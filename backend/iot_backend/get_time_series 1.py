import pandas as pd
import logging
import argparse
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

def get_time_series(dataset_name):
    """
    Loads and processes time-series data from a CSV file.
    Implements robust error handling and performance optimizations.
    """
    if not os.path.exists(dataset_name):
        logging.error(f"File not found: {dataset_name}")
        return None

    try:
        df = pd.read_csv(dataset_name)

        if df.empty:
            logging.error("The CSV file is empty.")
            return None

        # Step 1: Detect time column
        time_col = None
        for col in df.columns:
            if not pd.api.types.is_numeric_dtype(df[col]):
                try:
                    converted = pd.to_datetime(df[col], errors='coerce')
                    if converted.notna().mean() > 0.8:
                        time_col = col
                        df[col] = converted
                        break
                except Exception as e:
                    logging.warning(f"Skipping column '{col}' for datetime conversion: {e}")
                    continue

        if time_col is None:
            raise ValueError("Could not detect a valid time column automatically.")

        # Step 2: Drop invalid time values and sort
        df = df.dropna(subset=[time_col])
        df = df.set_index(time_col).sort_index()

        if df.empty:
            logging.error("All rows dropped after invalid timestamp filtering.")
            return None

        # Step 3: Keep only numeric columns
        df = df.select_dtypes(include='number')
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]

        if df.empty:
            logging.warning("No numeric columns found after filtering.")
            return None

        # Step 4: Interpolate missing values and flag rows
        df['was_interpolated'] = df.isna().any(axis=1)
        try:
            df = df.interpolate(method='time')
        except Exception as e:
            logging.warning(f"Interpolation failed: {e}")
            df = df.fillna(method='ffill').fillna(method='bfill')

        return df

    except FileNotFoundError:
        logging.error("CSV file not found.")
    except pd.errors.ParserError as e:
        logging.error(f"Parsing error while reading the CSV: {e}")
    except Exception as e:
        logging.error(f"Unexpected error: {e}")

    return None


def export_to_json(df, filename="processed_data.json"):
    """
    Exports the given DataFrame to a JSON file.
    """
    try:
        df.reset_index().to_json(filename, orient="records", date_format="iso", indent=2)
        logging.info(f"JSON exported successfully to '{filename}'")
    except Exception as e:
        logging.error(f"Failed to export JSON: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Time-series data cleaner")
    parser.add_argument("filepath", type=str, help="Path to the CSV file")

    args = parser.parse_args()
    df = get_time_series(args.filepath)

    if df is not None:
        logging.info("Data processed successfully!\n")
        print(df.head())
        export_to_json(df)
    else:
        logging.error("Failed to process the dataset.")