from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass
from typing import Any, Protocol

LOGGER = logging.getLogger(__name__)


class LLMClient(Protocol):
    def generate(self, prompt: str) -> str:
        ...


@dataclass(slots=True)
class HeuristicInsightGenerator:
    def generate(self, prompt: str) -> str:
        return prompt


class InsightGenerator:
    def __init__(self, llm_client: LLMClient | None = None) -> None:
        self.llm_client = llm_client

    def _build_prompt(self, analysis_result: dict[str, Any]) -> str:
        return (
            "You are a data analyst. Based on the following dataset metrics, "
            "generate key insights and potential business recommendations.\n\n"
            f"Metrics:\n{json.dumps(analysis_result, indent=2)}\n\n"
            "Return strict JSON with keys: key_insights, anomalies, recommendations."
        )

    def _heuristic_output(self, analysis_result: dict[str, Any]) -> dict[str, list[str]]:
        key_insights: list[str] = []
        anomalies: list[str] = []
        recommendations: list[str] = []

        summary = analysis_result.get("summary", {}).get("numeric_summary", {})
        for column, metrics in summary.items():
            mean = metrics.get("mean")
            variance = metrics.get("variance")
            if mean is not None:
                key_insights.append(f"{column}: average value is {mean:.4f}" if isinstance(mean, (float, int)) else f"{column}: average computed")
            if isinstance(variance, (float, int)) and variance > 0:
                key_insights.append(f"{column}: variance is {variance:.4f}")

        outliers = analysis_result.get("outliers", {})
        for column, info in outliers.items():
            count = info.get("count", 0)
            if isinstance(count, int) and count > 0:
                anomalies.append(f"{column}: detected {count} outliers")

        if anomalies:
            recommendations.append("Investigate outlier-heavy fields and validate source data quality.")
        if analysis_result.get("correlations"):
            recommendations.append("Review strongly correlated features before downstream modeling decisions.")
        if not recommendations:
            recommendations.append("No major anomalies detected. Continue monitoring trend stability.")

        return {
            "key_insights": key_insights,
            "anomalies": anomalies,
            "recommendations": recommendations,
        }

    def _safe_parse_json(self, raw: str) -> dict[str, Any]:
        try:
            parsed = json.loads(raw)
            if not isinstance(parsed, dict):
                raise ValueError("LLM output is not an object")
            return {
                "key_insights": parsed.get("key_insights", []),
                "anomalies": parsed.get("anomalies", []),
                "recommendations": parsed.get("recommendations", []),
            }
        except Exception:
            return {
                "key_insights": [],
                "anomalies": ["Insight parser failed; using fallback output."],
                "recommendations": ["Re-run analysis with stricter output formatting."],
            }

    def generate(self, analysis_result: dict[str, Any]) -> dict[str, Any]:
        prompt = self._build_prompt(analysis_result)

        if not self.llm_client:
            return self._heuristic_output(analysis_result)

        try:
            output = self.llm_client.generate(prompt)
            return self._safe_parse_json(output)
        except Exception as error:
            LOGGER.exception("AI insight generation failed")
            fallback = self._heuristic_output(analysis_result)
            fallback["anomalies"].append(f"AI generation failed: {type(error).__name__}")
            return fallback


def build_optional_openai_client() -> LLMClient | None:
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    if not api_key:
        return None
    try:
        from openai import OpenAI  # type: ignore
    except Exception:
        return None

    class _OpenAIAdapter:
        def __init__(self) -> None:
            self.client = OpenAI(api_key=api_key)

        def generate(self, prompt: str) -> str:
            response = self.client.responses.create(
                model=model,
                input=prompt,
                temperature=0.2,
            )
            return response.output_text

    return _OpenAIAdapter()
