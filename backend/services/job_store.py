# backend/services/job_store.py
"""
In-memory job registry using asyncio.Queue per job.
Each pipeline step pushes progress events; the SSE endpoint reads them.
"""
import asyncio
import json
from typing import AsyncGenerator

# { job_id: asyncio.Queue }
_queues: dict[str, asyncio.Queue] = {}

# { job_id: dict }  — stores final result once pipeline completes
_results: dict[str, dict] = {}

# { job_id: str }  — stores error message if pipeline fails
_errors: dict[str, str] = {}


def create_job(job_id: str) -> None:
    """Create a new event queue for the given job."""
    _queues[job_id] = asyncio.Queue()


def push_event(job_id: str, progress: int, message: str) -> None:
    """
    Push a progress event into the job's queue.
    Called from a worker thread, so we must be thread-safe.
    asyncio.Queue is NOT thread-safe — use call_soon_threadsafe.
    """
    q = _queues.get(job_id)
    if q is None:
        return
    try:
        loop = asyncio.get_event_loop()
        loop.call_soon_threadsafe(q.put_nowait, {"progress": progress, "message": message})
    except RuntimeError:
        # If there's no running loop (shouldn't happen), silently skip
        pass


def store_result(job_id: str, result: dict) -> None:
    """Store the final pipeline result for later retrieval."""
    _results[job_id] = result


def store_error(job_id: str, error_msg: str) -> None:
    """Store the error message if the pipeline fails."""
    _errors[job_id] = error_msg


def get_result(job_id: str) -> dict | None:
    """Retrieve the final result (or None if not ready)."""
    return _results.get(job_id)


def get_error(job_id: str) -> str | None:
    """Retrieve the error message (or None)."""
    return _errors.get(job_id)


def remove_job(job_id: str) -> None:
    """Clean up all data for a finished job."""
    _queues.pop(job_id, None)
    _results.pop(job_id, None)
    _errors.pop(job_id, None)


async def iter_events(job_id: str) -> AsyncGenerator[str, None]:
    """
    Async generator that yields SSE-formatted strings.
    Blocks on the queue until progress reaches 100 or an error event is sent.
    """
    q = _queues.get(job_id)
    if q is None:
        # Job doesn't exist — send a single error event
        payload = json.dumps({"progress": 0, "message": "Job not found"})
        yield f"data: {payload}\n\n"
        return

    while True:
        try:
            event = await asyncio.wait_for(q.get(), timeout=300)  # 5 min timeout
        except asyncio.TimeoutError:
            payload = json.dumps({"progress": 0, "message": "Job timed out"})
            yield f"data: {payload}\n\n"
            return

        payload = json.dumps(event)
        yield f"data: {payload}\n\n"

        if event.get("progress", 0) >= 100:
            return
