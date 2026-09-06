from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.schemas.patient import PatientIntake
from app.services.ai_service import analyze_patient_case, extract_form_data_from_voice
from app.core.database import supabase

router = APIRouter()

# --- NEW SCHEMA FOR VOICE INPUT ---
class VoiceInput(BaseModel):
    spoken_text: str


# --- 1. EXISTING INTAKE ENDPOINT ---
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
            "generic_medicines": ai_analysis.get("generic_medicines", []),
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


# --- 2. NEW VOICE-TO-FORM NLP ENDPOINT ---
@router.post("/extract-voice")
async def extract_voice_to_form(request: VoiceInput):
    """
    Takes raw transcribed text (Hindi/Marathi/English) and uses Gemini NLP 
    to auto-fill the frontend triage form.
    """
    try:
        extracted_data = extract_form_data_from_voice(request.spoken_text)
        
        return {
            "status": "success",
            "message": "Voice data successfully parsed into clinical format",
            "data": extracted_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))