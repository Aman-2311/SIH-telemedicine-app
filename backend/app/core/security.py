import os
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import jwt
from fastapi import HTTPException, Header, Depends, status
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "sahara_telemedicine_super_secure_jwt_secret_2026_abdm_compliant")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Exact authorized test mock identities
TEST_IDENTITIES = {
    "TEST-ASHA-MH-0001": {
        "sub": "TEST-ASHA-MH-0001",
        "name": "Sunita Patil (TEST)",
        "role": "asha",
        "phone": "+91 90000 10001",
    },
    "TEST-PATIENT-MH-0002": {
        "sub": "TEST-PATIENT-MH-0002",
        "name": "Savita Patil (TEST)",
        "role": "patient",
        "phone": "+91 90000 10002",
    },
    "DOC-MH-7001": {
        "sub": "DOC-MH-7001",
        "name": "Dr. Arvind Kulkarni (MD)",
        "role": "doctor",
        "phone": "+91 90000 10003",
    },
}


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    })
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        # Check if it's a development test fallback token
        if token.startswith("mock_jwt_token_"):
            parts = token.split("_")
            role = parts[3] if len(parts) > 3 else "asha"
            return {"sub": f"TEST-{role.upper()}-AUTO", "role": role, "name": f"Test {role.title()}"}
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = parts[1]
    return decode_access_token(token)


def require_role(allowed_roles: List[str]):
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User role '{user_role}' is not authorized for this resource. Required: {allowed_roles}",
            )
        return current_user
    return role_checker


# Role dependencies
require_asha = require_role(["asha", "admin"])
require_doctor = require_role(["doctor", "admin"])
require_patient = require_role(["patient", "admin"])
require_authenticated = get_current_user
