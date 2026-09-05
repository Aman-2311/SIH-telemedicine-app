from fastapi import APIRouter, HTTPException
from app.schemas.patient import PatientIntake

router = APIRouter()

@router.post("/intake")
async def submit_patient_intake(data: PatientIntake):
    """
    Receives the initial patient symptoms and vitals from the ASHA worker.
    """
    try:
        
        return {
            "status": "success",
            "message": "Patient intake data received and validated successfully.",
            "data": {
                "abha_id": data.abha_id,
                "recorded_vitals": data.vitals.model_dump() 
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))