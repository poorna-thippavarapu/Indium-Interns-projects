# # stt.faster_whisper: faster-whisper backend for stt
# from pathlib import Path
# from stt.base import ASRBackend

# class FasterWhisperBackend(ASRBackend):
#     def __init__(self):
#         from faster_whisper import WhisperModel  # only import if used
#         self.model = WhisperModel("base")
   
#     def transcribe(self, audio_path: Path) -> str:
      
#         segments, _ = self.model.transcribe(str(audio_path))
#         return " ".join([getattr(seg, "text", "") for seg in segments])
