from fastapi import APIRouter
from pydantic import BaseModel
import random
from app.core.security import create_access_token, TEST_IDENTITIES

router = APIRouter()

class LoginRequest(BaseModel):
    abha_id: str
    role: str  

class CreateAbhaRequest(BaseModel):
    phone_number: str
    full_name: str
    role: str = "patient"

class OtpRequest(BaseModel):
    phone_number: str

@router.post("/send-otp")
async def send_otp(request: OtpRequest):
    # Safe synthetic mock OTP for testing
    return {
        "status": "success",
        "message": f"OTP successfully dispatched to {request.phone_number}",
        "mock_otp": "1234"
    }

@router.post("/login")
async def login_with_abha(request: LoginRequest):
    # Map identity from authorized test records or construct synthetic demo payload
    identity = TEST_IDENTITIES.get(request.abha_id, {
        "sub": request.abha_id,
        "name": "Sunita Patil (TEST)" if request.role == "asha" else ("Savita Patil (TEST)" if request.role == "patient" else "Dr. Arvind Kulkarni (MD)"),
        "role": request.role,
        "phone": "+91 90000 10001" if request.role == "asha" else ("+91 90000 10002" if request.role == "patient" else "+91 90000 10003"),
    })

    # Generate real cryptographic JWT with HMAC-SHA256
    token = create_access_token({
        "sub": identity["sub"],
        "role": identity["role"],
        "name": identity["name"],
        "phone": identity.get("phone", ""),
        "is_test_identity": True,
    })

    return {
        "status": "success",
        "message": f"Authenticated successfully as {identity['name']}",
        "access_token": token,
        "token_type": "Bearer",
        "user_id": identity["sub"],
        "role": identity["role"],
        "user": {
            "abha_id": identity["sub"],
            "full_name": identity["name"],
            "role": identity["role"],
            "phone_number": identity.get("phone", ""),
            "is_test_account": True,
        }
    }

@router.post("/generate-app-id")
async def generate_app_id(request: CreateAbhaRequest):
    app_id = f"SAHARA-TEST-{random.randint(1000, 9999)}"
    token = create_access_token({
        "sub": app_id,
        "role": request.role,
        "name": request.full_name,
        "is_test_identity": True,
    })
    return {
        "status": "success",
        "message": "Synthetic SAHARA ID Generated",
        "abha_id": app_id,
        "access_token": token,
        "token_type": "Bearer",
        "user_id": app_id,
        "role": request.role,
        "user": {
            "abha_id": app_id,
            "full_name": request.full_name,
            "role": request.role,
            "is_test_account": True,
        }
    }

@router.post("/generate-abha")
async def generate_mock_abha(request: CreateAbhaRequest):
    part1 = str(random.randint(10, 99))
    part2 = str(random.randint(1000, 9999))
    part3 = str(random.randint(1000, 9999))
    part4 = str(random.randint(1000, 9999))
    abha_id = f"TEST-{part1}-{part2}-{part3}-{part4}"
    token = create_access_token({
        "sub": abha_id,
        "role": request.role,
        "name": request.full_name,
        "is_test_identity": True,
    })
    return {
        "status": "success",
        "message": "Synthetic ABHA ID Generated",
        "abha_id": abha_id,
        "access_token": token,
        "token_type": "Bearer",
        "user_id": abha_id,
        "role": request.role,
        "user": {
            "abha_id": abha_id,
            "full_name": request.full_name,
            "role": request.role,
            "is_test_account": True,
        }
    }