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
    try:
        import requests
        import os
        # Load API key directly from .env file
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
        with open(env_path, 'r') as f:
            for line in f:
                
                if line.startswith('GOOGLE_API_KEY='):
                    api_key = line.split('=', 1)[1].strip()
                    break
        
        url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}'
        prompt = f"""You are an expert image preprocessing planner. Analyze the image profile and user goal, then create a preprocessing plan.

Image Profile: {json.dumps(profile)}
User Goal: {user_goal}

Return a JSON object with these keys:
- "ops": Array of operations (resize, denoise, normalize, augment)
- "reasoning": Detailed explanation of why you chose these specific operations and parameters based on the image characteristics and user goal
- "notes": Brief summary of the preprocessing strategy

Example operations:
- {{"op": "resize", "width": 224, "height": 224}}
- {{"op": "denoise", "method": "gaussian", "ksize": 5}}
- {{"op": "normalize", "method": "minmax"}}
- {{"op": "augment", "rotation": 15, "zoom": 1.1, "h_flip": true}}

NO MARKDOWN. Return only valid JSON."""
        
        headers = {
            'Content-Type': 'application/json',
        }
        payload = {'contents': [{'parts': [{'text': prompt}]}]}
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        if response.status_code == 200:
            result = response.json()
            txt = result['candidates'][0]['content']['parts'][0]['text']
        else:
            raise Exception(f"API Error: {response.text}")
    except Exception as e:
        print(f"AI API Error: {e}")
        txt = '{"ops": [{"op": "resize", "width": 224, "height": 224}, {"op": "normalize", "method": "minmax"}], "reasoning": "AI service unavailable. Applied standard 224x224 resize which is commonly used for most machine learning models, especially image classification networks like ResNet, VGG, and others. Added min-max normalization to scale pixel values to 0-1 range for better model performance.", "notes": "Basic image preprocessing (AI unavailable)"}'
    j = txt[txt.find("{"):txt.rfind("}")+1] if "{" in txt else "{}"
    try:
        plan = json.loads(j)
    except:
        plan = {"ops": [], "reasoning": "Failed to parse AI response", "notes": "invalid JSON"}
    return plan

def llm_explain_step(step: Dict[str, Any], profile: dict, user_goal: str) -> str:
    """Ask Gemini to provide a critical and educational explanation for a step."""
    try:
        import requests
        # Load API key directly from .env file
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('GOOGLE_API_KEY='):
                    api_key = line.split('=', 1)[1].strip()
                    break
        
        url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}'
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
        payload = {'contents': [{'parts': [{'text': prompt}]}]}
        
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            return result['candidates'][0]['content']['parts'][0]['text']
        else:
            raise Exception(f"API Error: {response.text}")
    except Exception as e:
        print(f"AI API Error: {e}")
        # Provide basic explanations for common operations
        op = step.get('op', 'unknown')
        explanations = {
            'resize': f"Resize operation changes image dimensions to {step.get('width', 224)}x{step.get('height', 224)} pixels. This standardizes input size for machine learning models.",
            'denoise': f"Denoise operation using {step.get('method', 'gaussian')} method reduces image noise and artifacts, improving image quality for analysis.",
            'normalize': f"Normalize operation using {step.get('method', 'minmax')} method scales pixel values to a standard range, helping with model training stability.",
            'augment': "Augmentation operation applies transformations like rotation, scaling, and flipping to create variations of the image for data diversity."
        }
        return explanations.get(op, f"Step explanation unavailable (AI service error). Operation: {op}")

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
    try:
        img_np = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_np, cv2.IMREAD_COLOR)
        if img is None: 
            raise ValueError("Could not decode image from bytes for preview.")
        h, w = img.shape[:2]
        
        for s in plan.get("ops", []):
            try:
                opn = s.get("op")
                if opn == "resize":
                    width = s.get("width", 224)
                    height = s.get("height", 224)
                    img = cv2.resize(img, (width, height), interpolation=getattr(cv2, s.get("interp", "INTER_AREA")))
                    h, w = img.shape[:2]
                elif opn == "denoise":
                    ksize = s.get("ksize", 5)
                    if ksize % 2 == 0: ksize += 1
                    if ksize < 1: ksize = 1
                    method = s.get("method", "gaussian")
                    if method == "gaussian": 
                        img = cv2.GaussianBlur(img, (ksize, ksize), 0)
                    elif method == "median": 
                        img = cv2.medianBlur(img, ksize)
                    else: 
                        img = cv2.bilateralFilter(img, ksize, ksize*2, ksize*2)
                elif opn == "normalize":
                    f = img.astype("float32")
                    method = s.get("method", "minmax")
                    if method == "minmax":
                        mn, mx = f.min(), f.max()
                        img = ((f - mn)/(mx - mn if mx > mn else 1)*255).clip(0,255).astype("uint8")
                    else:
                        m, sd = f.mean(), f.std()
                        norm = (f - m)/(sd or 1)
                        img = (((norm - norm.min())/(norm.max()-norm.min() if norm.max() > norm.min() else 1)*255)).clip(0,255).astype("uint8")
                elif opn == "augment":
                    if s.get("rotation", 0) != 0:
                        M = cv2.getRotationMatrix2D((w/2, h/2), s.get("rotation", 0), 1)
                        img = cv2.warpAffine(img, M, (w, h))
                    zoom = s.get("zoom", 1.0)
                    if zoom != 1.0 and zoom > 0:
                        img = cv2.resize(img, None, fx=zoom, fy=zoom, interpolation=cv2.INTER_LINEAR)
                        h, w = img.shape[:2]
                    h_shift = s.get("h_shift", 0)
                    v_shift = s.get("v_shift", 0)
                    if h_shift != 0 or v_shift != 0:
                        M = np.float32([[1, 0, h_shift*w], [0, 1, v_shift*h]])
                        img = cv2.warpAffine(img, M, (w, h))
                    if s.get("h_flip"): 
                        img = cv2.flip(img, 1)
                    if s.get("v_flip"): 
                        img = cv2.flip(img, 0)
            except Exception as step_error:
                continue  # Skip this step and continue with others
                
        _, buffer = cv2.imencode('.png', img)
        return buffer.tobytes()
    except Exception as e:
        # Return the original image if processing fails
        _, buffer = cv2.imencode('.png', cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR))
        return buffer.tobytes()