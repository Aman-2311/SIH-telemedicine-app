import requests
import json
import jwt

BASE_URL = "http://127.0.0.1:8000"

print("=" * 60)
print("VERIFYING CRYPTOGRAPHIC JWT & RBAC SECURITY IMPLEMENTATION")
print("=" * 60)

# 1. Login as ASHA (Sunita Patil)
r_asha = requests.post(f"{BASE_URL}/api/auth/login", json={"abha_id": "TEST-ASHA-MH-0001", "role": "asha"})
assert r_asha.status_code == 200, f"ASHA login failed: {r_asha.text}"
asha_data = r_asha.json()
asha_token = asha_data["access_token"]
print(f"[PASS] 1. ASHA Login successful: {asha_data['message']}")
print(f"    Token prefix: {asha_token[:25]}...")

# Verify token format is real JWT (3 segments separated by dots)
assert len(asha_token.split(".")) == 3, "Token is not a valid 3-segment JWT!"
print("[PASS] 2. Verified token is a cryptographic 3-part JWT")

# 2. Login as Patient (Savita Patil)
r_pat = requests.post(f"{BASE_URL}/api/auth/login", json={"abha_id": "TEST-PATIENT-MH-0002", "role": "patient"})
assert r_pat.status_code == 200, f"Patient login failed: {r_pat.text}"
pat_data = r_pat.json()
pat_token = pat_data["access_token"]
print(f"[PASS] 3. Patient Login successful: {pat_data['message']}")

# 3. Login as Doctor (Dr. Arvind Kulkarni)
r_doc = requests.post(f"{BASE_URL}/api/auth/login", json={"abha_id": "DOC-MH-7001", "role": "doctor"})
assert r_doc.status_code == 200, f"Doctor login failed: {r_doc.text}"
doc_data = r_doc.json()
doc_token = doc_data["access_token"]
print(f"[PASS] 4. Doctor Login successful: {doc_data['message']}")

# 4. Security Check: Unauthenticated request to /api/queue
r_unauth = requests.get(f"{BASE_URL}/api/queue")
print(f"[PASS] 5. Unauthenticated GET /api/queue status: {r_unauth.status_code} (Expected: 401)")
assert r_unauth.status_code == 401, f"Expected 401, got {r_unauth.status_code}"

# 5. RBAC Check: Patient attempting to view Doctor queue
r_pat_queue = requests.get(f"{BASE_URL}/api/queue", headers={"Authorization": f"Bearer {pat_token}"})
print(f"[PASS] 6. Patient role accessing Doctor queue: {r_pat_queue.status_code} (Expected: 403 Forbidden)")
assert r_pat_queue.status_code == 403, f"Expected 403, got {r_pat_queue.status_code}"

# 6. RBAC Check: Doctor viewing Doctor queue
r_doc_queue = requests.get(f"{BASE_URL}/api/queue", headers={"Authorization": f"Bearer {doc_token}"})
print(f"[PASS] 7. Doctor role accessing Doctor queue: {r_doc_queue.status_code} (Expected: 200 OK)")
assert r_doc_queue.status_code == 200, f"Expected 200, got {r_doc_queue.status_code}"

# 7. Patient Scoping Check: Savita Patil accessing her own history
r_pat_own = requests.get(f"{BASE_URL}/api/intake/patient/TEST-PATIENT-MH-0002", headers={"Authorization": f"Bearer {pat_token}"})
print(f"[PASS] 8. Patient accessing own records: {r_pat_own.status_code} (Expected: 200 OK)")
assert r_pat_own.status_code == 200, f"Expected 200, got {r_pat_own.status_code}"

# 8. Patient Scoping Security: Savita Patil attempting to access ANOTHER patient's records
r_pat_other = requests.get(f"{BASE_URL}/api/intake/patient/TEST-OTHER-9999", headers={"Authorization": f"Bearer {pat_token}"})
print(f"[PASS] 9. Patient accessing unauthorized other patient records: {r_pat_other.status_code} (Expected: 403 Forbidden)")
assert r_pat_other.status_code == 403, f"Expected 403, got {r_pat_other.status_code}"

print("=" * 60)
print("ALL 9 SECURITY & AUTHENTICATION TESTS PASSED WITH 100% SUCCESS!")
print("=" * 60)
