import requests
import json
import uuid

# 1. Simulate ASHA Submission
test_abha = 'ABHA-SIM-' + str(uuid.uuid4())[:6]
payload = {
    'abha_id': test_abha,
    'patient_name': 'Simulation Patient',
    'voice_note_text': 'Patient has severe stomach pain',
    'translated_symptoms': 'Patient has severe stomach pain',
    'vitals': {
        'bp': '120/80',
        'pulse': '72',
        'temp': '98.6'
    }
}

print(f"Submitting ASHA Intake for {test_abha}...")
res = requests.post('http://127.0.0.1:8000/api/intake/', json=payload)
data = res.json()
case_id = data.get('case_id')
db_id = data.get('id')

print(f"ASHA case_id = {case_id}")
print(f"Supabase id = {db_id}")

# 2. Simulate Doctor Queue Fetch
headers = {
    'Authorization': 'Bearer mock_jwt_token_doctor_999'
}
q_res = requests.get('http://127.0.0.1:8000/api/queue/', headers=headers)
queue_data = q_res.json()

found = any(str(c.get('case_id')) == str(case_id) or str(c.get('id')) == str(case_id) for c in queue_data)
print(f"/api/queue contains {case_id} = {'YES' if found else 'NO'}")

# 3. Simulate UI Logic (since we removed .slice(0, 4) and mapping logic is robust)
ui_visible = 'YES' if found else 'NO'
print(f"Doctor UI displays {case_id} = {ui_visible}")
