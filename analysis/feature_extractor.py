from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd


def _to_builtin(value: Any) -> Any:
    if isinstance(value, (np.generic,)):
        return value.item()
    return value


def extract_summary_stats(data: pd.DataFrame) -> dict[str, Any]:
    if data.empty:
        return {"rows": 0, "columns": list(data.columns), "numeric_summary": {}}

    numeric_df = data.select_dtypes(include=[np.number])
    if numeric_df.empty:
        return {"rows": int(len(data)), "columns": list(data.columns), "numeric_summary": {}}

    summary: dict[str, dict[str, Any]] = {}
    for column in numeric_df.columns:
        series = numeric_df[column].dropna()
        if series.empty:
            continue
        summary[column] = {
            "mean": _to_builtin(series.mean()),
            "median": _to_builtin(series.median()),
            "variance": _to_builtin(series.var(ddof=1)),
            "min": _to_builtin(series.min()),
            "max": _to_builtin(series.max()),
            "std_dev": _to_builtin(series.std(ddof=1)),
            "count": int(series.count()),
        }

    return {
        "rows": int(len(data)),
        "columns": list(data.columns),
        "numeric_summary": summary,
    }


def detect_outliers(data: pd.DataFrame) -> dict[str, Any]:
    numeric_df = data.select_dtypes(include=[np.number])
    outliers: dict[str, Any] = {}

    for column in numeric_df.columns:
        series = numeric_df[column].dropna()
        if len(series) < 4:
            outliers[column] = {
                "method": "iqr",
                "count": 0,
                "lower_bound": None,
                "upper_bound": None,
                "indices": [],
            }
            continue

        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        mask = (numeric_df[column] < lower_bound) | (numeric_df[column] > upper_bound)
        indices = numeric_df.index[mask.fillna(False)].tolist()

        outliers[column] = {
            "method": "iqr",
            "count": int(len(indices)),
            "lower_bound": _to_builtin(lower_bound),
            "upper_bound": _to_builtin(upper_bound),
            "indices": [int(i) if isinstance(i, (int, np.integer)) else str(i) for i in indices[:100]],
        }

    return outliers


def compute_correlations(data: pd.DataFrame) -> dict[str, dict[str, Any]]:
    numeric_df = data.select_dtypes(include=[np.number])
    if numeric_df.shape[1] < 2:
        return {}

    corr_df = numeric_df.corr(method="pearson").fillna(0.0)
    output: dict[str, dict[str, Any]] = {}
    for row in corr_df.index:
        output[row] = {}
        for col in corr_df.columns:
            output[row][col] = _to_builtin(corr_df.loc[row, col])
    return output
