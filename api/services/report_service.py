from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any


class ReportService:
    def __init__(self, reports_dir: Path | str = "reports") -> None:
        self.reports_dir = Path(reports_dir)

    def _iter_report_files(self) -> list[Path]:
        if not self.reports_dir.exists():
            return []
        return sorted(
            [
                file
                for file in self.reports_dir.glob("*.json")
                if file.is_file() and file.name != "analysis_report.json"
            ]
        )

    @staticmethod
    def _load_json(path: Path) -> dict[str, Any]:
        with path.open("r", encoding="utf-8") as file:
            payload = json.load(file)
        if not isinstance(payload, dict):
            raise ValueError(f"Invalid report format: {path}")
        return payload

    def get_all_reports(self) -> list[dict[str, Any]]:
        reports: list[dict[str, Any]] = []
        for path in self._iter_report_files():
            try:
                reports.append(self._load_json(path))
            except Exception:
                continue
        return reports

    def get_report_by_dataset(self, dataset_name: str) -> dict[str, Any] | None:
        reports = self.get_all_reports()
        for report in reports:
            if report.get("dataset") == dataset_name:
                return report
        return None

    def get_latest_report(self) -> dict[str, Any] | None:
        reports = self.get_all_reports()
        if not reports:
            return None

        def sort_key(report: dict[str, Any]) -> tuple[datetime, str]:
            raw_ts = str(report.get("timestamp", ""))
            try:
                return (datetime.fromisoformat(raw_ts.replace("Z", "+00:00")), raw_ts)
            except Exception:
                return (datetime.min, raw_ts)

        reports.sort(key=sort_key, reverse=True)
        return reports[0]

