from pathlib import Path
import tempfile
from gtts import gTTS
from tts.base import TTSBackend

class GTTSBackend(TTSBackend):
    """
    Google Text-to-Speech (gTTS) backend implementation for TTSBackend.
    """
    def __init__(self, lang='en'):
        self.lang = lang

    def synthesize(self, text: str, speaker: str | None = None) -> Path:
        tts = gTTS(text=text, lang=self.lang)
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as fp:
            tts.save(fp.name)
            return Path(fp.name)
