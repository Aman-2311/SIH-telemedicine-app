from fastapi import APIRouter
from pydantic import BaseModel
import random

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
    return {"status": "success", "message": "OTP sent", "mock_otp": "1234"}

@router.post("/login")
async def login_with_abha(request: LoginRequest):
    return {
        "status": "success",
        "message": "Dummy Login successful",
        "access_token": f"mock_jwt_token_{request.role}_999",
        "user_id": f"dummy_user_{request.abha_id}",
        "role": request.role
    }

@router.post("/generate-app-id")
async def generate_app_id(request: CreateAbhaRequest):
    return {
        "status": "success",
        "message": "Dummy SAHARA ID Generated",
        "abha_id": f"SAHARA-{random.randint(1000, 9999)}",
        "access_token": f"mock_jwt_token_{request.role}_999",
        "user_id": "dummy_generated_user"
    }

@router.post("/generate-abha")
async def generate_mock_abha(request: CreateAbhaRequest):
    part1 = str(random.randint(10, 99))
    part2 = str(random.randint(1000, 9999))
    part3 = str(random.randint(1000, 9999))
    part4 = str(random.randint(1000, 9999))
    return {
        "status": "success",
        "message": "Dummy ABHA ID Generated",
        "abha_id": f"{part1}-{part2}-{part3}-{part4}",
        "access_token": f"mock_jwt_token_{request.role}_999",
        "user_id": "dummy_generated_user"
    }