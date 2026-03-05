from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from scheduler.pipeline_runner import DATASETS_DIR, REPORTS_DIR, log_job_execution, run_full_pipeline

LOGGER = logging.getLogger(__name__)


def _iter_dataset_files() -> list[Path]:
    if not DATASETS_DIR.exists():
        return []
    return sorted(
        [
            file
            for file in DATASETS_DIR.iterdir()
            if file.is_file() and file.suffix.lower() in {".csv", ".json", ".parquet"}
        ]
    )


def run_daily_analysis() -> dict[str, Any]:
    datasets = _iter_dataset_files()
    if not datasets:
        result = {
            "job": "daily_analysis",
            "status": "success",
            "message": "No datasets found",
            "processed_count": 0,
        }
        log_job_execution("daily_analysis", "success", details=result)
        return result

    processed_count = 0
    failures: list[dict[str, str]] = []
    for dataset in datasets:
        try:
            run_full_pipeline(dataset)
            processed_count += 1
        except Exception as error:
            failures.append({"dataset": dataset.name, "error": str(error)})

    status = "success" if not failures else "partial_success"
    result = {
        "job": "daily_analysis",
        "status": status,
        "processed_count": processed_count,
        "failed_count": len(failures),
        "failures": failures,
    }
    log_job_execution("daily_analysis", status, details=result)
    return result


def sync_new_data() -> dict[str, Any]:
    # Placeholder hook for external source sync. Current implementation checks local dataset drop-zone.
    datasets = _iter_dataset_files()
    result = {
        "job": "hourly_data_sync",
        "status": "success",
        "detected_datasets": len(datasets),
        "datasets": [file.name for file in datasets],
    }
    log_job_execution("hourly_data_sync", "success", details=result)
    return result


def report_cleanup(retention_days: int = 30) -> dict[str, Any]:
    if not REPORTS_DIR.exists():
        result = {"job": "report_cleanup", "status": "success", "deleted_files": 0}
        log_job_execution("report_cleanup", "success", details=result)
        return result

    threshold = datetime.now(timezone.utc) - timedelta(days=retention_days)
    deleted_files = 0
    for report_file in REPORTS_DIR.glob("*.json"):
        if report_file.name == "analysis_report.json":
            continue
        modified = datetime.fromtimestamp(report_file.stat().st_mtime, tz=timezone.utc)
        if modified < threshold:
            report_file.unlink(missing_ok=True)
            deleted_files += 1

    result = {
        "job": "report_cleanup",
        "status": "success",
        "deleted_files": deleted_files,
        "retention_days": retention_days,
    }
    log_job_execution("report_cleanup", "success", details=result)
    return result

