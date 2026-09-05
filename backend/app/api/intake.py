from fastapi import APIRouter, HTTPException
from app.schemas.patient import PatientIntake
from app.services.ai_service import analyze_patient_case
from app.core.database import supabase

router = APIRouter()

@router.post("/intake")
async def submit_patient_intake(data: PatientIntake):
    try:
        ai_analysis = analyze_patient_case(data)
        
        record = {
            "abha_id": data.abha_id,
            "vitals": data.vitals.model_dump(),
            "voice_note_text": data.voice_note_text,
            "triage_priority": ai_analysis["triage_priority"],
            "clinical_flags": ai_analysis["clinical_flags"],
            "ai_recommendation": ai_analysis["ai_recommendation"],
            "image_url": data.image_url  
        }
        
        
        response = supabase.table("patient_intakes").insert(record).execute()

        return {
            "status": "success",
            "message": "Patient intake recorded and stored successfully in Supabase.",
            "data": {
                "database_record": response.data
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))