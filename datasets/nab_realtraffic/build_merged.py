"""Merge the univariate NAB streams into multi-sensor CSVs for the correlation pipeline."""
import pandas as pd

def load(path, name):
    return pd.read_csv(f"raw/{path}", parse_dates=["timestamp"]).rename(columns={"value": name})

# Primary: one Minnesota DoT station, two metrics.
m = load("occupancy_t4013.csv", "occupancy_t4013").merge(
    load("speed_t4013.csv", "speed_t4013"), on="timestamp", how="inner")
# Intermediate, not shipped: two streams only, fails the three stream requirement.

# Primary dataset: add station 6005 for four streams.
m.merge(load("occupancy_6005.csv", "occupancy_6005"), on="timestamp").merge(
    load("speed_6005.csv", "speed_6005"), on="timestamp"
).to_csv("traffic_4stream_merged.csv", index=False)

# Negative control: three independent AWS CloudWatch streams.
load("ec2_cpu_utilization_825cc2.csv", "ec2_cpu").merge(
    load("ec2_network_in_257a54.csv", "ec2_net"), on="timestamp").merge(
    load("elb_request_count_8c0756.csv", "elb_req"), on="timestamp"
).to_csv("aws_control_merged.csv", index=False)
