# Reusable Detector Testing

## 1. Purpose

This document describes the reusable testing process developed for the Models pipeline.

The purpose of this implementation is to provide one common testing process that can be reused for the current anomaly detector and for future detectors added to the project. Isolation Forest was used as the first detector for validation.

The testing process uses the existing detector runner instead of creating a separate detector pipeline. This keeps detector selection and detector construction within the existing Models code while allowing the same testing process to be applied to different detectors.

The testing process covers normal data, obvious anomalies, no-anomaly data, very small datasets, missing values, invalid values, different sensor scales, single-sensor data, multivariate data and constant features.

---

## 2. Implementation

The reusable testing implementation consists of the following files:

- `data_science/testing/__init__.py`
- `data_science/testing/detector_test_module.py`
- `data_science/testing/test_cases.py`
- `data_science/tests/test_detector_test_module.py`

The existing detector runner was also updated:

- `data_science/detector_runner.py`

The runner now preserves the `metrics` field returned by the detector. This allows the testing module to report which sensor metrics were used during detection.

The existing model output adapter test was also updated so that its expected message matches the current adapter behaviour.

---

## 3. Testing Architecture

The testing process follows the existing detector architecture.

The flow is:

**Test Case → DetectorTestModule → Existing detector_runner → Selected Detector → Detector Result → Result Validation → Structured Test Result**

For Isolation Forest, the execution path is:

**Test Case → DetectorTestModule → `run_detector("isolationforest", ...)` → `IsolationForestDetector` → Detector Result → DetectorTestModule validation**

The testing module does not directly create an `IsolationForestDetector` instance. Detector selection remains inside `detector_runner`.

This allows future detectors to use the same testing process after they are registered with the existing detector runner.

---

## 4. Detector Test Case

Each test scenario is represented by a `DetectorTestCase`.

A test case contains:

- `name`
- `dataframe`
- `description`
- optional detector `parameters`

The `parameters` field allows detector configuration to be supplied for an individual test case. If no case-specific parameters are supplied, the parameters configured for the `DetectorTestModule` are used.

The test case is passed to `DetectorTestModule`, which sends the data through the existing detector runner.

This keeps the test data separate from the testing logic.

---

## 5. Reusable Detector Test Module

The `DetectorTestModule` provides two main operations.

### `run_case()`

Runs one `DetectorTestCase` through the selected detector and validates the returned result.

### `run_cases()`

Runs a list of test cases and returns a combined report containing:

- detector name
- parameters
- total number of test cases
- number of passed cases
- number of failed cases
- individual test results

If the detector runner returns a failure, the testing module records the error and marks that test case as failed instead of stopping the complete test process.

---

## 6. Result Contract Validation

The reusable module checks that the detector returns the expected common result fields.

The required fields are:

- `status`
- `model_name`
- `anomaly_flag`
- `score`
- `timestamp`
- `runtime`

The module checks that:

1. all required fields are present;
2. `anomaly_flag` has the same length as the input data;
3. `score` has the same length as the input data;
4. `timestamp` has the same length as the input data;
5. `anomaly_flag` contains boolean values;
6. `score` contains numeric values.

For a successful case, the module also records:

- anomaly count
- normal count
- minimum score
- maximum score
- runtime
- detector metrics

The `metrics` field is read from the detector result when available. It is not part of the required result-field validation.

This provides a common result structure that can be used when testing future detectors.

---

## 7. Representative Test Cases

The reusable test data contains ten scenarios.

| Test case | Purpose |
|---|---|
| `clean_data` | Test normal sensor readings |
| `obvious_anomalies` | Test detection of extreme sensor values |
| `no_anomalies` | Test stable readings with no intentionally injected anomaly |
| `too_few_readings` | Test behaviour with a very small dataset |
| `missing_values` | Test data containing `NaN` values |
| `invalid_values` | Test data containing a non-numeric sensor value |
| `different_sensor_scales` | Test sensors using substantially different numeric ranges |
| `single_sensor` | Test a single sensor metric |
| `multivariate_data` | Test multiple sensor metrics together |
| `constant_feature` | Test a dataset containing a constant feature |

The test cases are defined in `data_science/testing/test_cases.py`.

Keeping these cases in a separate module allows them to be reused by future detector tests.

---

## 8. Isolation Forest Configuration

Isolation Forest was used as the first detector for validation.

The main validation configuration was:

- `contamination = 0.05`
- `n_estimators = 100`
- `random_state = 42`

The current Isolation Forest implementation accepts the sensor DataFrame directly.

When the detector has not already been fitted, the current `detect()` implementation fits the Isolation Forest model using the supplied DataFrame before generating predictions and scores.

The detector then returns:

- anomaly flags
- anomaly scores
- model name
- timestamps
- runtime
- sensor metrics

