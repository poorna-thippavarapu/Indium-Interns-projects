
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

# Get basic stats about the image—size, dimensions, aspect ratio, and pixel stats.
# Works with file paths or in-memory bytes.
def profile_image(path_or_buffer: Any) -> Dict[str, Any]:
    file_size = 0
    img = None

    # Handle disk path vs. BytesIO
    if isinstance(path_or_buffer, str):
        file_size = os.path.getsize(path_or_buffer)  # file size in bytes
        img = cv2.imread(path_or_buffer)              # load with OpenCV
    elif isinstance(path_or_buffer, io.BytesIO):
        # read all bytes, decode to OpenCV image
        file_bytes = np.asarray(bytearray(path_or_buffer.read()), dtype=np.uint8)
        file_size = len(file_bytes)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        path_or_buffer.seek(0)  # rewind buffer
    # If nothing loaded, bail out
    if img is None:
        raise ValueError("Could not read the image.")

    h, w = img.shape[:2]
    stats = {
        "width": w,
        "height": h,
        "aspect_ratio": round(w / h, 3) if h > 0 else 0,
        "file_size_bytes": file_size
    }

    # If color image, compute per-channel mean/std
    if img.ndim == 3:
        mean, std = cv2.meanStdDev(img)
        stats["mean_pixel"] = [float(round(x, 2)) for x in mean.flatten()]
        stats["std_pixel"]  = [float(round(x, 2)) for x in std.flatten()]
    else:
        # grayscale fallback
        stats["mean_pixel"] = [float(round(img.mean(), 2))]
        stats["std_pixel"]  = [float(round(img.std(), 2))]
    return stats

# Ask Gemini to plan preprocessing steps given your image stats and goal.
def llm_make_visual_plan(profile: dict,
                         user_goal: str="prepare for ML",
                         dataset_info: dict=None) -> Dict[str, Any]:
    """Generates a visual plan using Gemini."""
    try:
        import requests
        import os
        # Load API key from .env at repo root (not ideal for shareable code)
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('GOOGLE_API_KEY='):
                    api_key = line.split('=', 1)[1].strip()
                    break

        url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}'
        dataset_context = f"\nDataset Context: {json.dumps(dataset_info)}" if dataset_info else ""

        # Craft the prompt—tell the LLM exactly what ops you support and what you want back.
        prompt = f"""You are an expert image preprocessing planner. Analyze the image profile, dataset context, and user goal to create an optimal preprocessing plan.

Image Profile: {json.dumps(profile)}
User Goal: {user_goal}{dataset_context}

Available preprocessing operations:
- Resize: Standardize dimensions (e.g., {{"op": "resize", "width": 224, "height": 224}})
- Denoise: Reduce noise (e.g., {{"op": "denoise", "method": "gaussian|median|bilateral", "ksize": 5}})
- Normalize: Scale pixel values (e.g., {{"op": "normalize", "method": "minmax|zscore"}})
- Augment: Data transformation with two approaches:
  * Deterministic: Precise, consistent transforms ({{"op": "augment", "mode": "deterministic", "rotation": 15, "zoom": 1.1, "h_flip": true}})
  * ML Training: Random variations ({{"op": "augment", "mode": "ml_training", "rotation_range": 30, "zoom_range": 0.2, "horizontal_flip": true, "num_variants": 8}})

For ML training augmentation, recommend 1-20 variants for effectiveness.

Return only valid JSON with:
- "ops": list of ops
- "reasoning": why you chose them
- "notes": brief strategy

NO MARKDOWN. ONLY JSON."""
        headers = {'Content-Type': 'application/json'}
        payload = {'contents': [{'parts': [{'text': prompt}]}]}

        response = requests.post(url, json=payload, headers=headers, timeout=30)
        if response.status_code == 200:
            result = response.json()
            txt = result['candidates'][0]['content']['parts'][0]['text']
        else:
            raise Exception(f"API Error: {response.text}")

    except Exception as e:
        # Fallback plans if LLM fails
        keyword_check = any(k in user_goal.lower() for k in ['train', 'dataset', 'augment', 'ml model', 'variety'])
        if keyword_check:
            # moderate ML-training fallback
            txt = '{"ops":[{"op":"resize","width":224,"height":224},' \
                  '{"op":"augment","mode":"ml_training","rotation_range":15,"zoom_range":0.1,' \
                  '"horizontal_flip":true,"num_variants":6},{"op":"normalize","method":"minmax"}],' \
                  '"reasoning":"AI unavailable; standard ML-training pipeline with 6 aug variants.",' \
                  '"notes":"ML training preprocessing (AI unavailable)"}'
        else:
            # basic deterministic fallback
            txt = '{"ops":[{"op":"resize","width":224,"height":224},' \
                  '{"op":"normalize","method":"minmax"}],' \
                  '"reasoning":"AI unavailable; basic 224x224 resize + minmax normalize.",' \
                  '"notes":"Basic image preprocessing (AI unavailable)"}'

    # Extract JSON blob—quick and dirty
    j = txt[txt.find("{"):txt.rfind("}")+1] if "{" in txt else "{}"
    try:
        plan = json.loads(j)
    except:
        # Final safety net
        plan = {"ops": [], "reasoning": "Failed to parse AI response", "notes": "invalid JSON"}
    return plan

