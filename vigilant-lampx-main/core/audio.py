# # core.audio: audio recording and saving helpers
# import sounddevice as sd
# import tempfile
# from scipy.io.wavfile import write
# import logging
# import time

# sample_rate = 16000
# record_seconds = 10

# def record_audio():
#     logging.info("recording… speak now")
#     audio_data = sd.rec(
#         int(record_seconds * sample_rate),
#         samplerate=sample_rate,
#         channels=1,
#         dtype="float32",
#     )
#     record_start_time = time.time()
#     return audio_data, record_start_time


# def stop_and_save_audio(audio_data, record_start_time):
#     sd.stop()
#     elapsed = time.time() - record_start_time
#     actual_frames = int(elapsed * sample_rate)
#     trimmed_audio = audio_data[:actual_frames]
#     with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
#         write(tmp.name, sample_rate, trimmed_audio)
#         audio_path = tmp.name
#     logging.info("audio captured!")
#     return audio_path
