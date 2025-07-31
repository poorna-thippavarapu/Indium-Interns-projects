# agents/text.py
import re
from pathlib import Path
from collections import Counter
from typing import List, Tuple, Dict, Any, Optional
import json

import pypdf
from langdetect import detect
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# (Helper functions are unchanged)
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)

def profile_text(path: str) -> Dict[str, Any]:
    text = ""
    if path.lower().endswith(".pdf"):
        reader = pypdf.PdfReader(path)
        pages = [pg.extract_text() or "" for pg in reader.pages]
        text = "\n".join(pages)
        lines = [l for pg in pages for l in pg.splitlines()]
    else:
        text = Path(path).read_text(encoding="utf-8")
        lines = text.splitlines()
    chars = len(text)
    words = re.findall(r"\w+", text)
    n_words = len(words)
    avg_word_len = sum(len(w) for w in words) / n_words if n_words else 0.0
    lang = detect(text[:10_000]) if n_words else "unknown"
    freq = Counter(w.lower() for w in words).most_common(10)
    repeated = [c for c in Counter(lines).values() if c > 1]
    boilerplate_ratio = sum(repeated) / len(lines) if lines else 0.0
    return {"chars": chars, "words": n_words, "avg_word_len": avg_word_len, "language": lang, "top_tokens": freq, "boilerplate_ratio": boilerplate_ratio}

_PLAN_PROMPT = """You are a text-cleaning planner. Return JSON ONLY. NO MARKDOWN.
{"ops":[...],"notes":"..."}"""

def _flatten_resp(content: Any) -> str:
    if isinstance(content, str): return content
    if isinstance(content, list):
        return "\n".join((p.get("text") or p.get("content") or "") if isinstance(p, dict) else str(p) for p in content)
    return str(content)

def llm_make_text_plan(profile: dict, user_goal: str = "prepare for NLP") -> dict:
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.0)
    resp = llm.invoke([
        SystemMessage(content=_PLAN_PROMPT),
        HumanMessage(content=json.dumps({"profile": profile, "user_goal": user_goal}))
    ])
    txt = _flatten_resp(resp.content)
    j = txt[txt.find("{"):txt.rfind("}")+1] if "{" in txt else "{}"
    try:
        plan = json.loads(j)
    except:
        plan = {"ops": [], "notes": "invalid JSON from LLM"}
    plan.setdefault("ops", [])
    plan.setdefault("notes", "")
    return plan

def remove_boilerplate(text: str) -> str:
    lines = text.splitlines()
    counts = Counter(lines)
    return "\n".join([l for l in lines if counts[l] == 1])

def apply_text_plan(text: str, plan: dict) -> Tuple[str, List[dict]]:
    log: List[dict] = []
    tokens: Optional[List[str]] = None
    for step in plan.get("ops", []):
        op = step.get("op")
        try:
            if op == "remove_boilerplate": text = remove_boilerplate(text)
            elif op == "lowercase": text = text.lower()
            elif op == "remove_punctuation": text = re.sub(r"[^\w\s]", " ", text)
            elif op == "remove_stopwords":
                lang = step.get("language", "en")
                sw = set(stopwords.words(lang))
                tokens = tokens or text.split()
                tokens = [w for w in tokens if w.lower() not in sw]
                text = " ".join(tokens)
            elif op == "normalize_whitespace": text = re.sub(r"\s+", " ", text).strip()
            elif op == "tokenize": tokens = text.split()
            elif op == "lemmatize":
                if tokens is None: tokens = text.split()
                lem = WordNetLemmatizer()
                tokens = [lem.lemmatize(w) for w in tokens]
                text = " ".join(tokens)
            else:
                log.append({"op": op, "status": "skip", "reason": "unknown op"}); continue
            log.append({"op": op, "status": "ok"})
        except Exception as e:
            log.append({"op": op, "status": "error", "error": str(e)})
    return text, log

def load_raw_text(path: str) -> str:
    if path.lower().endswith(".pdf"):
        reader = pypdf.PdfReader(path)
        return "".join(pg.extract_text() or "" for pg in reader.pages)
    return Path(path).read_text(encoding="utf-8")

def run_text_data_logic(file_path: str, user_goal: str = "prepare for NLP") -> Tuple[Dict[str, Any], str, str]:
    prof = profile_text(file_path)
    plan = llm_make_text_plan(prof, user_goal)
    raw = load_raw_text(file_path)
    cleaned, log = apply_text_plan(raw, plan)
    preview = cleaned[:500]
    summary = f"Applied {len(plan['ops'])} ops; final length {len(cleaned)} chars."
    return ({"profile": prof, "plan": plan, "execution_log": log, "cleaned_preview": preview}, summary, cleaned)