# Explain a specific step to the user or fallback to canned text.
def llm_explain_step(step: Dict[str, Any], profile: dict, user_goal: str) -> str:
    """Critical, educational explanation for one preprocessing step."""
    try:
        import requests
        # load key again—ugh, duplicate logic
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('GOOGLE_API_KEY='):
                    api_key = line.split('=', 1)[1].strip()
                    break

        url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}'
        prompt = f"""
You are a fair AI instructor. Context:
- Goal: {user_goal}
- Image Profile: {json.dumps(profile)}
- Step: {json.dumps(step)}
Task: 1) What it does 2) Critical consideration 3) ML impact."""
        payload = {'contents': [{'parts': [{'text': prompt}]}]}
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            return result['candidates'][0]['content']['parts'][0]['text']
        else:
            raise Exception(f"API Error: {response.text}")

    except Exception:
        # fallback explanations for common ops
        op = step.get('op', 'unknown')
        if op == 'resize':
            return f"Resize to {step.get('width',224)}x{step.get('height',224)} to standardize input size."
        if op == 'denoise':
            return f"Denoise ({step.get('method','gaussian')}) reduces noise for cleaner input."
        if op == 'normalize':
            return f"Normalize ({step.get('method','minmax')}) scales pixels for stable training."
        if op == 'augment':
            if step.get('mode') == 'ml_training':
                return (f"ML augment: {step.get('num_variants',6)} random variants "
                        f"(rot±{step.get('rotation_range',0)}°, zoom±{step.get('zoom_range',0)}) "
                        "to boost model robustness.")
            return "Augment applies fixed transforms to preview results deterministically."
        return f"No explanation available for op: {op}"

# Each op implementation. Notice we unify names and add fallback methods.
def op_resize(img: np.ndarray, width: int, height: int, interp: str="INTER_AREA") -> np.ndarray:
    # Choose interpolation by name, default to INTER_AREA
    method = getattr(cv2, interp, cv2.INTER_AREA)
    return cv2.resize(img, (width, height), interpolation=method)

def op_denoise(img: np.ndarray, method: str="gaussian", ksize: int=5) -> np.ndarray:
    # Support multiple denoise filters
    if method == "gaussian":
        return cv2.GaussianBlur(img, (ksize, ksize), 0)
    if method == "median":
        return cv2.medianBlur(img, ksize)
    if method == "bilateral":
        return cv2.bilateralFilter(img, d=ksize, sigmaColor=ksize*2, sigmaSpace=ksize*2)
    return img  # unknown method—no change

