import uvicorn
from app.main import app

if __name__ == "__main__":
    print("🚀 Starting Offline Education App Backend...")
    print("📡 Server running at: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )