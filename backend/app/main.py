from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import intake  

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

@app.get("/")
async def root():
    return {"status": "success", "message": "Backend is running!"}