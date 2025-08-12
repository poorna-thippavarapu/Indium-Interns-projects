"""
ui.layout: main streamlit ui rendering for vigilant-lamp
"""
# stdlib imports
# none required
# third-party imports
import streamlit as st
from ui.sidebar import render_sidebar
from ui.main_columns import render_main_columns

def render_main_ui(
    asr_backends,
    tts_backends,
    load_asr_backend,
    load_tts_backend,
    record_audio,
    stop_and_save_audio,
    read_uploaded_text,
):
    # set up streamlit page config and inject custom css
    st.set_page_config(
        page_title="vigilant-lamp",
        layout="wide",
        page_icon="🎛️",
    )
    with open("ui/style.css") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

    # --- sidebar --- #
    asr_model_choice, tts_engine_choice = render_sidebar(asr_backends, tts_backends)

    # --- backend loading --- #
    try:
        asr_backend = load_asr_backend(asr_model_choice)
    except NotImplementedError:
        st.warning(f"⚠️ support for {asr_backends[asr_model_choice][0]} is coming soon. please choose another model.")
        return
    try:
        tts_backend = load_tts_backend(tts_engine_choice)
    except NotImplementedError:
        st.warning(f"⚠️ support for {tts_backends[tts_engine_choice][0]} is coming soon. please choose another engine.")
        return

    # --- main columns --- #
    render_main_columns(
        asr_backend,
        tts_backend,
        asr_backends,
        tts_backends,
        asr_model_choice,
        tts_engine_choice,
        record_audio,
        stop_and_save_audio,
        read_uploaded_text,
    )
