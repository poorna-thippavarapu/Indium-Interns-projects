# agents/visual.py
import os
import io
import uuid
import json
from typing import Any, Dict, List, Tuple

import numpy as np
import cv2

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from langchain_core.output_parsers import JsonOutputParser # Keep for potential future use if needed
from tensorflow.keras.preprocessing.image import ImageDataGenerator

def profile_image(path_or_buffer: Any) -> Dict[str, Any]:
    file_size = 0
    img = None
    if isinstance(path_or_buffer, str):
        file_size = os.path.getsize(path_or_buffer)
        img = cv2.imread(path_or_buffer)
    elif isinstance(path_or_buffer, io.BytesIO):
        file_bytes = np.asarray(bytearray(path_or_buffer.read()), dtype=np.uint8)
        file_size = len(file_bytes)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        path_or_buffer.seek(0)
    if img is None: raise ValueError("Could not read the image.")
    h, w = img.shape[:2]
    stats = {"width": w, "height": h, "aspect_ratio": round(w / h, 3) if h > 0 else 0, "file_size_bytes": file_size}
    if img.ndim == 3:
        mean, std  = cv2.meanStdDev(img)
        stats["mean_pixel"] = [float(round(x, 2)) for x in mean.flatten()]
        stats["std_pixel"]  = [float(round(x, 2)) for x in std.flatten()]
    else:
        stats["mean_pixel"] = [float(round(img.mean(), 2))]
        stats["std_pixel"]  = [float(round(img.std(), 2))]
    return stats

def _flatten_resp(content: Any) -> str:
    if isinstance(content, str): return content
    if isinstance(content, list):
        return "\n".join((p.get("text") or p.get("content") or "") if isinstance(p, dict) else str(p) for p in content)
    return str(content)

def llm_make_visual_plan(profile: dict, user_goal: str="prepare for ML") -> Dict[str, Any]:
    """Generates a visual plan using Gemini."""
    prompt = """You are an expert image preprocessing planner. Return a JSON object with "ops" and "notes" keys. NO MARKDOWN."""
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.0)
    resp = llm.invoke([
        HumanMessage(content=prompt),
        HumanMessage(content=json.dumps({"profile": profile, "user_goal": user_goal}))
    ])
    txt = _flatten_resp(resp.content)
    j = txt[txt.find("{"):txt.rfind("}")+1] if "{" in txt else "{}"
    try:
        plan = json.loads(j)
    except:
        plan = {"ops": [], "notes": "invalid JSON"}
    return plan

def llm_explain_step(step: Dict[str, Any], profile: dict, user_goal: str) -> str:
    """Ask Gemini to provide a critical and educational explanation for a step."""
    prompt = f"""
    You are a critical but fair AI data science instructor. Your user is a beginner experimenting
    with an image preprocessing step. Your goal is to provide a balanced and educational explanation.
    **Context:**
    - User's Ultimate Goal: {user_goal}
    - Image Profile: {json.dumps(profile)}
    - The Step and Parameters they chose: {json.dumps(step)}
    **Your Task:**
    Provide a brief, critical explanation. Praise good choices but also clearly point out
    potential downsides, trade-offs, or better alternatives based on the user's goal.
    Structure your response with these three points:
    1.  **What It Does:** Simply explain the operation.
    2.  **Critical Consideration:** Analyze their specific parameter choice.
    3.  **ML Impact:** Explain how this choice could help or hinder a future machine learning model.
    """
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.2)
    resp = llm.invoke(prompt)
    return _flatten_resp(resp.content)

def op_resize(img: np.ndarray, width: int, height: int, interp: str="INTER_AREA") -> np.ndarray:
    method = getattr(cv2, interp, cv2.INTER_AREA)
    return cv2.resize(img, (width, height), interpolation=method)
def op_denoise(img: np.ndarray, method: str="gaussian", ksize: int=5) -> np.ndarray:
    if method == "gaussian": return cv2.GaussianBlur(img, (ksize, ksize), 0)
    if method == "median": return cv2.medianBlur(img, ksize)
    if method == "bilateral": return cv2.bilateralFilter(img, d=ksize, sigmaColor=ksize*2, sigmaSpace=ksize*2)
    return img
def op_normalize(img: np.ndarray, method: str="minmax") -> np.ndarray:
    f = img.astype("float32")
    if method == "minmax":
        mn, mx = f.min(), f.max()
        return ((f - mn) / (mx - mn if mx > mn else 1) * 255).clip(0,255).astype("uint8")
    if method == "zscore":
        m, sd = f.mean(), f.std()
        norm = (f - m) / (sd if sd else 1)
        nm = ((norm - norm.min()) / (norm.max() - norm.min() if norm.max() > norm.min() else 1) * 255)
        return nm.clip(0,255).astype("uint8")
    return img
