"""
tts package: text-to-speech backend registry and factory
"""


# from tts.coqui_tts import CoquiTTSBackend
from tts.gtts_tts import GTTSBackend

# registry of available tts backends

BACKENDS = {
    # "coqui_tts": ("Coqui-TTS", CoquiTTSBackend),
    "gtts": ("Google TTS", GTTSBackend)
}

def get_tts(key: str):
    # factory for tts backend by key
    return BACKENDS[key][1]()