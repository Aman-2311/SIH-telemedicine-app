from datetime import datetime, timezone, timedelta
import random
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.database import supabase
from app.api.intake import format_intake_record
from app.core.security import require_doctor

router = APIRouter()

# --- DATA MODELS ---
class Medicine(BaseModel):
    name: str
    dosage: str
    duration: str
    frequency: Optional[str] = None
    instructions: Optional[str] = None
    generic_alternative: Optional[str] = None

class PrescriptionData(BaseModel):
    doctor_id: str
    doctor_name: Optional[str] = "Dr. Arvind Kulkarni (MD)"
    diagnosis: str
    medicines: List[Medicine]
    notes: Optional[str] = ""


# --- 1. GET THE DOCTOR'S WAITING QUEUE (Real Supabase Data, Guarded for Doctors) ---
@router.get("")
@router.get("/")
async def get_patient_queue(current_user: dict = Depends(require_doctor)):
    """
    Fetches all patients currently waiting for a doctor from Supabase.
    Automatically sorts them so High/Urgent Priority cases appear first.
    Strictly restricted to authenticated doctors.
    """
    try:
        response = (
            supabase.table("patient_intakes")
            .select("*")
            .eq("status", "waiting")
            .order("created_at", desc=True)
            .execute()
        )
        raw_data = response.data or []
        formatted_data = [format_intake_record(r) for r in raw_data]
    except Exception as e:
        print(f"Error fetching waiting queue from Supabase: {e}")
        formatted_data = []

    priority_map = {"urgent": 1, "high": 1, "moderate": 2, "medium": 2, "routine": 3, "low": 3}
    today_prefix = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    def sort_key(x):
        created_str = str(x.get("created_at") or "")
        is_today = 0 if created_str.startswith(today_prefix) else 1
        p_weight = priority_map.get(str(x.get("triage_priority", "Routine")).lower(), 4)
        try:
            ts = datetime.fromisoformat(created_str.replace("Z", "+00:00")).timestamp()
        except Exception:
            ts = 0.0
        return (is_today, p_weight, -ts)

    sorted_data = sorted(formatted_data, key=sort_key)
    return sorted_data


# --- 2. GET COMPLETED / TREATED CASES (Real Supabase Data, Guarded for Doctors) ---
@router.get("/completed")
async def get_completed_cases(current_user: dict = Depends(require_doctor)):
    """
    Fetches all treated/completed patient cases from Supabase.
    Enables accurate calculation of 'Treated Today' based on prescription timestamps.
    """
    try:
        response = (
            supabase.table("patient_intakes")
            .select("*")
            .eq("status", "completed")
            .order("created_at", desc=True)
            .execute()
        )
        raw_data = response.data or []
        return [format_intake_record(r) for r in raw_data]
    except Exception as e:
        print(f"Error fetching completed cases from Supabase: {e}")
        return []


# --- 3. SUBMIT E-PRESCRIPTION & CLOSE CASE ---
@router.get("/doctors/availability")
async def get_doctor_availability(department: Optional[str] = None):
    # Mocking doctors available based on department for the demo
    # In a real app, this would query a Doctors or Users table filtered by role and status
    
    specialties = ["General Medicine", "Cardiology", "Dermatology", "Pediatrics", "Gynecology", "Orthopedics"]
    facilities = ["District Hospital", "City Medical Center", "Community Health Hub", "Rural Telemedicine Post"]
    
    doctors = [
        {"id": "doc-001", "name": "Dr. Sharma", "speciality": "General Medicine", "facility": "District Hospital", "available_slots": ["09:00 AM", "10:30 AM", "02:00 PM"]},
        {"id": "doc-002", "name": "Dr. Gupta", "speciality": "Cardiology", "facility": "City Medical Center", "available_slots": ["11:00 AM", "01:00 PM", "04:30 PM"]},
        {"id": "doc-003", "name": "Dr. Patel", "speciality": "Dermatology", "facility": "Community Health Hub", "available_slots": ["09:30 AM", "11:30 AM", "03:00 PM"]},
        {"id": "doc-004", "name": "Dr. Reddy", "speciality": "Pediatrics", "facility": "District Hospital", "available_slots": ["10:00 AM", "12:00 PM", "02:30 PM"]},
        {"id": "doc-005", "name": "Dr. Verma", "speciality": "General Medicine", "facility": "Rural Telemedicine Post", "available_slots": ["08:30 AM", "01:30 PM", "05:00 PM"]}
    ]
    
    if department:
        filtered = [d for d in doctors if d["speciality"].lower() == department.lower()]
        # Fallback if no matching speciality for demo
        if not filtered:
            filtered = [
                {"id": f"doc-10{random.randint(0,9)}", "name": f"Dr. {random.choice(['Singh', 'Kumar', 'Das', 'Roy'])}", "speciality": department, "facility": "District Hospital", "available_slots": ["10:00 AM", "02:00 PM"]}
            ]
        return {"doctors": filtered}
        
    return {"doctors": doctors}

