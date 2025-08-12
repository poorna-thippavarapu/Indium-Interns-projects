import streamlit as st
from pathlib import Path

def render_output_section():
    if st.session_state.get("audio_path"):
        st.subheader(st.session_state.get("audio_label", "audio"))
        st.audio(st.session_state.audio_path, format="audio/wav")
    if st.session_state.get("transcript"):
        st.subheader("transcript")
        st.markdown(f"> {st.session_state.transcript}")
        st.download_button("⬇ txt", st.session_state.transcript, file_name="transcript.txt")
    if st.session_state.get("tts_audio"):
        st.subheader("generated audio")
        st.audio(st.session_state.tts_audio, format="audio/wav")
        st.download_button("⬇ wav", Path(st.session_state.tts_audio).read_bytes(), file_name="tts_output.wav")
        st.subheader("source text")
        st.markdown(f"> {st.session_state.tts_text}")
