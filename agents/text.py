
import re
from pathlib import Path
from collections import Counter
from typing import List, Tuple, Dict, Any, Optional
import json
import os
import pypdf
from langdetect import detect
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Download NLTK data quietly at import time
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)


# Profile a text file or PDF: count chars, words, average word length,
# detect language, find top tokens and boilerplate ratio.
def profile_text(path: str) -> Dict[str, Any]:
    text = ""
    if path.lower().endswith(".pdf"):
        # Read all pages from PDF
        reader = pypdf.PdfReader(path)
        pages = [pg.extract_text() or "" for pg in reader.pages]
        text = "\n".join(pages)
        lines = [l for pg in pages for l in pg.splitlines()]
    else:
        # Read plain text file
        text = Path(path).read_text(encoding="utf-8")
        lines = text.splitlines()

    # Basic stats
    chars = len(text)
    words = re.findall(r"\w+", text)
    n_words = len(words)
    avg_word_len = sum(len(w) for w in words) / n_words if n_words else 0.0
    # Detect language on the first 10k chars
    lang = detect(text[:10_000]) if n_words else "unknown"
    # Top 10 most common tokens
    freq = Counter(w.lower() for w in words).most_common(10)
    # Boilerplate ratio: lines repeated more than once
    repeats = [c for c in Counter(lines).values() if c > 1]
    boilerplate_ratio = sum(repeats) / len(lines) if lines else 0.0

    return {
        "chars": chars,
        "words": n_words,
        "avg_word_len": avg_word_len,
        "language": lang,
        "top_tokens": freq,
        "boilerplate_ratio": boilerplate_ratio
    }


# Prompt template for planning text cleaning operations.
_PLAN_PROMPT = """You are a text-cleaning planner. Return JSON ONLY. NO MARKDOWN.
{"ops":[...],"notes":"..."}"""


# Flatten any LLM response content into a single string.
def _flatten_resp(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(
            (p.get("text") or p.get("content") or "") if isinstance(p, dict) else str(p)
            for p in content
        )
    return str(content)


# Ask Gemini to propose a sequence of text-cleaning operations given the profile.
def llm_make_text_plan(profile: dict, user_goal: str = "prepare for NLP") -> dict:
    try:
        import requests

        # Load API key from repo .env (not ideal for sharing)
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('GOOGLE_API_KEY='):
                    api_key = line.split('=', 1)[1].strip()
                    break

        url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}'
        # Build prompt with profile and goal
        prompt = f"{_PLAN_PROMPT}\n\n{json.dumps({'profile': profile, 'user_goal': user_goal})}"
        payload = {'contents': [{'parts': [{'text': prompt}]}]}

        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            txt = result['candidates'][0]['content']['parts'][0]['text']
        else:
            raise Exception(f"API Error: {response.text}")

    except Exception as e:
        # Fallback to a basic two-step plan if AI fails
        print(f"AI API Error: {e}")
        txt = '{"ops": [{"op": "lowercase"}, {"op": "remove_punctuation"}], "notes": "Basic text cleaning (AI unavailable)"}'

    # Extract JSON blob from response text
    j = txt[txt.find("{"):txt.rfind("}")+1] if "{" in txt else "{}"
    try:
        plan = json.loads(j)
    except:
        plan = {"ops": [], "notes": "invalid JSON from LLM"}
    # Ensure both keys exist
    plan.setdefault("ops", [])
    plan.setdefault("notes", "")

    return plan


# Remove lines that appear more than once (boilerplate) from raw text.
def remove_boilerplate(text: str) -> str:
    lines = text.splitlines()
    counts = Counter(lines)
    return "\n".join([l for l in lines if counts[l] == 1])


# Apply each cleaning operation in the plan to the text.
def apply_text_plan(text: str, plan: dict) -> Tuple[str, List[dict]]:
    log: List[dict] = []
    tokens: Optional[List[str]] = None

    for step in plan.get("ops", []):
        op = step.get("op")
        try:
            if op == "remove_boilerplate":
                text = remove_boilerplate(text)

            elif op == "lowercase":
                text = text.lower()

            elif op == "remove_punctuation":
                text = re.sub(r"[^\w\s]", " ", text)

            elif op == "remove_stopwords":
                lang = step.get("language", "en")
                sw = set(stopwords.words(lang))
                tokens = tokens or text.split()
                tokens = [w for w in tokens if w.lower() not in sw]
                text = " ".join(tokens)

            elif op == "normalize_whitespace":
                text = re.sub(r"\s+", " ", text).strip()

            elif op == "tokenize":
                tokens = text.split()

            elif op == "lemmatize":
                if tokens is None:
                    tokens = text.split()
                lem = WordNetLemmatizer()
                tokens = [lem.lemmatize(w) for w in tokens]
                text = " ".join(tokens)

            else:
                log.append({"op": op, "status": "skip", "reason": "unknown op"})
                continue

            log.append({"op": op, "status": "ok"})
        except Exception as e:
            log.append({"op": op, "status": "error", "error": str(e)})

    return text, log


# Load raw text, either from PDF or plain text file.
def load_raw_text(path: str) -> str:
    if path.lower().endswith(".pdf"):
        reader = pypdf.PdfReader(path)
        return "".join(pg.extract_text() or "" for pg in reader.pages)
    return Path(path).read_text(encoding="utf-8")


# Orchestrate profiling, planning, cleaning, and return results.
def run_text_data_logic(
    file_path: str,
    user_goal: str = "prepare for NLP"
) -> Tuple[Dict[str, Any], str, str]:
    prof = profile_text(file_path)
    plan = llm_make_text_plan(prof, user_goal)
    raw = load_raw_text(file_path)
    cleaned, log = apply_text_plan(raw, plan)
    preview = cleaned[:500]  # first 500 chars for preview
    summary = f"Applied {len(plan['ops'])} ops; final length {len(cleaned)} chars."
    return (
        {"profile": prof, "plan": plan, "execution_log": log, "cleaned_preview": preview},
        summary,
        cleaned
    )
