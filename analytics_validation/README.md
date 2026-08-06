# Analytics Response Validator

This validator checks whether a shared Analytics response follows the agreed Version 1 schema used by the Models and Correlation teams.

## Validation

The validator checks:

- Required fields
- Data types
- ISO 8601 timestamps
- Supported alert types
- Supported severity values
- Shared response structure

## Usage

```python
from analytics_validation.response_validator import validate_response

valid, errors = validate_response(response)

if valid:
    print("Response is valid")
else:
    print(errors)
```

## Run Tests

```bash
python -m pytest tests/test_response_validator.py -v
```