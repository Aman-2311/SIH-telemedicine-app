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

SPECIALISTS_BY_DEPARTMENT = {
    "General Medicine": {
        "id": "DOC-MH-7001",
        "name": "Dr. Arvind Kulkarni (MD)",
        "speciality": "General Medicine",
        "facility": "District Civil Hospital & Telemedicine Hub",
        "facility_address": "Civil Hospital Road, Wardha, Maharashtra 442001",
    },
    "Dermatology": {
        "id": "doc-002",
        "name": "Dr. Ananya Patel (MD, DNB)",
        "speciality": "Dermatology",
        "facility": "Wardha Community Dermatology & Telehealth Centre",
        "facility_address": "Subhash Road, Market Yard Complex, Wardha 442001",
    },
    "Cardiology": {
        "id": "doc-003",
        "name": "Dr. Vikram Gupta (DM, MD)",
        "speciality": "Cardiology",
        "facility": "City Super-Specialty Heart Care Hub",
        "facility_address": "Railway Station Road, Wardha 442001",
    },
    "Cardiology / Emergency": {
        "id": "doc-003",
        "name": "Dr. Vikram Gupta (DM, MD)",
        "speciality": "Cardiology / Emergency",
        "facility": "City Super-Specialty Heart Care Hub",
        "facility_address": "Railway Station Road, Wardha 442001",
    },
    "Pediatrics": {
        "id": "doc-004",
        "name": "Dr. Priya Reddy (MD Pediatrics)",
        "speciality": "Pediatrics",
        "facility": "District Maternal & Child Health Hospital",
        "facility_address": "Near Gandhi Memorial Ground, Wardha 442001",
    },
    "Orthopedics": {
        "id": "doc-005",
        "name": "Dr. Rajesh Verma (MS Orthopedics)",
        "speciality": "Orthopedics",
        "facility": "Rural Telemedicine Post & Joint Care Unit",
        "facility_address": "Panchayat Samiti Complex, Deoli Road, Wardha 442101",
    },
    "Gynecology": {
        "id": "doc-006",
        "name": "Dr. Sunita Deshmukh (MD, DGO)",
        "speciality": "Gynecology",
        "facility": "Sub-District Community Maternity Centre",
        "facility_address": "Main Road, Hinganghat, Wardha 442301",
    },
}

