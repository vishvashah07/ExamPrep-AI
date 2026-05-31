"""
retriever.py - Connect to Pinecone and return a LangChain retriever
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore


def get_vectorstore(namespace: str = "default") -> PineconeVectorStore:
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=os.getenv("GOOGLE_API_KEY"),
    )
    vectorstore = PineconeVectorStore(
        index_name=os.getenv("PINECONE_INDEX_NAME", "rag-agent"),
        embedding=embeddings,
        namespace=namespace,
    )
    return vectorstore


def get_retriever(namespace: str = "default", k: int = 5, filter: dict = None):
    vectorstore = get_vectorstore(namespace=namespace)
    search_kwargs = {"k": k}
    if filter:
        search_kwargs["filter"] = filter
    return vectorstore.as_retriever(search_kwargs=search_kwargs)
