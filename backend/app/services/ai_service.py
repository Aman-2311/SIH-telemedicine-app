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
    
        model = genai.GenerativeModel("gemini-3.6-flash", generation_config={"response_mime_type": "application/json"})
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

def extract_form_data_from_voice(spoken_text: str) -> dict:
    if not api_key:
        return {"error": "API key missing"}

    prompt = f"""
    You are a medical NLP data extractor. A rural patient or ASHA worker has dictated the following case notes via voice-to-text. 
    The text may be in Hindi, Marathi, Hinglish, or English.

    Raw Spoken Text: "{spoken_text}"

    Your task:
    1. Translate the meaning to English.
    2. Extract any mentioned vitals (Blood Pressure, Temperature, Pulse).
    3. Summarize the chief complaint/symptoms.
    
    If a vital is NOT mentioned, leave its value as an empty string "".

    Return strictly a JSON object matching this exact format:
    {{
        "translated_symptoms": "English summary of symptoms",
        "extracted_vitals": {{
            "bp": "extracted BP or empty string",
            "temp": "extracted temp or empty string",
            "pulse": "extracted pulse or empty string"
        }}
    }}
    """
    
    try:
        model = genai.GenerativeModel("models/gemini-2.5-flash")
        response = model.generate_content(prompt)
        raw_text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(raw_text)
    except Exception as e:
        print(f"NLP Extraction Error: {e}")
        return {
            "translated_symptoms": spoken_text,
            "extracted_vitals": {"bp": "", "temp": "", "pulse": ""}
        }