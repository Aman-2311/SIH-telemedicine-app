import requests
import json

base_url = "https://sahara-cio2.onrender.com"

# 1. Check if Render serves frontend
print("Checking Render Frontend...")
r = requests.get(base_url)
print(f"Render Root HTTP: {r.status_code}")
print(f"Render Root Content: {r.text[:50]}")

# 2. Check the Doctor Queue from Render backend directly
doc_headers = {"Authorization": "Bearer mock_jwt_token_doctor_999"}
q_resp = requests.get(f"{base_url}/api/queue/", headers=doc_headers)
print(f"\nProduction GET /api/queue HTTP: {q_resp.status_code}")
q_data = q_resp.json()

found_130 = next((c for c in q_data if str(c.get('case_id')) == '130' or str(c.get('id')) == '130'), None)

if found_130:
    print(f"Production GET /api/queue contains 130 = YES")
    print(f"Priority of 130: {found_130.get('triage_priority')}")
else:
    print(f"Production GET /api/queue contains 130 = NO")

# Let's count how many cases have higher priority than Routine (weight 1)
weights = {'urgent':3, 'high':3, 'moderate':2, 'medium':2, 'routine':1, 'low':1}
routine_weight = weights['routine']
higher_priority_count = 0
for c in q_data:
    w = weights.get(str(c.get('triage_priority', '')).lower(), 0)
    if w > routine_weight:
        higher_priority_count += 1

print(f"Number of cases sorting ABOVE case 130 (Medium/High priority): {higher_priority_count}")

