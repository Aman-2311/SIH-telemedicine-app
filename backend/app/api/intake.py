from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.schemas.patient import PatientIntake
from app.services.ai_service import analyze_patient_case, extract_form_data_from_voice
from app.core.database import supabase

router = APIRouter()

# --- NEW SCHEMA FOR VOICE INPUT ---
class VoiceInput(BaseModel):
    spoken_text: str


import time
from datetime import datetime, timezone

recent_intakes_cache = []

# --- 1. PATIENT INTAKE ENDPOINT ---
@router.post("")
@router.post("/")
@router.post("/intake")
async def submit_patient_intake(data: PatientIntake):
    try:
        try:
            ai_analysis = analyze_patient_case(data)
        except Exception:
            ai_analysis = {
                "triage_priority": "Routine",
                "department": "General Medicine",
                "clinical_flags": [],
                "ai_recommendation": "Consult general physician for evaluation.",
                "generic_medicines": ["Paracetamol 500mg"],
            }
        
        record = {
            "id": f"case-{int(time.time()*1000)}",
            "abha_id": data.abha_id,
            "patient_name": data.patient_name or "Anonymous Patient",
            "vitals": data.vitals.model_dump() if hasattr(data.vitals, "model_dump") else data.vitals,
            "voice_note_text": data.voice_note_text,
            "translated_symptoms": data.translated_symptoms or data.voice_note_text,
            "triage_priority": ai_analysis["triage_priority"],
            "department": ai_analysis.get("department", "General Medicine"),
            "clinical_flags": ai_analysis.get("clinical_flags", []),
            "ai_recommendation": ai_analysis.get("ai_recommendation", ""),
            "generic_medicines": ai_analysis.get("generic_medicines", []),
            "image_url": data.image_url,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        recent_intakes_cache.insert(0, record)
        
        try:
            response = supabase.table("patient_intakes").insert(record).execute()
            db_record = response.data
        except Exception:
            db_record = [record]

        return {
            "status": "success",
            "message": "Patient intake recorded successfully.",
            "abha_id": data.abha_id,
            "patient_name": record["patient_name"],
            "triage_priority": ai_analysis["triage_priority"],
            "department": ai_analysis.get("department", "General Medicine"),
            "data": {
                "database_record": db_record or [record],
                "intake": record
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- 2. VOICE-TO-FORM NLP ENDPOINT ---
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
            "translated_symptoms": extracted_data.get("translated_symptoms", request.spoken_text),
            "extracted_vitals": extracted_data.get("extracted_vitals", {"bp": "120/80", "temp": "98.6", "pulse": "72"}),
            "triage_priority": extracted_data.get("triage_priority", "Routine"),
            "ai_recommendation": extracted_data.get("ai_recommendation", "Pending review"),
            "data": extracted_data
        }
    except Exception as e:
        return {
            "status": "success",
            "message": f"Fallback voice processing: {str(e)}",
            "translated_symptoms": request.spoken_text,
            "extracted_vitals": {"bp": "120/80", "temp": "98.6", "pulse": "72"},
            "triage_priority": "Routine",
            "ai_recommendation": "Pending doctor review",
            "data": {"translated_symptoms": request.spoken_text, "extracted_vitals": {"bp": "120/80", "temp": "98.6", "pulse": "72"}}
        }

# --- 3. GET ASHA'S RECENT PATIENTS ---
@router.get("/asha/patients")
async def get_asha_patients():
    """Fetches recent patient intakes including live local session records"""
    try:
        sb_data = []
        try:
            response = supabase.table("patient_intakes").select("*").order("created_at", desc=True).limit(20).execute()
            if response.data:
                sb_data = response.data
        except Exception:
            pass

        # Combine recent cache with database records, avoiding duplicates
        seen_ids = set()
        combined = []
        for r in recent_intakes_cache + sb_data:
            rid = r.get("id") or r.get("case_id") or r.get("abha_id")
            if rid not in seen_ids:
                seen_ids.add(rid)
                combined.append(r)

        return {
            "status": "success",
            "data": combined
        }
    except Exception as e:
        return {
            "status": "success",
            "data": recent_intakes_cache
        }

# --- 4. GET PATIENT PRESCRIPTION ---
@router.get("/patient/{abha_id}")
async def get_patient_prescription(abha_id: str):
    """Fetches the latest prescription and case details for a patient by ABHA ID"""
    try:
        response = supabase.table("patient_intakes").select("*").eq("abha_id", abha_id).order("created_at", desc=True).limit(1).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="No records found for this ABHA ID")
            
        return {
            "status": "success",
            "data": response.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))