import pandas as pd
import numpy as np
import json
from typing import Dict, Any, List, Tuple, Optional

import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

# Profile a CSV by sampling up to `sample_rows`: report row count, overall null-row %
# and per-column stats (dtype, null%, unique count, numeric stats, sample values).
def profile_tabular(path: str, sample_rows: int = 5000) -> Dict[str, Any]:
    try:
        df = pd.read_csv(path, nrows=sample_rows)
    except Exception as e:
        # If reading fails, return an error payload
        return {
            "error": str(e),
            "rows_sampled": 0,
            "columns": {},
            "null_row_pct_overall": None
        }

    prof = {
        "rows_sampled": len(df),
        "null_row_pct_overall": float(df.isna().any(axis=1).mean()),
        "columns": {}
    }

    # Collect per-column metrics
    for c in df.columns:
        s = df[c]
        prof["columns"][c] = {
            "dtype": str(s.dtype),
            "null_pct": float(s.isna().mean()),
            "nunique": int(s.nunique(dropna=True)),
            # Numeric stats only if column is numeric
            "stats": (
                {"min": float(s.min()), "max": float(s.max()), "mean": float(s.mean())}
                if pd.api.types.is_numeric_dtype(s) else {}
            ),
            # Take up to 5 unique sample values (as strings)
            "sample": [str(v) for v in s.dropna().unique()[:5]]
        }
    return prof


# Prompt template for structured-data cleaning planner
_PLAN_PROMPT = """You are a data-cleaning planner. Return JSON ONLY. NO MARKDOWN.
{"ops":[...],"notes":"..."}"""


# Flatten any LLM response content into a single string
def _flatten_resp(x: Any) -> str:
    if isinstance(x, str):
        return x
    if isinstance(x, list):
        return "\n".join(
            [p.get("text", p.get("content", "")) if isinstance(p, dict) else str(p)
             for p in x]
        )
    return str(x)


# Ask Gemini to propose a tabular cleaning plan, fallback to a basic plan on error
def llm_make_tabular_plan(profile: dict, user_goal: str="prepare ML") -> dict:
    try:
        import requests

        # Load API key from .env at repo root
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('GOOGLE_API_KEY='):
                    api_key = line.split('=', 1)[1].strip()
                    break

        url = (
            'https://generativelanguage.googleapis.com/v1beta/'
            f'models/gemini-1.5-flash-latest:generateContent?key={api_key}'
        )
        prompt = f"{_PLAN_PROMPT}\n\n{json.dumps({'user_goal': user_goal, 'profile': profile})}"
        payload = {'contents': [{'parts': [{'text': prompt}]}]}

        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            txt = result['candidates'][0]['content']['parts'][0]['text']
        else:
            raise Exception(f"API Error: {response.text}")

    except Exception as e:
        # Log and fall back to a simple drop/impute plan
        print(f"AI API Error: {e}")
        txt = (
            '{"ops": ['
            '{"op": "drop_cols", "cols": []}, '
            '{"op": "impute", "col": "numeric_column", "strategy": "median"}'
            '], "notes": "Basic cleaning plan (AI unavailable)"}'
        )

    # Extract JSON blob and parse
    j = txt[txt.find("{"):txt.rfind("}")+1] if "{" in txt else "{}"
    try:
        plan = json.loads(j)
    except:
        plan = {"ops": [], "notes": "invalid JSON"}

    # Ensure keys exist
    plan.setdefault("ops", [])
    plan.setdefault("notes", "")
    return plan


# Cast a pandas Series to a target type, coercing errors
def _cast(s: pd.Series, to: str) -> pd.Series:
    to = to.lower()
    if to == "float":
        return pd.to_numeric(s, errors="coerce")
    if to == "int":
        return pd.to_numeric(s, errors="coerce").astype("Int64")
    if to == "bool":
        return s.astype(str).str.lower().isin(["1", "true", "y", "yes"])
    if to == "datetime":
        return pd.to_datetime(s, errors="coerce")
    return s.astype("string")


# Scale numeric Series based on method
def _scale(s: pd.Series, m: str) -> pd.Series:
    x = pd.to_numeric(s, errors="coerce").astype(float)
    m = m.lower()
    if m == "minmax":
        mn, mx = x.min(), x.max()
        rng = mx - mn
        return ((x - mn) / rng).fillna(0) if rng else x.fillna(0)
    if m == "log1p":
        mn = x.min()
        x = x - mn + 1 if mn < 0 else x
        return np.log1p(x)
    # Standard z-score scaling
    mu, sd = x.mean(), x.std(ddof=0)
    return ((x - mu) / sd).fillna(0) if sd else x.fillna(0)


