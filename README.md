# ExamPrep AI — RAG-Powered Study Assistant

A full-stack AI application that lets students upload their study materials (PDFs) and interact with them through an intelligent exam preparation agent. Built with a Retrieval-Augmented Generation (RAG) pipeline using LangChain, Pinecone, Google Gemini 3 Flash Preview, and React.

---

## What it does

Upload any PDF — lecture notes, textbooks, research papers — and the agent will:

- Answer questions strictly based on your uploaded material
- Generate practice quiz questions with answers
- Summarize topics in a structured format
- Create flashcards in Q&A format
- Maintain conversation history across turns
- Cite sources with page numbers to prevent hallucination

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11 | Core language |
| FastAPI | 0.115.0 | REST API server |
| Uvicorn | 0.30.6 | ASGI web server |
| LangChain | 0.3.25 | RAG pipeline orchestration |
| LangChain Google GenAI | 2.1.4 | Gemini LLM and embeddings |
| LangChain Pinecone | 0.2.0 | Vector store integration |
| Pinecone Client | 5.0.1 | Vector database client |
| PyPDF | 4.3.1 | PDF parsing |
| Pydantic | 2.9.2 | Request and response validation |
| python-multipart | latest | File upload handling |
| python-dotenv | 1.0.1 | Environment variable management |

### Frontend
| Technology | Purpose |
|---|---|
| React | UI framework |
| JavaScript JSX | Component language |
| Fetch API | HTTP communication with backend |
| Google Fonts | Playfair Display, DM Sans, DM Mono |

### AI and Infrastructure
| Service | Purpose |
|---|---|
| Google Gemini 3 Flash Preview | LLM for answer generation |
| Gemini Embedding 001 | Text embeddings (3072 dimensions) |
| Pinecone Serverless | Cloud vector database (AWS us-east-1) |

---

## Architecture

### RAG Pipeline

```
INDEXING PIPELINE (runs once on upload)

PDF Upload
    ↓
PyPDF Loader — reads all pages
    ↓
RecursiveCharacterTextSplitter — 800 chars, 80 overlap
    ↓
Gemini Embedding 001 — converts each chunk to 3072 numbers
    ↓
Pinecone Serverless — stores all vectors with cosine similarity


QUERY PIPELINE (runs on every question)

User Question
    ↓
Embed question → 3072 dimensional vector
    ↓
Pinecone cosine similarity search → Top 5 chunks
    ↓
Build prompt: system prompt + context + chat history + question
    ↓
Gemini 3 Flash Preview → generates answer
    ↓
StrOutputParser → clean string response
    ↓
React displays answer
```

### Study Modes

Each mode has a dedicated LCEL chain with its own system prompt:

| Mode | Behavior |
|---|---|
| Free Chat | Answers questions directly from study material |
| Quiz Mode | Generates 5 Q&A practice questions |
| Summarize | Structured summary with key points and takeaways |
| Flashcards | 5 flashcards in Q and A card format |

### Anti-Hallucination Techniques

| Technique | What it prevents |
|---|---|
| Context-only instruction | Model using outside knowledge |
| Source labeling with page numbers | Model mixing up information |
| Temperature 0.1 | Creative guessing and word filling |
| Empty context fallback | Hallucinating when no docs are found |

---

## Project Structure

```
examprep-ai/
├── app/
│   ├── __init__.py
│   ├── ingest.py          # PDF loading, chunking, embedding, Pinecone upload
│   ├── retriever.py       # Pinecone vector search setup
│   ├── agent.py           # LCEL chain with per-mode prompts
│   └── api.py             # FastAPI REST endpoints
├── data/
│   └── documents/         # Uploaded PDFs stored here
├── rag-ui/
│   └── src/
│       ├── App.js
│       ├── ExamPrepAgent.jsx
│       
├── .env                   # API keys — never commit this
├── .env.example           # Template for environment variables
├── .gitignore
├── requirements.txt
├── main.py                # Entry point
└── README.md
```

---

## Setup and Installation

### Prerequisites
- Python 3.11 or higher
- Node.js 18 or higher
- Google AI Studio API key — https://aistudio.google.com
- Pinecone account — https://app.pinecone.io

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/examprep-ai.git
cd examprep-ai
```

### 2. Create and activate virtual environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 3. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment variables
Copy `.env.example` to `.env` and fill in your keys:
```
GOOGLE_API_KEY=your_google_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=rag-agent
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1
```

### 5. Create Pinecone Index
Go to https://app.pinecone.io and create an index with these settings:
```
Name:       rag-agent
Dimensions: 3072
Metric:     cosine
Type:       Serverless
Cloud:      AWS
Region:     us-east-1
```

### 6. Install React dependencies
```bash
cd rag-ui
npm install
```

---

## Running the Application

Open two terminals simultaneously:

**Terminal 1 — Start backend:**
```bash
cd examprep-ai
venv\Scripts\activate
python main.py api
```
Backend runs at http://localhost:8000
API docs available at http://localhost:8000/docs

**Terminal 2 — Start frontend:**
```bash
cd rag-ui
npm start
```
Frontend runs at http://localhost:3000

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/upload` | Upload PDF and auto-ingest into Pinecone |
| GET | `/documents` | List all uploaded documents |
| DELETE | `/documents/{filename}` | Delete a document |
| POST | `/chat` | Send question and get answer |
| POST | `/reset` | Clear conversation history |

### Example chat request
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is photosynthesis?",
    "namespace": "default",
    "mode": "quiz"
  }'
```

### Example response
```json
{
  "answer": "Q1. What is photosynthesis?\nAnswer: ...",
  "namespace": "default"
}
```

---

## How to Use

1. Start both backend and frontend servers
2. Open http://localhost:3000 in your browser
3. Upload a PDF using the drag and drop zone in the sidebar
4. Wait for indexing to complete — confirmation message will appear
5. Select a study mode from the sidebar
6. Start asking questions about your material

---

## Key Design Decisions

### Why LCEL Chain over LangGraph ReAct Agent
LangGraph's ReAct agent uses Gemini's function calling internally which requires thought signatures — causing 400 errors with newer Gemini models. The LCEL chain bypasses function calling entirely, always retrieves context before answering, and is more predictable for RAG use cases.

### Why gemini-3-flash-preview
Latest Gemini preview model with improved reasoning and instruction following. Used with temperature 0.1 for factual grounded responses. If preview model is unavailable, fall back to gemini-2.0-flash-001.

### Why Pinecone Serverless
Free tier, auto-scales, no infrastructure to manage. Perfect for development and small production use cases.

### Why chunk size 800 with 80 overlap
800 characters captures enough context per chunk without exceeding token limits. 80 character overlap (10 percent) ensures sentences split across chunk boundaries are still retrievable.

### Why temperature 0.1
Near-zero temperature keeps responses factual and grounded in retrieved context. Slightly above 0 to avoid robotic-sounding responses.

### Why per-mode chains
Each study mode has its own dedicated LCEL chain with a mode-specific system prompt instead of a simple text prefix. This gives Gemini clear structural instructions per mode resulting in consistent and reliable formatting every time.