This fit-and-detect behaviour is important when interpreting the test results because the current test cases are not using a separate training dataset and test dataset.

---

## 9. Representative Test Results

The representative suite contains ten scenarios.

The observed results were:

| Scenario | Result | Observed behaviour |
|---|---|---|
| Clean data | Passed | 1 observation was flagged |
| Obvious anomalies | Passed | 1 observation was flagged |
| No anomalies | Passed | 0 observations were flagged |
| Too few readings | Passed | The detector executed and returned 0 flagged observations |
| Missing values | Passed | The detector executed and returned 1 flagged observation |
| Invalid values | Failed | A non-numeric value caused a float conversion error |
| Different sensor scales | Passed | The detector executed and returned 1 flagged observation |
| Single sensor | Passed | The detector executed successfully |
| Multivariate data | Passed | The detector executed using three sensor metrics |
| Constant feature | Passed | The detector executed and returned 1 flagged observation |

The complete representative run produced:

- Total cases: 10
- Passed: 9
- Failed: 1

The invalid-values scenario was the only failed case.

The failure was captured by the reusable testing module and reported as part of the test results.

---

## 10. Clean Data

The clean dataset contains normal temperature and pressure readings.

Using the default validation configuration, the detector flagged one observation.

This result shows that a dataset created as a normal baseline does not necessarily result in zero Isolation Forest alerts.

The anomaly count needs to be interpreted together with the detector configuration and the distribution of the input data.

Because the current detector fits on the supplied DataFrame when it is not already fitted, this test is a detector-behaviour check rather than a separate train/test performance evaluation.

---

## 11. Obvious Anomalies

The obvious-anomaly dataset contains three manually injected extreme values:

- temperature = `100`
- temperature = `-50`
- pressure = `500`

The detector executed successfully, but only one observation was flagged.

The flagged observation was:

- timestamp: `2026-08-01 00:17:00`
- temperature: `23.578947`
- pressure: `500.0`

This result is important when interpreting Isolation Forest output.

The presence of an extreme value in a single sensor does not guarantee that every manually injected anomaly will be classified as anomalous. The result depends on the complete feature distribution and the detector configuration.

The purpose of this test is therefore to observe detector behaviour rather than assume that every injected value must be detected.

---

## 12. No-Anomaly Data

The no-anomaly dataset contains constant temperature and pressure readings.

The observed result was:

- anomaly count: `0`
- normal count: `20`

The detector completed successfully.

This provides a baseline case for checking detector behaviour when the input contains no intentionally introduced variation.

---

## 13. Too Few Readings

The small-data scenario contains only two sensor readings.

The detector executed successfully and returned:

- anomaly count: `0`
- normal count: `2`

The current implementation does not explicitly reject a very small input dataset.

This is an important observation for future use because successful execution does not by itself establish that there is enough data for reliable anomaly detection.

---

## 14. Missing Values

The missing-value scenario contains `NaN` values in the sensor data.

In the current test environment, Isolation Forest executed successfully and returned one flagged observation.

This is the behaviour observed during the validation run.

It should not be treated as a guarantee that every possible missing-value pattern will be handled successfully. Input validation and preprocessing may still be required depending on the data source and detector being used.

---

## 15. Invalid Values

The invalid-value scenario contains a non-numeric sensor value:

`invalid`

The detector failed because the value could not be converted to a numeric value.

The observed error was:

`could not convert string to float: 'invalid'`

The reusable testing module captured this error and reported the test case as failed.

This shows that the current Isolation Forest path does not perform conversion or cleaning of invalid non-numeric sensor values before the data reaches the model.

Input validation should therefore be considered before detector execution when sensor data may contain invalid values.

---

## 16. Different Sensor Scales

The different-scale scenario contains:

- temperature: approximately `20` to `24`
- pressure: approximately `100000` to `104000`

The detector executed successfully and returned one flagged observation.

This scenario is included because different IoT sensors can naturally operate on very different numeric ranges.

The test confirms that the current implementation can execute on this type of input. It does not by itself establish that feature scale will have no effect on detector behaviour for other datasets.

---

## 17. Single Sensor

The single-sensor scenario contains only the `temperature` metric.

The detector executed successfully and returned the expected result structure.

This confirms that the reusable testing process can be applied to both single-metric and multi-metric inputs.

---

## 18. Multivariate Data

The multivariate scenario contains:

- temperature
- pressure
- humidity

A combined anomaly was introduced into the dataset.

The detector executed successfully and returned the three sensor metrics through the detector result.

The returned metrics were:

- `temperature`
- `pressure`
- `humidity`

The `metrics` field is preserved by `detector_runner` so that downstream testing and reporting can identify the sensor metrics supplied to the detector.

This is useful for the Models pipeline because future multivariate detectors can use the same result structure.

---

## 19. Constant Feature

The constant-feature scenario contains a temperature column where every reading has the same value, while the pressure values vary.

