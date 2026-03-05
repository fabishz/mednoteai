from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class ReportBuilder:
    def __init__(self, reports_dir: Path | str = "reports") -> None:
        self.reports_dir = Path(reports_dir)
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    def build_report(self, analysis_result: dict[str, Any], ai_insights: dict[str, Any]) -> dict[str, Any]:
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "dataset": analysis_result.get("dataset", "unknown"),
            "analysis_summary": {
                "summary": analysis_result.get("summary", {}),
                "correlations": analysis_result.get("correlations", {}),
                "outliers": analysis_result.get("outliers", {}),
            },
            "ai_insights": ai_insights,
            "recommendations": ai_insights.get("recommendations", []),
        }

    def save_report(self, report: dict[str, Any], output_name: str | None = None) -> Path:
        dataset = report.get("dataset", "unknown")
        filename = output_name or f"{dataset}_analysis_report.json"
        output_path = self.reports_dir / filename
        with output_path.open("w", encoding="utf-8") as file:
            json.dump(report, file, indent=2, ensure_ascii=False)
        return output_path
