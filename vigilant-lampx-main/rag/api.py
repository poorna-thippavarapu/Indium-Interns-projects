from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi import Body
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import shutil
from rag.rag_app import process_question
from stt.whisper import WhisperASRBackend

app = FastAPI()

# Enable CORS for all origins (customize for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/transcribe-audio/")
def transcribe_audio(audio: UploadFile = File(...)):
    temp_path = Path(f"/tmp/{audio.filename}")
    with temp_path.open("wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)
    asr = WhisperASRBackend()
    transcript = asr.transcribe(temp_path)
    return {"transcript": transcript}

@app.post("/ask/")
def ask_question(question: str = Form(...)):
    result = process_question(question)
    return JSONResponse(result)


class TTSRequest(BaseModel):
    text: str

@app.post("/tts/")
def synthesize_tts(request: TTSRequest = Body(...)):
    from tts.gtts_tts import GTTSBackend
    gtts = GTTSBackend()
    audio_path = gtts.synthesize(request.text)
    return FileResponse(audio_path, media_type="audio/mpeg")
