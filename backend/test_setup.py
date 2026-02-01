print("Testing setup...")

try:
    from app.database import Base, engine, init_db
    print("✅ Database imported!")
    
    init_db()
    print("✅ Database created!")
    print("✅ Setup is working!")
    
except Exception as e:
    print(f"❌ Error: {e}")