# stt.base: abstract base class for stt backends
from abc import ABC, abstractmethod
from pathlib import Path

class ASRBackend(ABC):
    @abstractmethod
    def transcribe(self, audio_path: Path) -> str:
        # transcribe audio file to text
        pass
