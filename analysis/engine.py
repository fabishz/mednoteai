from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import pandas as pd

from analysis.feature_extractor import compute_correlations, detect_outliers, extract_summary_stats

LOGGER = logging.getLogger(__name__)


class AnalysisEngine:
    def __init__(self, processed_dir: Path | str = "processed") -> None:
        self.processed_dir = Path(processed_dir)

    def _load_dataset(self, path: Path) -> pd.DataFrame:
        suffix = path.suffix.lower()
        if suffix == ".csv":
            return pd.read_csv(path)
        if suffix == ".parquet":
            return pd.read_parquet(path)
        if suffix == ".json":
            with path.open("r", encoding="utf-8") as file:
                payload = json.load(file)
            return pd.json_normalize(payload if isinstance(payload, list) else [payload])
        raise ValueError(f"Unsupported file format: {path.name}")

    def list_processed_datasets(self) -> list[Path]:
        if not self.processed_dir.exists():
            raise FileNotFoundError(f"Processed directory not found: {self.processed_dir}")
        files = [
            file
            for file in sorted(self.processed_dir.iterdir())
            if file.is_file() and file.suffix.lower() in {".csv", ".parquet", ".json"}
        ]
        return files

    def analyze_dataset(self, dataset_path: Path) -> dict[str, Any]:
        LOGGER.info("Analyzing dataset", extra={"dataset": dataset_path.name})
        data = self._load_dataset(dataset_path)
        summary = extract_summary_stats(data)
        correlations = compute_correlations(data)
        outliers = detect_outliers(data)
        return {
            "dataset": dataset_path.stem,
            "summary": summary,
            "correlations": correlations,
            "outliers": outliers,
        }

    def run(self) -> list[dict[str, Any]]:
        datasets = self.list_processed_datasets()
        if not datasets:
            raise FileNotFoundError(f"No datasets found in {self.processed_dir}")

        results: list[dict[str, Any]] = []
        for dataset in datasets:
            try:
                results.append(self.analyze_dataset(dataset))
            except Exception as error:
                LOGGER.exception("Dataset analysis failed", extra={"dataset": dataset.name})
                results.append(
                    {
                        "dataset": dataset.stem,
                        "error": str(error),
                        "summary": {},
                        "correlations": {},
                        "outliers": {},
                    }
                )
        return results
