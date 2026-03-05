from __future__ import annotations

from fastapi import APIRouter, HTTPException

from api.models.schemas import DatasetInfo
from api.services.dataset_service import DatasetService

router = APIRouter(prefix="/datasets", tags=["datasets"])
dataset_service = DatasetService()


@router.get("", response_model=list[DatasetInfo])
def list_datasets() -> list[DatasetInfo]:
    datasets = dataset_service.list_datasets()
    return [DatasetInfo.model_validate(item) for item in datasets]


@router.get("/{dataset_name}/summary")
def dataset_summary(dataset_name: str) -> dict:
    summary = dataset_service.get_dataset_summary(dataset_name)
    if summary is None:
        raise HTTPException(status_code=404, detail=f"Dataset summary not found for '{dataset_name}'")
    return {"dataset": dataset_name, "summary": summary}

