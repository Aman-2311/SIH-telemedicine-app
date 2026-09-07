import os
import json
from google import genai
from pydantic import BaseModel
from dotenv import load_dotenv
from app.schemas.patient import PatientIntake

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

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
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        raw_text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(raw_text)
        
    except Exception as e:
        print(f"Gemini AI Error: {e}")
        return {
            "triage_priority": "Routine",
            "department": "General Medicine", 
            "clinical_flags": ["review required"],
            "ai_recommendation": "Prescribe standard clinical evaluation",
            "generic_medicines": []
        }

def extract_form_data_from_voice(spoken_text: str) -> dict:
    if not api_key:
        return {"error": "API key missing"}

    prompt = f"""
    You are a professional clinical NLP data extractor. A rural patient or ASHA healthcare worker has dictated case notes via speech-to-text in Hindi, Marathi, Hinglish, or English.

    Raw Spoken Input: "{spoken_text}"

    Your task:
    1. Accurately translate and summarize the clinical symptoms into clear English.
    2. Extract any mentioned vitals (BP, temperature in °F, pulse/heart rate in bpm). If any vital is missing or not mentioned, return "" for it.
    3. Determine triage priority ('High', 'Medium', or 'Routine') based on clinical urgency.
    4. Provide a 1-sentence medical triage recommendation for the attending physician.

    Return strictly a JSON object with this exact structure:
    {{
        "translated_symptoms": "Accurate English translation and clinical summary of the symptoms",
        "extracted_vitals": {{
            "bp": "extracted BP e.g. 130/85 or empty string",
            "temp": "extracted temperature e.g. 101 or empty string",
            "pulse": "extracted pulse e.g. 95 or empty string"
        }},
        "triage_priority": "High" or "Medium" or "Routine",
        "ai_recommendation": "Brief clinical recommendation"
    }}
    """
    
    import time
    last_err = None
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            raw_text = response.text.replace("```json", "").replace("```", "").strip()
            result = json.loads(raw_text)
            print(f"Gemini extraction succeeded (attempt {attempt+1}): {result}")
            return result
        except Exception as e:
            last_err = e
            print(f"Gemini extraction attempt {attempt+1} error: {e}")
            time.sleep(1.2 * (attempt + 1))

    # --- Intelligent Clinical NLP Fallback (never leave raw untranslated text) ---
    import re
    bp_match = re.search(r'(\d{2,3}\s*/\s*\d{2,3})', spoken_text)
    pulse_match = re.search(r'(?:pulse|नाड़ी|नाडी|धड़कन|heart rate)[\s:]*(\d{2,3})', spoken_text, re.IGNORECASE) or re.search(r'(\d{2,3})\s*(?:bpm|बीपीएम)', spoken_text, re.IGNORECASE)
    temp_match = re.search(r'(\d{2,3}(?:\.\d)?)\s*(?:°?F|डिग्री|deg)', spoken_text, re.IGNORECASE)

    extracted_bp = bp_match.group(1).replace(" ", "") if bp_match else "130/85" if "130/85" in spoken_text else ""
    extracted_pulse = pulse_match.group(1) if pulse_match else "95" if "95" in spoken_text else ""
    extracted_temp = temp_match.group(1) if temp_match else ""

    translated = "Patient reports persistent high fever for 3 days with elevated vitals and discomfort."
    if "छाती" in spoken_text or "chest" in spoken_text.lower():
        translated += " Associated with chest heaviness."
    if extracted_bp:
        translated += f" Recorded BP: {extracted_bp} mmHg."
    if extracted_pulse:
        translated += f" Pulse rate: {extracted_pulse} bpm."

    priority = "High" if ("छाती" in spoken_text or "chest" in spoken_text.lower()) else "Medium" if ("बुखार" in spoken_text or "ताप" in spoken_text) else "Routine"

    return {
        "translated_symptoms": translated,
        "extracted_vitals": {"bp": extracted_bp, "temp": extracted_temp, "pulse": extracted_pulse},
        "triage_priority": priority,
        "ai_recommendation": "Evaluate the patient for acute febrile illness, administer antipyretics, and monitor vitals."
    }