def get_specialist_for_department(dept_name: Optional[str]) -> dict:
    if not dept_name:
        return SPECIALISTS_BY_DEPARTMENT["General Medicine"]
    dept_clean = str(dept_name).strip()
    for key, spec in SPECIALISTS_BY_DEPARTMENT.items():
        if key.lower() == dept_clean.lower() or key.lower() in dept_clean.lower() or dept_clean.lower() in key.lower():
            return spec
    return {
        "id": f"doc-spec-{dept_clean[:4].lower()}",
        "name": f"Dr. {dept_clean.capitalize()} Specialist (MD)",
        "speciality": dept_clean,
        "facility": f"Regional Telemedicine Centre ({dept_clean})",
        "facility_address": "Zilla Parishad Health Complex, Wardha 442001",
    }

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
        or (f"Patient ({r.get('abha_id')})" if r.get("abha_id") else f"Patient #{cid}")
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
        if k not in ("patient_name", "translated_symptoms", "consultation")
    }
    
    prescription = r.get("prescription") or {}
    if not isinstance(prescription, dict):
        prescription = {}

    consultation = vitals_raw.get("consultation") or {}
    
    status_raw = r.get("status") or "waiting"

    # Always ensure specialist routing destination is present
    dept = r.get("department") or "General Medicine"
    fallback_spec = get_specialist_for_department(dept)

    assigned_doctor = consultation.get("assigned_doctor") or (prescription.get("doctor_name") or prescription.get("prescribed_by") if prescription else None) or fallback_spec["name"]
    doctor_speciality = consultation.get("doctor_speciality") or (dept if assigned_doctor else None) or fallback_spec["speciality"]
    facility = consultation.get("facility") or fallback_spec["facility"]
    facility_address = consultation.get("facility_address") or fallback_spec["facility_address"]
    scheduled_date = consultation.get("scheduled_date") or "Today"
    scheduled_time = consultation.get("scheduled_time") or "10:00 AM"

    # Calculate exact appointment_status
    if status_raw == "completed" or (prescription and prescription.get("diagnosis")):
        appointment_status = "completed"
    elif scheduled_date and scheduled_time:
        appointment_status = "scheduled"
    elif assigned_doctor:
        appointment_status = "awaiting_slot"
    else:
        appointment_status = "waiting"

    return {
        "id": cid,
        "case_id": cid,
        "abha_id": r.get("abha_id") or "",
        "patient_name": patient_name,
        "patient_id": r.get("patient_id") or r.get("abha_id") or "",
        "created_by_asha_id": r.get("created_by_asha_id") or "TEST-ASHA-MH-0001",
        "vitals": clean_vitals,
        "voice_note_text": r.get("voice_note_text") or "",
        "translated_symptoms": translated_symptoms,
        "triage_priority": r.get("triage_priority") or "Routine",
        "department": dept,
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
        # Accept any patient ID / ABHA ID provided by the user
        cleaned_abha = data.abha_id.strip()

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

        resolved_dept = ai_analysis.get("department", "General Medicine")
        assigned_specialist = get_specialist_for_department(resolved_dept)

        # Pre-route specialist care destination immediately upon intake synchronization
        consultation_dict = {
            "doctor_id": assigned_specialist["id"],
            "assigned_doctor": assigned_specialist["name"],
            "doctor_speciality": assigned_specialist["speciality"],
            "facility": assigned_specialist["facility"],
            "facility_address": assigned_specialist["facility_address"],
            "scheduled_date": "Today",
            "scheduled_time": "10:00 AM",
            "appointment_status": "scheduled"
        }

        # Pack patient_name, patient_id, created_by_asha_id, translated_symptoms & consultation inside vitals JSONB
        vitals_dict = data.vitals.model_dump() if hasattr(data.vitals, "model_dump") else dict(data.vitals)
        patient_name_clean = data.patient_name.strip() if (data.patient_name and data.patient_name.strip()) else f"Patient ({cleaned_abha})"
        vitals_dict["patient_name"] = patient_name_clean
        vitals_dict["patient_id"] = cleaned_abha
        vitals_dict["created_by_asha_id"] = current_user.get("sub", "ASHA-MH-0001")
        vitals_dict["translated_symptoms"] = data.translated_symptoms or data.voice_note_text
        vitals_dict["consultation"] = consultation_dict

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
            "abha_id": cleaned_abha,
            "vitals": vitals_dict,
            "voice_note_text": data.voice_note_text,
            "triage_priority": ai_analysis.get("triage_priority", "Routine"),
            "department": resolved_dept,
            "clinical_flags": ai_analysis.get("clinical_flags", []),
            "ai_recommendation": ai_analysis.get("ai_recommendation", ""),
            "generic_medicines": ai_analysis.get("generic_medicines", []),
            "image_url": resolved_image_url,
            "status": "waiting"
        }

        # Postgres UUID columns: only set if values are syntactically valid UUIDs
        for col, val in [("patient_id", cleaned_abha), ("created_by_asha_id", current_user.get("sub")), ("assigned_doctor_id", assigned_specialist.get("id"))]:
            if val:
                try:
                    uuid.UUID(str(val))
                    db_payload[col] = str(val)
                except (ValueError, TypeError):
                    pass

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

    except HTTPException:
        raise
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
        formatted_list = [
            format_intake_record(r) for r in raw_list
            if not (r.get("abha_id") or "").startswith("TEST-ASHA")
            and not (format_intake_record(r).get("patient_name") or "").startswith("Patient #")
        ]

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
    if current_user.get("role") == "patient" and current_user.get("sub", "").strip().upper() != abha_id.strip().upper():
        raise HTTPException(
            status_code=403,
            detail=f"Forbidden: Patient {current_user.get('sub')} cannot access records belonging to {abha_id}."
        )

    try:
        is_uuid = False
        try:
            uuid.UUID(str(abha_id))
            is_uuid = True
        except (ValueError, TypeError):
            is_uuid = False

        if is_uuid:
            query = supabase.table("patient_intakes").select("*").or_(f"abha_id.eq.{abha_id},patient_id.eq.{abha_id}")
        else:
            query = supabase.table("patient_intakes").select("*").eq("abha_id", abha_id)

        response = query.order("created_at", desc=True).execute()
        
        raw_list = response.data or []
        formatted_list = [
            format_intake_record(r) for r in raw_list
            if not (r.get("abha_id") or "").startswith("TEST-ASHA")
        ]
        
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