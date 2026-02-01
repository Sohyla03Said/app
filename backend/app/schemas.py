# File: schemas.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    role: str = "student"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    theme: Optional[str] = "dark"
    language: Optional[str] = "en"
    onboarding_completed: Optional[bool] = False
    created_at: datetime

    class Config:
        from_attributes = True

# Document schemas
class DocumentBase(BaseModel):
    title: str

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: int
    file_type: str
    upload_date: datetime
    summary: Optional[str] = None
    user_id: int
    status: str
    file_size: int
    last_accessed: datetime

    class Config:
        from_attributes = True

# Chat schemas
class ChatBase(BaseModel):
    title: str

class ChatCreate(ChatBase):
    pass

class ChatResponse(ChatBase):
    id: int
    user_id: int
    created_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True

# Message schemas
class MessageBase(BaseModel):
    content: str
    role: str

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: int
    chat_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

# Response schemas
class SummaryResponse(BaseModel):
    summary: str
    document_id: int
    style: str

class DocumentUploadResponse(BaseModel):
    id: int
    title: str
    message: str