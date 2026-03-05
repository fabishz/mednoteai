from __future__ import annotations

import json
import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from analysis import AnalysisEngine, InsightGenerator, ReportBuilder, build_optional_openai_client

LOGGER = logging.getLogger(__name__)

ROOT_DIR = Path(".")
DATASETS_DIR = ROOT_DIR / "datasets"
PROCESSED_DIR = ROOT_DIR / "processed"
REPORTS_DIR = ROOT_DIR / "reports"
LOGS_DIR = ROOT_DIR / "logs"
JOB_LOG_FILE = LOGS_DIR / "scheduler_jobs.jsonl"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_directories() -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    LOGS_DIR.mkdir(parents=True, exist_ok=True)


def log_job_execution(job_name: str, status: str, details: dict[str, Any] | None = None, error: str | None = None) -> None:
    _ensure_directories()
    payload = {
        "job_name": job_name,
        "execution_time": _utc_now_iso(),
        "status": status,
        "details": details or {},
        "error": error,
    }
    with JOB_LOG_FILE.open("a", encoding="utf-8") as file:
        file.write(json.dumps(payload, ensure_ascii=False) + "\n")


def run_full_pipeline(dataset_path: str | Path) -> dict[str, Any]:
    _ensure_directories()
    dataset = Path(dataset_path)
    if not dataset.exists() or not dataset.is_file():
        raise FileNotFoundError(f"Dataset not found: {dataset}")

    if dataset.suffix.lower() not in {".csv", ".json", ".parquet"}:
        raise ValueError(f"Unsupported dataset file type: {dataset.suffix}")

    processed_target = PROCESSED_DIR / dataset.name

    try:
        shutil.copy2(dataset, processed_target)

        engine = AnalysisEngine(processed_dir=PROCESSED_DIR)
        analysis_result = engine.analyze_dataset(processed_target)

        insight_generator = InsightGenerator(llm_client=build_optional_openai_client())
        ai_insights = insight_generator.generate(analysis_result)

        report_builder = ReportBuilder(reports_dir=REPORTS_DIR)
        report = report_builder.build_report(analysis_result, ai_insights)
        report_path = report_builder.save_report(report)

        result = {
            "status": "success",
            "dataset": dataset.stem,
            "timestamp": _utc_now_iso(),
            "report_path": str(report_path),
        }
        log_job_execution("run_full_pipeline", "success", details=result)
        return result
    except Exception as error:
        LOGGER.exception("Pipeline execution failed for dataset '%s'", dataset.name)
        log_job_execution(
            "run_full_pipeline",
            "failed",
            details={"dataset": dataset.stem, "dataset_path": str(dataset)},
            error=str(error),
        )
        raise

