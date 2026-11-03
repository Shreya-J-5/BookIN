from typing import Optional, Dict, Any
from fastapi import Request
from app.core.security import decode_token


async def get_context(request: Request) -> Dict[str, Any]:
    user = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        payload = decode_token(token)
        if payload and payload.get("type") == "access":
            user = {
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "roles": payload.get("roles", [])
            }
            request.state.user = user

    return {
        "request": request,
        "user": user
    }
