# Intelligent-IoT-Data-Management

**choose_stream.py**
A utility function for validating user-selected data streams in time-series datasets.

**Overview**
The choose_stream() function is used to validate a list of data streams selected by a user (typically from a UI or API) against the list of available streams in a dataset. It ensures the selection is valid, unique, and meets the minimum required number of streams before continuing with further analysis like correlation, visualization, or anomaly detection.

**Features**
Validates that the selection:

Is a list of strings
Contains only streams available in the dataset

Includes at least one valid stream

Warns if only one stream is selected (recommendation to select more)

Optional support for setting a maximum number of streams

Returns the cleaned and validated list of stream names
