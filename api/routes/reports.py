from __future__ import annotations

from fastapi import APIRouter, HTTPException

from api.models.schemas import AnalysisReport
from api.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["reports"])
report_service = ReportService()


@router.get("", response_model=list[AnalysisReport])
def get_reports() -> list[AnalysisReport]:
    reports = report_service.get_all_reports()
    return [AnalysisReport.model_validate(report) for report in reports]


@router.get("/latest", response_model=AnalysisReport)
def get_latest_report() -> AnalysisReport:
    report = report_service.get_latest_report()
    if not report:
        raise HTTPException(status_code=404, detail="No reports available")
    return AnalysisReport.model_validate(report)


@router.get("/{dataset_name}", response_model=AnalysisReport)
def get_report_by_dataset(dataset_name: str) -> AnalysisReport:
    report = report_service.get_report_by_dataset(dataset_name)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report not found for dataset '{dataset_name}'")
    return AnalysisReport.model_validate(report)

