import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/vuelos_db"
)

# Convert url to asyncpg
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql+psycopg://", "postgresql+asyncpg://")

class Base(DeclarativeBase):
    pass

engine = create_engine(
    DATABASE_URL,
    echo=False,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=Session,
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Asincrónico Moderno ---
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,
    future=True,
)

AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=AsyncSession,
)

async def get_async_db():
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()
