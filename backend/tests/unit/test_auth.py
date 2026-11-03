import pytest
import uuid
from app.services.auth_service import AuthService
from app.core.security import hash_password, verify_password, decode_token
from app.core.permissions import RoleEnum


def test_password_hashing():
    pwd = "SecurePassword123!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_user_registration_and_auth(db_session):
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "MySecretPassword123"
    name = "Test Cinephile"

    # Register
    user, access_token, refresh_token = AuthService.register_user(
        db=db_session,
        email=unique_email,
        password=pwd,
        full_name=name,
        role_name=RoleEnum.CUSTOMER
    )

    assert user.id is not None
    assert user.email == unique_email
    assert user.full_name == name
    assert RoleEnum.CUSTOMER in [r.name for r in user.roles]

    # Verify JWT Access Token
    payload = decode_token(access_token)
    assert payload is not None
    assert payload["sub"] == str(user.id)
    assert payload["email"] == unique_email
    assert RoleEnum.CUSTOMER in payload["roles"]

    # Authenticate
    auth_user, new_access, new_refresh = AuthService.authenticate_user(
        db=db_session,
        email=unique_email,
        password=pwd
    )
    assert auth_user.id == user.id

    # Duplicate registration fails
    with pytest.raises(ValueError, match="already exists"):
        AuthService.register_user(
            db=db_session,
            email=unique_email,
            password="anotherpassword",
            full_name="Duplicate"
        )
