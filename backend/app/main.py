import sys
import os
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

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

@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "SIH Telemedicine Hub API",
        "version": "1.0.0"
    }

# Serve React Frontend (Unified Deployment)
# The static files will be located in frontend/dist/public during production
frontend_dist = os.path.join(backend_dir, "..", "frontend", "dist", "public")
if os.path.isdir(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    # Vite also occasionally puts other static files at the root, like vite.svg or favicon.ico.
    # We can handle those or let the catch-all handle them if they don't exist.

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow serving standard static files at root if they exist
        potential_file = os.path.join(frontend_dist, full_path)
        if os.path.isfile(potential_file):
            return FileResponse(potential_file)
        
        # Fallback to index.html for React Router / wouter
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        
        return {"error": "Frontend build not found."}
else:
    @app.get("/{full_path:path}")
    async def fallback_no_frontend(full_path: str):
        return {"error": "Frontend not built or not mounted."}