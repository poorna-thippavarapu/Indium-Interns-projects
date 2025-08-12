import streamlit as st
from ui.input_section import render_input_section
from ui.output_section import render_output_section

def render_main_columns(
    asr_backend,
    tts_backend,
    asr_backends,
    tts_backends,
    asr_model_choice,
    tts_engine_choice,
    record_audio,
    stop_and_save_audio,
    read_uploaded_text,
):
    # For Azure TTS, use the list of voices
    if hasattr(tts_backend, "voices") and hasattr(tts_backend, "voice_labels"):
        speakers = [name for name, _ in tts_backend.voices]
        speaker_labels = tts_backend.voice_labels
    else:
        speakers = getattr(tts_backend, "speakers", [None])
        speaker_labels = getattr(tts_backend, "speaker_labels", None)
    for key, default in (("is_recording", False), ("audio_data", None)):
        st.session_state.setdefault(key, default)

    st.markdown('<div class="terminal-box">', unsafe_allow_html=True)
    st.markdown(
        '<h1 style="text-align:center;color:#00ff66;margin:0 0 1rem;">vigilant-lamp</h1>',
        unsafe_allow_html=True,
    )
    st.markdown('<hr class="terminal-divider">', unsafe_allow_html=True)

    header_left, header_div, header_right = st.columns([0.5, 0.01, 0.5])
    with header_left:
        st.markdown('<h3 style="margin:0;text-align:left;">input</h3>', unsafe_allow_html=True)
    with header_div:
        st.markdown(
            '<div style="width:10px;height:2.90rem;border-left:2px dotted #f8f8f8;margin:auto;"></div>',
            unsafe_allow_html=True,
        )
    with header_right:
        st.markdown('<h3 style="margin:0;text-align:right;">output</h3>', unsafe_allow_html=True)
    st.markdown('<hr class="terminal-divider">', unsafe_allow_html=True)

    left_col, divider_col, right_col = st.columns([0.5, 0.03, 0.5], gap="small")
    with divider_col:
        st.markdown(
            '<div style="width:2px;height:100vh;border-left:2px dotted #f8f8f8;margin:auto;"></div>',
            unsafe_allow_html=True,
        )

    with left_col:
        render_input_section(
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
            speaker_labels if 'speaker_labels' in locals() else None,
        )
    with right_col:
        render_output_section()
    st.markdown("</div>", unsafe_allow_html=True)
