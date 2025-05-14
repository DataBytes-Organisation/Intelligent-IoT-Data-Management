import os

def save_correlations(df, correlations, output_dir, time_col="data_point"):
    """
    Saves a new CSV file in the same folder as the original with rolling correlations added.

    Parameters:
        correlations (dict): Dictionary containing rolling correlations for sensor pairs.
        output_dir (str): Folder path where the original file was located.
        time_col (str): Name of the time/index column.
    """
    df_to_save = df.copy()  # Assumes df_normalized is available in scope

    # Add correlation columns with appropriate names like c(1, 2)
    for (s1, s2), corr_values in correlations.items():
        col_name = f"c({s1[-1]}, {s2[-1]})"
        padded_corr = [None] * (len(df_to_save) - len(corr_values)) + corr_values
        df_to_save[col_name] = padded_corr

    # Save to the same directory as complex.csv with a new name
    output_path = os.path.join(output_dir, "complex_formatted.csv")
    df_to_save.to_csv(output_path, index=False)
    print(f"Saved: {output_path}")