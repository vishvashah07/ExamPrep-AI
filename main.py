"""
main.py - Entry point

  python main.py ingest   → Ingest documents
  python main.py chat     → CLI chat
  python main.py api      → Start FastAPI server
"""

import sys
import uvicorn
from app.ingest import ingest
from app.agent import RAGAgent


def run_ingest():
    print("Starting document ingestion...")
    ingest(data_dir="data/documents", namespace="default")


def run_chat():
    print("\n=== Exam Prep Agent (CLI Mode) ===")
    print("Type 'quit' to exit | 'reset' to clear history\n")
    agent = RAGAgent(namespace="default")
    while True:
        user_input = input("You: ").strip()
        if not user_input:
            continue
        if user_input.lower() == "quit":
            print("Goodbye!")
            break
        if user_input.lower() == "reset":
            agent.reset()
            continue
        print(f"\nAgent: {agent.chat(user_input)}\n")


def run_api():
    print("Starting FastAPI server at http://localhost:8000")
    uvicorn.run("app.api:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "api"
    if mode == "ingest":
        run_ingest()
    elif mode == "chat":
        run_chat()
    elif mode == "api":
        run_api()
    else:
        print("Usage: python main.py [ingest | chat | api]")
        sys.exit(1)
