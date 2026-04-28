
# Correlation Alert System – Test Suite

## Overview

This repository contains the test suite for the Correlation Alert System. It is designed to validate the correctness, reliability, and robustness of the system’s core components, including threshold evaluation, alert generation, and the end-to-end processing pipeline.

The tests ensure that changes in correlation (Δr) are accurately interpreted and converted into appropriate alert levels, while maintaining consistent data structures and handling edge cases effectively.

---

## Scope of Testing

### 1. Threshold Logic Validation

The test suite verifies the correct classification of alert levels based on Δr values:

* LOW: 0.3 ≤ Δr < 0.5
* MEDIUM: 0.5 ≤ Δr < 0.7
* HIGH: Δr ≥ 0.7

It also covers:

* Boundary conditions (e.g., exactly 0.3, 0.5, 0.7)
* Values below thresholds
* Negative values and zero
* Invalid inputs such as `None` or non-numeric data

---

### 2. Alert Generation Testing

These tests ensure that alerts are:

* Generated in the correct structure
* Assigned the appropriate alert level
* Assigned the correct status:

  * "alert" when a level is present
  * "normal" when no alert is triggered

The integration between threshold logic and alert generation is also validated.

---

### 3. Integration Testing

End-to-end tests validate the full alert pipeline by:

* Running the system through the main execution module
* Verifying that outputs are correctly formatted
* Ensuring all components work together seamlessly

---

## Alert Data Structure

Each generated alert follows a consistent format:

```python
{
    'sensor': str,      # Sensor identifier
    'delta_r': float,   # Change in correlation
    'level': str/None,  # LOW / MEDIUM / HIGH or None
    'status': str       # 'alert' or 'normal'
}
```

---

## Test Scenarios

| Δr Value | Expected Level | Expected Status |
| -------- | -------------- | --------------- |
| 0.0      | None           | normal          |
| 0.29     | None           | normal          |
| 0.3      | LOW            | alert           |
| 0.5      | MEDIUM         | alert           |
| 0.7      | HIGH           | alert           |
| -0.1     | None           | normal          |

---

## How to Run the Tests

Navigate to the project directory and execute:

```bash
python test_alerts.py
```

For more detailed output:

```bash
python test_alerts.py -v
```

---

## Test Design Principles

* Built using Python’s standard `unittest` framework
* No external dependencies required
* Designed to handle missing modules gracefully
* Covers both typical and edge-case scenarios
* Ensures maintainability and extensibility

---

## Expected Results

Once all system components are fully implemented:

* All tests should pass successfully
* No tests should be skipped
* The system should demonstrate consistent and reliable behavior across all scenarios

---

## Conclusion

This test suite provides comprehensive validation for the Correlation Alert System, ensuring accurate alert classification, proper data handling, and reliable integration across all components. It serves as a foundation for maintaining system quality and supporting future enhancements.

---
