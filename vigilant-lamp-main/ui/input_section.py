import streamlit as st
from pathlib import Path
import tempfile

def render_input_section(
    asr_backend,
    tts_backend,
    asr_backends,
    tts_backends,
    asr_model_choice,
    tts_engine_choice,
    record_audio,
    stop_and_save_audio,
    read_uploaded_text,
    speakers,
    speaker_labels=None,
):
    mode = st.radio("mode", ["speech → text (stt)", "text → speech (tts)"])
    if mode and mode.startswith("speech"):
        st.subheader("🎙️ speech input")
        method = st.radio("input method", ["upload wav", "record mic"])
        if method == "upload wav":
            audio_file = st.file_uploader("choose a .wav", type=["wav"])
            if audio_file:
                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                    tmp.write(audio_file.getbuffer())
                    st.session_state.audio_path = tmp.name
                st.session_state.audio_label = audio_file.name
        else:
            if st.button("start recording", disabled=st.session_state.is_recording):
                record_audio()
            if st.button("🛑 stop & save", disabled=not st.session_state.is_recording):
                stop_and_save_audio()
        if st.session_state.get("audio_path") and st.button("✍️ transcribe"):
            try:
                transcript = asr_backend.transcribe(Path(st.session_state.audio_path))
                st.session_state.transcript = transcript
            except NotImplementedError:
                st.info(f"⚠️ support for {asr_backends.get(asr_model_choice, ('unknown',))[0]} is coming soon. please choose another model.")
    else:
        st.subheader("text input")
        input_type = st.radio("input method", ["type", "upload .txt/.pdf"])
        text_to_speak = ""
        if input_type == "type":
            text_to_speak = st.text_area("enter text here")
        else:
            uploaded = st.file_uploader("upload", type=["txt", "pdf"])
            if uploaded:
                text_to_speak = read_uploaded_text(uploaded)
                st.text_area("extracted text", text_to_speak, height=200)
        if text_to_speak:
            # Use speaker_labels if available for user-friendly labels
            speaker = None
            # Prefer Azure/Coqui style speaker_labels if available
            if speaker_labels:
                label_to_id = {v: k for k, v in speaker_labels.items()}
                selected_label = st.selectbox("speaker", list(label_to_id.keys()))
                speaker = label_to_id[selected_label]
            elif speakers and speakers[0] is not None:
                speaker = st.selectbox("speaker", speakers)
            if st.button("🔊 generate audio"):
                try:
                    audio_path = tts_backend.synthesize(text_to_speak, speaker=speaker if speaker else None)
                    st.session_state.tts_audio = str(audio_path)
                    st.session_state.tts_text = text_to_speak
                except NotImplementedError:
                    st.info(f"⚠️ support for {tts_backends.get(tts_engine_choice, ('unknown',))[0]} is coming soon. please choose another engine.")
