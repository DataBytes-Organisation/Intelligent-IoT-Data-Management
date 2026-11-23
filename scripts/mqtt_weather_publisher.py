import json
import time

import pandas as pd
import paho.mqtt.client as mqtt

# Configuration

BROKER = "broker.emqx.io"
PORT = 1883

TOPIC = "iiotdm/replay/avalon_airport"

QOS = 1

PUBLISH_INTERVAL = 2

DATASET_PATH = "datasets/avalon.csv"
# MQTT Client
client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2
)
client.connect(BROKER, PORT, 60)
print("Connected to MQTT broker")
# Load Dataset
df = pd.read_csv(DATASET_PATH)

df.columns = df.columns.str.strip()

print(f"Loaded {len(df)} records")
# Publish Loop

for index, row in df.iterrows():

    payload = {
        "created_at": str(row["time"]),
        "entry_id": index + 1,
        "field1": float(row["temp"]),
        "field2": float(row["rhum"]),
        "field3": float(row["pres"]),
        "field4": float(row["wspd"])
    }

    client.publish(
        TOPIC,
        json.dumps(payload),
        qos=QOS
    )

    print(
        f"Published row {index + 1}"
    )

    print(json.dumps(payload))

    time.sleep(PUBLISH_INTERVAL)

client.disconnect()

print("Simulation complete")