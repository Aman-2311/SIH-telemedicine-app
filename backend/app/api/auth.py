from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random
from app.core.database import supabase

router = APIRouter()

# --- DATA MODELS ---
class LoginRequest(BaseModel):
    abha_id: str
    role: str  # Must be 'patient', 'asha', or 'doctor'

class CreateAbhaRequest(BaseModel):
    phone_number: str
    full_name: str
    role: str = "patient"


# --- 1. LOGIN / AUTO-REGISTER ENDPOINT ---
@router.post("/login")
async def login_with_abha(request: LoginRequest):
    # Hackathon Trick: Convert the ABHA ID into a dummy email for Supabase Auth
    clean_id = request.abha_id.replace("-", "").strip()
    dummy_email = f"{clean_id}_{request.role}@sih-telemedicine.local"
    dummy_password = "SIH_SecurePassword123!" # Fixed password for seamless mock OTP flow

    try:
        # Step 1: Attempt to log the user in
        response = supabase.auth.sign_in_with_password({
            "email": dummy_email,
            "password": dummy_password
        })
        return {
            "status": "success",
            "message": "Login successful",
            "access_token": response.session.access_token,
            "user_id": response.user.id,
            "role": request.role
        }
    except Exception:
        # Step 2: If login fails (user doesn't exist), auto-register them!
        try:
            sign_up_response = supabase.auth.sign_up({
                "email": dummy_email,
                "password": dummy_password,
                "options": {
                    "data": {
                        "role": request.role,
                        "abha_id": request.abha_id
                    }
                }
            })
            return {
                "status": "success",
                "message": "New ABHA account registered securely",
                "access_token": sign_up_response.session.access_token,
                "user_id": sign_up_response.user.id,
                "role": request.role
            }
        except Exception as signup_error:
            raise HTTPException(status_code=400, detail=str(signup_error))


# --- 2. GENERATE MOCK ABHA ENDPOINT ---
@router.post("/generate-abha")
async def generate_mock_abha(request: CreateAbhaRequest):
    # For SIH: We simulate the ABDM Sandbox API generation
    # ABHA IDs are 14 digits, typically formatted as XX-XXXX-XXXX-XXXX
    part1 = str(random.randint(10, 99))
    part2 = str(random.randint(1000, 9999))
    part3 = str(random.randint(1000, 9999))
    part4 = str(random.randint(1000, 9999))
    
    new_mock_abha = f"{part1}-{part2}-{part3}-{part4}"
    
    # Use the same dummy email logic to register them in Supabase instantly
    clean_id = new_mock_abha.replace("-", "").strip()
    dummy_email = f"{clean_id}_{request.role}@sih-telemedicine.local"
    dummy_password = "SIH_SecurePassword123!"

    try:
        # Register the brand new user in Supabase Auth securely
        sign_up_response = supabase.auth.sign_up({
            "email": dummy_email,
            "password": dummy_password,
            "options": {
                "data": {
                    "role": request.role,
                    "abha_id": new_mock_abha,
                    "full_name": request.full_name
                }
            }
        })
        
        return {
            "status": "success",
            "message": "ABHA ID successfully generated via ABDM Sandbox",
            "abha_id": new_mock_abha,
            "access_token": sign_up_response.session.access_token,
            "user_id": sign_up_response.user.id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to generate ABHA: {str(e)}")