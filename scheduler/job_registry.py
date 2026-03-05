from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from scheduler.jobs import report_cleanup, run_daily_analysis, sync_new_data


@dataclass(frozen=True, slots=True)
class JobDefinition:
    job_id: str
    name: str
    func: Callable
    trigger: str
    trigger_args: dict


def get_job_definitions() -> list[JobDefinition]:
    return [
        JobDefinition(
            job_id="daily_analysis",
            name="Daily Analysis",
            func=run_daily_analysis,
            trigger="interval",
            trigger_args={"hours": 24},
        ),
        JobDefinition(
            job_id="hourly_data_sync",
            name="Hourly Data Sync",
            func=sync_new_data,
            trigger="interval",
            trigger_args={"minutes": 60},
        ),
        JobDefinition(
            job_id="report_cleanup",
            name="Weekly Report Cleanup",
            func=report_cleanup,
            trigger="interval",
            trigger_args={"weeks": 1},
        ),
    ]

