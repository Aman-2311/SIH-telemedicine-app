from pydantic import BaseModel
from typing import Optional

class Vitals(BaseModel):
    bp: str
    temp: str
    pulse: str

class PatientIntake(BaseModel):
    abha_id: str
    patient_name: Optional[str] = "Anonymous Patient"
    voice_note_text: str
    translated_symptoms: Optional[str] = None
    vitals: Vitals
    image_url: Optional[str] = None 