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

class PrescriptionData(BaseModel):
    doctor_id: str
    diagnosis: str
    medicines: List[Medicine]
    notes: Optional[str] = ""

# --- 1. GET THE DOCTOR'S WAITING QUEUE ---
@router.get("/")
async def get_patient_queue():
    """
    Fetches all patients currently waiting for a doctor.
    Automatically sorts them so High Priority cases appear first.
    """
    try:
        # Fetch only cases that haven't been completed
        response = supabase.table("patient_intakes").select("*").eq("status", "waiting").execute()
        
        # Sort the cases: High (1) -> Medium (2) -> Routine (3)
        priority_map = {"High": 1, "Medium": 2, "Routine": 3}
        sorted_data = sorted(
            response.data, 
            key=lambda x: priority_map.get(x.get("triage_priority", "Routine"), 4)
        )
        
        return {
            "status": "success",
            "count": len(sorted_data),
            "data": sorted_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- 2. SUBMIT E-PRESCRIPTION & CLOSE CASE ---
@router.post("/{case_id}/prescribe")
async def submit_prescription(case_id: str, prescription: PrescriptionData):
    """
    Saves the doctor's prescription to the patient's record,
    assigns the doctor's ID, and marks the case as completed.
    """
    try:
        record_update = {
            "status": "completed",
            "assigned_doctor_id": prescription.doctor_id,
            "prescription": prescription.model_dump()
        }
        
        # Update the row where the Supabase ID matches the case_id
        response = supabase.table("patient_intakes").update(record_update).eq("id", case_id).execute()
        
        # Fallback check if the ID didn't exist
        if not response.data:
            raise HTTPException(status_code=404, detail="Case ID not found or already completed.")
            
        return {
            "status": "success",
            "message": "Prescription successfully saved. Case is now closed.",
            "data": response.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))