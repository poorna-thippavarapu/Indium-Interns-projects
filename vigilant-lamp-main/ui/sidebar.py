import streamlit as st

def render_sidebar(asr_backends, tts_backends):
    st.sidebar.markdown('<div style="display:flex;align-items:center;justify-content:space-between;font-weight:bold;font-size:1.2rem;margin-bottom:0.5rem;">'
                        'Choice of STT/TTS Model'
                        '</div>', unsafe_allow_html=True)
    st.sidebar.markdown("---")
    st.sidebar.markdown("### model selection")
    asr_model_choice = st.sidebar.selectbox(
        "choose stt model",
        options=list(asr_backends.keys()),
        format_func=lambda k: asr_backends[k][0],
        index=list(asr_backends.keys()).index("whisper")
    )
    tts_engine_choice = st.sidebar.selectbox(
        "choose tts engine",
        options=list(tts_backends.keys()),
        format_func=lambda k: tts_backends[k][0],
        index=list(tts_backends.keys()).index("coqui_tts")
    )
    return asr_model_choice, tts_engine_choice
