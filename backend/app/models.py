from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Float, BigInteger, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base


class EnrollmentStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class WorksheetType(enum.Enum):
    PDF = "PDF"
    QUESTION_BASED = "QUESTION_BASED"
    TEXT = "TEXT"

class QuestionType(enum.Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"
    ESSAY = "essay"
    FILL_BLANK = "fill_blank"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="student")
    full_name = Column(String)
    bio = Column(Text)
    theme = Column(String, default="dark")
    language = Column(String, default="en")
    onboarding_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    chats = relationship("Chat", back_populates="user", cascade="all, delete-orphan")
    
    # Teacher relationships
    classes_taught = relationship("Class", back_populates="teacher", cascade="all, delete-orphan")
    
    # Student relationships
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan", foreign_keys="[Enrollment.student_id]")
    worksheet_submissions = relationship("WorksheetSubmission", back_populates="student", cascade="all, delete-orphan", foreign_keys="[WorksheetSubmission.student_id]")
    class_chat_messages = relationship("ClassChatMessage", back_populates="student", foreign_keys="[ClassChatMessage.student_id]")
    
    # Notifications
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    
    # Material uploads
    uploaded_materials = relationship("ClassMaterial", back_populates="uploader", foreign_keys="[ClassMaterial.user_id]")
    created_folders = relationship("MaterialFolder", back_populates="creator", foreign_keys="[MaterialFolder.user_id]")


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(BigInteger, nullable=False)
    extracted_text = Column(Text)
    chunks = Column(Text)  # JSON serialized chunks
    status = Column(String, default="processing")  # processing, ready, failed
    upload_date = Column(DateTime, default=datetime.utcnow)
    last_accessed = Column(DateTime, default=datetime.utcnow)
    summary = Column(Text)
    
    user = relationship("User", back_populates="documents")
    chats = relationship("Chat", back_populates="document", cascade="all, delete-orphan")


