"""
stt package: speech-to-text backend registry and factory
"""
from stt.whisper import WhisperASRBackend
# from stt.faster_whisper import FasterWhisperBackend
# from stt.whisperx import WhisperXASRBackend

# registry of available stt backends
BACKENDS = {
    "whisper": ("OpenAI Whisper", WhisperASRBackend)
    # "faster_whisper": ("Faster-Whisper", FasterWhisperBackend)
    # "whisperx": ("WhisperX", WhisperXASRBackend),
}

def get_transcriber(key: str):
    # factory for stt backend by key
    return BACKENDS[key][1]()