The detector completed successfully and returned one flagged observation.

This scenario provides an additional edge case for future detector implementations because different anomaly detection algorithms may handle constant features differently.

---

## 20. Configuration Testing

Additional manual checks were performed to observe the effect of Isolation Forest configuration values.

These checks are separate from the automated 41-test pytest suite.

### 20.1 Contamination

The observed anomaly counts for the obvious-anomaly dataset were:

| Contamination | Flagged observations |
|---:|---:|
| 0.01 | 1 |
| 0.05 | 1 |
| 0.10 | 2 |

The results show that changing `contamination` can change the number of observations classified as anomalous.

The parameter should therefore be considered when interpreting anomaly counts.

### 20.2 Number of Estimators

Using `random_state = 42`, the observed results were:

| `n_estimators` | Flagged observations |
|---:|---:|
| 10 | 1 |
| 50 | 1 |
| 100 | 1 |
| 200 | 1 |

There was no change in the number of flagged observations for this particular dataset and configuration.

This result is specific to the test performed and should not be interpreted as meaning that changing `n_estimators` can never affect detector results.

### 20.3 Random State

A fixed `random_state` of `42` was used during validation.

Using a fixed random state makes the test runs easier to reproduce when comparing configurations or future code changes.

---

## 21. Isolation Forest Limitations Observed During Testing

The testing process identified the following limitations and considerations.

### 21.1 The current detection path fits on the supplied data

When the detector has not already been fitted, `detect()` fits the Isolation Forest model using the same DataFrame that is passed to `detect()`.

The current reusable tests therefore validate execution and detector behaviour on supplied test data. They are not a separate training-versus-testing evaluation.

### 21.2 Contamination affects the number of alerts

The contamination parameter influences the number of observations treated as anomalies.

Changing this parameter can therefore change the alert count without changing the input dataset.

### 21.3 Extreme values are not guaranteed to be detected

The obvious-anomaly scenario contained three extreme values, but only one was flagged.

This shows that an extreme sensor value should not automatically be treated as a guaranteed Isolation Forest detection.

### 21.4 Invalid non-numeric values are not handled

A non-numeric sensor value causes the current detector path to fail.

Input validation should therefore be considered before running the detector.

### 21.5 Very small datasets can still execute

The detector successfully processed a two-row dataset.

The current implementation does not enforce a minimum number of observations.

A successful execution should therefore not be interpreted as evidence that the dataset is large enough for reliable anomaly detection.

### 21.6 Configuration affects interpretation

Anomaly results should be considered together with the detector configuration, particularly:

- `contamination`
- `n_estimators`
- `random_state`

---

## 22. How to Apply the Process to Another Detector

The reusable process can be applied to another detector after it is registered with the existing detector runner.

The general process is:

1. Implement the new detector using the existing detector structure.
2. Register the detector in `data_science/detector_runner.py`.
3. Ensure that the detector returns the common result fields.
4. Reuse the existing representative test cases where they are appropriate.
5. Add detector-specific test cases if the new detector has additional requirements.
6. Create a `DetectorTestModule` using the new detector name.
7. Run the representative test suite.
8. Review both successful cases and captured failures.
9. Document detector-specific behaviour and limitations.

The testing module does not need to know how the new detector is internally implemented.

The detector runner remains responsible for selecting and constructing the detector.

---

## 23. Automated Test Suite

The automated tests were run from the repository root using:

`python -m pytest data_science\tests -v`

The final validation produced:

`41 passed in 4.32s`

The complete test suite includes:

- reusable detector testing tests
- injector tests
- model output adapter tests

The reusable detector test file contains 14 pytest tests. These include individual detector scenarios, unsupported-detector handling, the representative suite and detector result contract checks.

The 10-case representative suite is one part of the automated tests. The configuration checks described in Section 20 were performed separately.

---

## 24. Files Added and Updated

### Added

- `data_science/testing/__init__.py`
- `data_science/testing/detector_test_module.py`
- `data_science/testing/test_cases.py`
- `data_science/tests/test_detector_test_module.py`
- `data_science/docs/reusable_detector_testing.md`

### Updated

- `data_science/detector_runner.py`
- `data_science/tests/test_models_output_adapter.py`

---

## 25. Final Validation

The reusable testing process has been validated using Isolation Forest as the first detector.

The representative suite covered ten different data conditions and recorded both successful behaviour and the invalid-input failure.

The complete project test suite passed with:

`41 passed in 4.32s`

The implementation reuses the existing detector runner and provides a common testing structure that can be applied to future detectors.

The testing also identified several detector-specific behaviours that should be considered when interpreting results, including contamination settings, invalid input handling, very small datasets and the current fit-on-supplied-data behaviour.

The reusable testing process therefore provides both automated result validation and a consistent way to document detector behaviour and limitations.