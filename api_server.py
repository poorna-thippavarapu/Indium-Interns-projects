import os
import uuid
import json
import zipfile
import io
from typing import List
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware

# Import all agent logic
from agents.structured import run_structured_data_logic
from agents.text import run_text_data_logic
from agents.visual import profile_image, llm_make_visual_plan, apply_visual_plan, process_for_preview

app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Default address for the Vite React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Setup Directories ---
os.makedirs("temp_uploads", exist_ok=True)
os.makedirs("cleaned_uploads", exist_ok=True)

@app.post("/generate-plan")
async def generate_plan_endpoint(file: UploadFile = File(...), user_goal: str = Form(...)):
    """Takes a file, profiles it, and returns an initial LLM plan."""
    tmp_path = os.path.join("temp_uploads", f"{uuid.uuid4()}_{file.filename}")
    ext = file.filename.rsplit(".", 1)[-1].lower() if '.' in file.filename else ""
    with open(tmp_path, "wb") as f: f.write(await file.read())
    
    try:
        if ext == "csv":
            processed, _, profile = run_structured_data_logic(tmp_path, user_goal=user_goal)
            return JSONResponse({"profile": profile, "plan": processed.get("plan", {})})
        elif ext in ("txt", "md", "pdf"):
            processed, _, _ = run_text_data_logic(tmp_path, user_goal=user_goal)
            return JSONResponse({"profile": processed.get("profile", {}), "plan": processed.get("plan", {})})
        elif ext in ("png", "jpg", "jpeg"):
            prof = profile_image(tmp_path)
            plan = llm_make_visual_plan(prof, user_goal)
            return JSONResponse({"profile": prof, "plan": plan})
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
    finally:
        if os.path.exists(tmp_path): os.remove(tmp_path)

@app.post("/apply-plan")
async def apply_plan_endpoint(files: List[UploadFile] = File(...), plan: str = Form(...)):
    """Applies a user-defined plan to a batch of image files and returns a zip file."""
    plan_dict = json.loads(plan)
    batch_id = uuid.uuid4().hex
    out_dir = os.path.join("cleaned_uploads", batch_id)
    os.makedirs(out_dir, exist_ok=True)
    try:
        for f in files:
            tmp_path = os.path.join("temp_uploads", f"{uuid.uuid4()}_{f.filename}")
            with open(tmp_path, "wb") as fo: fo.write(await f.read())
            apply_visual_plan(tmp_path, plan_dict, out_dir=out_dir)
            os.remove(tmp_path)
        
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, _, image_files in os.walk(out_dir):
                for image_file in image_files:
                    zf.write(os.path.join(root, image_file), image_file)
        zip_buffer.seek(0)
        return StreamingResponse(
            zip_buffer, media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename=processed_{batch_id}.zip"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/preview-image")
async def preview_image_endpoint(
    file: UploadFile = File(...),
    plan: str = Form(...)
):
    """Takes a single image and a plan, returns the processed image for preview."""
    try:
        plan_dict = json.loads(plan)
        image_bytes = await file.read()
        processed_bytes = process_for_preview(image_bytes, plan_dict)
        return Response(content=processed_bytes, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)