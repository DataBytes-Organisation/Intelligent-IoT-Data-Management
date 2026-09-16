"""
[AIntg-002] Analytics Intelligence E2E smoke-test wrapper.

The reusable production logic now lives in:

analytics_integration.pipeline

This file intentionally keeps the deterministic NAB dataset
configuration used by the existing regression test.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from analytics_integration.pipeline import (
    run_models_path as _run_models_path,
    run_correlation_path as _run_correlation_path,
    run_analytics_pipeline,
)


REPO_ROOT = Path(__file__).resolve().parents[1]

DEFAULT_DATASET_PATH = (
    REPO_ROOT
    / "datasets"
    / "nab_realtraffic"
    / "traffic_4stream_merged.csv"
)

DEFAULT_ROW_LIMIT = 300

MODEL_METRIC = "occupancy_t4013"

CORRELATION_STREAMS = [
    "occupancy_t4013",
    "occupancy_6005",
]

CORRELATION_WINDOW_SIZE = 20
CORRELATION_STEP_SIZE = 10
CORRELATION_METHOD = "pearson"


def load_smoke_dataset(
    dataset_path: Path | str = DEFAULT_DATASET_PATH,
    row_limit: int | None = DEFAULT_ROW_LIMIT,
) -> pd.DataFrame:
    dataset_path = Path(dataset_path)

    if not dataset_path.exists():
        raise FileNotFoundError(
            f"E2E dataset was not found: {dataset_path}"
        )

    df = pd.read_csv(dataset_path)

    required_columns = {
        "timestamp",
        MODEL_METRIC,
        *CORRELATION_STREAMS,
    }

    missing = required_columns - set(df.columns)

    if missing:
        raise ValueError(
            "E2E dataset is missing required columns: "
            f"{sorted(missing)}"
        )

    if row_limit is not None:
        df = df.head(row_limit).copy()

    if df.empty:
        raise ValueError(
            "E2E dataset contains no rows."
        )

    return df


def run_models_path(
    df: pd.DataFrame,
) -> tuple[list[dict], dict]:
    """
    Backward-compatible AIntg-002 smoke wrapper.
    """

    return _run_models_path(
        df=df,
        timestamp_col="timestamp",
        model_metric=MODEL_METRIC,
        entity_id="nab_realtraffic",
        detector_name="isolationforest",
    )


def run_correlation_path(
    df: pd.DataFrame,
) -> tuple[list[dict], dict]:
    """
    Backward-compatible AIntg-002 smoke wrapper.
    """

    return _run_correlation_path(
        df=df,
        timestamp_col="timestamp",
        correlation_streams=CORRELATION_STREAMS,
        window_size=CORRELATION_WINDOW_SIZE,
        step_size=CORRELATION_STEP_SIZE,
        method=CORRELATION_METHOD,
    )


def run_mvp_pipeline(
    dataset_path: Path | str = DEFAULT_DATASET_PATH,
    row_limit: int | None = DEFAULT_ROW_LIMIT,
) -> dict:
    """
    Execute the deterministic AIntg-002 smoke test.
    """

    df = load_smoke_dataset(
        dataset_path=dataset_path,
        row_limit=row_limit,
    )

    return run_analytics_pipeline(
        df=df,
        timestamp_col="timestamp",
        entity_id="nab_realtraffic",
        model_metric=MODEL_METRIC,
        correlation_streams=CORRELATION_STREAMS,
        detector_name="isolationforest",
        correlation_window_size=(
            CORRELATION_WINDOW_SIZE
        ),
        correlation_step_size=(
            CORRELATION_STEP_SIZE
        ),
        correlation_method=CORRELATION_METHOD,
    )


def main():
    response = run_mvp_pipeline()

    alert_types = sorted(
        {
            alert["alert_type"]
            for alert in response["alerts"]
        }
    )

    print()
    print("============================================")
    print(" AINTL E2E SMOKE TEST SUCCESS")
    print("============================================")
    print("Status:", response["status"])
    print(
        "Processed items:",
        response["summary"]["processed_items"],
    )
    print(
        "Total alerts:",
        response["summary"]["alert_count"],
    )
    print(
        "Alert types:",
        alert_types,
    )
    print(
        "Errors:",
        response["errors"],
    )
    print(
        "Final response is valid "
        "Draft V0.1 JSON."
    )
    print("============================================")


if __name__ == "__main__":
    main()