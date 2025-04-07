import pandas as pd
import numpy as np

def get_time_series(file_path, columns='all'):
    df = pd.read_csv(file_path)
    df.columns = df.columns.str.strip()

    if columns != 'all':
        df = df[columns]

    time_col = None
    for col in df.columns:
        if not pd.api.types.is_numeric_dtype(df[col]):
            converted = pd.to_datetime(df[col], errors='coerce')
            if converted.notna().mean() > 0.8:
                df[col] = converted
                time_col = col
                break

    if time_col:
        df = df.dropna(subset=[time_col])
        df = df.set_index(time_col).sort_index()

    df_numeric = df.select_dtypes(include=[np.number])

    if time_col:
        df_numeric = df_numeric.interpolate(method='time')
    else:
        df_numeric = df_numeric.interpolate()

    return df_numeric

def export_to_csv(df, filename="processed_data.csv"):
    """
    Export the DataFrame to a CSV file.

    Args:
        df (pd.DataFrame): DataFrame to export.
        filename (str): Output filename.
    """
    try:
        df.to_csv(filename)
        print(f"✅ CSV exported to {filename}")
    except Exception as e:
        print(f"❌ Failed to export CSV: {e}")

def main():
    file_path = "2881821.csv"  # Adjust to your actual file path
    df = get_time_series(file_path, columns='all')

    if df is not None:
        print("\n✅ Processed Data:\n")
        print(df.head())
        export_to_csv(df, "simple_processed.csv")
    else:
        print("❌ Failed to process the dataset.")
        
if __name__ == "__main__":
    main()
