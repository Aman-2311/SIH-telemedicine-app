from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import intake, queue, upload, facilities
from app.api import intake, queue, upload, facilities, auth

app = FastAPI(
    title="SIH Telemedicine Hub API",
    description="Backend for the ASHA Store-and-Forward Telemedicine Platform"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(intake.router, prefix="/api", tags=["Patient Intake"])
app.include_router(queue.router, prefix="/api", tags=["Doctor Dashboard"])
app.include_router(upload.router, prefix="/api", tags=["Media Storage"])
app.include_router(facilities.router, prefix="/api/facilities", tags=["Facilities & Geolocation"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

@app.get("/")
async def root():
    return {"status": "success", "message": "Backend is running!"}