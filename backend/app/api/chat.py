from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.ai_service import patient_chat_assistant

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    language: Optional[str] = "English"

class ChatResponse(BaseModel):
    reply: str

@router.post("/chat", response_model=ChatResponse)
async def chat_with_gemini(req: ChatRequest):
    reply = patient_chat_assistant(query=req.query, language_hint=req.language or "English")
    return ChatResponse(reply=reply)
