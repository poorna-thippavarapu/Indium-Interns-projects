import requests
from io import BytesIO
from .base import TTSBackend
from core.config import AZURE_TTS_KEY, AZURE_TTS_REGION


from pathlib import Path

# List of English Azure Neural voices (as of July 2025)
# Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts
# Format: (voice name, label)
AZURE_ENGLISH_VOICES = [
    ("en-US-AriaNeural", "Aria (US, Female)"),
    ("en-US-GuyNeural", "Guy (US, Male)"),
    ("en-US-JennyNeural", "Jenny (US, Female)"),
    ("en-US-AmberNeural", "Amber (US, Female)"),
    ("en-US-AnaNeural", "Ana (US, Female)"),
    ("en-US-AshleyNeural", "Ashley (US, Female)"),
    ("en-US-BrandonNeural", "Brandon (US, Male)"),
    ("en-US-ChristopherNeural", "Christopher (US, Male)"),
    ("en-US-CoraNeural", "Cora (US, Female)"),
    ("en-US-ElizabethNeural", "Elizabeth (US, Female)"),
    ("en-US-EricNeural", "Eric (US, Male)"),
    ("en-US-JacobNeural", "Jacob (US, Male)"),
    ("en-US-MichelleNeural", "Michelle (US, Female)"),
    ("en-US-MonicaNeural", "Monica (US, Female)"),
    ("en-US-NancyNeural", "Nancy (US, Female)"),
    ("en-US-SaraNeural", "Sara (US, Female)"),
    ("en-US-SteffanNeural", "Steffan (US, Male)"),
    ("en-GB-LibbyNeural", "Libby (UK, Female)"),
    ("en-GB-MaisieNeural", "Maisie (UK, Female)"),
    ("en-GB-RyanNeural", "Ryan (UK, Male)"),
    ("en-GB-SoniaNeural", "Sonia (UK, Female)"),
    ("en-GB-ThomasNeural", "Thomas (UK, Male)"),
    ("en-AU-NatashaNeural", "Natasha (Australia, Female)"),
    ("en-AU-WilliamNeural", "William (Australia, Male)"),
    ("en-CA-ClaraNeural", "Clara (Canada, Female)"),
    ("en-CA-LiamNeural", "Liam (Canada, Male)"),
    ("en-IN-NeerjaNeural", "Neerja (India, Female)"),
    ("en-IN-PrabhatNeural", "Prabhat (India, Male)"),
    ("en-NZ-MitchellNeural", "Mitchell (NZ, Male)"),
    ("en-NZ-MollyNeural", "Molly (NZ, Female)"),
    ("en-ZA-LeahNeural", "Leah (South Africa, Female)"),
    ("en-ZA-LukeNeural", "Luke (South Africa, Male)")
]

class AzureTTS(TTSBackend):
    # List of available English voices (name, label)
    voices = AZURE_ENGLISH_VOICES
    """
    Microsoft Azure Text-to-Speech backend.
    """
    def __init__(self, voice="en-US-AriaNeural", output_format="riff-16khz-16bit-mono-pcm"):
        self.voice = voice
        self.output_format = output_format
        self.api_key = AZURE_TTS_KEY
        self.region = AZURE_TTS_REGION
        self.endpoint = f"https://{self.region}.tts.speech.microsoft.com/cognitiveservices/v1"
        self.voice_labels = {name: label for name, label in self.voices}

    def synthesize(self, text: str, speaker: str | None = None) -> Path:
        # If a speaker is provided, use it as the voice name
        voice = speaker if speaker else self.voice
        headers = {
            "Ocp-Apim-Subscription-Key": self.api_key,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": self.output_format,
            "User-Agent": "vigilant-lamp-azure-tts"
        }
        # Try to get the language code from the voice name (e.g., en-US)
        lang = voice.split("-")[0] + "-" + voice.split("-")[1] if "-" in voice else "en-US"
        ssml = f"""
        <speak version='1.0' xml:lang='{lang}'>
            <voice xml:lang='{lang}' name='{voice}'>
                {text}
            </voice>
        </speak>
        """
        response = requests.post(self.endpoint, headers=headers, data=ssml.encode('utf-8'))
        if response.status_code == 200:
            output_path = Path("azure_tts_output.wav")
            with open(output_path, "wb") as f:
                f.write(response.content)
            return output_path
        else:
            raise Exception(f"Azure TTS failed: {response.status_code} {response.text}")
