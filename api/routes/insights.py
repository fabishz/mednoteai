from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from api.models.schemas import InsightResponse
from api.services.report_service import ReportService

router = APIRouter(prefix="/insights", tags=["insights"])
report_service = ReportService()


def _build_insight_response(dataset_name: str) -> InsightResponse:
    report = report_service.get_report_by_dataset(dataset_name)
    if not report:
        raise HTTPException(status_code=404, detail=f"Insights not found for dataset '{dataset_name}'")

    ai_insights = report.get("ai_insights", {})
    return InsightResponse(
        dataset=dataset_name,
        key_insights=ai_insights.get("key_insights", []),
        anomalies=ai_insights.get("anomalies", []),
        recommendations=ai_insights.get("recommendations", []),
    )


@router.get("/{dataset_name}", response_model=InsightResponse)
def get_insights(
    dataset_name: str,
    type: Literal["all", "anomalies", "recommendations"] = Query(default="all"),
) -> InsightResponse:
    payload = _build_insight_response(dataset_name)
    if type == "anomalies":
        return InsightResponse(dataset=payload.dataset, anomalies=payload.anomalies)
    if type == "recommendations":
        return InsightResponse(dataset=payload.dataset, recommendations=payload.recommendations)
    return payload


@router.get("/{dataset_name}/recommendations")
def get_recommendations(dataset_name: str) -> dict:
    payload = _build_insight_response(dataset_name)
    return {"dataset": payload.dataset, "recommendations": payload.recommendations}

