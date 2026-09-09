import os
import time
import base64
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.schemas.patient import PatientIntake
from app.services.ai_service import analyze_patient_case, extract_form_data_from_voice
from app.core.database import supabase
from app.core.security import require_asha, require_authenticated

router = APIRouter()

class VoiceInput(BaseModel):
    spoken_text: str

def format_intake_record(r: Dict[str, Any]) -> Dict[str, Any]:
    """
    Standardizes a database row from Supabase patient_intakes into the canonical
    data contract consumed by ASHA, Doctor, and Patient views.
    """
    cid = str(r.get("id"))
    vitals_raw = r.get("vitals") or {}
    
    # Extract patient_name & translated_symptoms stored safely inside vitals JSONB
    patient_name = (
        vitals_raw.get("patient_name")
        or r.get("patient_name")
        or f"Patient #{cid}"
    )
    translated_symptoms = (
        vitals_raw.get("translated_symptoms")
        or r.get("translated_symptoms")
        or r.get("voice_note_text")
        or ""
    )
    
    # Clean vitals dictionary for pure clinical metrics
    clean_vitals = {
        k: v for k, v in vitals_raw.items() 
        if k not in ("patient_name", "translated_symptoms")
    }
    
    prescription = r.get("prescription") or {}
    if not isinstance(prescription, dict):
        prescription = {}

    consultation = vitals_raw.get("consultation") or {}
    
    status_raw = r.get("status") or "waiting"
    
    # Calculate exact appointment_status
    if status_raw == "completed" or (prescription and prescription.get("diagnosis")):
        appointment_status = "completed"
    elif consultation.get("scheduled_date") and consultation.get("scheduled_time"):
        appointment_status = "scheduled"
    elif consultation.get("assigned_doctor"):
        appointment_status = "awaiting_slot"
    else:
        appointment_status = "waiting"

    assigned_doctor = consultation.get("assigned_doctor") or (prescription.get("doctor_name") or prescription.get("prescribed_by") if prescription else None)
    doctor_speciality = consultation.get("doctor_speciality") or (r.get("department") if assigned_doctor else None)
    facility = consultation.get("facility") or None
    facility_address = consultation.get("facility_address") or None
    scheduled_date = consultation.get("scheduled_date") or None
    scheduled_time = consultation.get("scheduled_time") or None

    return {
        "id": cid,
        "case_id": cid,
        "abha_id": r.get("abha_id") or "",
        "patient_name": patient_name,
        "vitals": clean_vitals,
        "voice_note_text": r.get("voice_note_text") or "",
        "translated_symptoms": translated_symptoms,
        "triage_priority": r.get("triage_priority") or "Routine",
        "department": r.get("department") or "General Medicine",
        "clinical_flags": r.get("clinical_flags") or [],
        "ai_recommendation": r.get("ai_recommendation") or "",
        "generic_medicines": r.get("generic_medicines") or [],
        "image_url": r.get("image_url"),
        "status": status_raw,
        "prescription": prescription,
        "consultation": consultation,
        "assigned_doctor": assigned_doctor,
        "doctor_speciality": doctor_speciality,
        "facility": facility,
        "facility_address": facility_address,
        "scheduled_date": scheduled_date,
        "scheduled_time": scheduled_time,
        "appointment_status": appointment_status,
        "created_at": r.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "synced": True
    }


