"""
tts package: text-to-speech backend registry and factory
"""


from tts.coqui_tts import CoquiTTSBackend
from tts.gtts_tts import GTTSBackend
from tts.azure_tts import AzureTTS

# registry of available tts backends

BACKENDS = {
    "coqui_tts": ("Coqui-TTS", CoquiTTSBackend),
    "gtts": ("Google TTS", GTTSBackend),
    "azure_tts": ("Azure TTS", AzureTTS),
}

def get_tts(key: str):
    # factory for tts backend by key
    return BACKENDS[key][1]()
