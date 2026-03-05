from __future__ import annotations

from fastapi import APIRouter

from scheduler.scheduler import get_scheduler_status

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/jobs")
def get_jobs() -> dict:
    return get_scheduler_status()

