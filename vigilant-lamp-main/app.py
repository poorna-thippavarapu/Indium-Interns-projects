"""
vigilant-lamp: an offline stt ↔ tts voice-assistant demo built with streamlit.

features
--------
• speech-to-text via openai whisper  
• text-to-speech via coqui-tts (vits, vctk voices)  
• file upload / microphone recording (stt)  
• txt / pdf ingestion (tts)  
• terminal-style dark ui themed entirely in css
"""

from __future__ import annotations

# stdlib imports
import sys
from pathlib import Path as _Path
# add project root to sys.path for absolute imports
sys.path.insert(0, str(_Path(__file__).parent.resolve()))

# local imports
from stt import BACKENDS as ASR_BACKENDS, get_transcriber
from tts import BACKENDS as TTS_BACKENDS, get_tts
from core.audio import record_audio, stop_and_save_audio
from core.file_utils import read_uploaded_text
from ui.layout import render_main_ui

# --------------------------------------------------------------------------- #
# main entry point: all logic is modularized, only glue code here
# --------------------------------------------------------------------------- #

def load_asr_backend(model_key: str):
    # returns the selected asr backend instance
    return get_transcriber(model_key)


def load_tts_backend(engine_key: str):
    # returns the selected tts backend instance
    return get_tts(engine_key)


def main() -> None:
    # all ui logic is in ui.layout.render_main_ui
    render_main_ui(
        ASR_BACKENDS,
        TTS_BACKENDS,
        load_asr_backend,
        load_tts_backend,
        record_audio,
        stop_and_save_audio,
        read_uploaded_text,
    )

if __name__ == "__main__":
    main()
