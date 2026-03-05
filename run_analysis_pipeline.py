from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

from analysis import AnalysisEngine, InsightGenerator, ReportBuilder, build_optional_openai_client


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )


def run() -> int:
    logger = logging.getLogger("analysis_pipeline")
    processed_dir = Path("processed")
    reports_dir = Path("reports")

    engine = AnalysisEngine(processed_dir=processed_dir)
    insights = InsightGenerator(llm_client=build_optional_openai_client())
    builder = ReportBuilder(reports_dir=reports_dir)

    try:
        analysis_results = engine.run()
    except FileNotFoundError as error:
        logger.error("Pipeline failed: %s", error)
        return 1
    except Exception:
        logger.exception("Unexpected pipeline failure during analysis stage")
        return 1

    report_index: list[dict[str, str]] = []
    for result in analysis_results:
        ai_insights = insights.generate(result)
        report = builder.build_report(result, ai_insights)
        saved_path = builder.save_report(report)
        report_index.append(
            {
                "dataset": str(result.get("dataset", "unknown")),
                "report_path": str(saved_path),
            }
        )
        logger.info("Saved report for dataset '%s' at %s", result.get("dataset"), saved_path)

    index_path = reports_dir / "analysis_report.json"
    with index_path.open("w", encoding="utf-8") as file:
        json.dump({"reports": report_index}, file, indent=2)
    logger.info("Analysis pipeline completed. Index saved at %s", index_path)
    return 0


if __name__ == "__main__":
    configure_logging()
    sys.exit(run())
