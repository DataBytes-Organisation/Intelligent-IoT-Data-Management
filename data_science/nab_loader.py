import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import urlopen
import pandas as pd


def _read_nab_json(labels_file: str):
    if labels_file.startswith(("http://", "https://")):
        try:
            with urlopen(labels_file) as response:
                return json.load(response)
        except HTTPError as e:
            raise FileNotFoundError(
                f"NAB labels URL returned HTTP {e.code}: {labels_file}"
            ) from e
        except URLError as e:
            raise FileNotFoundError(
                f"NAB labels URL could not be reached: {labels_file} ({e.reason})"
            ) from e

    path = Path(labels_file)
    if not path.exists():
        raise FileNotFoundError(f"NAB labels file not found: {labels_file}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_nab_labels(data_index: pd.Index, labels_file: str, dataset_key: str) -> pd.Series:
    """
    Load NAB anomaly windows and convert them into a boolean Series aligned with data_index.

    Parameters
    ----------
    data_index : pd.Index
        Timestamp index from the loaded dataset.
    labels_file : str
        Local path or HTTPS URL to NAB combined_windows.json.
    dataset_key : str
        Key inside the JSON, e.g. "realKnownCause/ambient_temperature_system_failure.csv".

    Returns
    -------
    pd.Series
        Boolean series aligned with data_index. True means anomaly, False means normal.
    """
    windows_by_dataset = _read_nab_json(labels_file)

    if dataset_key not in windows_by_dataset:
        raise KeyError(
            f"Dataset key '{dataset_key}' not found in NAB labels file '{labels_file}'."
        )

    windows = windows_by_dataset[dataset_key]

    index_dt = pd.to_datetime(data_index)
    labels = pd.Series(False, index=data_index)

    for window in windows:
        if len(window) != 2:
            raise ValueError(
                f"Invalid NAB window for '{dataset_key}': expected [start, end], got {window}"
            )
        start = pd.to_datetime(window[0])
        end = pd.to_datetime(window[1])
        mask = (index_dt >= start) & (index_dt <= end)
        labels.loc[mask] = True

    return labels
