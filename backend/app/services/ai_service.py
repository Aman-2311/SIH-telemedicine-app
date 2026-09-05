import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from app.schemas.patient import PatientIntake

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

if api_key:
    genai.configure(api_key=api_key)

def analyze_patient_case(data: PatientIntake) -> dict:
    if not api_key:
        return {
            "triage_priority": "Routine",
            "clinical_flags": ["System Warning: API Key missing"],
            "ai_recommendation": "Please configure AI integration.",
            "generic_medicines": []
        }
    
    prompt = f"""
    You are an expert clinical AI assistant evaluating a patient intake from a rural health worker.
    
    Vitals: BP {data.vitals.bp}, Temp {data.vitals.temp} deg F, Pulse {data.vitals.pulse} bpm.
    Patient Symptoms/Notes: "{data.voice_note_text}"
    
    Analyze the severity and return ONLY a valid JSON object matching this exact structure:
    {{
        "triage_priority": "High" or "Medium" or "Routine",
        "clinical_flags": ["list", "of", "red flags"],
        "ai_recommendation": "brief 2-sentence clinical recommendation for the urban doctor",
        "generic_medicines": [
            {{
                "molecule": "Generic Salt Name (e.g., Paracetamol 500mg)",
                "approx_cost_inr": 15,
                "purpose": "Fever & pain management"
            }}
        ]
    }}
    """
    
    try:
    
        model = genai.GenerativeModel("gemini-3.6-flash")
        response = model.generate_content(prompt)
        
        raw_text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(raw_text)
        
    except Exception as e:
        print(f"Gemini AI Error: {e}")
        return {
            "triage_priority": "Medium",
            "clinical_flags": ["AI Analysis Failed"],
            "ai_recommendation": f"Review patient data manually. (Error: {str(e)[:50]})",
            "generic_medicines": []
        }