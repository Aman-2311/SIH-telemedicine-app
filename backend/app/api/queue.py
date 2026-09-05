from fastapi import APIRouter, HTTPException
from app.core.database import supabase

router = APIRouter()

@router.get("/queue")
async def get_patient_queue():
    """
    Retrieves the live queue of patient intakes for the urban doctor's dashboard, 
    sorted by the newest cases first.
    """
    try:
        response = supabase.table("patient_intakes").select("*").order("created_at", desc=True).execute()
        
        return {
            "status": "success",
            "message": "Patient queue retrieved successfully.",
            "data": {
                "total_patients": len(response.data),
                "patients": response.data
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))