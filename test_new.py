import requests
import json
import time
import uuid

base_url = "http://127.0.0.1:8000"

def run_test():
    print("1. Submitting NEW ASHA Intake...")
    test_abha = 'ABHA-NEW-' + str(uuid.uuid4())[:6]
    payload = {
        "abha_id": test_abha,
        "patient_name": "New Test Patient",
        "voice_note_text": "Patient has severe headache.",
        "translated_symptoms": "Patient has severe headache.",
        "vitals": {"bp": "120/80", "pulse": "75", "temp": "101.0"},
        "triage_priority": "Routine"
    }
    
    headers = {"Authorization": "Bearer mock_jwt_token_asha_999"}
    resp = requests.post(f"{base_url}/api/intake/", json=payload, headers=headers)
    data = resp.json()
    case_id = data.get("case_id")
    print(f"=> ASHA case = {case_id}")

    time.sleep(2)
    
    print("\n2. Fetching Queue...")
    doc_headers = {"Authorization": "Bearer mock_jwt_token_doctor_999"}
    q_resp = requests.get(f"{base_url}/api/queue/", headers=doc_headers)
    q_data = q_resp.json()
    
    found = any(str(c.get("case_id")) == str(case_id) for c in q_data)
    print(f"=> /api/queue contains {case_id} = {'YES' if found else 'NO'}")

    # Simulate newestCases logic
    sorted_by_date = sorted(q_data, key=lambda x: x.get('created_at', ''), reverse=True)
    newest_3 = sorted_by_date[:3]
    in_newest_3 = any(str(c.get("case_id")) == str(case_id) for c in newest_3)
    
    print(f"=> Doctor Home Newly Received displays {case_id} = {'YES' if in_newest_3 else 'NO'}")

if __name__ == "__main__":
    run_test()
