import pandas as pd
import os

def input_time_series(file_path):
    try:
        # Step 1: Detect the file extension to determine the file format
        file_extension = os.path.splitext(file_path)[1].lower()  # Extract file extension

        # Step 2: Load the file into a DataFrame based on the file format
        if file_extension == '.csv':  # Check if file is CSV
            df = pd.read_csv(file_path)
        elif file_extension in ['.xls', '.xlsx']:  # Check if file is Excel (.xls or .xlsx)
            df = pd.read_excel(file_path)
        elif file_extension == '.json':  # Check if file is JSON
            df = pd.read_json(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")  # Raise error for unsupported formats

        # Step 3: Try to automatically detect the time column by attempting datetime conversion
        time_col = None  # Initialize variable for storing the time column name
        for col in df.columns:  # Loop through all columns in the DataFrame
            try:
                converted = pd.to_datetime(df[col], errors='raise')  # Try converting column to datetime
                time_col = col  # Save the name of the valid datetime column
                df[col] = converted  # Replace original column with datetime formatted data
                break  # Stop searching after finding the first valid datetime column
            except Exception:  # If conversion fails, continue to the next column
                continue

        # Step 4: If no datetime column is found, raise an error
        if not time_col:  # Check if a time column was found
            raise ValueError("No valid datetime column found.")  # Raise error if no valid time column

        # Step 5: Ensure the time column is sorted in chronological order
        if not df[time_col].is_monotonic_increasing:  # Check if the time column is sorted
            raise ValueError(f"Time column '{time_col}' must be in chronological order.")  # Raise error if not sorted

        # Step 6: Check that all columns are either datetime or numeric (valid value columns)
        for col in df.columns:  # Loop through all columns in the DataFrame
            if col != time_col:  # Skip the time column
                df[col] = pd.to_numeric(df[col], errors='coerce')  # Convert non-time columns to numeric, invalid entries become NaN

        # Step 7: If all checks pass, print success message
        print(f"✅ Time series data is valid.")  # If all validation steps pass, print success message

    # Handle specific file-related errors
    except FileNotFoundError:  # If the file is not found
        print(f"❌ Error: File '{file_path}' not found.")

    # Handle validation-specific errors
    except ValueError as ve:  # If there are validation errors
        print(f"❌ Validation Error: {ve}")

    # Catch any other unexpected errors
    except Exception as e:  # Catch any unexpected errors
        print(f"❌ Unexpected Error: {e}")

# If the script is run directly, validate the specified file
if __name__ == "__main__":
    input_time_series("datasets/Time series.xlsx")  # Example file path to be validated
