# tts.base: abstract base class for tts backends
from abc import ABC, abstractmethod
from pathlib import Path

class TTSBackend(ABC):
    @abstractmethod
    def synthesize(self, text: str, speaker: str | None = None) -> Path:
        # synthesize text to audio file, return path
        pass
