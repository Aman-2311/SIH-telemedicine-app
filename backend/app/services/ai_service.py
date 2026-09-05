import os
from app.schemas.patient import PatientIntake

def analyze_patient_case(data: PatientIntake) -> dict:
    """
    Analyzes patient vitals and translated voice notes to generate 
    an automated triage severity score and clinical summary.
    """
    vitals = data.vitals
    notes = data.voice_note_text.lower()
    
    risk_level = "Routine"
    flags = []
    
    try:
        temp_val = float(vitals.temp)
        if temp_val > 102.0:
            risk_level = "High"
            flags.append("High Fever (>102°F)")
        elif temp_val > 99.5:
            if risk_level != "High":
                risk_level = "Moderate"
            flags.append("Low-grade Fever")
    except ValueError:
        pass

    emergency_keywords = ["chest pain", "breathless", "bleeding", "unconscious", "stroke", "severe pain"]
    for keyword in emergency_keywords:
        if keyword in notes:
            risk_level = "Critical"
            flags.append(f"Critical keyword detected: '{keyword}'")

    clinical_summary = {
        "triage_priority": risk_level,
        "clinical_flags": flags if flags else ["No immediate red flags detected"],
        "ai_recommendation": f"Patient presents with vitals (BP: {vitals.bp}, Temp: {vitals.temp}°F, Pulse: {vitals.pulse} bpm). Symptoms logged: '{data.voice_note_text}'. Recommended review by general practitioner within {'2 hours' if risk_level in ['High', 'Critical'] else '24 hours'}."
    }
    
    return clinical_summary