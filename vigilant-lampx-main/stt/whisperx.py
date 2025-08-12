# # stt.whisperx: whisperx backend for stt
# from pathlib import Path
# from stt.base import ASRBackend

# class WhisperXASRBackend(ASRBackend):
#     def __init__(self):
#         import whisperx  
#         self.model = whisperx.load_model("base", device="cpu", compute_type="int8")

#     def transcribe(self, audio_path: Path) -> str:
#         result = self.model.transcribe(str(audio_path))
#         segments = result.get("segments", [])
#         return " ".join(seg.get("text", "") for seg in segments)
