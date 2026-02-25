import os
import uuid
import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse

from services.audio_engine import BassExtractor
from services import job_store

router = APIRouter()

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".flac", ".ogg"}
MAX_FILE_SIZE_MB = 100


def _run_pipeline(file_path: str, job_id: str, original_filename: str) -> None:
    """
    Blocking pipeline call.
    Runs inside a thread via asyncio.to_thread() so the event loop
    stays free to respond to health checks during long Demucs jobs.
    Pushes progress events to the job store.
    """
    engine = BassExtractor(file_path)
    try:
        bpm, midi_b64 = engine.process_pipeline(
            progress_callback=lambda pct, msg: job_store.push_event(job_id, pct, msg)
        )
        job_store.store_result(job_id, {
            "bpm": bpm,
            "midi_b64": midi_b64,
            "filename": original_filename,
        })
    except Exception as e:
        error_msg = f"Processing failed: {str(e)}"
        job_store.store_error(job_id, error_msg)
        job_store.push_event(job_id, -1, f"❌ {error_msg}")
    finally:
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
    job_id = uuid.uuid4().hex
    safe_filename = f"{job_id}{ext}"
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

    # ── Create job queue and launch background task ──────────────────────────
    job_store.create_job(job_id)
    asyncio.create_task(
        asyncio.to_thread(_run_pipeline, file_path, job_id, audio_file.filename)
    )

    return {"job_id": job_id}


@router.get("/progress/{job_id}")
async def stream_progress(job_id: str):
    """SSE endpoint — streams real progress events from the pipeline."""
    return StreamingResponse(
        job_store.iter_events(job_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # critical for nginx/reverse proxies
        },
    )


@router.get("/result/{job_id}")
async def get_result(job_id: str):
    """Fetch the final result after the pipeline completes."""
    error = job_store.get_error(job_id)
    if error:
        job_store.remove_job(job_id)
        raise HTTPException(status_code=500, detail=error)

    result = job_store.get_result(job_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Result not ready or job not found")

    job_store.remove_job(job_id)
    return result