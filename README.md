# RAG AI Agent — Pinecone + LangChain + GPT-4o

An end-to-end Retrieval-Augmented Generation (RAG) AI Agent that lets you chat with your own documents using semantic search.

## Tech Stack

- **LangChain** — Agent orchestration & retrieval chain
- **Pinecone** — Vector database for semantic search
- **OpenAI** — Embeddings (`text-embedding-3-small`) + LLM (`gpt-4o`)
- **FastAPI** — REST API server
- **PyPDF** — PDF document loading

## Project Structure

```
rag-agent/
├── app/
│   ├── __init__.py
│   ├── agent.py        # LangChain ReAct agent
│   ├── retriever.py    # Pinecone retriever setup
│   ├── ingest.py       # Document loading & embedding
│   └── api.py          # FastAPI routes
├── data/
│   └── documents/      # Add your PDFs/TXTs here
├── .env                # API keys (never commit this)
├── requirements.txt
├── main.py             # Entry point
└── README.md
```

## Setup & Run

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd rag-agent
pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
cp .env .env.local   # or just edit .env directly
```

Fill in your keys in `.env`:
```
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=rag-agent
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1
```

### 3. Add Your Documents

```bash
mkdir -p data/documents
cp your_file.pdf data/documents/
```

### 4. Ingest Documents into Pinecone

```bash
python main.py ingest
```

### 5. Run

**CLI Chat:**
```bash
python main.py chat
```

**REST API:**
```bash
python main.py api
# Visit http://localhost:8000/docs
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Ask a question |
| POST | `/ingest` | Ingest documents |
| POST | `/reset` | Clear chat history |
| GET | `/health` | Health check |

### Example Chat Request

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the refund policy?", "namespace": "default"}'
```
