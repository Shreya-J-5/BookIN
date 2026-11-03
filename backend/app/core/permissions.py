from typing import List, Optional
from strawberry.permission import BasePermission
from strawberry.types import Info


class RoleEnum:
    CUSTOMER = "CUSTOMER"
    THEATRE_ADMIN = "THEATRE_ADMIN"
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"


ROLE_HIERARCHY = {
    RoleEnum.CUSTOMER: 1,
    RoleEnum.THEATRE_ADMIN: 2,
    RoleEnum.ADMIN: 3,
    RoleEnum.SUPER_ADMIN: 4,
}


class IsAuthenticated(BasePermission):
    message = "Authentication required. Please provide a valid Bearer token."

    def has_permission(self, source, info: Info, **kwargs) -> bool:
        request = info.context.get("request")
        if not request:
            return False
        user = getattr(request.state, "user", None)
        return user is not None


class HasRole(BasePermission):
    def __init__(self, required_role: str):
        self.required_role = required_role
        self.message = f"Permission denied. Role '{required_role}' or higher is required."

    def has_permission(self, source, info: Info, **kwargs) -> bool:
        request = info.context.get("request")
        if not request:
            return False
        user = getattr(request.state, "user", None)
        if not user:
            return False

        user_roles: List[str] = user.get("roles", [])
        required_level = ROLE_HIERARCHY.get(self.required_role, 99)

        # Check if user has any role equal to or higher than required level
        for role in user_roles:
            if ROLE_HIERARCHY.get(role, 0) >= required_level:
                return True
        return False


def is_user_admin(user: Optional[dict]) -> bool:
    if not user:
        return False
    roles = user.get("roles", [])
    return RoleEnum.ADMIN in roles or RoleEnum.SUPER_ADMIN in roles


def is_theatre_admin(user: Optional[dict]) -> bool:
    if not user:
        return False
    roles = user.get("roles", [])
    return RoleEnum.THEATRE_ADMIN in roles or RoleEnum.ADMIN in roles or RoleEnum.SUPER_ADMIN in roles
