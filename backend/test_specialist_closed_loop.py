import asyncio
import json
import sys
from datetime import datetime

# Direct test against FastAPI app using TestClient
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import supabase
from app.core.security import create_access_token

client = TestClient(app)

def run_test():
    print("=== STARTING SPECIALIST CLOSED-LOOP VERIFICATION TEST ===")
    
    # 1. Create auth tokens for ASHA, Doctor, and Patient
    asha_token = create_access_token({"sub": "asha-test", "role": "asha", "name": "Sunita Patil"})
    doctor_token = create_access_token({"sub": "doc-test", "role": "doctor", "name": "Dr. Sunita Sharma"})
    asha_headers = {"Authorization": f"Bearer {asha_token}"}
    doc_headers = {"Authorization": f"Bearer {doctor_token}"}

    # 2. Test Doctor Availability endpoint for multiple specialties
    print("\n--- Testing Doctor Availability Matching ---")
    for dept in ["Dermatology", "Cardiology", "General Medicine", "Pediatrics"]:
        res = client.get(f"/api/doctors/availability?department={dept}")
        assert res.status_code == 200, f"Doctor availability failed for {dept}: {res.text}"
        data = res.json()
        assert data.get("status") == "success"
        doctors = data.get("doctors", [])
        assert len(doctors) > 0, f"No doctors found for {dept}"
        doc = doctors[0]
        assert doc.get("name"), "Doctor must have a verified name"
        assert doc.get("facility"), "Doctor must have a verified facility"
        assert doc.get("facility_address"), "Doctor must have a physical street address"
        assert len(doc.get("available_slots", [])) > 0, "Doctor must have real time slots"
        print(f"[OK] Matched {dept}: {doc['name']} at {doc['facility']} ({doc['facility_address']}) - Slots: {doc['available_slots']}")

    # 3. Create a fresh patient intake to test the full journey
    print("\n--- Submitting New Patient Intake Case ---")
    test_abha = "TEST-ABHA-CLOSEDLOOP-001"
    intake_payload = {
        "abha_id": test_abha,
        "vitals": {
            "bp": "130/85",
            "pulse": "78",
            "temp": "99.1",
            "spo2": "97"
        },
        "voice_note_text": "Patient reports erythematous rash and pruritus on arms and back for three days.",
        "image_url": "https://images.unsplash.com/photo-5",
        "patient_name": "Ramesh Deshmukh"
    }

    intake_res = client.post("/api/intake/", json=intake_payload, headers=asha_headers)
    assert intake_res.status_code == 200, f"Intake submission failed: {intake_res.text}"
    intake_data = intake_res.json()
    case_id = intake_data.get("case_id") or intake_data.get("id")
    assert case_id, "Must return a valid Case ID"
    dept = intake_data.get("department") or "Dermatology"
    print(f"[OK] Created Case #{case_id} for ABHA {test_abha} (Department: {dept}, Priority: {intake_data.get('triage_priority')})")

    # Verify State 1: Unassigned case has zero fake doctor
    patient_res = client.get(f"/api/intake/patient/{test_abha}")
    assert patient_res.status_code == 200
    pdata = patient_res.json().get("data", [])
    assert len(pdata) > 0
    first_record = pdata[0]
    assert first_record.get("assigned_doctor") is None, f"Expected None assigned_doctor before scheduling, got: {first_record.get('assigned_doctor')}"
    assert first_record.get("scheduled_date") is None, f"Expected None scheduled_date before scheduling, got: {first_record.get('scheduled_date')}"
    assert first_record.get("appointment_status") == "waiting", f"Expected waiting status, got {first_record.get('appointment_status')}"
    print(f"[OK] Verified State 1 (No Doctor Assigned): assigned_doctor=None, scheduled_date=None, status='waiting'")

    # 4. Schedule consultation against this exact Case ID
    print("\n--- Scheduling Real Specialist Consultation ---")
    schedule_payload = {
        "doctor_id": "doc-derm-001",
        "assigned_doctor": "Dr. Sunita Sharma",
        "doctor_speciality": "Dermatology",
        "facility": "Community Health Hub",
        "facility_address": "Market Yard, Wardha, Maharashtra 442001",
        "scheduled_date": "12 September 2026",
        "scheduled_time": "10:30 AM"
    }

    sched_res = client.post(f"/api/{case_id}/schedule", json=schedule_payload, headers=asha_headers)
    assert sched_res.status_code == 200, f"Scheduling failed: {sched_res.text}"
    sched_data = sched_res.json()
    assert sched_data.get("status") == "success"
    assert sched_data.get("case_id") == case_id, "Must maintain the EXACT same Case ID"
    print(f"[OK] Confirmed State 3 (Slot Confirmed): Scheduled Dr. Sunita Sharma on Case #{case_id} at 10:30 AM, 12 Sept 2026")

    # 5. Verify Patient Portal sees the scheduled consultation
    patient_res2 = client.get(f"/api/intake/patient/{test_abha}")
    assert patient_res2.status_code == 200
    pdata2 = patient_res2.json().get("data", [])
    record2 = pdata2[0]
    assert record2.get("assigned_doctor") == "Dr. Sunita Sharma"
    assert record2.get("doctor_speciality") == "Dermatology"
    assert record2.get("facility") == "Community Health Hub"
    assert record2.get("facility_address") == "Market Yard, Wardha, Maharashtra 442001"
    assert record2.get("scheduled_date") == "12 September 2026"
    assert record2.get("scheduled_time") == "10:30 AM"
    assert record2.get("appointment_status") == "scheduled"
    assert record2.get("status") == "scheduled"
    print(f"[OK] Verified Patient Portal reflection: exact same Case #{case_id}, Dr. Sunita Sharma, scheduled time and physical location present")

    # 6. Verify Doctor Queue includes the scheduled case
    doc_queue_res = client.get("/api/", headers=doc_headers)
    assert doc_queue_res.status_code == 200
    doc_queue = doc_queue_res.json()
    found_case = next((c for c in doc_queue if str(c.get("case_id") or c.get("id")) == str(case_id)), None)
    assert found_case is not None, f"Scheduled Case #{case_id} must appear in Doctor Queue!"
    print(f"[OK] Doctor Queue includes Case #{case_id} with scheduled status")

    # 7. Doctor completes teleconsultation and prescribes medication
    print("\n--- Doctor Submitting Prescription & Completing Journey ---")
    prescribe_payload = {
        "doctor_id": "doc-derm-001",
        "doctor_name": "Dr. Sunita Sharma",
        "diagnosis": "Contact Dermatitis with Secondary Pruritus",
        "medicines": [
            {
                "name": "Cetirizine 10mg IP",
                "dosage": "1 tab OD at bedtime",
                "duration": "7 days",
                "generic_alternative": "PMBJP Cetirizine 10mg (₹6 vs Brand ₹38)"
            },
            {
                "name": "Hydrocortisone 1% Topical Cream",
                "dosage": "Apply BD sparingly",
                "duration": "5 days",
                "generic_alternative": "PMBJP Hydrocortisone Cream (₹18 vs Brand ₹85)"
            }
        ],
        "notes": "Avoid scented soaps and direct sun exposure. Apply cream after gentle cleansing."
    }

    rx_res = client.post(f"/api/{case_id}/prescribe", json=prescribe_payload, headers=doc_headers)
    assert rx_res.status_code == 200, f"Prescribe failed: {rx_res.text}"
    rx_data = rx_res.json()
    assert rx_data.get("status") == "success"
    print(f"[OK] Prescription submitted successfully on Case #{case_id}")

    # 8. Verify State 4 (Consultation Completed) on Patient Portal
    patient_res3 = client.get(f"/api/intake/patient/{test_abha}")
    assert patient_res3.status_code == 200
    pdata3 = patient_res3.json().get("data", [])
    record3 = pdata3[0]
    assert record3.get("status") == "completed"
    assert record3.get("appointment_status") == "completed"
    assert record3.get("prescription") is not None
    assert record3["prescription"].get("diagnosis") == "Contact Dermatitis with Secondary Pruritus"
    assert len(record3["prescription"].get("medicines", [])) == 2
    # Ensure consultation metadata preserved
    assert record3.get("assigned_doctor") == "Dr. Sunita Sharma"
    assert record3.get("facility") == "Community Health Hub"
    print(f"[OK] Verified State 4 (Consultation Completed): Diagnosis '{record3['prescription']['diagnosis']}', 2 PMBJP Medicines, Doctor '{record3.get('assigned_doctor')}' all preserved on exact same Case #{case_id}")

    print("\n=== ALL CLOSED-LOOP JOURNEY TESTS PASSED PERFECTLY ===")

if __name__ == "__main__":
    run_test()
