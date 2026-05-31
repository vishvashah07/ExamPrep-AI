"""
ingest.py - Optimized ingestion: only ingest new files, batch with retry
"""

import os
import time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

from pinecone import Pinecone, ServerlessSpec
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_community.document_loaders import PyPDFLoader, TextLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter


def create_pinecone_index():
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index_name = os.getenv("PINECONE_INDEX_NAME", "rag-agent")
    existing_indexes = [i.name for i in pc.list_indexes()]

    if index_name not in existing_indexes:
        print(f"Creating Pinecone index: {index_name}")
        pc.create_index(
            name=index_name,
            dimension=3072,
            metric="cosine",
            spec=ServerlessSpec(
                cloud=os.getenv("PINECONE_CLOUD", "aws"),
                region=os.getenv("PINECONE_REGION", "us-east-1"),
            ),
        )
        print(f"Index '{index_name}' created.")
    return pc.Index(index_name)


def get_embeddings():
    return GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=os.getenv("GOOGLE_API_KEY"),
    )


def chunk_documents(documents, chunk_size=800, chunk_overlap=80):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks = splitter.split_documents(documents)
    print(f"Created {len(chunks)} chunks.")
    return chunks


def ingest_file(file_path: str, namespace: str = "default"):
    """
    Ingest a SINGLE file into Pinecone.
    Much faster than re-ingesting everything.
    """
    print(f"=== Ingesting: {file_path} ===")
    create_pinecone_index()

    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    # Load single file
    if path.suffix == ".pdf":
        loader = PyPDFLoader(str(path))
    else:
        loader = TextLoader(str(path))

    documents = loader.load()
    print(f"Loaded {len(documents)} pages from {path.name}")

    if not documents:
        print("No content found in file.")
        return

    chunks = chunk_documents(documents)
    embeddings = get_embeddings()

    # Batch upload with retry on rate limit
    BATCH_SIZE = 20  # small batches to avoid rate limits
    index_name = os.getenv("PINECONE_INDEX_NAME", "rag-agent")

    print(f"Uploading {len(chunks)} chunks in batches of {BATCH_SIZE}...")

    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (len(chunks) + BATCH_SIZE - 1) // BATCH_SIZE

        while True:
            try:
                PineconeVectorStore.from_documents(
                    documents=batch,
                    embedding=embeddings,
                    index_name=index_name,
                    namespace=namespace,
                )
                print(f"  Batch {batch_num}/{total_batches} done ✓")
                time.sleep(0.5)  # small delay between batches
                break

            except Exception as e:
                err = str(e)
                if "429" in err or "quota" in err.lower() or "rate" in err.lower():
                    wait = 60
                    print(f"  Rate limit hit. Waiting {wait}s before retry...")
                    time.sleep(wait)
                else:
                    raise

    print(f"Successfully ingested {path.name}!")


def ingest(data_dir: str = "data/documents", namespace: str = "default"):
    """Ingest all files in a directory (used by CLI)."""
    print("=== Starting Ingestion Pipeline ===")
    create_pinecone_index()

    data_path = Path(data_dir)
    files = list(data_path.glob("**/*.pdf")) + list(data_path.glob("**/*.txt"))

    if not files:
        print("No documents found.")
        return

    for f in files:
        ingest_file(str(f), namespace=namespace)

    print("All files ingested!")