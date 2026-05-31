"""
agent.py - Exam Prep RAG Agent using LCEL Chain with anti-hallucination
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.retriever import get_retriever

# ── System prompt per mode ────────────────────────────────────────────────────

BASE_RULES = """
STRICT RULES - FOLLOW EXACTLY:
1. ONLY use information from the provided context. Never use outside knowledge.
2. If the answer is not in the context, say exactly: "I could not find this in your study material."
3. Do NOT use Markdown: no asterisks (*), no hashtags (#), no dashes (-) for bullets.
4. Use numbers (1, 2, 3) for lists. Use plain capitalization for headers. Use blank lines to separate sections.
5. Be concise and clear.
"""

MODE_PROMPTS = {
    "chat": f"""You are an expert exam preparation assistant.
Answer the student's question using ONLY the provided study material context.
{BASE_RULES}""",

    "quiz": f"""You are an exam question generator.
Generate exactly 5 quiz questions WITH answers based ONLY on the provided context.

Format each question exactly like this:
Q1. [Question here]
Answer: [Answer here]

Q2. [Question here]
Answer: [Answer here]

(and so on up to Q5)
{BASE_RULES}""",

    "summary": f"""You are a study summarizer.
Write a clear, structured summary of the provided context.

Format exactly like this:
MAIN TOPIC
[One sentence describing the main topic]

KEY POINTS
1. [First key point]
2. [Second key point]
3. [Third key point]
(add more if needed)

IMPORTANT TAKEAWAYS
[2-3 sentences on what the student must remember]
{BASE_RULES}""",

    "flashcard": f"""You are a flashcard creator.
Create exactly 5 flashcards based ONLY on the provided context.

Format each flashcard exactly like this:
CARD 1
Q: [Question]
A: [Answer]

CARD 2
Q: [Question]
A: [Answer]

(and so on up to CARD 5)
{BASE_RULES}""",
}


def build_chain(namespace: str = "default", k: int = 5, mode: str = "chat"):
    """Build LCEL chain for a specific study mode."""
    retriever = get_retriever(namespace=namespace, k=k)
    system_prompt = MODE_PROMPTS.get(mode, MODE_PROMPTS["chat"])

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt + "\n\nCONTEXT FROM STUDY MATERIAL:\n{context}\n\nIf the context is empty, say: 'No study material found. Please upload a PDF first.'"),
        ("placeholder", "{chat_history}"),
        ("human", "{question}")
    ])

    llm = ChatGoogleGenerativeAI(
        model="gemini-3-flash-preview",
        temperature=0.1, 
        google_api_key=os.getenv("GOOGLE_API_KEY"),
    )

    chain = (
        {
            "context": lambda x: _get_context(retriever, x["question"]),
            "chat_history": lambda x: x["chat_history"],
            "question": lambda x: x["question"],
        }
        | prompt
        | llm
        | StrOutputParser()
    )
    return chain


def _get_context(retriever, question: str) -> str:
    """Retrieve context and format it clearly with source labels."""
    try:
        docs = retriever.invoke(question)
        if not docs:
            return "NO CONTEXT FOUND"
        
        chunks = []
        for i, doc in enumerate(docs):
            source = doc.metadata.get("source", "unknown")
            page = doc.metadata.get("page", "?")
            chunks.append(f"[Source {i+1} - {Path(source).name}, page {page}]:\n{doc.page_content}")
        
        return "\n\n".join(chunks)
    except Exception:
        return "ERROR RETRIEVING CONTEXT"


class RAGAgent:
    """
    Stateful RAG Agent with per-mode chains and anti-hallucination prompts.
    """

    def __init__(self, namespace: str = "default", k: int = 5):
        self.namespace = namespace
        self.k = k
        self.chat_history: list = []
        # Build all mode chains upfront
        self.chains = {
            mode: build_chain(namespace=namespace, k=k, mode=mode)
            for mode in MODE_PROMPTS.keys()
        }

    def chat(self, user_input: str, mode: str = "chat") -> str:
        """Process query using the appropriate mode chain."""
        chain = self.chains.get(mode, self.chains["chat"])

        answer = chain.invoke({
            "question": user_input,
            "chat_history": self.chat_history,
        })

        self.chat_history.append(HumanMessage(content=user_input))
        self.chat_history.append(AIMessage(content=answer))
        return answer

    def reset(self):
        """Clear conversation history."""
        self.chat_history = []
        print("Chat history cleared.")