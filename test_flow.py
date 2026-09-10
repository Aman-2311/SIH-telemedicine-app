import requests
import json
import time

base_url = "http://127.0.0.1:8000"

def run_test():
    print("1. Submitting ASHA Intake...")
    payload = {
        "abha_id": "ABHA-TEST-777",
        "patient_name": "Test ASHA Patient",
        "voice_note_text": "Patient has severe headache and fever.",
        "translated_symptoms": "Patient has severe headache and fever.",
        "vitals": {
            "bp": "120/80",
            "pulse": "75",
            "temp": "101.0",
            "spo2": "98"
        },
        "triage_priority": "High",
        "ai_recommendation": "Consult physician for fever.",
        "image_url": ""
    }
    
    # Needs valid token
    headers = {"Authorization": "Bearer mock_jwt_token_asha_999"}
    resp = requests.post(f"{base_url}/api/intake/", json=payload, headers=headers)
    print("ASHA Submit Response:", resp.status_code)
    try:
        data = resp.json()
        print(json.dumps(data, indent=2))
        case_id = data.get("case_id")
        print("\n=> CASE ID RETURNED:", case_id)
    except Exception as e:
        print("Error parsing response:", e)
        return

    time.sleep(2)
    
    print("\n2. Fetching Queue as Doctor...")
    doc_headers = {"Authorization": "Bearer mock_jwt_token_doctor_999"}
    q_resp = requests.get(f"{base_url}/api/queue/", headers=doc_headers)
    print("Doctor Queue Response:", q_resp.status_code)
    try:
        q_data = q_resp.json()
        found = next((item for item in q_data if str(item.get("case_id")) == str(case_id)), None)
        if found:
            print("\n=> FOUND IN QUEUE!")
            print(json.dumps(found, indent=2))
        else:
            print("\n=> NOT FOUND IN QUEUE!")
            print("First 2 queue items:")
            print(json.dumps(q_data[:2], indent=2))
    except Exception as e:
        print("Error parsing queue:", e)

if __name__ == "__main__":
    run_test()
