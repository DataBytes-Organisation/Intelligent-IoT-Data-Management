# Intelligent-IoT-Data-Management


## Backend Integration Module
This project provides a complete pipeline for loading, cleaning, analyzing, and visualizing correlations between multiple sensor data streams using a sliding window approach. A user-friendly GUI allows users to interactively choose time ranges and sensor streams, and highlight correlation windows dynamically.

### Key Features
- Data Normalization: Cleans and interpolates missing sensor values.
- Interactive GUI: Select datetime ranges and sensors via a sleek Tkinter interface.
- Sliding Correlation Analysis: Computes pairwise Pearson correlations over moving windows.
- Visual Insights:
  * Plot correlation trends for all stream pairs.
  * Highlight specific windows with correlation values.
- Data Export: Save enriched CSVs with computed correlation columns.

### File Description
data_loader.py:	Loads sensor CSV data and creates 10-minute interval timestamps.
normalization.py:	Cleans and interpolates sensor data for further processing.
correlation.py:	Computes correlation between two streams in a specified datetime range.
sliding_correlations.py:	Calculates sliding window correlations between all unique stream pairs.
plotting_correlation.py:	Plots time-series correlation curves for all stream pairs.
plotting_streams.py:	Plots sensor pairs and highlights a custom datetime window with correlation overlay.
save_to_csv.py:	Saves original + computed correlation columns to complex_formatted.csv.
gui_setup.py:	Builds an interactive GUI for selecting datetime range, sensors, and window size.
main.ipynb:	Jupyter notebook for testing the full data pipeline.
