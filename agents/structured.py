import pandas as pd
import numpy as np
import json
from typing import Dict, Any, List, Tuple, Optional

import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

# (Helper functions like profile_tabular, _cast, etc. are unchanged)
def profile_tabular(path: str, sample_rows: int = 5000) -> Dict[str, Any]:
    try:
        df = pd.read_csv(path, nrows=sample_rows)
    except Exception as e:
        return {"error": str(e), "rows_sampled": 0, "columns": {}, "null_row_pct_overall": None}
    prof = {
        "rows_sampled": len(df),
        "null_row_pct_overall": float(df.isna().any(axis=1).mean()),
        "columns": {}
    }
    for c in df.columns:
        s = df[c]
        prof["columns"][c] = {
            "dtype": str(s.dtype), "null_pct": float(s.isna().mean()),
            "nunique": int(s.nunique(dropna=True)),
            "stats": ({"min": float(s.min()), "max": float(s.max()), "mean": float(s.mean())}
                      if pd.api.types.is_numeric_dtype(s) else {}),
            "sample": [str(v) for v in s.dropna().unique()[:5]]
        }
    return prof

_PLAN_PROMPT = """You are a data-cleaning planner. Return JSON ONLY. NO MARKDOWN.
{"ops":[...],"notes":"..."}"""

def _flatten_resp(x: Any) -> str:
    if isinstance(x, str): return x
    if isinstance(x, list): return "\n".join([p.get("text", p.get("content", "")) if isinstance(p, dict) else str(p) for p in x])
    return str(x)

def llm_make_tabular_plan(profile: dict, user_goal: str="prepare ML") -> dict:
    try:
        import requests
        import os
        # Load API key directly from .env file to avoid caching issues
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('GOOGLE_API_KEY='):
                    api_key = line.split('=', 1)[1].strip()
                    break
        
        url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}'
        prompt = f"{_PLAN_PROMPT}\n\n{json.dumps({'user_goal': user_goal, 'profile': profile})}"
        payload = {'contents': [{'parts': [{'text': prompt}]}]}
        
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            txt = result['candidates'][0]['content']['parts'][0]['text']
        else:
            raise Exception(f"API Error: {response.text}")
    except Exception as e:
        print(f"AI API Error: {e}")
        # Fallback mock response for structured data
        txt = '{"ops": [{"op": "drop_cols", "cols": []}, {"op": "impute", "col": "numeric_column", "strategy": "median"}], "notes": "Basic cleaning plan (AI unavailable)"}'
    j = txt[txt.find("{"):txt.rfind("}")+1] if "{" in txt else "{}"
    try:
        plan = json.loads(j)
    except:
        plan = {"ops": [], "notes": "invalid JSON"}
    plan.setdefault("ops", []); plan.setdefault("notes", "")
    return plan

# (Rest of the file is unchanged)
def _cast(s: pd.Series, to: str) -> pd.Series:
    to = to.lower()
    if to=="float": return pd.to_numeric(s,errors="coerce")
    if to=="int":   return pd.to_numeric(s,errors="coerce").astype("Int64")
    if to=="bool":  return s.astype(str).str.lower().isin(["1","true","y","yes"])
    if to=="datetime": return pd.to_datetime(s,errors="coerce")
    return s.astype("string")
def _scale(s: pd.Series, m: str) -> pd.Series:
    x = pd.to_numeric(s,errors="coerce").astype(float)
    m = m.lower()
    if m=="minmax":
        mn,mx = x.min(),x.max(); rng=mx-mn
        return ((x-mn)/rng).fillna(0) if rng else x.fillna(0)
    if m=="log1p":
        mn=x.min(); x = x-mn+1 if mn<0 else x
        return np.log1p(x)
    mu,sd = x.mean(),x.std(ddof=0)
    return ((x-mu)/sd).fillna(0) if sd else x.fillna(0)
def _bounds(s: pd.Series, method: str, k: float) -> Tuple[float,float]:
    arr = pd.to_numeric(s,errors="coerce").dropna().astype(float)
    if method=="iqr":
        q1,q3 = np.percentile(arr,[25,75]); iqr=q3-q1
        return q1-k*iqr, q3+k*iqr
    m,sd = arr.mean(),arr.std(ddof=0)
    return m-k*sd, m+k*sd
def apply_tabular_plan(path: str, plan: dict, out_path: Optional[str]=None) -> Tuple[pd.DataFrame,List[dict]]:
    df = pd.read_csv(path); log=[]
    for step in plan.get("ops",[]):
        op = step.get("op")
        try:
            if op=="drop_cols":
                cols=[c for c in step["cols"] if c in df]; df=df.drop(columns=cols)
                log.append({"op":op,"cols":cols,"status":"ok"})
            elif op=="cast":
                c, t = step["col"], step.get("to","string")
                if c in df: df[c]=_cast(df[c],t); log.append({"op":op,"col":c,"to":t,"status":"ok"})
            elif op=="impute":
                c,stp=step["col"],step.get("strategy","median")
                if c in df:
                    val = {"median":df[c].median(),"mean":df[c].mean()}.get(stp, step.get("value",0))
                    df[c]=df[c].fillna(val); log.append({"op":op,"col":c,"strategy":stp,"value":val,"status":"ok"})
            elif op=="trim_whitespace":
                cols=[c for c in step["cols"] if c in df]
                for c in cols: df[c]=df[c].astype("string").str.strip()
                log.append({"op":op,"cols":cols,"status":"ok"})
            elif op=="parse_dates":
                c=step["col"]
                if c in df: df[c]=pd.to_datetime(df[c],errors="coerce"); log.append({"op":op,"col":c,"status":"ok"})
            elif op=="scale":
                cols=[c for c in step["cols"] if c in df]
                m=step.get("method","standard"); ip=step.get("inplace",False); suf=step.get("suffix","_scaled")
                new=[]
                for c in cols:
                    sc=_scale(df[c],m)
                    if ip: df[c]=sc; new.append(c)
                    else: df[c+ suf]=sc; new.append(c+ suf)
                log.append({"op":op,"cols":cols,"method":m,"inplace":ip,"new_cols":new,"status":"ok"})
            elif op=="outliers":
                cols=[c for c in step["cols"] if c in df]
                m=step.get("method","zscore"); k=float(step.get("threshold",3)); act=step.get("action","cap"); suf=step.get("suffix","_outlier")
                for c in cols:
                    lo,hi=_bounds(df[c],m,k)
                    mask=df[c].notna()&((df[c]<lo)|(df[c]>hi)); n=int(mask.sum())
                    if act=="cap": df.loc[df[c]<lo,c]=lo; df.loc[df[c]>hi,c]=hi
                    elif act=="remove": df=df.loc[~mask]
                    else: df[c+ suf]=mask
                    log.append({"op":op,"col":c,"action":act,"num_outliers":n,"lower":lo,"upper":hi,"status":"ok"})
        except Exception as e:
            log.append({"op":op,"status":"error","error":str(e)})
    if out_path: df.to_csv(out_path,index=False)
    return df, log
def run_structured_data_logic(
    path: str, user_goal: str="prepare for ML", out_path: Optional[str]=None,
) -> Tuple[dict,str,dict]:
    prof = profile_tabular(path)
    plan=llm_make_tabular_plan(prof,user_goal)
    df, log=apply_tabular_plan(path,plan,out_path)
    summary=f"Applied {len(plan['ops'])} ops. Rows:{len(df)}. Cols:{df.shape[1]}."
    processed = {"cleaned_preview":df.head(5).to_dict("list"),"plan":plan,"execution_log":log}
    return processed,summary,prof