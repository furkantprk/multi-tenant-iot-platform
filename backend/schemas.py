from pydantic import BaseModel
from typing import List, Optional

class StatusColorBase(BaseModel):
    status_code: int
    label: str
    hex_color: str

class StatusColorCreate(StatusColorBase):
    pass

class StatusColor(StatusColorBase):
    id: int
    project_id: int

    class Config:
        orm_mode = True

class UnitBase(BaseModel):
    block_name: str
    floor_no: int
    unit_label: str
    physical_led_index: Optional[int] = None
    current_status: int = 0

class UnitCreate(UnitBase):
    pass

class Unit(UnitBase):
    id: int
    project_id: int

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str
    slug: str

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    api_key: str
    mac_address: Optional[str] = None
    calibration_active: bool
    calibration_led_index: int
    colors: List[StatusColor] = []
    units: List[Unit] = []

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    role: str
    project_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class AdminCredentialsUpdate(BaseModel):
    old_password: str
    new_password: str = None
    new_username: str = None

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class FloorData(BaseModel):
    floor_no: int
    units_count: int

class CustomBlocksCreate(BaseModel):
    block_names: str
    floors_data: List[FloorData]
