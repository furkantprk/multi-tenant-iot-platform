from fastapi import FastAPI, Depends, HTTPException, Request, APIRouter, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import uvicorn
import os

import crud, models, schemas
from database import SessionLocal, engine, Base

# Create DB tables
Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Multi-Tenant IoT Architecture Control")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS Settings for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        admin_user = db.query(models.User).filter(models.User.role == "admin").first()
        if not admin_user:
            hashed_pw = pwd_context.hash("admin123")
            new_admin = models.User(username="admin", password_hash=hashed_pw, role="admin", project_id=None)
            db.add(new_admin)
            db.commit()
    finally:
        db.close()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

SECRET_KEY = "super_secret_multi_tenant_iot_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 12

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# --- Admin API ---
admin_router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(get_current_user)])

@admin_router.get("/projects", response_model=List[schemas.Project])
def get_projects(db: Session = Depends(get_db)):
    return db.query(models.Project).all()

@admin_router.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404)
    db.query(models.User).filter(models.User.project_id == project_id).delete()
    db.query(models.Unit).filter(models.Unit.project_id == project_id).delete()
    db.query(models.StatusColor).filter(models.StatusColor.project_id == project_id).delete()
    db.delete(project)
    db.commit()
    return {"message": "Deleted"}

@admin_router.delete("/units/{unit_id}")
def delete_unit(unit_id: int, db: Session = Depends(get_db)):
    unit = db.query(models.Unit).filter(models.Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404)
    db.delete(unit)
    db.commit()
    return {"message": "Deleted"}

