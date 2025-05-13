# 📊 Time Series Input Cleaner

This Python script (`input_time_series.py`) is designed to **automatically load, validate, clean, and export** time series data from a variety of file formats including `.csv`, `.xls`, `.xlsx`, and `.json`. It detects the datetime column, ensures it's in chronological order, converts other columns to numeric format, and outputs cleaned data in both CSV and JSON formats.

---

##  Features

-  **Multi-format support**: Accepts `.csv`, `.xlsx`, `.xls`, and `.json` files  
-  **Datetime detection**: Automatically finds the first valid datetime column  
-  **Chronological validation**: Ensures the time column is sorted in increasing order  
-  **Data type conversion**: Converts non-time columns to numeric, handling missing values gracefully  
-  **Dual output**: Saves cleaned data to both `.csv` and `.json` in a `processed/` folder  

---

##  File Structure

project/
│
├── input_time_series.py # The main Python script
├── datasets/
│ └── Time series.xlsx # Example input file 
├── processed/ # Output directory (auto-created)
│ ├── Time series_clean.csv # Cleaned CSV output
│ └── Time series_clean.json # Cleaned JSON output
└── README.md


---

##  Requirements

Make sure you have Python 3 installed. Then, install required dependencies:

```bash
pip install pandas openpyxl
openpyxl is needed for reading .xlsx Excel files.
 How to Use

Place your time series data file in the datasets/ folder (or any path you prefer).
Edit the example usage line at the bottom of input_time_series.py:
input_time_series("datasets/Time series.xlsx")
Run the script:
python input_time_series.py
If successful, cleaned files will be created in the processed/ directory.

 Script Logic Overview

The script follows these steps:

Detects the file extension.
Loads the dataset using pandas.
Scans for the first valid datetime column.
Checks if that column is sorted in chronological order.
Converts all other columns to numeric, coercing errors to NaN.
Saves the cleaned data as both .csv and .json in processed/.
 Validation Rules

One column must contain valid datetime values.
The datetime column must be sorted in ascending (chronological) order.
All other data is coerced to numeric; non-numeric entries become NaN.
 Output

If your input file is named Time series.xlsx, the script will generate:

processed/Time series_clean.csv
processed/Time series_clean.json
 Example Use Case

Input file: datasets/sensor_data.json
Script call:
input_time_series("datasets/sensor_data.json")
Output files:
processed/sensor_data_clean.csv
processed/sensor_data_clean.json
 Troubleshooting

Issue	                        Fix
FileNotFoundError	            Double-check the file path is correct and exists
Unsupported file format	        Use .csv, .xls, .xlsx, or .json only
No valid datetime column found	Ensure at least one column has valid datetime-formatted values
Time column must be sorted	    Sort your datetime column before running or fix the source file
