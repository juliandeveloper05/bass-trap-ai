import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.audio_engine import BassExtractor

router = APIRouter()

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".flac", ".ogg"}
MAX_FILE_SIZE_MB = 100

@router.post("/process")
async def process(audio_file: UploadFile = File(...)):
    # --- Validate file extension ---
    ext = os.path.splitext(audio_file.filename)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Allowed: {ALLOWED_EXTENSIONS}")

    # --- Safe, unique filename to prevent path traversal ---
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    os.makedirs("temp", exist_ok=True)
    file_path = os.path.join("temp", safe_filename)

    # --- Read and validate file size ---
    content = await audio_file.read()
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large. Max size: {MAX_FILE_SIZE_MB}MB.")

    with open(file_path, "wb") as f:
        f.write(content)

    engine = BassExtractor(file_path)
    try:
        bpm, midi = engine.process_pipeline()
        return {"bpm": bpm, "midi_b64": midi, "filename": audio_file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    finally:
        # Guaranteed cleanup regardless of success or failure
        engine.cleanup()
