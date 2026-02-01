from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager
import shutil, os, uuid, json
from datetime import datetime, timedelta
from fastapi.responses import FileResponse, JSONResponse

from . import models, auth, schemas
from .database import get_db, engine, init_db
from .ai.llm import llm_manager
from .ai.rag import rag_system
from PyPDF2 import PdfReader
from docx import Document as DocxDocument
from pydantic import BaseModel
import hashlib
import random
import string
from sqlalchemy import func, or_, and_
import mimetypes


class ClassCreate(BaseModel):
    name: str
    description: Optional[str] = None
    subject: Optional[str] = None
    grade_level: Optional[str] = None
    max_students: Optional[int] = 50

class ClassResponse(BaseModel):
    id: int
    teacher_id: int
    name: str
    description: Optional[str]
    subject: Optional[str]
    grade_level: Optional[str]
    class_code: str
    student_count: int
    worksheet_count: int
    enrollment_status: Optional[str] = None  # For students
    created_at: datetime
    
    class Config:
        from_attributes = True

class EnrollmentRequest(BaseModel):
    class_code: Optional[str] = None
    teacher_username: Optional[str] = None

class WorksheetCreate(BaseModel):
    title: str
    description: Optional[str] = None
    worksheet_type: str = "question_based"
    due_date: Optional[datetime] = None
    max_score: int = 100

class QuestionCreate(BaseModel):
    question_text: str
    question_type: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str
    points: int = 10
    order: int

class WorksheetResponse(BaseModel):
    id: int
    class_id: int
    title: str
    description: Optional[str]
    worksheet_type: str
    question_count: int
    due_date: Optional[datetime]
    is_published: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class MaterialFolderCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "blue"
    is_public: Optional[bool] = True

class MaterialFolderResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    color: str
    material_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ClassMaterialCreate(BaseModel):
    title: str
    description: Optional[str] = None
    folder_id: Optional[int] = None

class ClassMaterialResponse(BaseModel):
    id: int
    class_id: int
    title: str
    description: Optional[str]
    file_name: str
    file_type: str
    file_size: int
    folder_id: Optional[int]
    folder_name: Optional[str]
    uploader_name: str
    upload_date: datetime
    last_accessed: datetime
    download_count: int
    
    class Config:
        from_attributes = True

# -------------------------------
# STARTUP/SHUTDOWN EVENT HANDLER
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # STARTUP
    print("\n" + "="*70)
    print("🚀 STARTING OFFLINE EDUCATION APP")
    print("="*70)
    
    # Initialize database
    print("\n📊 Initializing database...")
    models.Base.metadata.create_all(bind=engine)
    init_db()
    print("✅ Database initialized")
    
    # Load AI models
    print("\n🤖 Loading AI Models...")
    print("-"*70)
    
    # Load LLM (Mistral 7B)
    print("\n1️⃣ Loading Language Model (Mistral 7B)...")
    print("   Path: E:\\offline-edu-app\\models\\mistral-7b-instruct-v0.2.Q4_K_M.gguf")
    model_loaded = llm_manager.load_model()
    
    if model_loaded:
        print("✅ ✅ ✅ LLM LOADED SUCCESSFULLY! ✅ ✅ ✅")
        print("🤖 Real AI responses are now active!")
    else:
        print("⚠️  ⚠️  ⚠️  LLM NOT LOADED - RUNNING IN DEMO MODE ⚠️  ⚠️  ⚠️")
        print("   To enable AI features:")
        print("   1. Download Mistral 7B GGUF model")
        print("   2. Place at: E:\\offline-edu-app\\models\\mistral-7b-instruct-v0.2.Q4_K_M.gguf")
    
    # Load embedding model for RAG
    print("\n2️⃣ Loading Embedding Model for RAG...")
    embedding_loaded = rag_system.load_embedding_model()
    
    if embedding_loaded:
        print("✅ Embedding model loaded successfully!")
    else:
        print("⚠️  Embedding model not loaded (optional)")
    
    print("\n" + "="*70)
    print("✅ SERVER IS READY AND RUNNING!")
    print("="*70 + "\n")
    
    yield
    
    # SHUTDOWN
    print("\n👋 Shutting down Offline Education App...")
    print("="*70 + "\n")

# -------------------------------
# Create FastAPI app with lifespan
app = FastAPI(
    title="Offline Education App API",
    description="Fully offline AI-powered study assistant",
    version="1.0.0",
    lifespan=lifespan
)

# -------------------------------
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# -------------------------------
# Pydantic Models
class DocumentResponse(BaseModel):
    id: int
    title: str
    file_name: str
    file_type: str
    file_size: int
    upload_date: datetime
    last_accessed: datetime
    status: str
    summary: Optional[str] = None
    flashcard_count: int = 0
    quiz_count: int = 0
    chat_count: int = 0

    class Config:
        from_attributes = True

class DocumentDetailResponse(DocumentResponse):
    extracted_text: Optional[str] = None
    file_path: str

class UploadDocumentResponse(BaseModel):
    success: bool
    data: DocumentResponse
    message: str

