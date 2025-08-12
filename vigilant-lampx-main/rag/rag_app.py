import os
from typing import cast
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS
import PyPDF2
from langchain.embeddings.openai import OpenAIEmbeddings
import openai
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
# from core.audio import record_audio, stop_and_save_audio
# from stt.whisperx import WhisperXASRBackend
from tts.gtts_tts import GTTSBackend
from pathlib import Path
from stt.whisper import WhisperASRBackend

from dotenv import load_dotenv
load_dotenv()


# Backend configuration (use environment variables for deployment)

AZURE_API_KEY = cast(str, os.getenv("AZURE_API_KEY"))
AZURE_ENDPOINT = cast(str, os.getenv("AZURE_ENDPOINT"))
AZURE_RESOURCE_NAME = cast(str, os.getenv("AZURE_RESOURCE_NAME"))
EMBEDDING_DEPLOYMENT_NAME = cast(str, os.getenv("EMBEDDING_DEPLOYMENT_NAME"))
LLM_DEPLOYMENT_NAME = cast(str, os.getenv("LLM_DEPLOYMENT_NAME"))

# Check for missing environment variables
missing_vars = []
for var, value in [
    ("AZURE_API_KEY", AZURE_API_KEY),
    ("AZURE_ENDPOINT", AZURE_ENDPOINT),
    ("AZURE_RESOURCE_NAME", AZURE_RESOURCE_NAME),
    ("EMBEDDING_DEPLOYMENT_NAME", EMBEDDING_DEPLOYMENT_NAME),
    ("LLM_DEPLOYMENT_NAME", LLM_DEPLOYMENT_NAME)
]:
    if not value:
        missing_vars.append(var)
if missing_vars:
    raise EnvironmentError(f"Missing required environment variables: {', '.join(missing_vars)}")

openai.api_key = AZURE_API_KEY
openai.api_base = AZURE_ENDPOINT
openai.api_type = "azure"
openai.api_version = "2023-03-15-preview"

def load_embedding_model():
    return OpenAIEmbeddings(
        client=openai.Embedding,
        openai_api_key=AZURE_API_KEY,
        deployment=EMBEDDING_DEPLOYMENT_NAME
    )

def load_llm_model():
    def azure_llm(prompt):
        response = openai.ChatCompletion.create(
            engine=LLM_DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500
        )
        if isinstance(response, dict) and "choices" in response:
            return response["choices"][0]["message"]["content"].strip()
        else:
            raise ValueError("Unexpected response format from Azure OpenAI API.")
    return azure_llm

def build_faiss_index(chunks, _embedding_model):
    texts = [chunk["text"] for chunk in chunks]
    metadata = [chunk for chunk in chunks]
    return FAISS.from_texts(texts, _embedding_model, metadatas=metadata)

def parse_pdf(file_path):
    with open(file_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        return "\n".join(page.extract_text() or "" for page in reader.pages)

def clean_text(raw_text):
    lines = raw_text.split("\n")
    cleaned_lines = [line.strip() for line in lines if line.strip()]
    return "\n".join(cleaned_lines)

def split_text(cleaned_text):
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_text(cleaned_text)
    return [{"text": chunk} for chunk in chunks]

def retrieve_chunks(question, faiss_index, embedding_model):
    question_embedding = embedding_model.embed_query(question)
    return faiss_index.similarity_search_by_vector(question_embedding, k=5)

def generate_answer(retrieved_chunks, question, llm_model):
    context = "\n".join([chunk.metadata["text"] for chunk in retrieved_chunks])
    prompt = f"""
    You are a professional customer service representative. Answer the customer's question in a clear, concise, and friendly manner, as if you are assisting them directly. Do not mention that you are an AI, a chatbot, or that you are referencing a PDF or document. If possible, keep your answer under 100 words unless a longer response is absolutely necessary for clarity or completeness.

    Context:
    {context}

    Customer's Question:
    {question}

    Your Response:
    """
    return llm_model(prompt)

# Debug logs to confirm deployment names and endpoint
print(f"Embedding Deployment Name: {EMBEDDING_DEPLOYMENT_NAME}")
print(f"LLM Deployment Name: {LLM_DEPLOYMENT_NAME}")
print(f"Endpoint: {AZURE_ENDPOINT}")

# Example backend usage (replace with API endpoints for frontend integration)
def process_question(user_question, audio_data=None, record_start_time=None):
    file_path = "rag/data/my_manual.pdf"
    raw_text = parse_pdf(file_path)
    cleaned_text = clean_text(raw_text)
    chunks = split_text(cleaned_text)
    embedding_model = load_embedding_model()
    faiss_index = build_faiss_index(chunks, embedding_model)
    llm_model = load_llm_model()
    retrieved_chunks = retrieve_chunks(user_question, faiss_index, embedding_model)
    answer = generate_answer(retrieved_chunks, user_question, llm_model)
    gtts = GTTSBackend()
    tts_audio_path = gtts.synthesize(answer)
    return {
        "question": user_question,
        "answer": answer,
        "tts_audio_path": str(tts_audio_path) if tts_audio_path else None
    }


# --- FastAPI entry point for Azure deployment ---
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/ask")
async def ask(request: Request):
    data = await request.json()
    user_question = data.get("question")
    if not user_question:
        return JSONResponse(status_code=400, content={"error": "Missing 'question' in request body."})
    result = process_question(user_question)
    return result

if __name__ == "__main__":
    uvicorn.run("rag.rag_app:app", host="0.0.0.0", port=8000)