@router.post("/{case_id}/schedule")
async def schedule_consultation(case_id: str, payload: Dict[str, Any]):
    query_id = int(case_id) if case_id.isdigit() else case_id
    record = supabase.table("patient_intakes").select("*").eq("id", query_id).execute()
    
    if not record.data:
        record = supabase.table("patient_intakes").select("*").eq("abha_id", case_id).execute()
        
    if not record.data:
        raise HTTPException(status_code=404, detail="Case not found")
        
    vitals_raw = record.data[0].get("vitals") or {}
    if isinstance(vitals_raw, str):
        import json
        try:
            vitals_raw = json.loads(vitals_raw)
        except:
            vitals_raw = {}
            
    # Add scheduling metadata to consultation dict inside vitals
    vitals_raw["consultation"] = {
        "assigned_doctor": payload.get("assigned_doctor", "Unassigned"),
        "doctor_speciality": payload.get("doctor_speciality", "General Medicine"),
        "facility": payload.get("facility", "District Hospital"),
        "scheduled_date": payload.get("scheduled_date", datetime.now().strftime("%Y-%m-%d")),
        "scheduled_time": payload.get("scheduled_time", "09:00 AM"),
        "appointment_status": "scheduled"
    }

    supabase.table("patient_intakes").update({
        "vitals": vitals_raw,
        "status": "scheduled"  # update case status to scheduled
    }).eq("id", record.data[0]["id"]).execute()
    
    return {"status": "success", "message": "Consultation scheduled", "consultation": vitals_raw["consultation"]}

@router.post("/{case_id}/prescribe")
async def submit_prescription(
    case_id: str,
    prescription: PrescriptionData,
    current_user: dict = Depends(require_doctor)
):
    """
    Saves the doctor's prescription to the patient's record in Supabase,
    and marks the case as completed.
    """
    prescription_dict = prescription.model_dump()
    prescription_dict["prescribed_at"] = datetime.now(timezone.utc).isoformat()
    prescription_dict["prescribed_by"] = current_user.get("name", "Dr. Arvind Kulkarni (MD)")

    record_update = {
        "status": "completed",
        "prescription": prescription_dict
    }

    try:
        query_id = int(case_id) if case_id.isdigit() else case_id
        response = (
            supabase.table("patient_intakes")
            .update(record_update)
            .eq("id", query_id)
            .execute()
        )

        # Fallback to query by abha_id if case_id didn't match row id
        if not response.data:
            response = (
                supabase.table("patient_intakes")
                .update(record_update)
                .eq("abha_id", case_id)
                .execute()
            )

        if not response.data:
            raise HTTPException(status_code=404, detail=f"Case {case_id} not found in database.")

        saved_row = response.data[0]
        formatted = format_intake_record(saved_row)

        return {
            "status": "success",
            "message": "Prescription successfully saved. Case is now closed.",
            "data": formatted,
            "case_id": formatted["id"]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error saving prescription in Supabase: {e}")
        raise HTTPException(status_code=500, detail=str(e))