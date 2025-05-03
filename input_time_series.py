import pandas as pd
import os

def input_time_series(file_path):
    try:
        # Step 1: Detect file extension
        file_extension = os.path.splitext(file_path)[1].lower()

        # Step 2: Load the data accordingly
        if file_extension == '.csv':
            df = pd.read_csv(file_path)
        elif file_extension in ['.xls', '.xlsx']:
            df = pd.read_excel(file_path)
        elif file_extension == '.json':
            df = pd.read_json(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")

        # Step 3: Detect and convert time column
        time_col = None
        for col in df.columns:
            try:
                df[col] = pd.to_datetime(df[col], errors='raise')
                time_col = col
                break
            except Exception:
                continue

        if not time_col:
            raise ValueError("No valid datetime column found.")

        # Step 4: Ensure time column is sorted
        if not df[time_col].is_monotonic_increasing:
            raise ValueError(f"Time column '{time_col}' must be in chronological order.")

        # Step 5: Convert non-time columns to numeric
        for col in df.columns:
            if col != time_col:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # Step 6: Create output directory
        base_name = os.path.splitext(os.path.basename(file_path))[0]
        output_dir = "processed"
        os.makedirs(output_dir, exist_ok=True)

        # Step 7: Save to CSV and JSON
        csv_path = os.path.join(output_dir, f"{base_name}_clean.csv")
        json_path = os.path.join(output_dir, f"{base_name}_clean.json")
        df.to_csv(csv_path, index=False)
        df.to_json(json_path, orient='records', date_format='iso')

        print("✅ Time series data is valid.")
        print(f"📁 Saved cleaned dataset as:\n - {csv_path}\n - {json_path}")

    except FileNotFoundError:
        print(f"❌ Error: File '{file_path}' not found.")
    except ValueError as ve:
        print(f"❌ Validation Error: {ve}")
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")

# Example usage
if __name__ == "__main__":
    input_time_series("datasets/Time series.xlsx")  # Update the path as needed
