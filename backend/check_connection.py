import requests
import sys

print("==================================================")
print("SYSTEM & SERVER CONNECTIVITY DIAGNOSTICS")
print("==================================================")

# 1. Check Backend FastAPI (Port 8000)
try:
    r = requests.get("http://127.0.0.1:8000/docs", timeout=4)
    print(f"[OK] Backend FastAPI Server (Port 8000): ACTIVE (Status: {r.status_code})")
except Exception as e:
    print(f"[FAIL] Backend FastAPI Server: FAILED ({e})")

# 2. Check Frontend Dev Server (Port 3000)
try:
    r = requests.get("http://127.0.0.1:3000/", timeout=4)
    print(f"[OK] Frontend Web App (Port 3000): ACTIVE (Status: {r.status_code})")
except Exception as e:
    print(f"[FAIL] Frontend Web App: FAILED ({e})")

# 3. Check Frontend Proxy to Backend (/api from Port 3000)
try:
    r = requests.post(
        "http://127.0.0.1:3000/api/auth/login",
        json={"abha_id": "TEST-ASHA-MH-0001", "role": "asha"},
        timeout=4,
    )
    data = r.json()
    has_token = "access_token" in data
    print(f"[OK] Frontend-to-Backend Proxy (/api): CONNECTED (Status: {r.status_code}, JWT Issued: {has_token})")
except Exception as e:
    print(f"[FAIL] Frontend-to-Backend Proxy: FAILED ({e})")

# 4. Check Backend Supabase Database Connection
try:
    from app.core.database import supabase
    res = supabase.table("patient_intakes").select("id").limit(1).execute()
    print(f"[OK] Supabase Cloud Database: CONNECTED (Query success, {len(res.data)} sample records in patient_intakes)")
except Exception as e:
    print(f"[FAIL] Supabase Cloud Database: FAILED ({e})")

print("==================================================")
