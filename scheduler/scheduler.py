from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from scheduler.job_registry import get_job_definitions
from scheduler.pipeline_runner import JOB_LOG_FILE, log_job_execution

LOGGER = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def _wrap_job(job_id: str, func):
    def _runner():
        try:
            result = func()
            log_job_execution(job_id, "success", details={"result": result})
        except Exception as error:
            log_job_execution(job_id, "failed", error=str(error))
            LOGGER.exception("Scheduled job '%s' failed", job_id)

    return _runner


def start_scheduler() -> BackgroundScheduler:
    global _scheduler
    if _scheduler and _scheduler.running:
        return _scheduler

    scheduler = BackgroundScheduler(timezone="UTC")
    for job in get_job_definitions():
        if job.trigger != "interval":
            raise ValueError(f"Unsupported trigger type: {job.trigger}")
        scheduler.add_job(
            _wrap_job(job.job_id, job.func),
            trigger=IntervalTrigger(**job.trigger_args),
            id=job.job_id,
            name=job.name,
            replace_existing=True,
            coalesce=True,
            max_instances=1,
            misfire_grace_time=300,
        )

    scheduler.start()
    _scheduler = scheduler
    log_job_execution("scheduler", "success", details={"event": "started"})
    return scheduler


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        log_job_execution("scheduler", "success", details={"event": "stopped"})
    _scheduler = None


def _read_last_runs(limit: int = 50) -> list[dict[str, Any]]:
    if not JOB_LOG_FILE.exists():
        return []
    lines = JOB_LOG_FILE.read_text(encoding="utf-8").splitlines()
    recent = lines[-limit:]
    entries: list[dict[str, Any]] = []
    for line in recent:
        try:
            entries.append(json.loads(line))
        except Exception:
            continue
    return list(reversed(entries))


def get_scheduler_status() -> dict[str, Any]:
    active_jobs: list[dict[str, Any]] = []
    if _scheduler and _scheduler.running:
        for job in _scheduler.get_jobs():
            active_jobs.append(
                {
                    "id": job.id,
                    "name": job.name,
                    "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
                    "trigger": str(job.trigger),
                }
            )

    return {
        "active_jobs": active_jobs,
        "last_runs": _read_last_runs(),
    }

