# backend/services/job_store.py
"""
In-memory job registry using asyncio.Queue per job.
Each pipeline step pushes progress events; the SSE endpoint reads them.

IMPORTANT: push_event() is called from a worker thread (asyncio.to_thread).
We capture the running event loop at job creation time (on the async main thread)
and reuse it in push_event() via loop.call_soon_threadsafe() — the only
thread-safe way to schedule work on an asyncio loop from another thread.
"""
import asyncio
import json
from typing import AsyncGenerator

# { job_id: asyncio.Queue }
_queues: dict[str, asyncio.Queue] = {}

# { job_id: asyncio.AbstractEventLoop }
_loops: dict[str, asyncio.AbstractEventLoop] = {}

# { job_id: dict }  — stores final result once pipeline completes
_results: dict[str, dict] = {}

# { job_id: str }  — stores error message if pipeline fails
_errors: dict[str, str] = {}


def create_job(job_id: str) -> None:
    """
    Create a new event queue for the given job.
    Must be called from the async event loop thread so we can capture
    the running loop for later use by push_event().
    """
    _queues[job_id] = asyncio.Queue()
    _loops[job_id] = asyncio.get_running_loop()  # ✅ safe here — we're on the main async thread


def push_event(job_id: str, progress: int, message: str) -> None:
    """
    Push a progress event into the job's queue.
    Called from a worker thread via asyncio.to_thread(), so we MUST use
    loop.call_soon_threadsafe() with the loop captured at create_job() time.
    """
    q = _queues.get(job_id)
    loop = _loops.get(job_id)
    if q is None or loop is None:
        return
    loop.call_soon_threadsafe(q.put_nowait, {"progress": progress, "message": message})


def store_result(job_id: str, result: dict) -> None:
    """Store the final pipeline result for later retrieval."""
    _results[job_id] = result


def store_error(job_id: str, error_msg: str) -> None:
    """Store the error message if the pipeline fails."""
    _errors[job_id] = error_msg


def get_result(job_id: str) -> dict | None:
    return _results.get(job_id)


def get_error(job_id: str) -> str | None:
    return _errors.get(job_id)


def remove_job(job_id: str) -> None:
    """Clean up all data for a finished job."""
    _queues.pop(job_id, None)
    _loops.pop(job_id, None)
    _results.pop(job_id, None)
    _errors.pop(job_id, None)


async def iter_events(job_id: str) -> AsyncGenerator[str, None]:
    """
    Async generator that yields SSE-formatted strings.
    Blocks on the queue until progress reaches 100 or an error event is sent.
    """
    q = _queues.get(job_id)
    if q is None:
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
