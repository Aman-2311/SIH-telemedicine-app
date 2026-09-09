import sys
import os
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import intake, queue, upload, facilities, auth, chat

app = FastAPI(
    title="SIH Telemedicine Hub API",
    description="Backend for the ASHA Store-and-Forward Telemedicine Platform"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core API Routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(intake.router, prefix="/api/intake", tags=["Patient Intake"])

app.include_router(queue.router, prefix="/api/queue", tags=["Doctor Dashboard"])
app.include_router(queue.router, prefix="/api", tags=["Doctor Dashboard Alias"])
app.include_router(intake.router, prefix="/api", tags=["Patient Intake Alias"])
app.include_router(facilities.router, prefix="/api/facilities", tags=["Facilities & Geolocation"])
app.include_router(upload.router, prefix="/api", tags=["Media Storage"])
app.include_router(chat.router, prefix="/api", tags=["Patient AI Chat"])

@app.get("/")
@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "SIH Telemedicine Hub API",
        "version": "1.0.0"
    }