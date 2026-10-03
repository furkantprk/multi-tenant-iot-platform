from sqlalchemy.orm import Session
from passlib.context import CryptContext
import secrets
import models, schemas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_project(db: Session, project: schemas.ProjectCreate):
    api_key = secrets.token_hex(16)
    db_project = models.Project(
        name=project.name,
        slug=project.slug,
        api_key=api_key
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Default colors
    default_colors = [
        {"status_code": 0, "label": "Satışta", "hex_color": "#00FF00"},
        {"status_code": 1, "label": "Satıldı", "hex_color": "#FF0000"},
        {"status_code": 2, "label": "Rezerve", "hex_color": "#0000FF"},
        {"status_code": 3, "label": "Kapalı", "hex_color": "#000000"},
    ]
    for c in default_colors:
        db_color = models.StatusColor(
            project_id=db_project.id,
            status_code=c["status_code"],
            label=c["label"],
            hex_color=c["hex_color"]
        )
        db.add(db_color)
    db.commit()
    return db_project

def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Project).offset(skip).limit(limit).all()

def get_project_by_slug(db: Session, slug: str):
    return db.query(models.Project).filter(models.Project.slug == slug).first()

def get_project_by_api_key(db: Session, api_key: str):
    return db.query(models.Project).filter(models.Project.api_key == api_key).first()

def get_project_by_mac_address(db: Session, mac_address: str):
    return db.query(models.Project).filter(models.Project.mac_address == mac_address).first()

def create_unit(db: Session, unit: schemas.UnitCreate, project_id: int):
    db_unit = models.Unit(**unit.dict(), project_id=project_id)
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        username=user.username,
        password_hash=get_password_hash(user.password),
        role=user.role,
        project_id=user.project_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
