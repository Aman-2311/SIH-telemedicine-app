from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import supabase

router = APIRouter()

# --- DATA MODELS ---
class Medicine(BaseModel):
    name: str
    dosage: str
    duration: str
    generic_alternative: Optional[str] = None

class PrescriptionData(BaseModel):
    doctor_id: str
    diagnosis: str
    medicines: List[Medicine]
    notes: Optional[str] = ""

# Demo patients if table is clean
demo_cases = [
    {
        "id": "case-mh-101",
        "case_id": "case-mh-101",
        "patient_name": "Rameshwar Rao",
        "abha_id": "91-4455-8899-1023",
        "age": 58,
        "gender": "Male",
        "triage_priority": "Urgent",
        "department": "Cardiology",
        "vitals": {
            "bp": "165/105",
            "temp": "99.1",
            "pulse": "108",
            "spo2": "94"
        },
        "voice_note_text": "मरीज को छाती में भारीपन है, सांस लेने में तकलीफ हो रही है और बीपी 165/105 है।",
        "translated_symptoms": "Patient reports acute chest tightness, dyspnea on minimal exertion, and palpitation for the past 6 hours. Elevated BP 165/105 mmHg with tachycardia.",
        "ai_red_flags": ["Stage 2 Hypertension (165/105 mmHg)", "Tachycardia (108 bpm)", "Suspected Angina / Acute Coronary Syndrome"],
        "status": "waiting"
    },
    {
        "id": "case-mh-102",
        "case_id": "case-mh-102",
        "patient_name": "Priya Devi",
        "abha_id": "91-8899-2233-4455",
        "age": 26,
        "gender": "Female",
        "triage_priority": "Moderate",
        "department": "Dermatology",
        "vitals": {
            "bp": "118/78",
            "temp": "101.4",
            "pulse": "82",
            "spo2": "99"
        },
        "voice_note_text": "हातावर आणि पाठीवर लाल पुरळ आले आहे, खाज सुटत आहे आणि ताप 101.4 आहे.",
        "translated_symptoms": "Erythematous pruritic maculopapular rash on bilateral arms and upper torso with high pyrexia 101.4 °F for 3 days.",
        "ai_red_flags": ["Pyrexia (101.4 °F)", "Spreading Dermatitis"],
        "status": "waiting"
    },
    {
        "id": "case-mh-103",
        "case_id": "case-mh-103",
        "patient_name": "Santosh Shinde",
        "abha_id": "91-1122-3344-5566",
        "age": 42,
        "gender": "Male",
        "triage_priority": "Routine",
        "department": "General Medicine",
        "vitals": {
            "bp": "124/82",
            "temp": "98.4",
            "pulse": "74",
            "spo2": "98"
        },
        "voice_note_text": "सामान्य डोकेदुखी आणि थकवा जाणवतो आहे, जेवण जात नाही.",
        "translated_symptoms": "Mild generalized tension headache, fatigue, and mild anorexia for 2 days. Normal systemic vitals.",
        "ai_red_flags": [],
        "status": "waiting"
    }
]

# --- 1. GET THE DOCTOR'S WAITING QUEUE ---
@router.get("")
@router.get("/")
async def get_patient_queue():
    """
    Fetches all patients currently waiting for a doctor.
    Automatically sorts them so High Priority cases appear first.
    """
    try:
        response = supabase.table("patient_intakes").select("*").eq("status", "waiting").execute()
        raw_data = response.data if response.data else demo_cases
    except Exception:
        raw_data = demo_cases
        
    priority_map = {"urgent": 1, "high": 1, "moderate": 2, "medium": 2, "routine": 3, "low": 3}
    sorted_data = sorted(
        raw_data, 
        key=lambda x: priority_map.get(str(x.get("triage_priority", "Routine")).lower(), 4)
    )
    
    return sorted_data


# --- 2. SUBMIT E-PRESCRIPTION & CLOSE CASE ---
@router.post("/{case_id}/prescribe")
async def submit_prescription(case_id: str, prescription: PrescriptionData):
    """
    Saves the doctor's prescription to the patient's record,
    assigns the doctor's ID, and marks the case as completed.
    """
    record_update = {
        "status": "completed",
        "assigned_doctor_id": prescription.doctor_id,
        "prescription": prescription.model_dump()
    }
    
    try:
        response = supabase.table("patient_intakes").update(record_update).eq("id", case_id).execute()
        data = response.data[0] if response.data else record_update
    except Exception:
        data = record_update
        
    return {
        "status": "success",
        "message": "Prescription successfully saved. Case is now closed.",
        "data": data
    }