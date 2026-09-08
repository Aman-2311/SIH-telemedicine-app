import requests
import json
import time
import sys

BASE_URL = "http://localhost:8000"

def run_test():
    print("==========================================================")
    print("STARTING REAL END-TO-END DATABASE INTEGRATION TEST")
    print("ASHA -> Supabase -> Doctor Queue -> Prescribe -> Patient Portal")
    print("==========================================================")

    test_abha = "TEST-PATIENT-MH-0002"
    patient_name = "Kavita Waghmare"
    
    # 1. ASHA Worker Intake Submission
    print("\n[Step 1] Submitting real patient intake via POST /api/intake/ ...")
    intake_payload = {
        "patient_name": patient_name,
        "abha_id": test_abha,
        "age": 47,
        "gender": "Female",
        "voice_note_text": "मरीज को तीन दिनों से सीने में भारीपन और सांस लेने में कठिनाई है, चक्कर भी आ रहे हैं।",
        "vitals": {
            "bp": "158/98",
            "temp": "99.4",
            "pulse": "102",
            "spo2": "95"
        }
    }
    
    res_intake = requests.post(f"{BASE_URL}/api/intake/", json=intake_payload)
    if res_intake.status_code != 200:
        print(f"FAILED Step 1: {res_intake.status_code} - {res_intake.text}")
        sys.exit(1)
        
    intake_data = res_intake.json()
    case_id = str(intake_data.get("case_id") or intake_data.get("id"))
    triage_priority = intake_data.get("triage_priority")
    print(f"  -> SUCCESS! Case ID: {case_id}")
    print(f"  -> Triage Priority: {triage_priority}")
    print(f"  -> Translated: {intake_data.get('translated_symptoms', '')[:80]}...")
    
    # 2. Check Doctor Queue
    print(f"\n[Step 2] Verifying Doctor Queue via GET /api/queue/ ...")
    res_queue = requests.get(f"{BASE_URL}/api/queue/")
    if res_queue.status_code != 200:
        print(f"FAILED Step 2: {res_queue.status_code} - {res_queue.text}")
        sys.exit(1)
        
    queue = res_queue.json()
    found_case = next((c for c in queue if str(c.get("id")) == case_id or str(c.get("case_id")) == case_id), None)
    if not found_case:
        print(f"FAILED: Case {case_id} not found in Doctor Waiting Queue! Queue size: {len(queue)}")
        sys.exit(1)
        
    print(f"  -> SUCCESS! Case {case_id} found in waiting queue.")
    print(f"  -> Patient: {found_case.get('patient_name')}, Priority: {found_case.get('triage_priority')}")
    print(f"  -> Queue size: {len(queue)}")

    # 3. Doctor Prescribes Medication
    print(f"\n[Step 3] Doctor submitting prescription via POST /api/queue/{case_id}/prescribe ...")
    rx_payload = {
        "doctor_id": "DOCTOR-MH-7313",
        "doctor_name": "Dr. Arvind Kulkarni (MD)",
        "diagnosis": "Stage 2 Essential Hypertension with exertional angina suspicion",
        "medicines": [
            {
                "name": "Telmisartan 40mg",
                "dosage": "1 tablet once daily after breakfast",
                "duration": "30 days",
                "generic_alternative": "Telmisartan 40mg IP (PMBJP Generic)"
            },
            {
                "name": "Amlodipine 5mg",
                "dosage": "1 tablet once daily at bedtime",
                "duration": "30 days",
                "generic_alternative": "Amlodipine 5mg IP (PMBJP Generic)"
            }
        ],
        "notes": "Restrict dietary sodium (<5g/day). Measure BP twice weekly. Immediate hospital visit if severe chest tightness recurs."
    }
    
    res_rx = requests.post(f"{BASE_URL}/api/queue/{case_id}/prescribe", json=rx_payload)
    if res_rx.status_code != 200:
        print(f"FAILED Step 3: {res_rx.status_code} - {res_rx.text}")
        sys.exit(1)
        
    rx_res = res_rx.json()
    print(f"  -> SUCCESS! Prescription saved.")
    print(f"  -> Message: {rx_res.get('message')}")
    
    # 4. Verify Case Removed from Waiting Queue & Added to Completed
    print(f"\n[Step 4] Checking Queue states (waiting vs completed) ...")
    res_queue_after = requests.get(f"{BASE_URL}/api/queue/")
    queue_after = res_queue_after.json()
    still_waiting = any(str(c.get("id")) == case_id or str(c.get("case_id")) == case_id for c in queue_after)
    if still_waiting:
        print(f"FAILED: Case {case_id} is still in waiting queue!")
        sys.exit(1)
    print(f"  -> SUCCESS! Case removed from waiting queue.")

    res_completed = requests.get(f"{BASE_URL}/api/queue/completed")
    completed = res_completed.json()
    found_completed = next((c for c in completed if str(c.get("id")) == case_id or str(c.get("case_id")) == case_id), None)
    if not found_completed:
        print(f"FAILED: Case {case_id} not found in completed cases! Completed count: {len(completed)}")
        sys.exit(1)
    print(f"  -> SUCCESS! Case found in completed cases list (Count: {len(completed)}).")
    print(f"  -> Completed Prescribed At: {found_completed.get('prescription', {}).get('prescribed_at')}")

    # 5. ASHA Patient History Verification
    print(f"\n[Step 5] Checking ASHA Patients list via GET /api/intake/asha/patients ...")
    res_asha = requests.get(f"{BASE_URL}/api/intake/asha/patients")
    asha_records = res_asha.json().get("data", [])
    asha_case = next((c for c in asha_records if str(c.get("id")) == case_id or str(c.get("case_id")) == case_id), None)
    if not asha_case:
        print(f"FAILED: Case {case_id} not found in ASHA patient list!")
        sys.exit(1)
    print(f"  -> SUCCESS! Found in ASHA records. Status: {asha_case.get('status')}")
    print(f"  -> Diagnosis visible to ASHA: {asha_case.get('prescription', {}).get('diagnosis')}")
    print(f"  -> Medicines visible to ASHA: {[m.get('name') for m in asha_case.get('prescription', {}).get('medicines', [])]}")

    # 6. Patient Portal Verification
    print(f"\n[Step 6] Checking Patient Portal API via GET /api/intake/patient/{test_abha} ...")
    res_patient = requests.get(f"{BASE_URL}/api/intake/patient/{test_abha}")
    patient_data = res_patient.json()
    latest_rx = patient_data.get("latest", {})
    if not latest_rx or str(latest_rx.get("id")) != case_id:
        print(f"FAILED: Patient portal latest record is not case {case_id}! Got: {latest_rx.get('id')}")
        sys.exit(1)
    
    rx_details = latest_rx.get("prescription", {})
    print(f"  -> SUCCESS! Patient portal returns active prescription for case {case_id}:")
    print(f"     * Doctor: {rx_details.get('doctor_name')}")
    print(f"     * Diagnosis: {rx_details.get('diagnosis')}")
    print(f"     * Medicines ({len(rx_details.get('medicines', []))}):")
    for m in rx_details.get('medicines', []):
        print(f"       - {m.get('name')} | {m.get('dosage')} | {m.get('duration')} (Alternative: {m.get('generic_alternative')})")
    print(f"     * Total patient consultation history records: {len(patient_data.get('data', []))}")

    print("\n==========================================================")
    print("ALL END-TO-END TESTS PASSED WITH 100% REAL SUPABASE DATA!")
    print("==========================================================")

if __name__ == "__main__":
    run_test()
