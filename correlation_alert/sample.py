from threshold import classify_delta_r
from alerts import generate_alert

mock_data = [
    ("sensor_A", 0.25),
    ("sensor_B", 0.45),
    ("sensor_C", 0.65),
    ("sensor_D", 0.85),
]


def run_pipeline(data):
    results = []

    for sensor, delta_r in data:

        # Step 1: classification
        level = classify_delta_r(delta_r)

        # Step 2: alert generation
        alert = generate_alert(sensor, delta_r, level)

        results.append(alert)

    return results


if __name__ == "__main__":
    alerts = run_pipeline(mock_data)

    print("\n--- Correlation Change Alerts ---\n")

    for a in alerts:
        print(f"Sensor: {a['sensor']}")
        print(f"Δr: {a['delta_r']}")
        print(f"Alert Level: {a['alert_level']}")
        print(f"Status: {a['status']}")
        print("-------------------------------")