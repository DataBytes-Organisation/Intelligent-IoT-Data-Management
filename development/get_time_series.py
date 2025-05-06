import pandas as pd

def get_time_series(dataset_name, start_idx=0, end_idx=None):
    """
    Loads and slices time-series sensor data using row indices (not timestamps).

    Parameters:
        dataset_name (str): Path to the CSV file.
        start_idx (int): Starting row index for the time window.
        end_idx (int): Ending row index for the time window.

    Returns:
        pd.DataFrame: Cleaned sensor data in the selected range.
    """
    try:
        df = pd.read_csv(dataset_name)

        # Keep only numeric sensor columns
        df = df.loc[:, df.dtypes.apply(pd.api.types.is_numeric_dtype)]
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]

        # Handle default end_idx
        if end_idx is None or end_idx > len(df):
            end_idx = len(df)

        # Slice by index
        return df.iloc[start_idx:end_idx]

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
    df.to_json(filename, orient="records", indent=2)
    print(f"✅ JSON exported to {filename}")


# ---------------- TESTING BLOCK ----------------

if __name__ == "__main__":
    # Path to your dataset
    file_path = "../datasets/complex.csv"  

    # Define time window using row indices
    start_idx = 250
    end_idx = 500

    # Load and slice the data
    df = get_time_series(file_path, start_idx, end_idx)

    if df is not None:
        print("\n✅ Data slice loaded successfully!\n")
        print(df.head())

        # Optional: export to JSON
        export_to_json(df, filename="complex_slice.json")

        # Optional: export to CSV for debug
        df.to_csv("complex_slice.csv", index=False)
    else:
        print("❌ Failed to process the dataset.")
