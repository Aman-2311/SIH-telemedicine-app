import io
import requests
from app.core.database import supabase
# Minimal valid 1x1 PNG image bytes
TEST_PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    b"\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff?\x00\x05\xfe\x02\xfe\xa76\x81\x9e\x00\x00\x00\x00IEND\xaeB`\x82"
)

def generate_test_image_bytes():
    return TEST_PNG_BYTES

def test_flow():
    base_url = "http://localhost:8000"
    print("=== Step 1: Testing direct upload to /api/upload ===")
    img_bytes = generate_test_image_bytes()
    files = {"file": ("dermatology_lesion_sample.jpg", img_bytes, "image/jpeg")}
    headers = {"Authorization": "Bearer test-asha-token"}
    
    upload_res = requests.post(f"{base_url}/api/upload", files=files, headers=headers)
    print(f"Upload status: {upload_res.status_code}")
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    upload_data = upload_res.json()
    print("Upload response:", upload_data)
    
    storage_url = upload_data["data"]["url"]
    assert "supabase.co/storage/v1/object/public/medical-images/" in storage_url
    print(f"Verified Supabase Storage URL: {storage_url}")
    
    # Check image is reachable
    img_fetch = requests.get(storage_url)
    assert img_fetch.status_code == 200, f"Image fetch returned {img_fetch.status_code}"
    assert len(img_fetch.content) > 0, "Fetched image is empty"
    print(f"Fetched image successfully: HTTP {img_fetch.status_code}, {len(img_fetch.content)} bytes")
    
    print("\n=== Step 2: Testing intake creation with Supabase image_url ===")
    intake_payload = {
        "abha_id": "TEST-ABHA-ATTACHMENT-001",
        "patient_name": "Ramesh Patil (Attachment Test)",
        "voice_note_text": "Patient has severe rash and irritation on the forearm for 4 days.",
        "translated_symptoms": "Severe pruritic erythematous rash on forearm lasting 4 days.",
        "vitals": {
            "bp": "126/82",
            "temp": "98.8",
            "pulse": "76"
        },
        "image_url": storage_url
    }
    
    intake_res = requests.post(f"{base_url}/api/intake/", json=intake_payload, headers=headers)
    print(f"Intake status: {intake_res.status_code}")
    assert intake_res.status_code == 200, f"Intake submission failed: {intake_res.text}"
    intake_data = intake_res.json()
    case_id = intake_data["case_id"]
    print(f"Case created with ID: {case_id}")
    assert intake_data["data"]["image_url"] == storage_url
    
    print("\n=== Step 3: Verifying Doctor Queue returns real image_url ===")
    doc_headers = {"Authorization": "Bearer test-doctor-token"}
    queue_res = requests.get(f"{base_url}/api/queue", headers=doc_headers)
    assert queue_res.status_code == 200
    queue_items = queue_res.json()
    
    matched_case = next((c for c in queue_items if str(c.get("case_id") or c.get("id")) == str(case_id)), None)
    assert matched_case is not None, f"Case #{case_id} not found in doctor queue"
    print(f"Doctor queue case found: {matched_case.get('patient_name')}")
    assert matched_case.get("image_url") == storage_url, f"Expected {storage_url}, got {matched_case.get('image_url')}"
    print(f"Doctor queue returns real Supabase Storage image_url: {matched_case.get('image_url')}")
    
    print("\n=== Step 4: Testing attachment verification endpoint ===")
    att_res = requests.get(f"{base_url}/api/attachment/{case_id}", headers=doc_headers)
    print(f"Attachment lookup status: {att_res.status_code}")
    assert att_res.status_code == 200
    att_data = att_res.json()
    assert att_data["has_attachment"] is True
    assert att_data["image_url"] == storage_url
    print("Attachment endpoint verified successfully!")
    
    print("\n=== Step 5: Testing base64 offline sync conversion on intake ===")
    import base64
    b64_img = f"data:image/jpeg;base64,{base64.b64encode(img_bytes).decode('utf-8')}"
    intake_b64_payload = {
        "abha_id": "TEST-ABHA-OFFLINE-SYNC-002",
        "patient_name": "Suresh Kale (Base64 Offline Sync)",
        "voice_note_text": "Dermatological lesion observed during offline field visit.",
        "translated_symptoms": "Dermatological lesion observed during offline field visit.",
        "vitals": {
            "bp": "120/80",
            "temp": "98.6",
            "pulse": "72"
        },
        "image_url": b64_img
    }
    
    intake_b64_res = requests.post(f"{base_url}/api/intake/", json=intake_b64_payload, headers=headers)
    assert intake_b64_res.status_code == 200
    b64_case = intake_b64_res.json()
    b64_saved_url = b64_case["data"]["image_url"]
    print(f"Base64 auto-converted to Supabase Storage URL: {b64_saved_url}")
    assert b64_saved_url.startswith("https://")
    assert "supabase.co/storage/v1/object/public/medical-images/" in b64_saved_url
    
    # Check reachable
    b64_fetch = requests.get(b64_saved_url)
    assert b64_fetch.status_code == 200
    print("Base64 uploaded image successfully verified in Supabase Storage!")
    
    print("\n>>> ALL BACKEND & STORAGE ATTACHMENT TESTS PASSED! <<<")

if __name__ == "__main__":
    test_flow()
