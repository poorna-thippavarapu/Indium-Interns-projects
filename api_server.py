import os
import uuid
import json
import zipfile
import io
from typing import List
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load .env at startup so API keys and configs are available
load_dotenv()

# Bring in our data-processing agents
from agents.structured import run_structured_data_logic
from agents.text import run_text_data_logic
from agents.visual import (
    profile_image,
    llm_make_visual_plan,
    apply_visual_plan,
    process_for_preview,
    llm_explain_step,
)

# Create FastAPI app
app = FastAPI()

# --- CORS setup: allow local Vite dev server ports for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[f"http://localhost:{p}" for p in range(5173, 5182)],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure our temp and output dirs exist
os.makedirs("temp_uploads", exist_ok=True)
os.makedirs("cleaned_uploads", exist_ok=True)


@app.post("/generate-plan")
async def generate_plan_endpoint(
    file: UploadFile = File(...),
    user_goal: str = Form(...)
):
    """
    1. Save the uploaded file to temp_uploads.
    2. Detect its type (CSV, text, image).
    3. Run the appropriate 'run_*_logic' to get profile & plan.
    4. Return JSON with profile, plan, and a preview/log.
    """
    tmp_path = os.path.join("temp_uploads", f"{uuid.uuid4()}_{file.filename}")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""

    # Write upload to disk
    with open(tmp_path, "wb") as f:
        f.write(await file.read())

    try:
        if ext == "csv":
            # Structured data path
            processed, _, profile = run_structured_data_logic(tmp_path, user_goal=user_goal)
            return JSONResponse({
                "profile": profile,
                "plan": processed.get("plan", {}),
                "data_type": "csv",
                "execution_log": processed.get("execution_log", []),
                "cleaned_preview": processed.get("cleaned_preview", {})
            })

        elif ext in ("txt", "md", "pdf"):
            # Text data path
            processed, _, _ = run_text_data_logic(tmp_path, user_goal=user_goal)
            return JSONResponse({
                "profile": processed.get("profile", {}),
                "plan": processed.get("plan", {}),
                "data_type": "text",
                "execution_log": processed.get("execution_log", []),
                "cleaned_preview": processed.get("cleaned_preview", "")
            })

        elif ext in ("png", "jpg", "jpeg"):
            # Image data path: profile & plan only, no execution yet
            prof = profile_image(tmp_path)
            plan = llm_make_visual_plan(prof, user_goal)
            return JSONResponse({
                "profile": prof,
                "plan": plan,
                "data_type": "image"
            })

        else:
            # Unsupported file types
            raise HTTPException(status_code=400, detail="Unsupported file type")

    finally:
        # Clean up the temp file no matter what
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.post("/apply-plan")
async def apply_plan_endpoint(
    files: List[UploadFile] = File(...),
    plan: str = Form(...)
):
    """
    1. Parse user-provided JSON plan.
    2. Save all uploads to temp, apply the plan per file.
    3. Collect logs/previews and save outputs to cleaned_uploads/<batch_id>.
    4. Zip results and stream back to client.
    """
    plan_dict = json.loads(plan)
    batch_id = uuid.uuid4().hex
    out_dir = os.path.join("cleaned_uploads", batch_id)
    os.makedirs(out_dir, exist_ok=True)

    try:
        # Determine file type by first file’s extension
        first_file = files[0]
        ext = first_file.filename.rsplit(".", 1)[-1].lower() if "." in first_file.filename else ""

        if ext == "csv":
            # Batch CSV processing
            results = []
            from agents.structured import apply_tabular_plan
            import pandas as pd

            for f in files:
                tmp_path = os.path.join("temp_uploads", f"{uuid.uuid4()}_{f.filename}")
                with open(tmp_path, "wb") as fo:
                    fo.write(await f.read())

                df, log = apply_tabular_plan(tmp_path, plan_dict)
                out_path = os.path.join(out_dir, f"processed_{f.filename}")
                df.to_csv(out_path, index=False)

                results.append({
                    "filename": f.filename,
                    "execution_log": log,
                    "preview": df.head(10).to_dict("records"),
                    "shape": df.shape
                })
                os.remove(tmp_path)

            # Zip all processed CSVs for download
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
                for root, _, csv_files in os.walk(out_dir):
                    for csv_file in csv_files:
                        zf.write(os.path.join(root, csv_file), csv_file)
            zip_buffer.seek(0)
            return StreamingResponse(
                zip_buffer,
                media_type="application/zip",
                headers={"Content-Disposition": f"attachment; filename=processed_csv_{batch_id}.zip"}
            )

        elif ext in ("txt", "md", "pdf"):
            # Batch text processing
            results = []
            from agents.text import load_raw_text, apply_text_plan

            for f in files:
                tmp_path = os.path.join("temp_uploads", f"{uuid.uuid4()}_{f.filename}")
                with open(tmp_path, "wb") as fo:
                    fo.write(await f.read())

                raw_text = load_raw_text(tmp_path)
                cleaned_text, log = apply_text_plan(raw_text, plan_dict)
                out_path = os.path.join(out_dir, f"processed_{f.filename}")
                with open(out_path, "w", encoding="utf-8") as out_f:
                    out_f.write(cleaned_text)

                results.append({
                    "filename": f.filename,
                    "execution_log": log,
                    "preview": cleaned_text[:1000],
                    "original_length": len(raw_text),
                    "cleaned_length": len(cleaned_text)
                })
                os.remove(tmp_path)

            # Zip all processed text files
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
                for root, _, text_files in os.walk(out_dir):
                    for text_file in text_files:
                        zf.write(os.path.join(root, text_file), text_file)
            zip_buffer.seek(0)
            return StreamingResponse(
                zip_buffer,
                media_type="application/zip",
                headers={"Content-Disposition": f"attachment; filename=processed_text_{batch_id}.zip"}
            )

        else:
            # Assume image batch if not CSV or text
            for f in files:
                tmp_path = os.path.join("temp_uploads", f"{uuid.uuid4()}_{f.filename}")
                with open(tmp_path, "wb") as fo:
                    fo.write(await f.read())

                # Apply image plan, saving variants to out_dir
                apply_visual_plan(tmp_path, plan_dict, out_dir=out_dir)
                os.remove(tmp_path)

            # Zip all processed images
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
                for root, _, image_files in os.walk(out_dir):
                    for image_file in image_files:
                        zf.write(os.path.join(root, image_file), image_file)
            zip_buffer.seek(0)
            return StreamingResponse(
                zip_buffer,
                media_type="application/zip",
                headers={"Content-Disposition": f"attachment; filename=processed_images_{batch_id}.zip"}
            )

    except Exception as e:
        # Surface any unexpected errors as HTTP 500
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/preview-image")
async def preview_image_endpoint(
    file: UploadFile = File(...),
    plan: str = Form(...)
):
    """
    For frontend previews: take raw bytes + plan JSON,
    apply deterministic transforms in-memory, return PNG bytes.
    """
    try:
        plan_dict = json.loads(plan)
        image_bytes = await file.read()
        processed_bytes = process_for_preview(image_bytes, plan_dict)
        return Response(content=processed_bytes, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/explain-step")
async def explain_step_endpoint(
    step: str = Form(...),
    profile: str = Form(...),
    user_goal: str = Form(...)
):
    """
    AI learning mode: given one step, the image profile, and goal,
    return a human-readable explanation of that step.
    """
    try:
        step_dict = json.loads(step)
        profile_dict = json.loads(profile)
        explanation = llm_explain_step(step_dict, profile_dict, user_goal)
        return JSONResponse({"explanation": explanation})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    # Run with `python main_app.py` for local dev
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
