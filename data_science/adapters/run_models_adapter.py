import json

from data_science.adapters.models_output_adapter import adapt_models_output


# --- REAL MODELS OUTPUT (batch format) ---
model_result = {
    "model_name": "IsolationForest",
    "timestamp": [
        "2026-08-05T08:20:00Z",
        "2026-08-05T08:21:00Z",
        "2026-08-05T08:22:00Z",
        "2026-08-05T08:23:00Z",
    ],
    "anomaly_flag": [
        False,
        True,
        False,
        True,
    ],
    "score": [
        0.12,
        0.91,
        0.18,
        0.95,
    ],
    "runtime": 0.024,  # seconds
}


# --- INPUT CONTEXT (as required by review) ---
input_context = {
    "entity_id": "sensor_node_01",
    "metrics": ["temperature"],
    "sensor_values": [29.8, 31.8, 30.1, 33.1],
}


# --- PRINT RAW INPUT ---
print("\n================ RAW MODELS OUTPUT ================\n")
print(json.dumps(model_result, indent=4))


# --- RUN ADAPTER ---
adapted_output = adapt_models_output(
    model_result,
    input_context,
)


# --- PRINT ADAPTED OUTPUT ---
print("\n================ ADAPTED OUTPUT (DRAFT V0.1) ================\n")
print(json.dumps(adapted_output, indent=4))


# --- SUMMARY CHECK ---
print("\n================ SUMMARY CHECK ================\n")
print(f"Total alerts generated: {len(adapted_output)}")


# --- GENERATE MAPPING TABLE ---
def print_mapping_table():
    print("\n================ FIELD MAPPING TABLE ================\n")

    mapping = [
        ("model_name", "method", "Direct mapping"),
        ("timestamp", "timestamp", "Converted to ISO 8601"),
        (
            "anomaly_flag",
            "alerts inclusion",
            "Only True values produce alerts",
        ),
        ("score", "score", "Preserved raw"),
        (
            "runtime",
            "supporting_values.runtime_ms",
            "seconds → milliseconds",
        ),
        (
            "input_context.metrics",
            "target.metrics",
            "Passed from caller",
        ),
        (
            "input_context.entity_id",
            "target.entity_id",
            "Passed from caller",
        ),
        (
            "sensor_values",
            "supporting_values.sensor_value",
            "Optional inclusion",
        ),
    ]

    print("| Raw Models field | Draft V0.1 field | Conversion |")
    print("|------------------|------------------|------------|")

    for raw, target, conv in mapping:
        print(f"| {raw} | {target} | {conv} |")


# --- CALL MAPPING TABLE ---
print_mapping_table()