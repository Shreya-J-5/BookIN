from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from typing import AsyncGenerator, Generator
from app.core.config import settings

# Synchronous Engine & Session
sync_connect_args = {}
if settings.is_sqlite:
    sync_connect_args["check_same_thread"] = False

sync_engine = create_engine(
    settings.sync_database_url,
    echo=False,
    connect_args=sync_connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

# Asynchronous Engine & Session
async_connect_args = {}
if settings.is_sqlite:
    async_connect_args["check_same_thread"] = False

async_engine = create_async_engine(
    settings.async_database_url_resolved,
    echo=False,
    connect_args=async_connect_args,
    pool_pre_ping=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
