def choose_stream(selected_streams, available_streams, min_selection=3):
    """
    Validates user-selected streams against available streams.
 
    Parameters:
    - selected_streams (list of str): Streams selected by user from UI.
    - available_streams (list of str): All available streams in the dataset.
    - min_selection (int): Minimum number of streams required.
 
    Returns:
    - list of str: Validated selected streams.
 
    Raises:
    - ValueError: If selection is invalid or not in available streams.
    """
    if not isinstance(selected_streams, list):
        raise ValueError("Selected streams must be a list.")
 
    if len(set(selected_streams)) < min_selection:
        raise ValueError(f"Please select at least {min_selection} unique streams.")
 
    invalid = [s for s in selected_streams if s not in available_streams]
    if invalid:
        raise ValueError(f"The following selected streams are invalid: {invalid}")
 
    return selected_streams
 
if __name__ == "__main__":
    # Simulate available streams from JSON or csv
    available_streams = ['temperature', 'humidity', 'pressure', 'CO2', 'light']
 
    # Simulate user selection from UI
    selected_streams = ['temperature', 'humidity', 'pressure']
 
    try:
        validated = choose_stream(selected_streams, available_streams)
        print("✅ Validated Streams:", validated)
    except ValueError as e:
        print("❌ Validation Error:", e)