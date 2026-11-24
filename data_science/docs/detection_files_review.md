# Isolation Forest Script Review

## Key points
Contamination has a 5%

## iforest_detector.py
**What does it do:** This file acts as a wrapper for sklearn's Isolation Forest, which we use to detect anomalies in the data, so it works with the project's format.
**Settings:** Uses contamination = 0.05, n_estimators = 100, random_state = 42.
**fit()** trains the model.
**detect()** flags anomalies and gives scores.
**Output:** The output of the file is simple. It provides key details: anomaly_flag (whether each reading is considered an anomaly) and score (how anomalous each reading is). It also gives basic run info like timestamps, runtime and model_name.
**Comments:** Contamination is set to 0.05, which acts as a 5% cap, so it will only pick up the top 5% of readings. If a dataset has 12% anomalies, the extra 7% will be missed, which lowers the recall of the scan. It also always flags the top 5% as anomalies, even if they aren't. Another possible issue is that the scores haven't been normalised.

## pipeline.py
**What does it do:** This is used for benchmarking. It loads in a dataset and will run all 11 detectors on it, including Isolation Forest. It compares results and formats them into a text file for easy reading, a CSV file and also a graph to view differences and patterns. Main use is for testing.
**Settings:** Settings are set within build_detectors(). Isolation Forest is set with the same contamination of 0.05.
**run_pipeline()** is the main flow of the program. It works through the steps to load and scale the inputted data, inject anomalies and run each detector, then evaluate and report.
**run_train_test_benchmark()** trains on the first 70% of the data and tests on the last 30% with added anomalies.
**Modes:** Includes 3 modes: synthetic, which trains and tests on the same data with anomalies; train/test, which fits to older data and tests on newer data; and NAB, which uses real machine temperature data.
**Output:** Gives the results of precision, recall, F1 and AUC for each detector it runs.
**Comments:** Synthetic mode trains on the same data it tests on, so the results it gives are possibly inflated, and direct comparison between it and the other modes isn't accurate. NAB is useful as it's real data with real anomalies in it, not just a made-up CSV file with injected anomalies added for testing. Along with this, the timestamp code in train/test mode sets the timestamps starting from 1st Jan 2024 instead of using the real timestamps. If this was used on real sensor data, it would mess up the timestamps.

## models_output_adapter.py
**What does it do:** This file acts as the translator between the detectors and the rest of the platform. It takes the raw detector output and converts it into the project's standard alert format. This gives Analytics Integration and the frontend devs a standard way to receive the alerts generated from the models.
**Main function:** adapt_models_output() takes in the detector results and additional info (which sensors were used, plus optional sensor values).
**Checks:** Validity checks make sure all required fields are there and have appropriate values (timestamps, model_name, score, runtime etc.).
**Output:** Gives a list of alerts, one for each reading labelled as an anomaly. Each alert also includes additional info like the model name, score and timestamp.
**Comments:** Currently severity is always set to None. This is being worked on by the Models team this trimester, but for now users can't use the severity feature. It also creates one alert per flagged reading, so a single event can show up as lots of separate alerts. Scores aren't normalised either.

## evaluator.py
**What does it do:** Marks how well each detector did. Compares what the detector flagged against the real anomalies and works out the scores.
**Main function:** evaluate() takes the detector output and the true labels.
**Checks:** Makes sure the output has anomaly_flag and model_name, and lines up the predictions with the labels so they match.
**Output:** Gives precision, recall, F1, ROC-AUC, how many were flagged vs how many were real, and the true/false positives and negatives.
**Comments:** Precision, recall and F1 use the flags, but ROC-AUC uses the scores. That's why Isolation Forest got 1.0 AUC but only 0.67 recall on synthetic. The scores ranked every anomaly right, but the 5% cap stopped it flagging all of them, so the issue is the threshold, not the model.

## anomaly_injector.py
used to add fake anomalies (level shift, spikes) to clean data and returns where the data points are so detectors can be tested and scored. Uses random fixed seed so anomalies are same each run through. Adds set number of anomalies not % based, so data size would not scale with anomaly size in testing.

## preprocessor.py
Loads in a csv, uses the real timestamp column if there is one, otherwise will make a new timestamp per second. Helps with cleaning data, drops empty value rows and scales values 0-1 with minmaxscaler
**Comments:** any columns with an empty value get completely dropped, which could mean potential data loss before giving results.

## input_validator.py
Checks the sensor data before it gets to the detector, so invalid data gets caught early with an error. checks the data isn't empty, the timestamps are valid with no duplicates (if there's no timestamp column it makes per second ones similar to preprocessor.py and the sensor columns are numbers. It can also tag data with a sensor ID.
**Comments:** If any sensor value is missing, it rejects the whole dataset. Preprocessor.py just drops those rows instead, so the two files don't handle missing data the same way.

## detector_runner.py
Gives one shared function, run_detector(), to run a detector by name and get back either a success with the results or a fail with an error message. Setting controls like contamination can be passed in through parameters, so it doesn't have to stay at always 0.05.
**Comments:** Only Isolation Forest is supported currently. Any other detector name just returns that it's not supported, so the other 10 detectors only work in the benchmark pipeline. It also makes a new detector every time it runs, so the model gets retrained on each batch of data instead of using a trained model.