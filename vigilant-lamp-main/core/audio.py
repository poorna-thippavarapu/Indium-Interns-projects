# core.audio: audio recording and saving helpers
import sounddevice as sd
import tempfile
from scipy.io.wavfile import write
import streamlit as st
import time

sample_rate = 16000
record_seconds = 10

def record_audio():
    st.session_state.is_recording = True
    st.info("recording… speak now")
    st.session_state.audio_data = sd.rec(
        int(record_seconds * sample_rate),
        samplerate=sample_rate,
        channels=1,
        dtype="float32",
    )
    st.session_state.record_start_time = time.time()


def stop_and_save_audio():
    sd.stop()
    st.session_state.is_recording = False
    # Calculate actual recorded duration using wall-clock time
    elapsed = time.time() - st.session_state.get("record_start_time", 0)
    actual_frames = int(elapsed * sample_rate)
    trimmed_audio = st.session_state.audio_data[:actual_frames]
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        write(tmp.name, sample_rate, trimmed_audio)
        st.session_state.audio_path = tmp.name
        st.session_state.audio_label = "mic recording"
    st.success("audio captured ✔")
    st.session_state.pop("record_start_time", None)