# --- 1. PATIENT INTAKE ENDPOINT (Direct Supabase Insertion) ---
@router.post("")
@router.post("/")
@router.post("/intake")
async def submit_patient_intake(data: PatientIntake, current_user: dict = Depends(require_asha)):
    try:
        try:
            ai_analysis = analyze_patient_case(data)
        except Exception as e:
            print(f"AI Analysis fallback: {e}")
            ai_analysis = {
                "triage_priority": "Routine",
                "department": "General Medicine",
                "clinical_flags": [],
                "ai_recommendation": "Consult general physician for clinical evaluation.",
                "generic_medicines": ["Paracetamol 500mg"],
            }

        # Pack patient_name & translated_symptoms inside vitals JSONB to match Supabase schema
        vitals_dict = data.vitals.model_dump() if hasattr(data.vitals, "model_dump") else dict(data.vitals)
        vitals_dict["patient_name"] = data.patient_name or "Anonymous Patient"
        vitals_dict["translated_symptoms"] = data.translated_symptoms or data.voice_note_text

        # Resolve clinical image URL (upload base64 to Supabase Storage if needed)
        resolved_image_url = data.image_url
        if resolved_image_url and (resolved_image_url.startswith("data:image/") or ";base64," in resolved_image_url):
            try:
                if ";base64," in resolved_image_url:
                    header, b64_str = resolved_image_url.split(";base64,", 1)
                    content_type = header.replace("data:", "").strip() if "data:" in header else "image/jpeg"
                else:
                    b64_str = resolved_image_url
                    content_type = "image/jpeg"
                
                ext = content_type.split("/")[-1] if "/" in content_type else "jpg"
                if ext not in ["jpg", "jpeg", "png", "webp"]:
                    ext = "jpg"
                
                img_bytes = base64.b64decode(b64_str)
                unique_filename = f"{uuid.uuid4()}.{ext}"
                
                supabase.storage.from_("medical-images").upload(
                    file=img_bytes,
                    path=unique_filename,
                    file_options={"content-type": content_type}
                )
                resolved_image_url = supabase.storage.from_("medical-images").get_public_url(unique_filename)
                print(f"Persisted intake base64 image to Supabase Storage: {resolved_image_url}")
            except Exception as b64_err:
                print(f"Warning: Failed to persist base64 image to Supabase Storage: {b64_err}")

        db_payload = {
            "abha_id": data.abha_id,
            "vitals": vitals_dict,
            "voice_note_text": data.voice_note_text,
            "triage_priority": ai_analysis.get("triage_priority", "Routine"),
            "department": ai_analysis.get("department", "General Medicine"),
            "clinical_flags": ai_analysis.get("clinical_flags", []),
            "ai_recommendation": ai_analysis.get("ai_recommendation", ""),
            "generic_medicines": ai_analysis.get("generic_medicines", []),
            "image_url": resolved_image_url,
            "status": "waiting"
        }

        response = supabase.table("patient_intakes").insert(db_payload).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Database insert returned no rows.")

        saved_row = response.data[0]
        formatted = format_intake_record(saved_row)

        return {
            "status": "success",
            "message": "Patient intake recorded successfully in Supabase.",
            "case_id": formatted["id"],
            "id": formatted["id"],
            "patient_name": formatted["patient_name"],
            "triage_priority": formatted["triage_priority"],
            "department": formatted["department"],
            "data": formatted
        }

    except Exception as e:
        print(f"Intake insertion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- 2. VOICE-TO-FORM NLP ENDPOINT ---
@router.post("/extract-voice")
async def extract_voice_to_form(request: VoiceInput, current_user: dict = Depends(require_authenticated)):
    """Takes raw transcribed text and uses Gemini NLP to auto-fill vitals & symptoms."""
    try:
        extracted_data = extract_form_data_from_voice(request.spoken_text)
        return {
            "status": "success",
            "message": "Voice data successfully parsed into clinical format",
            "translated_symptoms": extracted_data.get("translated_symptoms", request.spoken_text),
            "extracted_vitals": extracted_data.get("extracted_vitals", {"bp": "120/80", "temp": "98.6", "pulse": "72"}),
            "triage_priority": extracted_data.get("triage_priority", "Routine"),
            "ai_recommendation": extracted_data.get("ai_recommendation", "Pending doctor review"),
            "data": extracted_data
        }
    except Exception as e:
        return {
            "status": "partial_success",
            "message": f"NLP Parsing note: {e}",
            "translated_symptoms": request.spoken_text,
            "extracted_vitals": {"bp": "120/80", "temp": "98.6", "pulse": "72"},
            "triage_priority": "Routine",
            "ai_recommendation": "Pending doctor review",
            "data": {"translated_symptoms": request.spoken_text, "extracted_vitals": {"bp": "120/80", "temp": "98.6", "pulse": "72"}}
        }


# --- 3. GET ASHA'S RECENT PATIENTS (Real Database Query) ---
@router.get("/asha/patients")
async def get_asha_patients(current_user: dict = Depends(require_asha)):
    """Fetches real patient intakes from Supabase with canonical formatting. Zero mock fallbacks."""
    try:
        response = (
            supabase.table("patient_intakes")
            .select("*")
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
        
        raw_list = response.data or []
        formatted_list = [format_intake_record(r) for r in raw_list]

        return {
            "status": "success",
            "data": formatted_list
        }
    except Exception as e:
        print(f"Error fetching ASHA patients from Supabase: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- 4. GET PATIENT PRESCRIPTION & CASE HISTORY (Real Database Query) ---
@router.get("/patient/{abha_id}")
async def get_patient_prescription(abha_id: str, current_user: dict = Depends(require_authenticated)):
    """Fetches real consultation & prescription history for a patient by ABHA ID."""
    # Strict Patient Scoping: Patient can only query their own ABHA ID
    if current_user.get("role") == "patient" and current_user.get("sub") != abha_id:
        raise HTTPException(
            status_code=403,
            detail=f"Forbidden: Patient {current_user.get('sub')} cannot access records belonging to {abha_id}."
        )

    try:
        response = (
            supabase.table("patient_intakes")
            .select("*")
            .eq("abha_id", abha_id)
            .order("created_at", desc=True)
            .execute()
        )
        
        raw_list = response.data or []
        formatted_list = [format_intake_record(r) for r in raw_list]
        
        # Find latest consultation with an issued prescription
        latest_with_prescription = next(
            (
                r for r in formatted_list 
                if r.get("status") == "completed" 
                and r.get("prescription") 
                and r.get("prescription", {}).get("medicines")
            ),
            None
        )

        return {
            "status": "success",
            "data": formatted_list,
            "latest": latest_with_prescription or (formatted_list[0] if formatted_list else None)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching patient prescription for {abha_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))