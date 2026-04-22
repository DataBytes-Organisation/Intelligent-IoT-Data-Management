from correlation_alert.alerts import generate_alert

mock_data = [
    ("sensor_A", 0.25),
    ("sensor_B", 0.45),
    ("sensor_C", 0.65),
    ("sensor_D", 0.85),
]

for sensor, delta in mock_data:
    print(generate_alert(sensor, delta))

