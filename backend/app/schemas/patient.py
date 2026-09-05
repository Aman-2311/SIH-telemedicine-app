from pydantic import BaseModel
from typing import Optional

class Vitals(BaseModel):
    bp: str
    temp: str
    pulse: str

class PatientIntake(BaseModel):
    abha_id: str
    voice_note_text: str
    vitals: Vitals
    image_url: Optional[str] = None 