def op_normalize(img: np.ndarray, method: str="minmax") -> np.ndarray:
    f = img.astype("float32")
    if method == "minmax":
        mn, mx = f.min(), f.max()
        scale = (mx - mn) if mx > mn else 1
        return ((f - mn) / scale * 255).clip(0,255).astype("uint8")
    if method == "zscore":
        m, sd = f.mean(), f.std()
        sd = sd if sd > 0 else 1
        norm = (f - m) / sd
        return norm.astype("float32")  # preserve floats for ML
    return img

# Wrapper that picks deterministic vs ML training augment
def op_augment(img: np.ndarray, aug_args: Dict[str, Any]) -> List[Tuple[np.ndarray, str]]:
    """
    Returns list of (augmented_image, description) tuples.
    Deterministic: exact transforms.
    ML Training: random batches.
    """
    if aug_args.get("mode") == "ml_training":
        return op_augment_ml_training(img, aug_args)
    return [(op_augment_deterministic(img, aug_args), "deterministic")]

def op_augment_deterministic(img: np.ndarray, aug_args: Dict[str, Any]) -> np.ndarray:
    # Fixed transforms so preview == actual output
    h, w = img.shape[:2]
    # Rotation
    rot = aug_args.get("rotation", 0)
    if rot:
        M = cv2.getRotationMatrix2D((w/2, h/2), rot, 1)
        img = cv2.warpAffine(img, M, (w, h))
    # Zoom
    zoom = aug_args.get("zoom", 1.0)
    if zoom > 0 and zoom != 1.0:
        img = cv2.resize(img, None, fx=zoom, fy=zoom, interpolation=cv2.INTER_LINEAR)
        h, w = img.shape[:2]
    # Shifts
    h_shift, v_shift = aug_args.get("h_shift", 0), aug_args.get("v_shift", 0)
    if h_shift or v_shift:
        M = np.float32([[1, 0, h_shift*w], [0, 1, v_shift*h]])
        img = cv2.warpAffine(img, M, (w, h))
    # Flips
    if aug_args.get("h_flip"):
        img = cv2.flip(img, 1)
    if aug_args.get("v_flip"):
        img = cv2.flip(img, 0)
    return img

def op_augment_ml_training(img: np.ndarray, aug_args: Dict[str, Any]) -> List[Tuple[np.ndarray, str]]:
    """
    Random augmentations using ImageDataGenerator.
    Converts BGR→RGB, scales if needed, then creates variants.
    """
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    params = {}
    # Map front-end args to datagen params
    for key in ["rotation_range", "zoom_range", "width_shift_range", "height_shift_range", "shear_range", "brightness_range"]:
        if aug_args.get(key):
            params[key] = aug_args[key]
    for flip in ["horizontal_flip", "vertical_flip"]:
        if aug_args.get(flip):
            params[flip] = True
    params["fill_mode"] = aug_args.get("fill_mode", "nearest")

    if not params:
        return [(img, "original")]

    datagen = ImageDataGenerator(**params)
    # Ensure data in 0–255 uint8
    img_for_datagen = img_rgb.copy().astype("uint8")
    batch = img_for_datagen.astype("float32")[None]

    variants = []
    for i in range(aug_args.get("num_variants", 6)):
        try:
            aug = next(datagen.flow(batch, batch_size=1))[0].astype("uint8")
            bgr = cv2.cvtColor(aug, cv2.COLOR_RGB2BGR)
            desc = f"ml_aug_{i+1}"
            variants.append((bgr, desc))
        except:
            continue
    return variants or [(img, "original")]

