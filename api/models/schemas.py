from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class DatasetInfo(BaseModel):
    name: str
    file_path: str
    file_type: str


class AnalysisReport(BaseModel):
    dataset: str
    timestamp: str
    analysis_summary: dict[str, Any] = Field(default_factory=dict)
    ai_insights: dict[str, Any] = Field(default_factory=dict)
    recommendations: list[str] = Field(default_factory=list)


class InsightResponse(BaseModel):
    dataset: str
    key_insights: list[str] = Field(default_factory=list)
    anomalies: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)

