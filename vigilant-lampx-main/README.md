RAG Bot with STT/TTS functionaltiy 

For STT we are using WhisperX and for TTS we are using gTTS for now.
Backends for whisper, faster-whisper, coqui* are kept in stt/tts
folders in case we have to implement that. 

*To implement coqui, make sure you integrate choice of speakers with
InputBar.js otherwise it will end up using the default voice, i.e. ED
from the dataset. 

Second phase of the project

Most of the files of this project are forked from vigilant-lamp.
https://github.com/quarktetra23/vigilant-lamp 


