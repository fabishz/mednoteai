from __future__ import annotations

from pathlib import Path
from typing import Any

from api.services.report_service import ReportService


class DatasetService:
    def __init__(self, processed_dir: Path | str = "processed", report_service: ReportService | None = None) -> None:
        self.processed_dir = Path(processed_dir)
        self.report_service = report_service or ReportService()

    def list_datasets(self) -> list[dict[str, str]]:
        if not self.processed_dir.exists():
            return []

        datasets: list[dict[str, str]] = []
        for file in sorted(self.processed_dir.iterdir()):
            if not file.is_file():
                continue
            if file.suffix.lower() not in {".csv", ".json", ".parquet"}:
                continue
            datasets.append(
                {
                    "name": file.stem,
                    "file_path": str(file.resolve()),
                    "file_type": file.suffix.lower().lstrip("."),
                }
            )
        return datasets

    def get_dataset_summary(self, dataset_name: str) -> dict[str, Any] | None:
        report = self.report_service.get_report_by_dataset(dataset_name)
        if not report:
            return None
        analysis_summary = report.get("analysis_summary", {})
        return analysis_summary.get("summary", {})

