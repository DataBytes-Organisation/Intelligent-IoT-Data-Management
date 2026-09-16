from pathlib import Path

import numpy as np
import pandas as pd


def generate_datasets(output_dir):
    """Generate the five CCA109 input datasets."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    row_count = 120
    time_values = np.arange(row_count)
    sensor_1 = np.sin(time_values / 10) * 10 + 50
    sensor_2 = np.sin(time_values / 10 + 0.3) * 10 + 50
    sensor_3 = np.cos(time_values / 15) * 5 + 20

    base = pd.DataFrame(
        {
            "time": time_values,
            "s1": sensor_1.round(4),
            "s2": sensor_2.round(4),
            "s3": sensor_3.round(4),
        }
    )

    # Case 1: Missing values in sensor columns.
    missing_values = base.copy()
    missing_values.loc[10:14, "s1"] = np.nan
    missing_values.loc[40, "s2"] = np.nan
    missing_values.loc[60:62, "s3"] = np.nan
    missing_values.to_csv(output_dir / "case1_missing_values.csv", index=False)

    # Case 2: Two timestamp formats in one column.
    timestamps = pd.date_range("2026-01-01 00:00:00", periods=row_count, freq="min")
    mixed_timestamps = [value.strftime("%Y-%m-%d %H:%M:%S") for value in timestamps]
    for index in range(30, 45):
        mixed_timestamps[index] = timestamps[index].strftime("%d/%m/%Y %H:%M")
    mixed_timestamp_data = base.copy()
    mixed_timestamp_data["time"] = mixed_timestamps
    mixed_timestamp_data.to_csv(
        output_dir / "case2_mixed_timestamps.csv",
        index=False,
    )

    # Case 3: A required stream has a different name.
    renamed_column = base.copy().rename(columns={"s3": "sensor_three"})
    renamed_column.to_csv(output_dir / "case3_renamed_column.csv", index=False)

    # Case 4: Duplicate rows and timestamps.
    duplicate_rows = pd.concat([base, base.iloc[20:25], base.iloc[50:53]])
    duplicate_rows = duplicate_rows.sort_values("time").reset_index(drop=True)
    duplicate_rows.to_csv(output_dir / "case4_duplicates.csv", index=False)

    # Case 5: Non-numeric sensor values.
    non_numeric_values = base.copy().astype({"s1": object, "s2": object})
    non_numeric_values.loc[15, "s1"] = "N/A"
    non_numeric_values.loc[16, "s1"] = "error"
    non_numeric_values.loc[70, "s2"] = "--"
    non_numeric_values.loc[71, "s2"] = "sensor_offline"
    non_numeric_values.to_csv(
        output_dir / "case5_non_numeric.csv",
        index=False,
    )

    return sorted(output_dir.glob("*.csv"))


if __name__ == "__main__":
    evidence_dir = Path(__file__).resolve().parent / "datasets"
    generated_files = generate_datasets(evidence_dir)
    print(f"Created {len(generated_files)} datasets in {evidence_dir}")
