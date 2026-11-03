from app.database.connection import sync_engine
from app.database.base import Base
import app.models  # ensure models are registered


def create_all_tables():
    Base.metadata.create_all(bind=sync_engine)
    print("Database tables created successfully.")


if __name__ == "__main__":
    create_all_tables()
