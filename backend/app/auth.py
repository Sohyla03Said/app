from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import models
from .database import get_db
import bcrypt

SECRET_KEY = "your-secret-key-change-this-in-production-12345"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7   # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def get_password_hash(password: str) -> str:
    if len(password.encode('utf-8')) > 72:
        raise ValueError("Password too long (max 72 bytes)")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    
    # Force sub to be string (prevents type mismatch issues)
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"[DEBUG] Token decoded successfully. sub = {payload.get('sub')}, exp = {payload.get('exp')}")
        print(f"[DEBUG] Current server time: {datetime.utcnow().isoformat()}")
        return payload
    except JWTError as e:
        print(f"[JWT ERROR] Failed to decode token: {str(e)}")
        return None


# ADD THIS FUNCTION - it was missing
def decode_access_token(token: str):
    """Alias for decode_token to match main.py import"""
    return decode_token(token)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    print(f"[DEBUG] get_current_user called with token: {token[:20]}...")
    
    payload = decode_token(token)
    if payload is None:
        print("[DEBUG] Payload is None → authentication failed")
        raise credentials_exception
    
    user_id_str = payload.get("sub")
    if user_id_str is None:
        print("[DEBUG] No 'sub' in payload")
        raise credentials_exception
    
    try:
        user_id = int(user_id_str)  # convert back to int for DB lookup
    except ValueError:
        print(f"[DEBUG] Invalid user_id format: {user_id_str}")
        raise credentials_exception
    
    print(f"[DEBUG] Looking for user with id = {user_id}")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        print(f"[DEBUG] User with id {user_id} not found in database")
        raise credentials_exception
    
    print(f"[DEBUG] User authenticated: id={user.id}, username={user.username}")
    return user


def authenticate_user(db: Session, username: str, password: str):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        print(f"[DEBUG] User not found: {username}")
        return False
    if not verify_password(password, user.hashed_password):
        print(f"[DEBUG] Password verification failed for {username}")
        return False
    print(f"[DEBUG] User authenticated during login: {username}")
    return user