# -------------------------------
# Get current user
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = auth.decode_access_token(token)
        if payload is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(models.User).filter(models.User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Unauthorized")

# -------------------------------
# AUTH ENDPOINTS
@app.post("/api/auth/signup", response_model=schemas.Token)
async def signup(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        existing = db.query(models.User).filter(models.User.username == user_data.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")
        if user_data.email:
            email_exists = db.query(models.User).filter(models.User.email == user_data.email).first()
            if email_exists:
                raise HTTPException(status_code=400, detail="Email already registered")

        hashed_pw = auth.get_password_hash(user_data.password)
        user = models.User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_pw,
            role=user_data.role,
            created_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        access_token = auth.create_access_token(data={"sub": str(user.id)})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/api/auth/login", response_model=schemas.Token)
async def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    try:
        user = auth.authenticate_user(db, user_data.username, user_data.password)
        if not user:
            raise HTTPException(status_code=401, detail="Incorrect username or password", headers={"WWW-Authenticate": "Bearer"})
        access_token = auth.create_access_token(data={"sub": str(user.id)})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/api/auth/me")
async def get_me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "theme": current_user.theme,
        "language": current_user.language,
        "onboarding_completed": current_user.onboarding_completed
    }

# -------------------------------
# DOCUMENTS ENDPOINTS
@app.get("/api/documents", response_model=Dict[str, Any])
async def get_documents(
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        documents = db.query(models.Document).filter(
            models.Document.user_id == current_user.id
        ).order_by(models.Document.upload_date.desc()).all()
        
        result = []
        for doc in documents:
            result.append({
                "_id": doc.id,
                "title": doc.title,
                "fileName": doc.file_name,
                "fileType": doc.file_type,
                "fileSize": doc.file_size,
                "uploadDate": doc.upload_date.isoformat() if doc.upload_date else None,
                "lastAccessed": doc.last_accessed.isoformat() if doc.last_accessed else None,
                "status": doc.status,
                "summary": doc.summary or "",
            })
        
        return {
            "success": True,
            "count": len(result),
            "data": result,
        }
    except Exception as e:
        print(f"Get documents error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load documents: {str(e)}")

@app.get("/api/documents/{document_id}", response_model=Dict[str, Any])
async def get_document(
    document_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        document = db.query(models.Document).filter(
            models.Document.id == document_id,
            models.Document.user_id == current_user.id
        ).first()
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document.last_accessed = datetime.utcnow()
        db.commit()
        
        document_data = {
            "_id": document.id,
            "title": document.title,
            "fileName": document.file_name,
            "filePath": document.file_path,
            "fileType": document.file_type,
            "fileSize": document.file_size,
            "uploadDate": document.upload_date.isoformat() if document.upload_date else None,
            "lastAccessed": document.last_accessed.isoformat() if document.last_accessed else None,
            "status": document.status,
            "summary": document.summary or "",
            "extractedText": document.extracted_text or "",
        }
        
        return {
            "success": True,
            "data": document_data
        }
    except Exception as e:
        print(f"Get document error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load document: {str(e)}")
    
@app.post("/api/documents/upload", response_model=Dict[str, Any])
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        print(f"[UPLOAD] {file.filename} by {current_user.username}")
        
        allowed_extensions = {'.pdf', '.docx', '.txt', '.md'}
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
        
        if not title:
            title = os.path.splitext(file.filename)[0]
        
        docs_dir = os.path.join("data", "documents", str(current_user.id))
        os.makedirs(docs_dir, exist_ok=True)
        
        unique_id = str(uuid.uuid4())[:8]
        safe_name = f"{unique_id}_{file.filename.replace(' ', '_')}"
        file_path = os.path.join(docs_dir, safe_name)
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        document = models.Document(
            user_id=current_user.id,
            title=title,
            file_name=file.filename,
            file_path=file_path,
            file_type=ext,
            file_size=len(content),
            status='processing',
            upload_date=datetime.utcnow(),
            last_accessed=datetime.utcnow()
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        await process_document_background(document.id, file_path, ext, db)
        
        document_data = {
            "_id": document.id,
            "title": document.title,
            "fileName": document.file_name,
            "filePath": document.file_path,
            "fileType": document.file_type,
            "fileSize": document.file_size,
            "uploadDate": document.upload_date.isoformat(),
            "lastAccessed": document.last_accessed.isoformat(),
            "status": document.status,
            "summary": document.summary or "",
        }
        
        return {
            "success": True,
            "data": document_data,
            "message": "Document uploaded successfully. Processing in progress..."
        }
        
    except Exception as e:
        print(f"[UPLOAD] Failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    

async def process_document_background(document_id: int, file_path: str, ext: str, db: Session):
    """Background processing of document"""
    try:
        text_content = ""
        
        if ext == ".pdf":
            with open(file_path, "rb") as f:
                reader = PdfReader(f)
                for i, page in enumerate(reader.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text_content += f"Page {i+1}:\n{page_text}\n\n"
        elif ext == ".docx":
            doc = DocxDocument(file_path)
            for p in doc.paragraphs:
                if p.text.strip():
                    text_content += p.text + "\n"
        elif ext in [".txt", ".md"]:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text_content = f.read()
        
        chunks = rag_system.chunk_text(text_content, chunk_size=500, overlap=50)
        
        document = db.query(models.Document).filter(models.Document.id == document_id).first()
        if document:
            document.extracted_text = text_content[:10000]
            document.chunks = json.dumps(chunks)
            document.status = 'ready'
            db.commit()
            
            print(f"✅ Document {document_id} processed successfully")
    
    except Exception as e:
        print(f"❌ Error processing document {document_id}: {e}")
        document = db.query(models.Document).filter(models.Document.id == document_id).first()
        if document:
            document.status = 'failed'
            db.commit()

@app.delete("/api/documents/{document_id}")
async def delete_document(
    document_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        document = db.query(models.Document).filter(
            models.Document.id == document_id,
            models.Document.user_id == current_user.id
        ).first()
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
        
        db.delete(document)
        db.commit()
        
        return {
            "success": True,
            "message": "Document deleted successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")

@app.get("/api/documents/{document_id}/file")
async def get_document_file(
    document_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        document = db.query(models.Document).filter(
            models.Document.id == document_id,
            models.Document.user_id == current_user.id
        ).first()
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        if not os.path.exists(document.file_path):
            raise HTTPException(status_code=404, detail="File not found on disk")
        
        return FileResponse(
            path=document.file_path,
            filename=document.file_name,
            media_type='application/octet-stream'
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download document: {str(e)}")

@app.get("/static/documents/{user_id}/{filename}")
async def get_static_document(
    user_id: int,
    filename: str,
    current_user: models.User = Depends(get_current_user)
):
    """Serve static document files with authentication"""
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    file_path = os.path.join("data", "documents", str(user_id), filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type is None:
        mime_type = "application/octet-stream"
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=mime_type
    )

# -------------------------------
# CHAT ENDPOINTS
@app.get("/api/chats")
async def get_chats(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        chats = db.query(models.Chat).filter(
            models.Chat.user_id == current_user.id
        ).order_by(models.Chat.updated_at.desc()).all()
        
        return [
            {
                "id": chat.id,
                "title": chat.title,
                "document_id": chat.document_id,
                "created_at": chat.created_at.isoformat(),
                "updated_at": chat.updated_at.isoformat(),
                "message_count": len(chat.messages)
            }
            for chat in chats
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load chats: {str(e)}")

@app.post("/api/chats")
async def create_chat(
    chat_data: dict = Body(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        title = chat_data.get("title", "New Chat")
        document_id = chat_data.get("document_id")
        
        if document_id:
            document = db.query(models.Document).filter(
                models.Document.id == document_id,
                models.Document.user_id == current_user.id
            ).first()
            if not document:
                raise HTTPException(status_code=404, detail="Document not found")
        
        chat = models.Chat(
            user_id=current_user.id,
            document_id=document_id,
            title=title,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(chat)
        db.commit()
        db.refresh(chat)
        
        return {
            "id": chat.id,
            "title": chat.title,
            "document_id": chat.document_id,
            "created_at": chat.created_at.isoformat(),
            "updated_at": chat.updated_at.isoformat()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create chat: {str(e)}")

@app.get("/api/chats/{chat_id}/messages")
async def get_messages(
    chat_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        chat = db.query(models.Chat).filter(
            models.Chat.id == chat_id,
            models.Chat.user_id == current_user.id
        ).first()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        messages = db.query(models.Message).filter(
            models.Message.chat_id == chat_id
        ).order_by(models.Message.timestamp).all()
        
        return [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat()
            }
            for msg in messages
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load messages: {str(e)}")
    
@app.post("/api/chats/{chat_id}/messages")
async def send_message(
    chat_id: int,
    message_request: dict = Body(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        chat = db.query(models.Chat).filter(
            models.Chat.id == chat_id,
            models.Chat.user_id == current_user.id
        ).first()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        content = message_request.get("content")
        if not content:
            raise HTTPException(status_code=400, detail="Content is required")
        
        user_message = models.Message(
            chat_id=chat_id,
            role="user",
            content=content,
            timestamp=datetime.utcnow()
        )
        db.add(user_message)
        
        context = None
        if chat.document_id:
            document = db.query(models.Document).filter(
                models.Document.id == chat.document_id
            ).first()
            if document and document.extracted_text:
                context = document.extracted_text[:3000]
        
        messages = [{"role": "user", "content": content}]
        
        print(f"\n🤖 Generating AI response for: '{content[:50]}...'")
        print(f"   LLM loaded: {llm_manager.is_loaded}")
        
        try:
            ai_response = llm_manager.chat(messages, context=context, max_tokens=512, temperature=0.7)
            print(f"✅ AI response generated: {ai_response[:100]}...")
        except Exception as e:
            print(f"❌ LLM error: {e}")
            ai_response = f"I received your message: '{content}'. However, I encountered an error generating a response. Error: {str(e)}"
        
        ai_message = models.Message(
            chat_id=chat_id,
            role="assistant",
            content=ai_response,
            timestamp=datetime.utcnow()
        )
        db.add(ai_message)
        
        chat.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "user_message": content,
            "ai_response": ai_response,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error sending message: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")

@app.post("/api/chats/{chat_id}/export")
async def export_chat(
    chat_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        chat = db.query(models.Chat).filter(
            models.Chat.id == chat_id,
            models.Chat.user_id == current_user.id
        ).first()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        messages = db.query(models.Message).filter(
            models.Message.chat_id == chat_id
        ).order_by(models.Message.timestamp).all()
        
        content = f"Chat: {chat.title}\n"
        content += f"Created: {chat.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
        content += "="*50 + "\n\n"
        
        for msg in messages:
            role = "You" if msg.role == "user" else "AI"
            timestamp = msg.timestamp.strftime('%H:%M:%S')
            content += f"[{timestamp}] {role}:\n{msg.content}\n\n"
        
        return {
            "content": content,
            "title": chat.title
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export chat: {str(e)}")


@app.delete("/api/chats/{chat_id}")
async def delete_chat(
    chat_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a chat and all its messages"""
    try:
        chat = db.query(models.Chat).filter(
            models.Chat.id == chat_id,
            models.Chat.user_id == current_user.id
        ).first()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        db.query(models.Message).filter(
            models.Message.chat_id == chat_id
        ).delete()
        
        db.delete(chat)
        db.commit()
        
        return {
            "success": True,
            "message": "Chat deleted successfully",
            "chat_id": chat_id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete chat: {str(e)}")

# -------------------------------
# AI ACTIONS ENDPOINTS
@app.post("/api/ai/summarize")
async def ai_summarize(
    request_data: dict = Body(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        document_id = request_data.get("document_id")
        style = request_data.get("style", "detailed")
        
        document = db.query(models.Document).filter(
            models.Document.id == document_id,
            models.Document.user_id == current_user.id
        ).first()
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        text = document.extracted_text or ""
        if not text:
            if os.path.exists(document.file_path):
                if document.file_type == ".pdf":
                    with open(document.file_path, "rb") as f:
                        reader = PdfReader(f)
                        for page in reader.pages:
                            page_text = page.extract_text()
                            if page_text:
                                text += page_text + "\n"
                else:
                    with open(document.file_path, "r", encoding="utf-8", errors="ignore") as f:
                        text = f.read(10000)
        
        if not text:
            raise HTTPException(status_code=400, detail="No text content available")
        
        summary = llm_manager.summarize(text, style)
        
        document.summary = summary
        db.commit()
        
        return {
            "success": True,
            "summary": summary,
            "document_id": document_id,
            "style": style
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@app.post("/api/ai/explain")
async def ai_explain(
    request_data: dict = Body(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        document_id = request_data.get("document_id")
        concept = request_data.get("concept")
        level = request_data.get("level", "detailed")
        
        document = db.query(models.Document).filter(
            models.Document.id == document_id,
            models.Document.user_id == current_user.id
        ).first()
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        context = document.extracted_text or ""
        if context:
            lines = context.split('\n')
            relevant_lines = [line for line in lines if concept.lower() in line.lower()]
            context = '\n'.join(relevant_lines[:5]) if relevant_lines else context[:1000]
        
        prompt = f"Explain this concept: {concept}\n\nContext from document:\n{context}\n\nExplanation ({level} level):"
        explanation = llm_manager.generate(prompt, max_tokens=400, temperature=0.7)
        
        return {
            "success": True,
            "explanation": explanation,
            "concept": concept,
            "level": level,
            "document_id": document_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation failed: {str(e)}")

# -------------------------------
# USER PROFILE ENDPOINTS
@app.patch("/api/users/me")
async def update_profile(
    theme: Optional[str] = Form(None),
    language: Optional[str] = Form(None),
    onboarding_completed: Optional[bool] = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if theme is not None:
            current_user.theme = theme
        if language is not None:
            current_user.language = language
        if onboarding_completed is not None:
            current_user.onboarding_completed = onboarding_completed
        
        db.commit()
        db.refresh(current_user)
        
        return {
            "message": "Profile updated successfully",
            "theme": current_user.theme,
            "language": current_user.language,
            "onboarding_completed": current_user.onboarding_completed
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@app.post("/api/users/me/password")
async def change_password(
    current_password: str = Form(...),
    new_password: str = Form(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if not auth.verify_password(current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        current_user.hashed_password = auth.get_password_hash(new_password)
        db.commit()
        
        return {"message": "Password updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to change password: {str(e)}")

# -------------------------------
# HEALTH & UTILITY ENDPOINTS
@app.get("/")
async def root():
    return {
        "message": "Offline Education App API",
        "status": "running",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")

@app.get("/api/debug/token")
async def debug_token(token: str = Depends(oauth2_scheme)):
    """Debug endpoint to check token validity"""
    try:
        payload = auth.decode_access_token(token)
        if payload:
            return {
                "valid": True,
                "payload": payload,
                "expires_at": datetime.fromtimestamp(payload.get("exp")).isoformat() if payload.get("exp") else None
            }
        else:
            return {"valid": False, "error": "Token decode failed"}
    except Exception as e:
        return {"valid": False, "error": str(e)}

# -------------------------------
# ERROR HANDLERS
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    print(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# -------------------------------
# CLASS MANAGEMENT ENDPOINTS
@app.get("/api/classes", response_model=List[ClassResponse])
async def get_classes(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get classes for current user (teacher gets their classes, student gets enrolled classes)"""
    try:
        if current_user.role == 'teacher':
            classes = db.query(models.Class).filter(
                models.Class.teacher_id == current_user.id,
                models.Class.is_active == True
            ).order_by(models.Class.created_at.desc()).all()
            
            result = []
            for class_obj in classes:
                student_count = db.query(func.count(models.Enrollment.id)).filter(
                    models.Enrollment.class_id == class_obj.id,
                    models.Enrollment.status == models.EnrollmentStatus.APPROVED
                ).scalar() or 0
                
                worksheet_count = db.query(func.count(models.Worksheet.id)).filter(
                    models.Worksheet.class_id == class_obj.id,
                    models.Worksheet.is_published == True
                ).scalar() or 0
                
                result.append({
                    "id": class_obj.id,
                    "teacher_id": class_obj.teacher_id,
                    "name": class_obj.name,
                    "description": class_obj.description,
                    "subject": class_obj.subject,
                    "grade_level": class_obj.grade_level,
                    "class_code": class_obj.class_code,
                    "student_count": student_count,
                    "worksheet_count": worksheet_count,
                    "created_at": class_obj.created_at
                })
            
            return result
            
        else:
            enrollments = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == current_user.id
            ).all()
            
            result = []
            for enrollment in enrollments:
                class_obj = enrollment.class_obj
                if class_obj and class_obj.is_active:
                    student_count = db.query(func.count(models.Enrollment.id)).filter(
                        models.Enrollment.class_id == class_obj.id,
                        models.Enrollment.status == models.EnrollmentStatus.APPROVED
                    ).scalar() or 0
                    
                    worksheet_count = db.query(func.count(models.Worksheet.id)).filter(
                        models.Worksheet.class_id == class_obj.id,
                        models.Worksheet.is_published == True
                    ).scalar() or 0
                    
                    result.append({
                        "id": class_obj.id,
                        "teacher_id": class_obj.teacher_id,
                        "name": class_obj.name,
                        "description": class_obj.description,
                        "subject": class_obj.subject,
                        "grade_level": class_obj.grade_level,
                        "class_code": class_obj.class_code,
                        "student_count": student_count,
                        "worksheet_count": worksheet_count,
                        "enrollment_status": enrollment.status.value,
                        "created_at": class_obj.created_at
                    })
            
            return result
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load classes: {str(e)}")

@app.post("/api/classes", response_model=ClassResponse)
async def create_class(
    class_data: ClassCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Teacher creates a new class"""
    try:
        if current_user.role != 'teacher':
            raise HTTPException(status_code=403, detail="Only teachers can create classes")
        
        def generate_class_code():
            prefix = ''.join(random.choices(string.ascii_uppercase, k=3))
            suffix = ''.join(random.choices(string.digits, k=3))
            return f"{prefix}-{suffix}"
        
        class_code = generate_class_code()
        while db.query(models.Class).filter(models.Class.class_code == class_code).first():
            class_code = generate_class_code()
        
        new_class = models.Class(
            teacher_id=current_user.id,
            name=class_data.name,
            description=class_data.description,
            subject=class_data.subject,
            grade_level=class_data.grade_level,
            class_code=class_code,
            max_students=class_data.max_students,
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(new_class)
        db.commit()
        db.refresh(new_class)
        
        return {
            "id": new_class.id,
            "teacher_id": new_class.teacher_id,
            "name": new_class.name,
            "description": new_class.description,
            "subject": new_class.subject,
            "grade_level": new_class.grade_level,
            "class_code": new_class.class_code,
            "student_count": 0,
            "worksheet_count": 0,
            "created_at": new_class.created_at
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create class: {str(e)}")

@app.get("/api/classes/public")
async def get_public_classes(
    search: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    teacher_name: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get public classes for students to browse and join"""
    try:
        query = db.query(models.Class).filter(
            models.Class.is_active == True
        )
        
        if search:
            query = query.filter(
                or_(
                    models.Class.name.ilike(f"%{search}%"),
                    models.Class.description.ilike(f"%{search}%"),
                    models.Class.subject.ilike(f"%{search}%")
                )
            )
        
        if subject:
            query = query.filter(models.Class.subject == subject)
        
        if teacher_name:
            query = query.join(models.User).filter(
                models.User.username.ilike(f"%{teacher_name}%")
            )
        
        classes = query.order_by(models.Class.created_at.desc()).limit(50).all()
        
        result = []
        for class_obj in classes:
            teacher = db.query(models.User).filter(models.User.id == class_obj.teacher_id).first()
            student_count = db.query(func.count(models.Enrollment.id)).filter(
                models.Enrollment.class_id == class_obj.id,
                models.Enrollment.status == models.EnrollmentStatus.APPROVED
            ).scalar() or 0
            
            result.append({
                "id": class_obj.id,
                "name": class_obj.name,
                "description": class_obj.description,
                "subject": class_obj.subject,
                "grade_level": class_obj.grade_level,
                "class_code": class_obj.class_code,
                "teacher": {
                    "id": teacher.id,
                    "username": teacher.username,
                    "full_name": teacher.full_name
                },
                "student_count": student_count,
                "created_at": class_obj.created_at
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load public classes: {str(e)}")

@app.post("/api/classes/join")
async def join_class(
    request: EnrollmentRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Student requests to join a class using class code or teacher username"""
    try:
        if current_user.role != 'student':
            raise HTTPException(status_code=400, detail="Only students can join classes")
        
        class_obj = None
        if request.class_code:
            class_obj = db.query(models.Class).filter(
                models.Class.class_code == request.class_code,
                models.Class.is_active == True
            ).first()
        elif request.teacher_username:
            teacher = db.query(models.User).filter(
                models.User.username == request.teacher_username,
                models.User.role == 'teacher'
            ).first()
            if teacher:
                class_obj = db.query(models.Class).filter(
                    models.Class.teacher_id == teacher.id,
                    models.Class.is_active == True
                ).first()
        
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found")
        
        existing = db.query(models.Enrollment).filter(
            models.Enrollment.student_id == current_user.id,
            models.Enrollment.class_id == class_obj.id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Already enrolled or pending enrollment")
        
        approved_count = db.query(func.count(models.Enrollment.id)).filter(
            models.Enrollment.class_id == class_obj.id,
            models.Enrollment.status == models.EnrollmentStatus.APPROVED
        ).scalar() or 0
        
        if approved_count >= class_obj.max_students:
            raise HTTPException(status_code=400, detail="Class is full")
        
        enrollment = models.Enrollment(
            student_id=current_user.id,
            class_id=class_obj.id,
            status=models.EnrollmentStatus.PENDING,
            requested_at=datetime.utcnow()
        )
        
        notification = models.Notification(
            user_id=class_obj.teacher_id,
            title="New Enrollment Request",
            message=f"{current_user.username} wants to join your class: {class_obj.name}",
            type="enrollment_request",
            related_id=enrollment.id,
            created_at=datetime.utcnow()
        )
        
        db.add(enrollment)
        db.add(notification)
        db.commit()
        
        return {
            "success": True,
            "message": "Enrollment request sent. Waiting for teacher approval.",
            "class_id": class_obj.id,
            "class_name": class_obj.name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to join class: {str(e)}")

@app.get("/api/classes/{class_id}")
async def get_class_details(
    class_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a class"""
    try:
        class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found")
        
        can_access = False
        enrollment_status = None
        
        if current_user.role == 'teacher' and class_obj.teacher_id == current_user.id:
            can_access = True
        else:
            enrollment = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == current_user.id,
                models.Enrollment.class_id == class_id
            ).first()
            if enrollment and enrollment.status == models.EnrollmentStatus.APPROVED:
                can_access = True
                enrollment_status = enrollment.status.value
        
        if not can_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        teacher = db.query(models.User).filter(models.User.id == class_obj.teacher_id).first()
        
        student_count = db.query(func.count(models.Enrollment.id)).filter(
            models.Enrollment.class_id == class_id,
            models.Enrollment.status == models.EnrollmentStatus.APPROVED
        ).scalar() or 0
        
        worksheet_count = db.query(func.count(models.Worksheet.id)).filter(
            models.Worksheet.class_id == class_id
        ).scalar() or 0
        
        pending_enrollments = db.query(func.count(models.Enrollment.id)).filter(
            models.Enrollment.class_id == class_id,
            models.Enrollment.status == models.EnrollmentStatus.PENDING
        ).scalar() or 0
        
        announcements = db.query(models.Announcement).filter(
            models.Announcement.class_id == class_id
        ).order_by(models.Announcement.created_at.desc()).limit(5).all()
        
        return {
            "id": class_obj.id,
            "name": class_obj.name,
            "description": class_obj.description,
            "subject": class_obj.subject,
            "grade_level": class_obj.grade_level,
            "class_code": class_obj.class_code,
            "max_students": class_obj.max_students,
            "teacher": {
                "id": teacher.id,
                "username": teacher.username,
                "full_name": teacher.full_name,
                "bio": teacher.bio
            },
            "student_count": student_count,
            "worksheet_count": worksheet_count,
            "pending_enrollments": pending_enrollments,
            "enrollment_status": enrollment_status,
            "announcements": [
                {
                    "id": a.id,
                    "title": a.title,
                    "content": a.content,
                    "is_important": a.is_important,
                    "created_at": a.created_at
                } for a in announcements
            ],
            "created_at": class_obj.created_at
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load class details: {str(e)}")

@app.get("/api/classes/{class_id}/enrollments")
async def get_enrollments(
    class_id: int,
    status: Optional[str] = Query(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get enrollment requests for a class (teacher only)"""
    try:
        class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found")
        
        if current_user.id != class_obj.teacher_id:
            raise HTTPException(status_code=403, detail="Only class teacher can view enrollments")
        
        query = db.query(models.Enrollment).filter(
            models.Enrollment.class_id == class_id
        )
        
        if status:
            query = query.filter(models.Enrollment.status == status)
        
        enrollments = query.order_by(models.Enrollment.requested_at.desc()).all()
        
        result = []
        for enrollment in enrollments:
            student = db.query(models.User).filter(models.User.id == enrollment.student_id).first()
            result.append({
                "id": enrollment.id,
                "student": {
                    "id": student.id,
                    "username": student.username,
                    "full_name": student.full_name,
                    "email": student.email
                },
                "status": enrollment.status.value,
                "requested_at": enrollment.requested_at,
                "approved_at": enrollment.approved_at
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load enrollments: {str(e)}")

@app.get("/api/classes/{class_id}/students")
async def get_students(
    class_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all enrolled students for a class"""
    try:
        class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found")
        
        if current_user.id != class_obj.teacher_id:
            enrollment = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == current_user.id,
                models.Enrollment.class_id == class_id,
                models.Enrollment.status == models.EnrollmentStatus.APPROVED
            ).first()
            if not enrollment:
                raise HTTPException(status_code=403, detail="Access denied")
        
        enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.class_id == class_id,
            models.Enrollment.status == models.EnrollmentStatus.APPROVED
        ).all()
        
        result = []
        for enrollment in enrollments:
            student = db.query(models.User).filter(models.User.id == enrollment.student_id).first()
            
            submissions = db.query(models.WorksheetSubmission).filter(
                models.WorksheetSubmission.student_id == student.id,
                models.WorksheetSubmission.worksheet_id.in_(
                    db.query(models.Worksheet.id).filter(
                        models.Worksheet.class_id == class_id
                    )
                )
            ).all()
            
            total_worksheets = db.query(func.count(models.Worksheet.id)).filter(
                models.Worksheet.class_id == class_id
            ).scalar() or 0
            
            completed = len([s for s in submissions if s.grade is not None])
            avg_grade = sum([s.grade for s in submissions if s.grade]) / len(submissions) if submissions else None
            
            result.append({
                "id": student.id,
                "username": student.username,
                "full_name": student.full_name,
                "email": student.email,
                "joined_at": enrollment.approved_at,
                "completed_worksheets": completed,
                "average_grade": round(avg_grade, 2) if avg_grade else None,
                "total_worksheets": total_worksheets
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load students: {str(e)}")

@app.post("/api/enrollments/{enrollment_id}/approve")
async def approve_enrollment(
    enrollment_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve a student enrollment (teacher only)"""
    try:
        enrollment = db.query(models.Enrollment).filter(models.Enrollment.id == enrollment_id).first()
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        class_obj = enrollment.class_obj
        if class_obj.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only class teacher can approve enrollments")
        
        approved_count = db.query(func.count(models.Enrollment.id)).filter(
            models.Enrollment.class_id == class_obj.id,
            models.Enrollment.status == models.EnrollmentStatus.APPROVED
        ).scalar() or 0
        
        if approved_count >= class_obj.max_students:
            raise HTTPException(status_code=400, detail="Class is full")
        
        enrollment.status = models.EnrollmentStatus.APPROVED
        enrollment.approved_at = datetime.utcnow()
        enrollment.approved_by = current_user.id
        
        notification = models.Notification(
            user_id=enrollment.student_id,
            title="Enrollment Approved",
            message=f"You have been approved to join {class_obj.name}",
            type="enrollment_approved",
            related_id=class_obj.id,
            created_at=datetime.utcnow()
        )
        
        db.add(notification)
        db.commit()
        
        return {
            "success": True,
            "message": "Enrollment approved successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to approve enrollment: {str(e)}")

@app.post("/api/enrollments/{enrollment_id}/reject")
async def reject_enrollment(
    enrollment_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reject a student enrollment (teacher only)"""
    try:
        enrollment = db.query(models.Enrollment).filter(models.Enrollment.id == enrollment_id).first()
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        class_obj = enrollment.class_obj
        if class_obj.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only class teacher can reject enrollments")
        
        enrollment.status = models.EnrollmentStatus.REJECTED
        
        notification = models.Notification(
            user_id=enrollment.student_id,
            title="Enrollment Rejected",
            message=f"Your request to join {class_obj.name} was rejected",
            type="enrollment_rejected",
            related_id=class_obj.id,
            created_at=datetime.utcnow()
        )
        
        db.add(notification)
        db.commit()
        
        return {
            "success": True,
            "message": "Enrollment rejected"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reject enrollment: {str(e)}")

# -------------------------------
# MATERIAL FOLDERS ENDPOINTS
# -------------------------------
@app.post("/api/classes/{class_id}/folders")
async def create_material_folder(
    class_id: int,
    folder_data: MaterialFolderCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new material folder (teacher only)"""
    try:
        class_obj = db.query(models.Class).filter(
            models.Class.id == class_id,
            models.Class.teacher_id == current_user.id
        ).first()
        
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found or access denied")
        
        existing = db.query(models.MaterialFolder).filter(
            models.MaterialFolder.class_id == class_id,
            models.MaterialFolder.name == folder_data.name
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Folder with this name already exists")
        
        new_folder = models.MaterialFolder(
            class_id=class_id,
            user_id=current_user.id,
            name=folder_data.name,
            description=folder_data.description,
            color=folder_data.color,
            is_public=folder_data.is_public,
            created_at=datetime.utcnow()
        )
        
        db.add(new_folder)
        db.commit()
        db.refresh(new_folder)
        
        return {
            "id": new_folder.id,
            "name": new_folder.name,
            "description": new_folder.description,
            "color": new_folder.color,
            "material_count": 0,
            "created_at": new_folder.created_at
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create folder: {str(e)}")

@app.get("/api/classes/{class_id}/folders")
async def get_material_folders(
    class_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all material folders for a class"""
    try:
        class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found")
        
        can_access = False
        if current_user.role == 'teacher' and class_obj.teacher_id == current_user.id:
            can_access = True
        else:
            enrollment = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == current_user.id,
                models.Enrollment.class_id == class_id,
                models.Enrollment.status == models.EnrollmentStatus.APPROVED
            ).first()
            if enrollment:
                can_access = True
        
        if not can_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if current_user.role == 'teacher':
            folders = db.query(models.MaterialFolder).filter(
                models.MaterialFolder.class_id == class_id
            ).order_by(models.MaterialFolder.order_index).all()
        else:
            folders = db.query(models.MaterialFolder).filter(
                models.MaterialFolder.class_id == class_id,
                models.MaterialFolder.is_public == True
            ).order_by(models.MaterialFolder.order_index).all()
        
        result = []
        for folder in folders:
            material_count = db.query(func.count(models.ClassMaterial.id)).filter(
                models.ClassMaterial.folder_id == folder.id,
                models.ClassMaterial.status == "active"
            ).scalar() or 0
            
            result.append({
                "id": folder.id,
                "name": folder.name,
                "description": folder.description,
                "color": folder.color,
                "material_count": material_count,
                "created_at": folder.created_at
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load folders: {str(e)}")

@app.delete("/api/classes/{class_id}/folders/{folder_id}")
async def delete_material_folder(
    class_id: int,
    folder_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a material folder (teacher only)"""
    try:
        class_obj = db.query(models.Class).filter(
            models.Class.id == class_id,
            models.Class.teacher_id == current_user.id
        ).first()
        
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found or access denied")
        
        folder = db.query(models.MaterialFolder).filter(
            models.MaterialFolder.id == folder_id,
            models.MaterialFolder.class_id == class_id
        ).first()
        
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        
        db.query(models.ClassMaterial).filter(
            models.ClassMaterial.folder_id == folder_id
        ).update({"folder_id": None})
        
        db.delete(folder)
        db.commit()
        
        return {
            "success": True,
            "message": "Folder deleted successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete folder: {str(e)}")

# -------------------------------
# CLASS MATERIALS ENDPOINTS
# -------------------------------
@app.post("/api/classes/{class_id}/materials")
async def upload_class_material(
    class_id: int,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    folder_id: Optional[int] = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a material to class (teacher only)"""
    try:
        class_obj = db.query(models.Class).filter(
            models.Class.id == class_id,
            models.Class.teacher_id == current_user.id
        ).first()
        
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found or access denied")
        
        allowed_extensions = {'.pdf', '.docx', '.doc', '.txt', '.md', '.pptx', '.ppt', '.xlsx', '.xls', '.jpg', '.jpeg', '.png', '.mp4', '.mp3', '.zip'}
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
        
        if not title:
            title = os.path.splitext(file.filename)[0]
        
        materials_dir = os.path.join("data", "class_materials", str(class_id))
        os.makedirs(materials_dir, exist_ok=True)
        
        unique_id = str(uuid.uuid4())[:8]
        safe_name = f"{unique_id}_{file.filename.replace(' ', '_')}"
        file_path = os.path.join(materials_dir, safe_name)
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        if folder_id:
            folder = db.query(models.MaterialFolder).filter(
                models.MaterialFolder.id == folder_id,
                models.MaterialFolder.class_id == class_id
            ).first()
            if not folder:
                folder_id = None
        
        material = models.ClassMaterial(
            class_id=class_id,
            user_id=current_user.id,
            title=title,
            description=description,
            file_name=file.filename,
            file_path=file_path,
            file_type=ext,
            file_size=len(content),
            folder_id=folder_id,
            status="active",
            upload_date=datetime.utcnow(),
            last_accessed=datetime.utcnow()
        )
        
        db.add(material)
        db.commit()
        db.refresh(material)
        
        uploader = db.query(models.User).filter(models.User.id == current_user.id).first()
        folder_name = folder.name if folder_id and folder else None
        
        return {
            "id": material.id,
            "class_id": material.class_id,
            "title": material.title,
            "description": material.description,
            "file_name": material.file_name,
            "file_type": material.file_type,
            "file_size": material.file_size,
            "folder_id": material.folder_id,
            "folder_name": folder_name,
            "uploader_name": uploader.username,
            "upload_date": material.upload_date,
            "last_accessed": material.last_accessed,
            "download_count": material.download_count
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload material: {str(e)}")

@app.get("/api/classes/{class_id}/materials")
async def get_class_materials(
    class_id: int,
    folder_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    file_type: Optional[str] = Query(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all materials for a class"""
    try:
        class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found")
        
        can_access = False
        if current_user.role == 'teacher' and class_obj.teacher_id == current_user.id:
            can_access = True
        else:
            enrollment = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == current_user.id,
                models.Enrollment.class_id == class_id,
                models.Enrollment.status == models.EnrollmentStatus.APPROVED
            ).first()
            if enrollment:
                can_access = True
        
        if not can_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        query = db.query(models.ClassMaterial).filter(
            models.ClassMaterial.class_id == class_id,
            models.ClassMaterial.status == "active"
        )
        
        if folder_id:
            query = query.filter(models.ClassMaterial.folder_id == folder_id)
        else:
            query = query.filter(models.ClassMaterial.folder_id.is_(None))
        
        if file_type and file_type != 'all':
            query = query.filter(models.ClassMaterial.file_type == f".{file_type}")
        
        if search:
            query = query.filter(
                or_(
                    models.ClassMaterial.title.ilike(f"%{search}%"),
                    models.ClassMaterial.description.ilike(f"%{search}%"),
                    models.ClassMaterial.file_name.ilike(f"%{search}%")
                )
            )
        
        materials = query.order_by(models.ClassMaterial.upload_date.desc()).all()
        
        result = []
        for material in materials:
            uploader = db.query(models.User).filter(models.User.id == material.user_id).first()
            
            folder_name = None
            if material.folder_id:
                folder = db.query(models.MaterialFolder).filter(
                    models.MaterialFolder.id == material.folder_id
                ).first()
                folder_name = folder.name if folder else None
            
            result.append({
                "id": material.id,
                "class_id": material.class_id,
                "title": material.title,
                "description": material.description,
                "file_name": material.file_name,
                "file_path": material.file_path,
                "file_type": material.file_type.lstrip('.'),
                "file_size": material.file_size,
                "folder_id": material.folder_id,
                "folder_name": folder_name,
                "uploader_name": uploader.username if uploader else "Unknown",
                "upload_date": material.upload_date,
                "last_accessed": material.last_accessed,
                "download_count": material.download_count,
                "is_owner": current_user.id == material.user_id
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load materials: {str(e)}")

@app.get("/api/materials/{material_id}/download")
async def download_class_material(
    material_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a class material"""
    try:
        material = db.query(models.ClassMaterial).filter(
            models.ClassMaterial.id == material_id
        ).first()
        
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        
        class_obj = material.class_obj
        can_access = False
        if current_user.role == 'teacher' and class_obj.teacher_id == current_user.id:
            can_access = True
        else:
            enrollment = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == current_user.id,
                models.Enrollment.class_id == class_obj.id,
                models.Enrollment.status == models.EnrollmentStatus.APPROVED
            ).first()
            if enrollment:
                can_access = True
        
        if not can_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        material.download_count += 1
        material.last_accessed = datetime.utcnow()
        db.commit()
        
        if not os.path.exists(material.file_path):
            raise HTTPException(status_code=404, detail="File not found on disk")
        
        mime_type, _ = mimetypes.guess_type(material.file_path)
        if mime_type is None:
            mime_type = "application/octet-stream"
        
        return FileResponse(
            path=material.file_path,
            filename=material.file_name,
            media_type=mime_type
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download material: {str(e)}")

@app.delete("/api/materials/{material_id}")
async def delete_class_material(
    material_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a class material (teacher only)"""
    try:
        material = db.query(models.ClassMaterial).filter(
            models.ClassMaterial.id == material_id
        ).first()
        
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        
        class_obj = material.class_obj
        if current_user.id != material.user_id and current_user.id != class_obj.teacher_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this material")
        
        material.status = "deleted"
        db.commit()
        
        return {
            "success": True,
            "message": "Material deleted successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete material: {str(e)}")

@app.get("/api/classes/{class_id}/materials/stats")
async def get_materials_stats(
    class_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get statistics about class materials"""
    try:
        class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found")
        
        can_access = False
        if current_user.role == 'teacher' and class_obj.teacher_id == current_user.id:
            can_access = True
        else:
            enrollment = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == current_user.id,
                models.Enrollment.class_id == class_id,
                models.Enrollment.status == models.EnrollmentStatus.APPROVED
            ).first()
            if enrollment:
                can_access = True
        
        if not can_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        total_materials = db.query(func.count(models.ClassMaterial.id)).filter(
            models.ClassMaterial.class_id == class_id,
            models.ClassMaterial.status == "active"
        ).scalar() or 0
        
        materials_by_type = db.query(
            models.ClassMaterial.file_type,
            func.count(models.ClassMaterial.id)
        ).filter(
            models.ClassMaterial.class_id == class_id,
            models.ClassMaterial.status == "active"
        ).group_by(models.ClassMaterial.file_type).all()
        
        total_downloads = db.query(func.sum(models.ClassMaterial.download_count)).filter(
            models.ClassMaterial.class_id == class_id,
            models.ClassMaterial.status == "active"
        ).scalar() or 0
        
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_uploads = db.query(func.count(models.ClassMaterial.id)).filter(
            models.ClassMaterial.class_id == class_id,
            models.ClassMaterial.status == "active",
            models.ClassMaterial.upload_date >= week_ago
        ).scalar() or 0
        
        return {
            "total_materials": total_materials,
            "materials_by_type": {t[0].lstrip('.'): t[1] for t in materials_by_type},
            "total_downloads": total_downloads,
            "recent_uploads": recent_uploads
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load material stats: {str(e)}")

# -------------------------------
# WORKSHEET MANAGEMENT ENDPOINTS
# -------------------------------
@app.get("/api/worksheets/{worksheet_id}")
async def get_worksheet_details(
    worksheet_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a worksheet"""
    try:
        worksheet = db.query(models.Worksheet).filter(models.Worksheet.id == worksheet_id).first()
        
        if not worksheet:
            raise HTTPException(status_code=404, detail="Worksheet not found")
        
        can_access = False
        
        if current_user.id == worksheet.teacher_id:
            can_access = True
        else:
            enrollment = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == current_user.id,
                models.Enrollment.class_id == worksheet.class_id,
                models.Enrollment.status == models.EnrollmentStatus.APPROVED
            ).first()
            if enrollment:
                can_access = True
        
        if not can_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        question_count = db.query(func.count(models.Question.id)).filter(
            models.Question.worksheet_id == worksheet_id
        ).scalar() or 0
        
        submission_count = db.query(func.count(models.WorksheetSubmission.id)).filter(
            models.WorksheetSubmission.worksheet_id == worksheet_id
        ).scalar() or 0
        
        avg_grade = db.query(func.avg(models.WorksheetSubmission.grade)).filter(
            models.WorksheetSubmission.worksheet_id == worksheet_id,
            models.WorksheetSubmission.grade.isnot(None)
        ).scalar() or 0
        
        return {
            "id": worksheet.id,
            "title": worksheet.title,
            "description": worksheet.description,
            "worksheet_type": worksheet.worksheet_type.value,
            "class_id": worksheet.class_id,
            "teacher_id": worksheet.teacher_id,
            "due_date": worksheet.due_date,
            "max_score": worksheet.max_score,
            "is_published": worksheet.is_published,
            "created_at": worksheet.created_at,
            "updated_at": worksheet.updated_at,
            "question_count": question_count,
            "submission_count": submission_count,
            "average_grade": round(avg_grade, 2) if avg_grade else None,
            "class_name": worksheet.class_obj.name if worksheet.class_obj else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load worksheet: {str(e)}")

@app.get("/api/worksheets/{worksheet_id}/questions")
async def get_worksheet_questions(
    worksheet_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all questions for a worksheet"""
    try:
        worksheet = db.query(models.Worksheet).filter(models.Worksheet.id == worksheet_id).first()
        
        if not worksheet:
            raise HTTPException(status_code=404, detail="Worksheet not found")
        
        can_access = False
        if current_user.id == worksheet.teacher_id:
            can_access = True
        else:
            enrollment = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == current_user.id,
                models.Enrollment.class_id == worksheet.class_id,
                models.Enrollment.status == models.EnrollmentStatus.APPROVED
            ).first()
            if enrollment and worksheet.is_published:
                can_access = True
        
        if not can_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        questions = db.query(models.Question).filter(
            models.Question.worksheet_id == worksheet_id
        ).order_by(models.Question.order).all()
        
        result = []
        for question in questions:
            options = []
            if question.options:
                try:
                    options = json.loads(question.options)
                except:
                    options = []
            
            result.append({
                "id": question.id,
                "worksheet_id": question.worksheet_id,
                "question_text": question.question_text,
                "question_type": question.question_type.value,
                "options": options,
                "correct_answer": question.correct_answer,
                "explanation": question.explanation,
                "points": question.points,
                "order": question.order,
                "created_at": question.created_at
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load questions: {str(e)}")

@app.get("/api/worksheets/{worksheet_id}/submissions")
async def get_worksheet_submissions(
    worksheet_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all submissions for a worksheet (teacher only)"""
    try:
        worksheet = db.query(models.Worksheet).filter(models.Worksheet.id == worksheet_id).first()
        
        if not worksheet:
            raise HTTPException(status_code=404, detail="Worksheet not found")
        
        if current_user.id != worksheet.teacher_id:
            raise HTTPException(status_code=403, detail="Only worksheet creator can view submissions")
        
        submissions = db.query(models.WorksheetSubmission).filter(
            models.WorksheetSubmission.worksheet_id == worksheet_id
        ).order_by(models.WorksheetSubmission.submitted_at.desc()).all()
        
        result = []
        for submission in submissions:
            student = db.query(models.User).filter(models.User.id == submission.student_id).first()
            
            result.append({
                "id": submission.id,
                "worksheet_id": submission.worksheet_id,
                "student_id": submission.student_id,
                "student": {
                    "id": student.id if student else None,
                    "username": student.username if student else None,
                    "full_name": student.full_name if student else None,
                    "email": student.email if student else None
                },
                "submitted_at": submission.submitted_at,
                "grade": submission.grade,
                "feedback": submission.feedback,
                "ai_feedback": submission.ai_feedback,
                "status": submission.status
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load submissions: {str(e)}")

@app.get("/api/classes/{class_id}/worksheets/{worksheet_id}")
async def get_class_worksheet_details(
    class_id: int,
    worksheet_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get worksheet details within a class context"""
    try:
        class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found")
        
        can_access = False
        if current_user.role == 'teacher' and class_obj.teacher_id == current_user.id:
            can_access = True
        else:
            enrollment = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == current_user.id,
                models.Enrollment.class_id == class_id,
                models.Enrollment.status == models.EnrollmentStatus.APPROVED
            ).first()
            if enrollment:
                can_access = True
        
        if not can_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        worksheet = db.query(models.Worksheet).filter(
            models.Worksheet.id == worksheet_id,
            models.Worksheet.class_id == class_id
        ).first()
        
        if not worksheet:
            raise HTTPException(status_code=404, detail="Worksheet not found in this class")
        
        question_count = db.query(func.count(models.Question.id)).filter(
            models.Question.worksheet_id == worksheet_id
        ).scalar() or 0
        
        submission = None
        if current_user.role == 'teacher':
            submission_count = db.query(func.count(models.WorksheetSubmission.id)).filter(
                models.WorksheetSubmission.worksheet_id == worksheet_id
            ).scalar() or 0
        else:
            submission = db.query(models.WorksheetSubmission).filter(
                models.WorksheetSubmission.worksheet_id == worksheet_id,
                models.WorksheetSubmission.student_id == current_user.id
            ).first()
            submission_count = 1 if submission else 0
        
        return {
            "id": worksheet.id,
            "title": worksheet.title,
            "description": worksheet.description,
            "worksheet_type": worksheet.worksheet_type.value,
            "due_date": worksheet.due_date,
            "max_score": worksheet.max_score,
            "is_published": worksheet.is_published,
            "question_count": question_count,
            "submission_count": submission_count,
            "has_submission": submission is not None,
            "grade": submission.grade if submission else None,
            "created_at": worksheet.created_at
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load worksheet: {str(e)}")
    

@app.post("/api/classes/{class_id}/worksheets", response_model=WorksheetResponse)
async def create_worksheet(
    class_id: int,
    worksheet_data: WorksheetCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new worksheet (teacher only)"""
    try:
        if current_user.role != 'teacher':
            raise HTTPException(status_code=403, detail="Only teachers can create worksheets")
        
        class_obj = db.query(models.Class).filter(
            models.Class.id == class_id,
            models.Class.teacher_id == current_user.id
        ).first()
        
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found or access denied")
        
        new_worksheet = models.Worksheet(
            class_id=class_id,
            teacher_id=current_user.id,
            title=worksheet_data.title,
            description=worksheet_data.description,
            worksheet_type=worksheet_data.worksheet_type,
            due_date=worksheet_data.due_date,
            max_score=worksheet_data.max_score,
            is_published=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(new_worksheet)
        db.commit()
        db.refresh(new_worksheet)
        
        return {
            "id": new_worksheet.id,
            "class_id": new_worksheet.class_id,
            "title": new_worksheet.title,
            "description": new_worksheet.description,
            "worksheet_type": new_worksheet.worksheet_type,
            "question_count": 0,
            "due_date": new_worksheet.due_date,
            "is_published": new_worksheet.is_published,
            "created_at": new_worksheet.created_at
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create worksheet: {str(e)}")

@app.post("/api/worksheets/{worksheet_id}/questions")
async def add_question(
    worksheet_id: int,
    question_data: QuestionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a question to a worksheet (teacher only)"""
    try:
        worksheet = db.query(models.Worksheet).filter(models.Worksheet.id == worksheet_id).first()
        if not worksheet:
            raise HTTPException(status_code=404, detail="Worksheet not found")
        
        if worksheet.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only worksheet creator can add questions")
        
        options_json = json.dumps(question_data.options) if question_data.options else None
        
        new_question = models.Question(
            worksheet_id=worksheet_id,
            question_text=question_data.question_text,
            question_type=question_data.question_type,
            options=options_json,
            correct_answer=question_data.correct_answer,
            explanation=question_data.explanation,
            points=question_data.points,
            order=question_data.order,
            created_at=datetime.utcnow()
        )
        
        db.add(new_question)
        worksheet.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            "success": True,
            "question_id": new_question.id,
            "message": "Question added successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add question: {str(e)}")

@app.post("/api/worksheets/{worksheet_id}/publish")
async def publish_worksheet(
    worksheet_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Publish a worksheet (make it visible to students)"""
    try:
        worksheet = db.query(models.Worksheet).filter(models.Worksheet.id == worksheet_id).first()
        if not worksheet:
            raise HTTPException(status_code=404, detail="Worksheet not found")
        
        if worksheet.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only worksheet creator can publish")
        
        question_count = db.query(func.count(models.Question.id)).filter(
            models.Question.worksheet_id == worksheet_id
        ).scalar() or 0
        
        if question_count == 0:
            raise HTTPException(status_code=400, detail="Cannot publish empty worksheet")
        
        worksheet.is_published = True
        worksheet.updated_at = datetime.utcnow()
        
        enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.class_id == worksheet.class_id,
            models.Enrollment.status == models.EnrollmentStatus.APPROVED
        ).all()
        
        for enrollment in enrollments:
            notification = models.Notification(
                user_id=enrollment.student_id,
                title="New Worksheet Available",
                message=f"A new worksheet '{worksheet.title}' is available in {worksheet.class_obj.name}",
                type="new_worksheet",
                related_id=worksheet.id,
                created_at=datetime.utcnow()
            )
            db.add(notification)
        
        db.commit()
        
        return {
            "success": True,
            "message": "Worksheet published successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to publish worksheet: {str(e)}")
    

@app.get("/api/classes/{class_id}/worksheets")
async def get_class_worksheets(
    class_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all worksheets for a class"""
    try:
        class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found")
        
        can_access = False
        if current_user.role == 'teacher' and class_obj.teacher_id == current_user.id:
            can_access = True
        else:
            enrollment = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == current_user.id,
                models.Enrollment.class_id == class_id,
                models.Enrollment.status == models.EnrollmentStatus.APPROVED
            ).first()
            if enrollment:
                can_access = True
        
        if not can_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if current_user.role == 'teacher':
            worksheets = db.query(models.Worksheet).filter(
                models.Worksheet.class_id == class_id
            ).order_by(models.Worksheet.created_at.desc()).all()
        else:
            worksheets = db.query(models.Worksheet).filter(
                models.Worksheet.class_id == class_id,
                models.Worksheet.is_published == True
            ).order_by(models.Worksheet.created_at.desc()).all()
        
        result = []
        for worksheet in worksheets:
            question_count = db.query(func.count(models.Question.id)).filter(
                models.Question.worksheet_id == worksheet.id
            ).scalar() or 0
            
            avg_grade = db.query(func.avg(models.WorksheetSubmission.grade)).filter(
                models.WorksheetSubmission.worksheet_id == worksheet.id,
                models.WorksheetSubmission.grade.isnot(None)
            ).scalar()
            
            submission_count = db.query(func.count(models.WorksheetSubmission.id)).filter(
                models.WorksheetSubmission.worksheet_id == worksheet.id
            ).scalar() or 0
            
            pending_grading = db.query(func.count(models.WorksheetSubmission.id)).filter(
                models.WorksheetSubmission.worksheet_id == worksheet.id,
                models.WorksheetSubmission.grade.is_(None)
            ).scalar() or 0
            
            submission = None
            if current_user.role == 'student':
                submission = db.query(models.WorksheetSubmission).filter(
                    models.WorksheetSubmission.worksheet_id == worksheet.id,
                    models.WorksheetSubmission.student_id == current_user.id
                ).first()
            
            result.append({
                "id": worksheet.id,
                "title": worksheet.title,
                "description": worksheet.description,
                "worksheet_type": worksheet.worksheet_type.value if worksheet.worksheet_type else "question_based",
                "question_count": question_count,
                "due_date": worksheet.due_date,
                "max_score": worksheet.max_score,
                "average_grade": round(avg_grade, 2) if avg_grade else None,
                "submission_count": submission_count,
                "pending_grading": pending_grading,
                "is_published": worksheet.is_published,
                "has_submission": submission is not None,
                "grade": submission.grade if submission else None,
                "created_at": worksheet.created_at,
                "teacher_id": worksheet.teacher_id
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load worksheets: {str(e)}")

# -------------------------------
# AI CHAT ENDPOINTS FOR CLASSES
# -------------------------------
@app.post("/api/classes/{class_id}/chats")
async def create_class_chat(
    class_id: int,
    chat_data: dict = Body(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create an AI chat for a class"""
    try:
        class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found")
        
        can_access = False
        if current_user.role == 'teacher' and class_obj.teacher_id == current_user.id:
            can_access = True
        else:
            enrollment = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == current_user.id,
                models.Enrollment.class_id == class_id,
                models.Enrollment.status == models.EnrollmentStatus.APPROVED
            ).first()
            if enrollment:
                can_access = True
        
        if not can_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        new_chat = models.ClassChat(
            class_id=class_id,
            title=chat_data.get("title", "Class Chat"),
            description=chat_data.get("description", ""),
            is_public=True,
            ai_enabled=True,
            created_at=datetime.utcnow()
        )
        
        db.add(new_chat)
        db.commit()
        db.refresh(new_chat)
        
        quick_prompts = [
            "Summarize the main concepts",
            "Explain this in simpler terms",
            "Give me examples of this concept",
            "Create a quiz from this material",
            "What are the key takeaways?"
        ]
        
        for i, prompt in enumerate(quick_prompts):
            quick = models.QuickPrompt(
                chat_id=new_chat.id,
                prompt_text=prompt,
                category="general",
                order=i
            )
            db.add(quick)
        
        db.commit()
        
        return {
            "id": new_chat.id,
            "title": new_chat.title,
            "description": new_chat.description,
            "class_id": new_chat.class_id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create chat: {str(e)}")

@app.get("/api/classes/{class_id}/chats")
async def get_class_chats(
    class_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all AI chats for a class"""
    try:
        class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found")
        
        can_access = False
        if current_user.role == 'teacher' and class_obj.teacher_id == current_user.id:
            can_access = True
        else:
            enrollment = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == current_user.id,
                models.Enrollment.class_id == class_id,
                models.Enrollment.status == models.EnrollmentStatus.APPROVED
            ).first()
            if enrollment:
                can_access = True
        
        if not can_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        chats = db.query(models.ClassChat).filter(
            models.ClassChat.class_id == class_id
        ).order_by(models.ClassChat.created_at.desc()).all()
        
        result = []
        for chat in chats:
            message_count = db.query(func.count(models.ClassChatMessage.id)).filter(
                models.ClassChatMessage.chat_id == chat.id
            ).scalar() or 0
            
            quick_prompts = db.query(models.QuickPrompt).filter(
                models.QuickPrompt.chat_id == chat.id
            ).order_by(models.QuickPrompt.order).all()
            
            result.append({
                "id": chat.id,
                "title": chat.title,
                "description": chat.description,
                "message_count": message_count,
                "quick_prompts": [
                    {
                        "id": qp.id,
                        "text": qp.prompt_text,
                        "category": qp.category
                    } for qp in quick_prompts
                ],
                "created_at": chat.created_at
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load chats: {str(e)}")

@app.post("/api/chats/{chat_id}/messages")
async def send_chat_message(
    chat_id: int,
    message_data: dict = Body(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message in class AI chat"""
    try:
        chat = db.query(models.ClassChat).filter(models.ClassChat.id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        class_obj = chat.class_obj
        can_access = False
        if current_user.role == 'teacher' and class_obj.teacher_id == current_user.id:
            can_access = True
        else:
            enrollment = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == current_user.id,
                models.Enrollment.class_id == class_obj.id,
                models.Enrollment.status == models.EnrollmentStatus.APPROVED
            ).first()
            if enrollment:
                can_access = True
        
        if not can_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        content = message_data.get("content", "")
        use_ai = message_data.get("use_ai", True)
        
        user_message = models.ClassChatMessage(
            chat_id=chat_id,
            student_id=current_user.id if current_user.role == 'student' else None,
            teacher_id=current_user.id if current_user.role == 'teacher' else None,
            content=content,
            role=current_user.role,
            is_ai_generated=False,
            created_at=datetime.utcnow()
        )
        db.add(user_message)
        
        ai_response = ""
        if use_ai and chat.ai_enabled:
            materials = db.query(models.ClassMaterial).filter(
                models.ClassMaterial.class_id == class_obj.id
            ).all()
            
            context = ""
            for material in materials:
                if material.is_ai_ready:
                    contexts = db.query(models.ChatContext).filter(
                        models.ChatContext.material_id == material.id
                    ).all()
                    for ctx in contexts:
                        context += ctx.content[:1000] + "\n"
            
            prompt = f"Context from class materials:\n{context}\n\nStudent question: {content}\n\nProvide a helpful, educational response:"
            ai_response = llm_manager.generate(prompt, max_tokens=500, temperature=0.7)
            
            ai_message = models.ClassChatMessage(
                chat_id=chat_id,
                content=ai_response,
                role="ai",
                is_ai_generated=True,
                created_at=datetime.utcnow()
            )
            db.add(ai_message)
        
        db.commit()
        
        return {
            "user_message": content,
            "ai_response": ai_response if use_ai else None,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")
    
@app.delete("/api/classes/{class_id}")
async def delete_class(
    class_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a class (teacher only)"""
    try:
        if current_user.role != 'teacher':
            raise HTTPException(status_code=403, detail="Only teachers can delete classes")
        
        class_obj = db.query(models.Class).filter(
            models.Class.id == class_id,
            models.Class.teacher_id == current_user.id
        ).first()
        
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found or access denied")
        
        class_name = class_obj.name
        print(f"Deleting class: {class_name} (ID: {class_id})")
        
        try:
            db.delete(class_obj)
            db.commit()
            print(f"Class deleted successfully with cascade: {class_name}")
            
        except Exception as cascade_error:
            db.rollback()
            print(f"Cascade delete failed: {cascade_error}")
            print("Trying manual deletion of related records...")
            
            db.query(models.ClassChatMessage).filter(
                models.ClassChatMessage.chat_id.in_(
                    db.query(models.ClassChat.id).filter(models.ClassChat.class_id == class_id)
                )
            ).delete(synchronize_session=False)
            
            db.query(models.QuickPrompt).filter(
                models.QuickPrompt.chat_id.in_(
                    db.query(models.ClassChat.id).filter(models.ClassChat.class_id == class_id)
                )
            ).delete(synchronize_session=False)
            
            db.query(models.ClassChat).filter(models.ClassChat.class_id == class_id).delete(synchronize_session=False)
            
            db.query(models.ChatContext).filter(
                models.ChatContext.material_id.in_(
                    db.query(models.ClassMaterial.id).filter(models.ClassMaterial.class_id == class_id)
                )
            ).delete(synchronize_session=False)
            
            db.query(models.ClassMaterial).filter(models.ClassMaterial.class_id == class_id).delete(synchronize_session=False)
            
            db.query(models.Announcement).filter(models.Announcement.class_id == class_id).delete(synchronize_session=False)
            
            submissions = db.query(models.WorksheetSubmission.id).filter(
                models.WorksheetSubmission.worksheet_id.in_(
                    db.query(models.Worksheet.id).filter(models.Worksheet.class_id == class_id)
                )
            ).subquery()
            
            db.query(models.Answer).filter(models.Answer.submission_id.in_(submissions)).delete(synchronize_session=False)
            
            db.query(models.WorksheetSubmission).filter(
                models.WorksheetSubmission.worksheet_id.in_(
                    db.query(models.Worksheet.id).filter(models.Worksheet.class_id == class_id)
                )
            ).delete(synchronize_session=False)
            
            db.query(models.Question).filter(
                models.Question.worksheet_id.in_(
                    db.query(models.Worksheet.id).filter(models.Worksheet.class_id == class_id)
                )
            ).delete(synchronize_session=False)
            
            db.query(models.Worksheet).filter(models.Worksheet.class_id == class_id).delete(synchronize_session=False)
            
            db.query(models.Enrollment).filter(models.Enrollment.class_id == class_id).delete(synchronize_session=False)
            
            db.query(models.Notification).filter(
                or_(
                    models.Notification.type == 'enrollment_request',
                    models.Notification.type == 'enrollment_approved',
                    models.Notification.type == 'enrollment_rejected',
                    models.Notification.type == 'new_worksheet'
                ),
                models.Notification.related_id == class_id
            ).delete(synchronize_session=False)
            
            db.delete(class_obj)
            db.commit()
            print(f"Class deleted successfully with manual cleanup: {class_name}")
        
        return {
            "success": True,
            "message": f"Class '{class_name}' deleted successfully"
        }
        
    except Exception as e:
        db.rollback()
        print(f"Error deleting class {class_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to delete class: {str(e)}")
        

@app.get("/api/chats/{chat_id}/messages")
async def get_chat_messages(
    chat_id: int,
    limit: int = Query(50, ge=1, le=100),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get messages from a class chat"""
    try:
        chat = db.query(models.ClassChat).filter(models.ClassChat.id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        class_obj = chat.class_obj
        can_access = False
        if current_user.role == 'teacher' and class_obj.teacher_id == current_user.id:
            can_access = True
        else:
            enrollment = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == current_user.id,
                models.Enrollment.class_id == class_obj.id,
                models.Enrollment.status == models.EnrollmentStatus.APPROVED
            ).first()
            if enrollment:
                can_access = True
        
        if not can_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        messages = db.query(models.ClassChatMessage).filter(
            models.ClassChatMessage.chat_id == chat_id
        ).order_by(models.ClassChatMessage.created_at.desc()).limit(limit).all()
        
        messages.reverse()
        
        result = []
        for msg in messages:
            sender = None
            if msg.student_id:
                student = db.query(models.User).filter(models.User.id == msg.student_id).first()
                sender = student.username if student else "Student"
            elif msg.teacher_id:
                teacher = db.query(models.User).filter(models.User.id == msg.teacher_id).first()
                sender = teacher.username if teacher else "Teacher"
            else:
                sender = "AI Assistant"
            
            result.append({
                "id": msg.id,
                "content": msg.content,
                "role": msg.role,
                "sender": sender,
                "is_ai_generated": msg.is_ai_generated,
                "created_at": msg.created_at
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load messages: {str(e)}")