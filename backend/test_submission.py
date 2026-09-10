import asyncio
import json
from app.core.security import create_access_token
from app.core.database import supabase
from httpx import AsyncClient
from app.main import app

async def run_test():
    # 1. Create ASHA Token
    asha_token = create_access_token(data={"sub": "asha_user_1", "role": "asha"})
    
    # 2. Create Doctor Token
    doctor_token = create_access_token(data={"sub": "DOC-MH-7001", "role": "doctor"})
    
    payload = {
      "abha_id": "ABHA-TEST-9999",
      "patient_name": "Test Case",
      "voice_note_text": "Patient has severe headache.",
      "vitals": {
        "bp": "120/80",
        "temp": "98.6",
        "pulse": "72"
      }
    }
    
    async with AsyncClient(base_url="http://127.0.0.1:8000", timeout=60.0) as ac:
        print("=== 1. POST /api/intake ===")
        response = await ac.post("/api/intake", json=payload, headers={"Authorization": f"Bearer {asha_token}"})
        print(f"Status: {response.status_code}")
        try:
            resp_json = response.json()
            print(json.dumps(resp_json, indent=2))
            case_id = resp_json.get("case_id")
        except:
            print(response.text)
            return

        if not case_id:
            print("No case_id returned!")
            return
            
        print(f"\n=== 2. SUPABASE DIRECT QUERY FOR {case_id} ===")
        try:
            # Query Supabase directly
            sb_resp = supabase.table("patient_intakes").select("*").eq("id", case_id).execute()
            if sb_resp.data:
                row = sb_resp.data[0]
                print(f"id: {row.get('id')}")
                print(f"abha_id: {row.get('abha_id')}")
                print(f"patient_id: {row.get('patient_id')}")
                print(f"created_by_asha_id: {row.get('created_by_asha_id')}")
                print(f"status: {row.get('status')}")
                print(f"triage_priority: {row.get('triage_priority')}")
                print(f"department: {row.get('department')}")
                print(f"assigned_doctor_id: {row.get('assigned_doctor_id')}")
                print(f"created_at: {row.get('created_at')}")
            else:
                print("CASE NOT FOUND IN SUPABASE!")
        except Exception as e:
            print(f"Supabase error: {e}")

        print("\n=== 3. GET /api/queue ===")
        q_resp = await ac.get("/api/queue", headers={"Authorization": f"Bearer {doctor_token}"})
        print(f"Status: {q_resp.status_code}")
        q_data = q_resp.json()
        
        found = False
        for item in q_data:
            if item.get("id") == case_id or item.get("case_id") == case_id:
                found = True
                print("FOUND in /api/queue!")
                print(json.dumps(item, indent=2))
                break
                
        if not found:
            print("NOT FOUND in /api/queue!")
            print(f"Queue has {len(q_data)} items. Here are the IDs:")
            for item in q_data:
                print(f" - {item.get('id')}")

if __name__ == "__main__":
    asyncio.run(run_test())
