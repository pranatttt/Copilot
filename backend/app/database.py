import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# The URL defined in your .env
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# 1. Create the Engine with Production Optimizations
# We increase robustness for persistent history writes.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # Standard pool size for concurrent users
    pool_size=20, 
    # Max additional connections if pool is full
    max_overflow=10, 
    # FIX: Checks if connection is alive before using it (Zscaler/Proxy safe)
    pool_pre_ping=True, 
    # FIX: Prevents "Connection Timed Out" by refreshing pipes every 30 mins
    pool_recycle=1800 
)

# 2. Create the Session Factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Base class for database models
Base = declarative_base()

# 4. Dependency to get the DB session
# Ensures every API request gets a fresh pipe and closes it immediately after saving history.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
