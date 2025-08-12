# tts.coqui_tts: coqui-tts backend for tts
from pathlib import Path
import tempfile
from TTS.api import TTS
from tts.base import TTSBackend

# List of speaker IDs to exclude
EXCLUDED_SPEAKERS = {
    "p235", "p242", "p285", "p289", "p290", "p291", "p296", "p319", "p320", "p321", "p322",
    "p324", "p325", "p327", "p328", "p331", "p332", "p337", "p338", "p342", "p344", "p346",
    "p348", "p349", "p350", "p352", "p353", "p354", "p355", "p356", "p357", "p358", "p359"
}

# Hardcoded mapping: speaker_id -> label (format: id| accent gender)
SPEAKER_LABELS = {
    "p225": "p225 | Southern England Female",
    "p226": "p226 | Northern Ireland Male",
    "p227": "p227 | Southern England Female",
    "p228": "p228 | Southern England Male",
    "p229": "p229 | Southern England Male",
    "p230": "p230 | Southern England Male",
    "p231": "p231 | Scottish Male",
    "p232": "p232 | Southern England Male",
    "p233": "p233 | Welsh Male",
    "p234": "p234 | Southern England Male",
    "p236": "p236 | Irish Male",
    "p237": "p237 | Southern England Female",
    "p238": "p238 | Southern England Male",

    "p239": "p239 | Southern England Male",
    "p240": "p240 | Southern England Female",

    "p241": "p241 | Scottish Male",
    "p243": "p243 | Scottish Male",
    "p244": "p244 | Southern England Male",
    "p245": "p245 | Scottish Male",
    "p246": "p246 | Scottish Male",
    "p247": "p247 | Scottish Male",
    "p248": "p248 | Scottish Female",
    "p249": "p249 | Scottish Female",
    "p250": "p250 | Scottish Female",
    "p251": "p251 | Scottish Female",
    "p252": "p252 | Southern England Male",
    "p253": "p253 | Southern England Male",
    "p254": "p254 | Scottish Female",
    "p255": "p255 | Scottish Male",
    "p256": "p256 | Scottish Female",
    "p257": "p257 | Scottish Female",
    "p258": "p258 | Southern England Female",
    "p259": "p259 | Southern England Male",
    "p260": "p260 | Southern England Male",
    "p261": "p261 | Southern England Male",
    "p262": "p262 | Scottish Male",
    "p263": "p263 | Southern England Female",
    "p264": "p264 | Southern England Female",
    "p265": "p265 | Southern England Female",
    "p266": "p266 | Southern England Male",
    "p267": "p267 | Southern England Male",
    "p268": "p268 | Scottish Male",
    "p269": "p269 | Scottish Female",
    "p270": "p270 | Southern England Male",
    "p271": "p271 | Scottish Male",
    "p272": "p272 | Scottish Male",
    "p273": "p273 | Scottish Female",
    "p274": "p274 | Scottish Female",
    "p275": "p275 | Scottish Male",
    "p276": "p276 | Scottish Female",
    "p277": "p277 | Scottish Male",
    "p278": "p278 | Scottish Female",
    "p279": "p279 | Scottish Female",
    "p280": "p280 | Scottish Male",
    "p281": "p281 | Scottish Male",
    "p282": "p282 | Scottish Female",
    "p283": "p283 | Scottish Female",
    "p284": "p284 | Scottish Female",
    "p286": "p286 | Scottish Female",
    "p287": "p287 | Scottish Female",
    "p288": "p288 | Scottish Male",
    "p292": "p292 | Southern England Female",
    "p293": "p293 | Scottish Female",
    "p294": "p294 | Scottish Female",
    "p295": "p295 | Scottish Male",
    "p297": "p297 | Scottish Female",
    "p298": "p298 | Scottish Female",
    "p299": "p299 | Scottish Female",
    "p300": "p300 | Scottish Female",
    "p301": "p301 | Scottish Male",
    "p302": "p302 | Scottish Male",
    "p303": "p303 | Scottish Male",
    "p304": "p304 | Scottish Female",
    "p305": "p305 | Scottish Female",
    "p306": "p306 | Scottish Female",
    "p307": "p307 | Scottish Male",
    "p308": "p308 | Scottish Female",
    "p309": "p309 | Scottish Male",
    "p310": "p310 | Scottish Male",
    "p311": "p311 | Scottish Female",
    "p312": "p312 | Scottish Female",
    "p313": "p313 | Scottish Female",
    "p314": "p314 | Scottish Female",
    "p315": "p315 | Scottish Female",
    "p316": "p316 | Scottish Female",
    "p317": "p317 | Scottish Male",
    "p318": "p318 | Scottish Female",
    "p323": "p323 | Southern England Female",
    "p326": "p326 | Southern England Female",
    "p329": "p329 | Scottish Female",
    "p330": "p330 | Scottish Female",
    "p333": "p333 | Scottish Female",
    "p334": "p334 | Scottish Female",
    "p335": "p335 | Scottish Male",
    "p336": "p336 | Scottish Female",
    "p339": "p339 | Scottish Male",
    "p340": "p340 | Scottish Female",
    "p341": "p341 | Scottish Female",
    "p343": "p343 | Scottish Female",
    "p345": "p345 | Scottish Male",
    "p347": "p347 | Scottish Female",
    "p351": "p351 | Scottish Female",
    "p360": "p360 | Scottish Male",
    "p361": "p361 | Scottish Female",
}

class CoquiTTSBackend(TTSBackend):
    def __init__(self):
        # load coqui-tts model once per instance
        self.tts = TTS(model_name="tts_models/en/vctk/vits")
        # Filter and map speakers
        all_speakers = self.tts.speakers if hasattr(self.tts, "speakers") and self.tts.speakers is not None else []
        self.speakers = [s for s in all_speakers if s not in EXCLUDED_SPEAKERS and s in SPEAKER_LABELS]
        self.speaker_labels = {s: SPEAKER_LABELS[s] for s in self.speakers}
    # Resource usage logging (CPU/memory) for analysis. Requires 'psutil' package.
    # To enable, uncomment this method and the calls in synthesize().
    # def log_resource_usage(self, note: str = ""):
    #     import psutil, os
    #     process = psutil.Process(os.getpid())
    #     mem_mb = process.memory_info().rss / 1024 ** 2
    #     cpu_percent = process.cpu_percent(interval=0.1)
    #     print(f"[ResourceUsage] {note} | Memory: {mem_mb:.2f} MB | CPU: {cpu_percent:.1f}%")

    def synthesize(self, text: str, speaker: str | None = None) -> Path:
        # To enable resource usage logging, uncomment the lines below:
        # self.log_resource_usage("Before synthesis")
        # synthesize text to wav file, return path
        speaker_arg = speaker if speaker is not None else (self.speakers[0] if self.speakers else None)
        if speaker_arg is None:
            raise ValueError("no speaker available for synthesis.")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            self.tts.tts_to_file(text=text, speaker=speaker_arg, file_path=tmp.name)
            # self.log_resource_usage("After synthesis")
            return Path(tmp.name)
