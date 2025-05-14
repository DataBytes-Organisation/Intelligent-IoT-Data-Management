import os

def save_correlations(df, correlations, output_dir):
    """
    Saves the original DataFrame along with padded sliding window correlation columns
    for each pair of sensor streams to a CSV file.

    Parameters:
        df (DataFrame): The input DataFrame containing time, datetime, and sensor values.
        correlations (dict): Dictionary containing correlation lists keyed by sensor column pairs.
        output_dir (str): Directory path where the output CSV should be saved.

    Returns:
        None
    """
    # Create a copy of the DataFrame to avoid modifying the original
    df_to_save = df.copy()

    # Add each correlation result as a new column
    for (s1, s2), corr_values in correlations.items():
        # Construct a short column name for the pair (e.g., c(1, 2))
        col_name = f"c({s1[-1]}, {s2[-1]})"

        # Pad the correlation list to align with the full DataFrame length
        padded_corr = [None] * (len(df_to_save) - len(corr_values)) + corr_values

        # Add the padded correlation values as a new column
        df_to_save[col_name] = padded_corr

    # Define the full output path and save the DataFrame as CSV
    output_path = os.path.join(output_dir, "complex_formatted.csv")
    df_to_save.to_csv(output_path, index=False)

    # Notify the user of the saved file
    print(f"Saved: {output_path}")
