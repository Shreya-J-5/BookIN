import pytest
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import SessionLocal, sync_engine
from app.database.base import Base
import app.models
from app.database.seed import seed_database


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=sync_engine)
    seed_database()
    yield
    # Teardown if needed


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