def op_augment(img: np.ndarray, aug_args: Dict[str, Any]) -> np.ndarray:
    datagen = ImageDataGenerator(**aug_args)
    batch = img.astype("float32")[None]
    aug = next(datagen.flow(batch, batch_size=1))
    return aug[0].astype("uint8")
def apply_visual_plan(path: str, plan: Dict[str, Any], out_dir: str) -> Tuple[str, List[Dict[str, Any]]]:
    os.makedirs(out_dir, exist_ok=True)
    img = cv2.imread(path)
    if img is None: return "", [{"op": "load", "status": "error", "error": "Could not read image"}]
    logs: List[Dict[str, Any]] = []
    final_fn = ""
    for step in plan.get("ops", []):
        op = step.get("op", "")
        try:
            if op == "resize": img = op_resize(img, step["width"], step["height"], step.get("interp","INTER_AREA"))
            elif op == "denoise": img = op_denoise(img, step.get("method","gaussian"), step.get("ksize",5))
            elif op == "normalize": img = op_normalize(img, step.get("method","minmax"))
            elif op == "augment": img = op_augment(img, {k:v for k,v in step.items() if k!="op"})
            else:
                logs.append({"op":op, "status":"skip", "reason":"unknown"}); continue
            fn = f"{uuid.uuid4().hex}_{op}.png"
            fp = os.path.join(out_dir, fn)
            cv2.imwrite(fp, img)
            final_fn = fn
            logs.append({"op":op, "status":"ok", "output":fn})
        except Exception as e:
            logs.append({"op":op, "status":"error", "error":str(e)})
    return final_fn, logs
def run_visual_data_logic(file_path: str, user_goal: str="prepare for ML", out_dir: str="cleaned_uploads") -> Tuple[Dict[str, Any], str]:
    prof = profile_image(file_path)
    plan_dict = llm_make_visual_plan(prof, user_goal)
    expls  = [ llm_explain_step(s, prof, user_goal) for s in plan_dict.get("ops", []) ]
    fn, log = apply_visual_plan(file_path, plan_dict, out_dir)
    summary = f"Applied {len(log)} ops; final image = {fn}"
    return {"profile": prof, "plan": plan_dict, "explanations": expls, "execution_log": log, "preprocessed_image": fn}, summary
def process_for_preview(img_bytes: bytes, plan: Dict[str, Any]) -> bytes:
    img_np = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(img_np, cv2.IMREAD_COLOR)
    if img is None: raise ValueError("Could not decode image from bytes for preview.")
    h, w = img.shape[:2]
    for s in plan.get("ops", []):
        opn = s.get("op")
        if opn == "resize":
            img = cv2.resize(img, (s["width"], s["height"]), interpolation=getattr(cv2, s.get("interp", "INTER_AREA")))
            h, w = img.shape[:2]
        elif opn == "denoise":
            ksize = s.get("ksize", 5)
            if ksize % 2 == 0: ksize += 1
            if ksize < 1: ksize = 1
            if s["method"] == "gaussian": img = cv2.GaussianBlur(img, (ksize,)*2, 0)
            elif s["method"] == "median": img = cv2.medianBlur(img, ksize)
            else: img = cv2.bilateralFilter(img, ksize, ksize*2, ksize*2)
        elif opn == "normalize":
            f = img.astype("float32")
            if s["method"] == "minmax":
                mn, mx = f.min(), f.max()
                img = ((f - mn)/(mx - mn if mx > mn else 1)*255).clip(0,255).astype("uint8")
            else:
                m, sd = f.mean(), f.std()
                norm = (f - m)/(sd or 1)
                img = (((norm - norm.min())/(norm.max()-norm.min() if norm.max() > norm.min() else 1)*255)).clip(0,255).astype("uint8")
        elif opn == "augment":
            if s.get("rotation", 0) != 0:
                M = cv2.getRotationMatrix2D((w/2, h/2), s["rotation"], 1)
                img = cv2.warpAffine(img, M, (w, h))
            if s.get("zoom", 1.0) != 1.0:
                if s["zoom"] > 0:
                    img = cv2.resize(img, None, fx=s["zoom"], fy=s["zoom"], interpolation=cv2.INTER_LINEAR)
                    h, w = img.shape[:2]
            if s.get("h_shift", 0) != 0 or s.get("v_shift", 0) != 0:
                M = np.float32([[1, 0, s['h_shift']*w], [0, 1, s['v_shift']*h]])
                img = cv2.warpAffine(img, M, (w, h))
            if s.get("h_flip"): img = cv2.flip(img, 1)
            if s.get("v_flip"): img = cv2.flip(img, 0)
    _, buffer = cv2.imencode('.png', img)
    return buffer.tobytes()