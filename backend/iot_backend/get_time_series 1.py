import pandas as pd

def get_time_series(dataset_name):
    """
    Loads and processes time-series data from a CSV file.
    
    - Automatically detects the most likely time column (non-numeric).
    - Drops rows with missing/invalid time.
    - Sets time as the index and sorts it.
    - Keeps only numeric sensor columns.
    - Interpolates missing sensor values.
    - Flags rows where interpolation occurred.

    Parameters:
        dataset_name (str): Path to the CSV file.

    Returns:
        pd.DataFrame: Cleaned and processed time-series DataFrame.
    """
    try:
        df = pd.read_csv(dataset_name)

        # Step 1: Detecting the time column
        time_col = None
        for col in df.columns:
            if not pd.api.types.is_numeric_dtype(df[col]):
                try:
                    converted = pd.to_datetime(df[col], errors='coerce')
                    success_rate = converted.notna().mean()
                    if success_rate > 0.8:
                        time_col = col
                        df[col] = converted
                        break
                except:
                    continue

        if time_col is None:
            raise ValueError("⚠️ Could not detect a valid time column automatically.")

        # Step 2: Drop invalid time values and sort
        df = df.dropna(subset=[time_col])
        df = df.set_index(time_col).sort_index()

        # Step 3: Keep only numeric columns (sensor values)
        df = df.drop(columns=[col for col in df.columns if not pd.api.types.is_numeric_dtype(df[col])], errors='ignore')
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]

        # Step 4: Flag and interpolate missing values
        df['was_interpolated'] = df.isna().any(axis=1)
        df = df.interpolate(method='time')

        return df

    except Exception as e:
        print(f"❌ Error loading dataset: {e}")
        return None


def export_to_json(df, filename="processed_data.json"):
    """
    Exports the given DataFrame to a JSON file.

    Parameters:
        df (pd.DataFrame): DataFrame to export.
        filename (str): Output filename.
    """
    df.reset_index().to_json(filename, orient="records", date_format="iso", indent=2)
    print(f"✅ JSON exported to {filename}")


# Testing the function directly
if __name__ == "__main__":
    file_path = "../datasets/swanHill_weather_10000_data.csv"  # Replace with any dataset
    df = get_time_series(file_path)

    if df is not None:
        print("\n✅ Data processed successfully!\n")
        print(df.head())

        # Optional: export to JSON if needed
        export_to_json(df)

    else:
        print("❌ Failed to process the dataset.")