@admin_router.post("/projects", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return crud.create_project(db=db, project=project)

@admin_router.get("/projects/{project_id}/users")
def get_project_users(project_id: int, db: Session = Depends(get_db)):
    db_users = db.query(models.User).filter(models.User.project_id == project_id).all()
    return [{"id": u.id, "username": u.username, "password": "Kriptolanmış (Gizli)"} for u in db_users]

@admin_router.post("/projects/{project_id}/users")
def add_project_user(project_id: int, user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if username exists globally
    existing = db.query(models.User).filter(models.User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(username=user.username, password_hash=hashed_password, role="client", project_id=project_id)
    db.add(db_user)
    db.commit()
    return {"message": "User added"}

@admin_router.delete("/projects/{project_id}/users/{user_id}")
def delete_project_user(project_id: int, user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id, models.User.project_id == project_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}

@app.post("/api/login")
@limiter.limit("5/minute")
def login(request: Request, user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not pwd_context.verify(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if db_user.role == "admin":
        access_token = create_access_token(data={"sub": db_user.username, "role": "admin"})
        return {"access_token": access_token, "token_type": "bearer", "role": "admin"}
        
    project = db.query(models.Project).filter(models.Project.id == db_user.project_id).first()
    access_token = create_access_token(data={"sub": db_user.username, "role": "client", "project_id": db_user.project_id})
    return {"access_token": access_token, "token_type": "bearer", "role": "client", "project_id": db_user.project_id, "project_slug": project.slug if project else None}

@admin_router.post("/update-credentials")
def update_credentials(creds: schemas.AdminCredentialsUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    if not pwd_context.verify(creds.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Eski şifre hatalı")
    
    if creds.new_username and creds.new_username.strip() != "":
        existing = db.query(models.User).filter(models.User.username == creds.new_username.strip()).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış")
        current_user.username = creds.new_username.strip()

    if creds.new_password and creds.new_password.strip() != "":
        current_user.password_hash = pwd_context.hash(creds.new_password.strip())
        
    db.commit()
    return {"message": "Bilgiler başarıyla güncellendi", "new_username": current_user.username}

@admin_router.post("/projects/{project_id}/generate_units")
def generate_units(project_id: int, blocks: str, floors: int, units_per_floor: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    block_names = [b.strip() for b in blocks.split(',') if b.strip()]
    created = []
    for block in block_names:
        unit_counter = 1
        for f in range(floors):
            for u in range(units_per_floor):
                unit_label = f"Kat {f} - Birim {unit_counter}"
                unit = schemas.UnitCreate(block_name=block, floor_no=f, unit_label=unit_label)
                db_unit = crud.create_unit(db, unit, project_id)
                created.append(db_unit)
                unit_counter += 1
    return {"message": "Units generated", "count": len(created)}

@admin_router.post("/projects/{project_id}/generate_units_custom")
def generate_units_custom(project_id: int, payload: schemas.CustomBlocksCreate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    block_names = [b.strip() for b in payload.block_names.split(',') if b.strip()]
    created = []
    for block in block_names:
        unit_counter = 1
        for floor_data in payload.floors_data:
            f = floor_data.floor_no
            for u in range(floor_data.units_count):
                unit_label = f"Kat {f} - Birim {unit_counter}"
                unit = schemas.UnitCreate(block_name=block, floor_no=f, unit_label=unit_label)
                db_unit = crud.create_unit(db, unit, project_id)
                created.append(db_unit)
                unit_counter += 1
    return {"message": "Units generated", "count": len(created)}

@admin_router.post("/projects/{project_id}/units", response_model=schemas.Unit)
def add_single_unit(project_id: int, unit: schemas.UnitCreate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return crud.create_unit(db, unit, project_id)

@admin_router.get("/projects/{project_id}/units", response_model=List[schemas.Unit])
def get_project_units(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.Unit).filter(models.Unit.project_id == project_id).all()

@admin_router.delete("/projects/{project_id}/units")
def delete_all_project_units(project_id: int, db: Session = Depends(get_db)):
    db.query(models.Unit).filter(models.Unit.project_id == project_id).delete()
    db.commit()
    return {"message": "All units deleted"}

@admin_router.delete("/projects/{project_id}/units/block/{block_name}")
def delete_project_block_units(project_id: int, block_name: str, db: Session = Depends(get_db)):
    db.query(models.Unit).filter(
        models.Unit.project_id == project_id,
        models.Unit.block_name == block_name
    ).delete()
    db.commit()
    return {"message": f"All units in {block_name} deleted"}

@admin_router.get("/projects/{project_id}/colors", response_model=List[schemas.StatusColor])
def get_project_colors(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.StatusColor).filter(models.StatusColor.project_id == project_id).all()

@admin_router.put("/projects/{project_id}/colors")
def update_project_colors(project_id: int, colors: List[schemas.StatusColorBase], db: Session = Depends(get_db)):
    # Mevcut tüm renkleri sil
    db.query(models.StatusColor).filter(models.StatusColor.project_id == project_id).delete()
    
    # Yeni renkleri index sırasına göre durum kodu vererek ekle
    for idx, c in enumerate(colors):
        db_color = models.StatusColor(
            project_id=project_id,
            status_code=idx,
            label=c.label,
            hex_color=c.hex_color
        )
        db.add(db_color)
        
    # Eğer silinen durum kodunda kalmış daireler varsa, onları varsayılana (0) çek
    max_status = len(colors) - 1
    units = db.query(models.Unit).filter(models.Unit.project_id == project_id).all()
    for u in units:
        if u.current_status > max_status:
            u.current_status = 0
            
    db.commit()
    return {"message": "Colors updated"}

@admin_router.put("/units/{unit_id}", response_model=schemas.Unit)
def update_unit(unit_id: int, unit_label: str = None, current_status: int = None, db: Session = Depends(get_db)):
    unit = db.query(models.Unit).filter(models.Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    if unit_label is not None:
        unit.unit_label = unit_label
    if current_status is not None:
        unit.current_status = current_status
    db.commit()
    db.refresh(unit)
    return unit

@admin_router.post("/projects/{project_id}/calibration/toggle")
def toggle_calibration(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.calibration_active = not project.calibration_active
    if project.calibration_active:
        project.calibration_led_index = 0
    db.commit()
    db.refresh(project)
    return {"calibration_active": project.calibration_active}

@admin_router.post("/projects/{project_id}/calibration/map")
def map_unit_led(project_id: int, unit_id: int, led_index: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    unit = db.query(models.Unit).filter(models.Unit.id == unit_id, models.Unit.project_id == project_id).first()
    if not project or not unit:
        raise HTTPException(status_code=404, detail="Project or Unit not found")
    
    unit.physical_led_index = led_index
    project.calibration_led_index = led_index + 1
    db.commit()
    return {"message": "Mapped successfully"}

@admin_router.post("/projects/{project_id}/calibration/undo")
def undo_calibration(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project or project.calibration_led_index <= 0:
        raise HTTPException(status_code=400, detail="Geri alınacak eşleştirme yok")
    
    unit = db.query(models.Unit).filter(
        models.Unit.project_id == project_id, 
        models.Unit.physical_led_index == project.calibration_led_index - 1
    ).first()
    
    if unit:
        unit.physical_led_index = None
        
    project.calibration_led_index -= 1
    db.commit()
    return {"message": "Undo successful"}

@admin_router.put("/projects/{project_id}/mac_address")
def update_project_mac(project_id: int, mac_address: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.mac_address = mac_address.upper()
    db.commit()
    return {"message": "MAC address updated", "mac_address": project.mac_address}

# --- ESP32 Device API ---
device_router = APIRouter(prefix="/api/device", tags=["device"])

@device_router.get("/sync")
def sync_device(api_key: str = None, mac_address: str = None, db: Session = Depends(get_db)):
    project = None
    if mac_address:
        project = crud.get_project_by_mac_address(db, mac_address.upper())
    elif api_key:
        project = crud.get_project_by_api_key(db, api_key)
        
    if not project:
        raise HTTPException(status_code=401, detail="Invalid API Key or MAC Address")
    
    max_led_index = project.calibration_led_index if project.calibration_active else -1
    for unit in project.units:
        if unit.physical_led_index is not None and unit.physical_led_index > max_led_index:
            max_led_index = unit.physical_led_index
            
    count = max_led_index + 1 if max_led_index >= 0 else 0
    colors = ["#000000"] * count

    if project.calibration_active:
        if project.calibration_led_index < count:
            colors[project.calibration_led_index] = "#FFFFFF"
    else:
        # Get color dict for status
        status_colors = {c.status_code: c.hex_color for c in project.colors}
        for unit in project.units:
            if unit.physical_led_index is not None:
                colors[unit.physical_led_index] = status_colors.get(unit.current_status, "#000000")
                
    return {"count": count, "colors": colors}

app.include_router(admin_router)
app.include_router(device_router)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
