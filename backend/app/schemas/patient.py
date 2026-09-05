from pydantic import BaseModel, Field
from typing import Optional


class Vitals(BaseModel):
    bp: str = Field(..., description="Blood pressure, e.g., '120/80'")
    temp: str = Field(..., description="Temperature in Fahrenheit, e.g., '101.2'")
    pulse: str = Field(..., description="Heart rate in BPM, e.g., '88'")


class PatientIntake(BaseModel):
    abha_id: str = Field(..., description="14-digit ABHA ID")
    voice_note_text: str = Field(..., description="The translated text from Bhashini")
    vitals: Vitals