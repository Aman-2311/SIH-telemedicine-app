from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from app.core.database import supabase
from app.core.security import require_authenticated
import uuid
import os

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"}

@router.post("/upload")
async def upload_medical_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_authenticated)
):
    """
    Receives a patient clinical image (wound, lesion, prescription, etc.),
    generates a collision-resistant filename, and securely stores it in the
    Supabase 'medical-images' storage bucket.
    Returns the persistent Supabase Storage URL.
    """
    try:
        content_type = file.content_type or "image/jpeg"
        if not content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files are allowed.")
            
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Empty file submitted.")
        
        # Sanitize extension
        raw_ext = (file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg").lower()
        if raw_ext not in ["jpg", "jpeg", "png", "webp", "gif"]:
            raw_ext = "jpg"
            
        unique_filename = f"{uuid.uuid4()}.{raw_ext}"
        
        supabase.storage.from_("medical-images").upload(
            file=file_bytes,
            path=unique_filename,
            file_options={"content-type": content_type}
        )
        
        public_url = supabase.storage.from_("medical-images").get_public_url(unique_filename)
        
        return {
            "status": "success",
            "message": "Image uploaded successfully to Supabase Storage.",
            "data": {
                "filename": unique_filename,
                "url": public_url,
                "content_type": content_type
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")


@router.get("/attachment/{case_id}")
async def get_case_attachment(
    case_id: str,
    current_user: dict = Depends(require_authenticated)
):
    """
    Securely returns the clinical attachment URL for an authorized case.
    Can be used to generate ephemeral signed URLs if private bucket access is configured.
    """
    try:
        response = supabase.table("patient_intakes").select("id,image_url,status").eq("id", case_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Case #{case_id} not found.")
        
        row = response.data[0]
        image_url = row.get("image_url")
        
        if not image_url:
            return {
                "status": "not_found",
                "case_id": case_id,
                "has_attachment": False,
                "image_url": None
            }
            
        return {
            "status": "success",
            "case_id": case_id,
            "has_attachment": True,
            "image_url": image_url
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch attachment: {str(e)}")