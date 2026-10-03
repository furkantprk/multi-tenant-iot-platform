from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    slug = Column(String, unique=True, index=True)
    api_key = Column(String, unique=True, index=True)
    mac_address = Column(String, unique=True, index=True, nullable=True)
    calibration_active = Column(Boolean, default=False)
    calibration_led_index = Column(Integer, default=0)

    colors = relationship("StatusColor", back_populates="project")
    units = relationship("Unit", back_populates="project")
    users = relationship("User", back_populates="project")

class StatusColor(Base):
    __tablename__ = "status_colors"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    status_code = Column(Integer, index=True)
    label = Column(String)
    hex_color = Column(String)

    project = relationship("Project", back_populates="colors")

class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    block_name = Column(String, index=True)
    floor_no = Column(Integer)
    unit_label = Column(String)
    physical_led_index = Column(Integer, nullable=True)
    current_status = Column(Integer, default=0)

    project = relationship("Project", back_populates="units")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)

    project = relationship("Project", back_populates="users")
