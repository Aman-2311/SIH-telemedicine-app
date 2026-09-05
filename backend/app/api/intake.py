from fastapi import APIRouter, HTTPException
from app.schemas.patient import PatientIntake
from app.services.ai_service import analyze_patient_case  

router = APIRouter()

@router.post("/intake")
async def submit_patient_intake(data: PatientIntake):
    """
    Receives initial patient intake, runs AI triage analysis, 
    and returns a structured clinical summary for urban doctors.
    """
    try:
        ai_analysis = analyze_patient_case(data)
        
        return {
            "status": "success",
            "message": "Patient intake processed and AI triage generated successfully.",
            "data": {
                "abha_id": data.abha_id,
                "recorded_vitals": data.vitals.model_dump(),
                "ai_triage": ai_analysis
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))