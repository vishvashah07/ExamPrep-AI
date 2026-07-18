"""
api.py - FastAPI REST API for the Exam Prep RAG Agent
"""

import os
import shutil
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from app.agent import RAGAgent
from app.ingest import ingest_file

UPLOAD_DIR = Path("data/documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Exam Prep RAG Agent", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    "https://examprepai-vishva.vercel.app",
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_agents: dict = {}


def get_agent(namespace: str = "default") -> RAGAgent:
    if namespace not in _agents:
        _agents[namespace] = RAGAgent(namespace=namespace)
    return _agents[namespace]


class ChatRequest(BaseModel):
    question: str
    namespace: Optional[str] = "default"
    mode: Optional[str] = "chat"

class ChatResponse(BaseModel):
    answer: str
    namespace: str

class ResetRequest(BaseModel):
    namespace: Optional[str] = "default"


@app.get("/")
def root():
    return {"message": "Exam Prep Agent is running!"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """Upload and ingest each PDF one at a time."""
    uploaded = []
    for file in files:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"Only PDFs allowed. Got: {file.filename}")

        dest = UPLOAD_DIR / file.filename
        with open(dest, "wb") as f:
            shutil.copyfileobj(file.file, f)

        try:
            ingest_file(str(dest), namespace="default")
            uploaded.append(file.filename)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to ingest {file.filename}: {str(e)}")

    # Reset agent to pick up new docs
    _agents.pop("default", None)

    return {
        "message": f"Successfully uploaded and indexed {len(uploaded)} file(s)",
        "files": uploaded,
    }


@app.get("/documents")
def list_documents():
    files = [f.name for f in UPLOAD_DIR.glob("*.pdf")]
    return {"documents": files, "count": len(files)}


@app.delete("/documents/{filename}")
def delete_document(filename: str):
    path = UPLOAD_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    path.unlink()
    return {"message": f"Deleted {filename}"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """Chat with mode passed directly to agent."""
    try:
        agent = get_agent(namespace=request.namespace)
        # Pass mode directly to agent — no prefix hacks needed anymore
        answer = agent.chat(request.question, mode=request.mode)
        return ChatResponse(answer=answer, namespace=request.namespace)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reset")
def reset_chat(request: ResetRequest):
    agent = get_agent(namespace=request.namespace)
    agent.reset()
    return {"message": "Chat history cleared"}
