from typing import List

def choose_stream(
    selected_streams: List[str],
    available_streams: List[str],
    min_selection: int = 1,
    max_selection: int = None
) -> List[str]:
    """
    Validates a list of user-selected data streams against the available dataset streams.

    Parameters:
        selected_streams (List[str]): Stream names selected by the user (from UI).
        available_streams (List[str]): All valid stream names from the dataset.
        min_selection (int): Minimum number of streams required. Default is 1.
        max_selection (int, optional): Maximum number of streams allowed.

    Returns:
        List[str]: The validated list of selected stream names.

    Raises:
        ValueError: If the input is invalid or selection constraints are not met.
    """
    if not isinstance(selected_streams, list):
        raise ValueError(" 'selected_streams' must be a list of strings.")

    unique_selected = list(set(selected_streams))

    if len(unique_selected) < min_selection:
        raise ValueError(
            f" Please select at least {min_selection} stream(s). You selected {len(unique_selected)}."
        )

    if len(unique_selected) == 1:
        print(" Only one stream selected. Consider selecting more to enable correlation or comparison features.")

    if max_selection and len(unique_selected) > max_selection:
        raise ValueError(
            f" You can select a maximum of {max_selection} streams. You selected {len(unique_selected)}."
        )

    invalid = [s for s in unique_selected if s not in available_streams]
    if invalid:
        raise ValueError(
            f" The following selected streams are not valid: {', '.join(invalid)}\n"
            f" Available options are: {', '.join(available_streams)}"
        )

    return unique_selected
