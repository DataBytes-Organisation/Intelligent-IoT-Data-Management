from correlation_alert.alerts import generate_alerts


def load_mock_data():
    """
    Temporary mock dataset for demo/testing.
    NOTE: This will be replaced by real correlation pipeline output.
    """
    return [
        {"sensor": "Temp-Humidity", "delta_r": 0.12},
        {"sensor": "Pressure-Temp", "delta_r": 0.35},
        {"sensor": "CO2-Temperature", "delta_r": 0.55},
        {"sensor": "Vibration-Motor", "delta_r": 0.82},
        {"sensor": "Humidity-Airflow", "delta_r": 0.15},
    ]


def run_alert_pipeline(data=None):
    """
    Wrapper pipeline for alert generation.

    - If data is provided → use it (future integration with correlation pipeline)
    - If not → fall back to mock data (demo mode)
    """
    if data is None:
        data = load_mock_data()

    alerts = generate_alerts(data)
    return alerts


if __name__ == "__main__":
    alerts = run_alert_pipeline()

    print("=" * 52)
    print("      CORRELATION CHANGE ALERT SYSTEM")
    print("=" * 52)
    print("\nAnalysis Window: Last 30 Minutes")
    print("Sensors Analysed:", len(alerts))
    print("Threshold Δr: 0.30\n")

    print("-" * 52)
    print(f"{'Sensor Pair':25} {'Δr Change':12} {'Alert'}")
    print("-" * 52)

    for item in alerts:
        level = item["level"] if item["level"] else "NORMAL"
        print(f"{item['sensor']:25} {item['delta_r']:<12.2f} {level}")

    low = sum(1 for a in alerts if a["level"] == "LOW")
    med = sum(1 for a in alerts if a["level"] == "MEDIUM")
    high = sum(1 for a in alerts if a["level"] == "HIGH")

    print("\n" + "-" * 52)
    print("SUMMARY")
    print("-" * 52)
    print("Total Pairs Checked :", len(alerts))
    print("Alerts Triggered    :", low + med + high)
    print("LOW Alerts          :", low)
    print("MEDIUM Alerts       :", med)
    print("HIGH Alerts         :", high)
    print("\nStatus: Monitoring Active")
    print("=" * 52)