# Execute the plan: save images or .npy for floats, log each step.
def apply_visual_plan(path: str, plan: Dict[str, Any], out_dir: str) -> Tuple[str, List[Dict[str, Any]]]:
    os.makedirs(out_dir, exist_ok=True)
    img = cv2.imread(path)
    if img is None:
        return "", [{"op": "load", "status": "error", "error": "Could not read image"}]
    logs, final_fn = [], ""
    for step in plan.get("ops", []):
        op = step.get("op", "")
        try:
            if op == "resize":
                img = op_resize(img, step["width"], step["height"], step.get("interp","INTER_AREA"))
            elif op == "denoise":
                img = op_denoise(img, step.get("method","gaussian"), step.get("ksize",5))
            elif op == "normalize":
                img = op_normalize(img, step.get("method","minmax"))
            elif op == "augment":
                aug_params = {k:v for k,v in step.items() if k!="op"}
                results = op_augment(img, aug_params)
                for aug_img, desc in results:
                    fn = f"{uuid.uuid4().hex}_{desc}.png"
                    cv2.imwrite(os.path.join(out_dir, fn), aug_img)
                    logs.append({"op":f"{op}_{desc}", "status":"ok", "output":fn})
                    final_fn = fn
                img = results[-1][0]  # continue with last variant
                continue
            else:
                logs.append({"op":op, "status":"skip", "reason":"unknown"})
                continue

            # Save result file
            if op == "normalize" and step.get("method") == "zscore":
                fn = f"{uuid.uuid4().hex}_normalize_zscore.npy"
                np.save(os.path.join(out_dir, fn), img)
            else:
                fn = f"{uuid.uuid4().hex}_{op}.png"
                save_img = img.clip(0,255).astype("uint8") if img.dtype != np.uint8 else img
                cv2.imwrite(os.path.join(out_dir, fn), save_img)
            logs.append({"op":op, "status":"ok", "output":fn})
            final_fn = fn
        except Exception as e:
            logs.append({"op":op, "status":"error", "error":str(e)})
    return final_fn, logs

# Higher-level: run profiling, get plan, explanations, apply plan.
def run_visual_data_logic(file_path: str,
                          user_goal: str="prepare for ML",
                          out_dir: str="cleaned_uploads") -> Tuple[Dict[str, Any], str]:
    prof = profile_image(file_path)
    plan_dict = llm_make_visual_plan(prof, user_goal)
    expls = [llm_explain_step(s, prof, user_goal) for s in plan_dict.get("ops", [])]
    fn, log = apply_visual_plan(file_path, plan_dict, out_dir)
    summary = f"Applied {len(log)} ops; final image = {fn}"
    return {
        "profile": prof,
        "plan": plan_dict,
        "explanations": expls,
        "execution_log": log,
        "preprocessed_image": fn
    }, summary

# For quick frontend preview: apply plan in memory and return PNG bytes.
def process_for_preview(img_bytes: bytes, plan: Dict[str, Any]) -> bytes:
    try:
        img = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode image for preview.")
        for s in plan.get("ops", []):
            opn = s.get("op")
            try:
                if opn == "resize":
                    img = cv2.resize(img,
                                     (s.get("width",224), s.get("height",224)),
                                     interpolation=getattr(cv2, s.get("interp","INTER_AREA")))
                elif opn == "denoise":
                    k = s.get("ksize",5)
                    k = k+1 if k % 2 == 0 else max(1, k)  # ensure valid kernel
                    img = (cv2.GaussianBlur(img,(k,k),0) if s.get("method","gaussian")=="gaussian"
                           else cv2.medianBlur(img,k) if s.get("method")=="median"
                           else cv2.bilateralFilter(img,k,k*2,k*2))
                elif opn == "normalize":
                    f = img.astype("float32")
                    if s.get("method","minmax") == "minmax":
                        mn,mx = f.min(),f.max()
                        img = ((f-mn)/(mx-mn if mx>mn else 1)*255).clip(0,255).astype("uint8")
                    else:
                        norm = (f-f.mean())/(f.std() or 1)
                        img = (((norm-norm.min())/(norm.max()-norm.min() if norm.max()>norm.min() else 1)*255)).clip(0,255).astype("uint8")
                elif opn == "augment":
                    # reuse op_augment logic—just take first variant for preview
                    img = op_augment(img, {k:v for k,v in s.items() if k!="op"})[0][0]
            except:
                continue
        _, buf = cv2.imencode('.png', img)
        return buf.tobytes()
    except:
        # if preview fails, return original
        _, buf = cv2.imencode('.png', cv2.imdecode(np.frombuffer(img_bytes,np.uint8), cv2.IMREAD_COLOR))
        return buf.tobytes()