class Chat(Base):
    __tablename__ = "chats"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="chats")
    document = relationship("Document", back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)
    role = Column(String, nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    chat = relationship("Chat", back_populates="messages")


class Class(Base):
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    subject = Column(String)
    grade_level = Column(String)
    class_code = Column(String, unique=True, index=True, nullable=False)
    max_students = Column(Integer, default=50)
    is_active = Column(Boolean, default=True)
    cover_image = Column(String)  # URL for class cover image
    created_at = Column(DateTime, default=datetime.utcnow)
    
    teacher = relationship("User", back_populates="classes_taught")
    enrollments = relationship("Enrollment", back_populates="class_obj", cascade="all, delete-orphan")
    worksheets = relationship("Worksheet", back_populates="class_obj", cascade="all, delete-orphan")
    materials = relationship("ClassMaterial", back_populates="class_obj", cascade="all, delete-orphan")
    material_folders = relationship("MaterialFolder", back_populates="class_obj", cascade="all, delete-orphan")
    announcements = relationship("Announcement", back_populates="class_obj", cascade="all, delete-orphan")
    class_chats = relationship("ClassChat", back_populates="class_obj", cascade="all, delete-orphan")


class Enrollment(Base):
    __tablename__ = "enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    status = Column(Enum(EnrollmentStatus), default=EnrollmentStatus.PENDING)
    requested_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    student = relationship("User", back_populates="enrollments", foreign_keys=[student_id])
    class_obj = relationship("Class", back_populates="enrollments")
    approver = relationship("User", foreign_keys=[approved_by])


class Worksheet(Base):
    __tablename__ = "worksheets"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    worksheet_type = Column(Enum(WorksheetType), default=WorksheetType.QUESTION_BASED)
    pdf_file_path = Column(String, nullable=True)  # For PDF worksheets
    due_date = Column(DateTime, nullable=True)
    max_score = Column(Integer, default=100)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    class_obj = relationship("Class", back_populates="worksheets")
    teacher = relationship("User", foreign_keys=[teacher_id])
    questions = relationship("Question", back_populates="worksheet", cascade="all, delete-orphan")
    submissions = relationship("WorksheetSubmission", back_populates="worksheet", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    worksheet_id = Column(Integer, ForeignKey("worksheets.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(Enum(QuestionType), nullable=False)
    options = Column(Text)  # JSON for multiple choice
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text)  # Detailed explanation
    points = Column(Integer, default=10)
    order = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    worksheet = relationship("Worksheet", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")


class WorksheetSubmission(Base):
    __tablename__ = "worksheet_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    worksheet_id = Column(Integer, ForeignKey("worksheets.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    grade = Column(Float, default=0.0)
    feedback = Column(Text)
    ai_feedback = Column(Text)  # AI-generated feedback
    status = Column(String, default="submitted")  # submitted, graded, returned
    
    worksheet = relationship("Worksheet", back_populates="submissions")
    student = relationship("User", back_populates="worksheet_submissions", foreign_keys=[student_id])
    answers = relationship("Answer", back_populates="submission", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("worksheet_submissions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer_text = Column(Text, nullable=False)
    is_correct = Column(Boolean)
    points_awarded = Column(Integer, default=0)
    ai_feedback = Column(Text)
    
    submission = relationship("WorksheetSubmission", back_populates="answers")
    question = relationship("Question", back_populates="answers")


class ClassMaterial(Base):
    __tablename__ = "class_materials"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Uploader
    title = Column(String, nullable=False)
    description = Column(Text)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(BigInteger, nullable=False)
    folder_id = Column(Integer, ForeignKey("material_folders.id"), nullable=True)
    is_ai_ready = Column(Boolean, default=False)
    status = Column(String, default="active")  # active, archived, deleted
    upload_date = Column(DateTime, default=datetime.utcnow)
    last_accessed = Column(DateTime, default=datetime.utcnow)
    download_count = Column(Integer, default=0)
    
    # Relationships
    class_obj = relationship("Class", back_populates="materials")
    uploader = relationship("User", back_populates="uploaded_materials", foreign_keys=[user_id])
    folder = relationship("MaterialFolder", back_populates="materials")
    chat_contexts = relationship("ChatContext", back_populates="material", cascade="all, delete-orphan")


class MaterialFolder(Base):
    __tablename__ = "material_folders"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Creator
    name = Column(String, nullable=False)
    description = Column(Text)
    color = Column(String, default="blue")
    order_index = Column(Integer, default=0)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    class_obj = relationship("Class", back_populates="material_folders")
    creator = relationship("User", back_populates="created_folders", foreign_keys=[user_id])
    materials = relationship("ClassMaterial", back_populates="folder")


class Announcement(Base):
    __tablename__ = "announcements"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    is_important = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    class_obj = relationship("Class", back_populates="announcements")
    teacher = relationship("User", foreign_keys=[teacher_id])


class ClassChat(Base):
    __tablename__ = "class_chats"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    worksheet_id = Column(Integer, ForeignKey("worksheets.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    is_public = Column(Boolean, default=True)
    ai_enabled = Column(Boolean, default=True)
    context_material_id = Column(Integer, ForeignKey("class_materials.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    class_obj = relationship("Class", back_populates="class_chats")
    worksheet = relationship("Worksheet")
    context_material = relationship("ClassMaterial")
    messages = relationship("ClassChatMessage", back_populates="class_chat", cascade="all, delete-orphan")
    quick_prompts = relationship("QuickPrompt", back_populates="class_chat", cascade="all, delete-orphan")


class ClassChatMessage(Base):
    __tablename__ = "class_chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("class_chats.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null for AI messages
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null for student/AI messages
    content = Column(Text, nullable=False)
    role = Column(String, nullable=False)  # student, teacher, ai
    is_ai_generated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    class_chat = relationship("ClassChat", back_populates="messages")
    student = relationship("User", back_populates="class_chat_messages", foreign_keys=[student_id])
    teacher = relationship("User", foreign_keys=[teacher_id])


class QuickPrompt(Base):
    __tablename__ = "quick_prompts"
    
    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("class_chats.id"), nullable=False)
    prompt_text = Column(String, nullable=False)
    ai_response_template = Column(Text)
    category = Column(String)  # summary, explanation, quiz, etc.
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    class_chat = relationship("ClassChat", back_populates="quick_prompts")


class ChatContext(Base):
    __tablename__ = "chat_contexts"
    
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("class_materials.id"), nullable=False)
    content = Column(Text, nullable=False)  # Extracted text for AI context
    vector_embedding = Column(Text)  # JSON for vector embeddings
    created_at = Column(DateTime, default=datetime.utcnow)
    
    material = relationship("ClassMaterial", back_populates="chat_contexts")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String)  # enrollment_request, worksheet_graded, announcement, etc.
    related_id = Column(Integer)  # ID of related entity
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="notifications")