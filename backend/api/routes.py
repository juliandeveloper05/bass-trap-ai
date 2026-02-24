import os
import uuid
import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException

# audio_engine lives in services/ sub-package
from services.audio_engine import BassExtractor

router = APIRouter()

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".flac", ".ogg"}
MAX_FILE_SIZE_MB = 100


def _run_pipeline(file_path: str) -> dict:
    """
    Blocking pipeline call.
    Runs inside a thread via asyncio.to_thread() so the event loop
    stays free to respond to health checks during long Demucs jobs.
    """
    engine = BassExtractor(file_path)
    try:
        bpm, midi_b64 = engine.process_pipeline()
        return {"bpm": bpm, "midi_b64": midi_b64}
    finally:
        # Guaranteed cleanup whether pipeline succeeds or raises
        engine.cleanup()


@router.post("/process")
async def process(audio_file: UploadFile = File(...)):
    # ── Validate extension ───────────────────────────────────────────────────
    ext = os.path.splitext(audio_file.filename)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: '{ext}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}"
        )

    # ── Safe, collision-proof filename (prevents path-traversal attacks) ─────
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    os.makedirs("temp", exist_ok=True)
    file_path = os.path.join("temp", safe_filename)

    # ── Read and enforce size cap before touching disk ───────────────────────
    content = await audio_file.read()
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {MAX_FILE_SIZE_MB}MB."
        )

    with open(file_path, "wb") as f:
        f.write(content)

    try:
        result = await asyncio.to_thread(_run_pipeline, file_path)
        result["filename"] = audio_file.filename
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")