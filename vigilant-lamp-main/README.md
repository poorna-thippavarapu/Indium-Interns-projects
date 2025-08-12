# Vigilant-Lamp — Offline Speech ↔ Text Assistant

Vigilant-Lamp is a **fully-offline speech interface** built with [OpenAI Whisper](https://github.com/openai/whisper) for Speech-to-Text (STT) and [Coqui TTS](https://github.com/coqui-ai/TTS) for Text-to-Speech (TTS). The end product is hosted with Streamlit. It runs **locally without any external APIs or internet access** once the models are downloaded locally. 

> **Heads-up** – The models are large and _first-time inference_ can take a while (especially on CPU-only machines). Subsequent runs will be faster due to caching. 

<p align="center">
  <img src="https://github.com/user-attachments/assets/435128c0-f5c7-48e4-bb96-6a141e92448f" alt="Screenshot 2025-06-22 at 20 40 30">
</p>

---

## Features

| Feature | Details |
|---------|---------|
| **API-Free** | No API keys, no rate-limits, no vendor lock-in – everything runs on the local machine. |
| **Independent Models** | Uses Whisper’s *base* model for STT and Coqui TTS VITS models for multi-speaker English synthesis. |
| **Downloadable Outputs** | Export transcriptions as `.txt` and synthesized speech as `.wav`. |

---

## Directory Structure

## Installation (For Running it on Streamlit)

```bash
# 1. Clone
$ git clone https://github.com/quarktetra23/vigilant-lamp.git
$ cd vigilant-lamp-main

# 2. Recommnded to create isolated env (Python 3.10) give that there a lot of different version of dependencies
$ python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 3. Install **exact** versions
$ pip install -r requirements.txt
(additionalyy install ffmpeg from brew for whisperX, not installable via pip unless you use pyffmpeg, a python wrapper but at your own risk)

# 4. Run the app
$ streamlit run app.py
```

> **Do not** upgrade any dependency, unless you know what you are doing – Whisper (STT) and Coqui TTS have conflicting version dependency requirements. By conflicting I mean Coqui TTS does not work with the very latest Python and Numpy versions. For exact dependency version, I have created requirements.txt . You will need to change your Python Interpreter to a **3.10.x**.

---

## Requirements

* `Software` : Python **3.10.x** (tested)
* `requirements.txt`: see file for exact versions and compatibility notes.

---