# Compute bounds for outlier detection using IQR or z-score
def _bounds(s: pd.Series, method: str, k: float) -> Tuple[float, float]:
    arr = pd.to_numeric(s, errors="coerce").dropna().astype(float)
    if method == "iqr":
        q1, q3 = np.percentile(arr, [25, 75])
        iqr = q3 - q1
        return q1 - k * iqr, q3 + k * iqr
    # z-score method
    m, sd = arr.mean(), arr.std(ddof=0)
    return m - k * sd, m + k * sd


# Apply the cleaning plan: drop, cast, impute, trim, parse dates, scale, handle outliers.
def apply_tabular_plan(
    path: str,
    plan: dict,
    out_path: Optional[str] = None
) -> Tuple[pd.DataFrame, List[dict]]:
    df = pd.read_csv(path)
    log = []

    for step in plan.get("ops", []):
        op = step.get("op")
        try:
            if op == "drop_cols":
                cols = [c for c in step["cols"] if c in df]
                df = df.drop(columns=cols)
                log.append({"op": op, "cols": cols, "status": "ok"})

            elif op == "cast":
                c, t = step["col"], step.get("to", "string")
                if c in df:
                    df[c] = _cast(df[c], t)
                    log.append({"op": op, "col": c, "to": t, "status": "ok"})

            elif op == "impute":
                c, strategy = step["col"], step.get("strategy", "median")
                if c in df:
                    val = {
                        "median": df[c].median(),
                        "mean": df[c].mean()
                    }.get(strategy, step.get("value", 0))
                    df[c] = df[c].fillna(val)
                    log.append({
                        "op": op, "col": c,
                        "strategy": strategy, "value": val,
                        "status": "ok"
                    })

            elif op == "trim_whitespace":
                cols = [c for c in step["cols"] if c in df]
                for c in cols:
                    df[c] = df[c].astype("string").str.strip()
                log.append({"op": op, "cols": cols, "status": "ok"})

            elif op == "parse_dates":
                c = step["col"]
                if c in df:
                    df[c] = pd.to_datetime(df[c], errors="coerce")
                    log.append({"op": op, "col": c, "status": "ok"})

            elif op == "scale":
                cols = [c for c in step["cols"] if c in df]
                method = step.get("method", "standard")
                inplace = step.get("inplace", False)
                suffix = step.get("suffix", "_scaled")
                new_cols = []
                for c in cols:
                    scaled = _scale(df[c], method)
                    if inplace:
                        df[c] = scaled
                        new_cols.append(c)
                    else:
                        df[c + suffix] = scaled
                        new_cols.append(c + suffix)
                log.append({
                    "op": op, "cols": cols,
                    "method": method, "inplace": inplace,
                    "new_cols": new_cols, "status": "ok"
                })

            elif op == "outliers":
                cols = [c for c in step["cols"] if c in df]
                method = step.get("method", "zscore")
                k = float(step.get("threshold", 3))
                action = step.get("action", "cap")
                suffix = step.get("suffix", "_outlier")

                for c in cols:
                    lo, hi = _bounds(df[c], method, k)
                    mask = df[c].notna() & ((df[c] < lo) | (df[c] > hi))
                    n = int(mask.sum())

                    if action == "cap":
                        df.loc[df[c] < lo, c] = lo
                        df.loc[df[c] > hi, c] = hi
                    elif action == "remove":
                        df = df.loc[~mask]
                    else:
                        df[c + suffix] = mask

                    log.append({
                        "op": op, "col": c,
                        "action": action, "num_outliers": n,
                        "lower": lo, "upper": hi,
                        "status": "ok"
                    })

            else:
                log.append({"op": op, "status": "skip", "reason": "unknown"})
                continue

        except Exception as e:
            log.append({"op": op, "status": "error", "error": str(e)})

    # If requested, write the cleaned DataFrame back to CSV
    if out_path:
        df.to_csv(out_path, index=False)

    return df, log


# High-level orchestration: profile, plan, apply, and summarize.
def run_structured_data_logic(
    path: str,
    user_goal: str = "prepare for ML",
    out_path: Optional[str] = None,
) -> Tuple[dict, str, dict]:
    prof = profile_tabular(path)
    plan = llm_make_tabular_plan(prof, user_goal)
    df, log = apply_tabular_plan(path, plan, out_path)
    summary = f"Applied {len(plan['ops'])} ops. Rows: {len(df)}. Cols: {df.shape[1]}."
    processed = {
        "cleaned_preview": df.head(5).to_dict("list"),
        "plan": plan,
        "execution_log": log
    }
    return processed, summary, prof
