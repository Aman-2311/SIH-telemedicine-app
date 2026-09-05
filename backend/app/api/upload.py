from fastapi import APIRouter, HTTPException, UploadFile, File
from app.core.database import supabase
import uuid
import os

router = APIRouter()

@router.post("/upload")
async def upload_medical_image(file: UploadFile = File(...)):
    """
    Receives an image (prescription, wound photo, etc.), generates a unique filename,
    and stores it securely in the Supabase 'medical-images' bucket.
    """
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files are allowed.")
            
        file_bytes = await file.read()
        
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        response = supabase.storage.from_("medical-images").upload(
            file=file_bytes,
            path=unique_filename,
            file_options={"content-type": file.content_type}
        )
        
        public_url = supabase.storage.from_("medical-images").get_public_url(unique_filename)
        
        return {
            "status": "success",
            "message": "Image uploaded successfully.",
            "data": {
                "filename": unique_filename,
                "url": public_url
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))