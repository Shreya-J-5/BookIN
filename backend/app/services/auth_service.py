from typing import Optional, List, Tuple
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.user import User, Role, UserRole
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.permissions import RoleEnum


class AuthService:
    @staticmethod
    def get_or_create_role(db: Session, role_name: str) -> Role:
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            role = Role(name=role_name)
            db.add(role)
            db.commit()
            db.refresh(role)
        return role

    @classmethod
    def register_user(
        cls,
        db: Session,
        email: str,
        password: str,
        full_name: str,
        phone: Optional[str] = None,
        city: str = "Mumbai",
        role_name: str = RoleEnum.CUSTOMER
    ) -> Tuple[User, str, str]:
        # Normalize email
        email_clean = email.strip().lower()

        # Check existing user
        existing_user = db.query(User).filter(User.email == email_clean).first()
        if existing_user:
            raise ValueError(f"User with email '{email_clean}' already exists.")

        # Validate password strength
        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters long.")

        # Hash password and create user
        hashed = hash_password(password)
        new_user = User(
            email=email_clean,
            hashed_password=hashed,
            full_name=full_name.strip(),
            phone=phone.strip() if phone else None,
            city=city.strip(),
            is_active=True
        )
        db.add(new_user)
        db.flush()

        # Assign role
        role = cls.get_or_create_role(db, role_name)
        user_role = UserRole(user_id=new_user.id, role_id=role.id)
        db.add(user_role)
        db.commit()
        db.refresh(new_user)

        # Generate tokens
        role_names = [r.name for r in new_user.roles]
        access_token = create_access_token(str(new_user.id), new_user.email, role_names)
        refresh_token = create_refresh_token(str(new_user.id))

        return new_user, access_token, refresh_token

    @classmethod
    def authenticate_user(
        cls,
        db: Session,
        email: str,
        password: str
    ) -> Tuple[User, str, str]:
        email_clean = email.strip().lower()
        user = db.query(User).filter(User.email == email_clean).first()
        if not user:
            raise ValueError("Invalid email or password.")

        if not user.is_active:
            raise ValueError("Account is deactivated. Please contact support.")

        if not verify_password(password, user.hashed_password):
            raise ValueError("Invalid email or password.")

        role_names = [r.name for r in user.roles]
        access_token = create_access_token(str(user.id), user.email, role_names)
        refresh_token = create_refresh_token(str(user.id))

        return user, access_token, refresh_token

    @classmethod
    def refresh_access_token(cls, db: Session, refresh_token_str: str) -> Tuple[str, str]:
        payload = decode_token(refresh_token_str)
        if not payload or payload.get("type") != "refresh":
            raise ValueError("Invalid or expired refresh token.")

        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
        if not user or not user.is_active:
            raise ValueError("User not found or inactive.")

        role_names = [r.name for r in user.roles]
        new_access_token = create_access_token(str(user.id), user.email, role_names)
        new_refresh_token = create_refresh_token(str(user.id))
        return new_access_token, new_refresh_token

    @classmethod
    def get_user_by_id(cls, db: Session, user_id: uuid.UUID) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()
