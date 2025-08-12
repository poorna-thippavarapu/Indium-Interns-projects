# stt.whisper: openai whisper backend for stt
from pathlib import Path
import whisper
from stt.base import ASRBackend

class WhisperASRBackend(ASRBackend):
    def __init__(self):
        # load whisper model once per instance
        self.model = whisper.load_model("base")
    # Resource usage logging (CPU/memory) for analysis. Requires 'psutil' package.
    # To enable, uncomment this method and the calls in transcribe().
    # def log_resource_usage(self, note: str = ""):
    #     import psutil, os
    #     process = psutil.Process(os.getpid())
    #     mem_mb = process.memory_info().rss / 1024 ** 2
    #     cpu_percent = process.cpu_percent(interval=0.1)
    #     print(f"[ResourceUsage] {note} | Memory: {mem_mb:.2f} MB | CPU: {cpu_percent:.1f}%")

    def transcribe(self, audio_path: Path) -> str:
        # To enable resource usage logging, uncomment the lines below:
        # self.log_resource_usage("Before transcription")
        # transcribe using openai whisper
        result = self.model.transcribe(str(audio_path))
        # self.log_resource_usage("After transcription")
        return str(result.get("text", ""))
