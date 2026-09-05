from fastapi import APIRouter, Query
from typing import Optional
import math

router = APIRouter()

# Mock facilities database
MOCK_FACILITIES = [
    {
        "name": "District Civil Hospital, Pune",
        "type": "Hospital",
        "lat": 18.5204,
        "lon": 73.8567,
        "contact": "+91 20 2612 8000",
        "emergency_services": True
    },
    {
        "name": "Pradhan Mantri Bhartiya Janaushadhi Kendra, Shivajinagar",
        "type": "Pharmacy",
        "lat": 18.5314,
        "lon": 73.8446,
        "contact": "+91 800 123 4567",
        "emergency_services": False
    },
    {
        "name": "Community Health Centre, Kothrud",
        "type": "Hospital",
        "lat": 18.5074,
        "lon": 73.8197,
        "contact": "+91 20 2539 1234",
        "emergency_services": True
    },
    {
        "name": "Jan Aushadhi Store, Viman Nagar",
        "type": "Pharmacy",
        "lat": 18.5679,
        "lon": 73.9143,
        "contact": "+91 800 987 6543",
        "emergency_services": False
    }
]

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in kilometers
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

@router.get("/nearby")
async def get_nearby_facilities(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    facility_type: Optional[str] = Query(None, description="'Hospital' or 'Pharmacy'")
):
    results = []
    
    for facility in MOCK_FACILITIES:
        if facility_type and facility["type"].lower() != facility_type.lower():
            continue
            
        dist = haversine(lat, lon, facility["lat"], facility["lon"])
        
        fac_data = facility.copy()
        fac_data["distance_km"] = round(dist, 2)
        results.append(fac_data)
        
    results.sort(key=lambda x: x["distance_km"])
    
    return {
        "status": "success",
        "user_location": {"lat": lat, "lon": lon},
        "count": len(results),
        "facilities": results
    }
