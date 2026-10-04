import os
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed

from docker import DockerClient
from prometheus_client import CollectorRegistry, Gauge, generate_latest, CONTENT_TYPE_LATEST
from prometheus_client.core import REGISTRY
from wsgiref.simple_server import make_server


COMPOSE_PROJECT = os.environ.get("COMPOSE_PROJECT_NAME", "capstoneb_build_and_develop")
MONITORED_SERVICES = {
    "analytics-integration",
    "backend",
    "db",
    "docker-service-exporter",
    "frontend",
    "grafana",
    "mailhog",
    "prometheus",
}

client = DockerClient(base_url="unix://var/run/docker.sock", timeout=5)


def parse_cpu_percent(stats):
    cpu_stats = stats.get("cpu_stats", {})
    precpu_stats = stats.get("precpu_stats", {})

    cpu_total = cpu_stats.get("cpu_usage", {}).get("total_usage", 0)
    precpu_total = precpu_stats.get("cpu_usage", {}).get("total_usage", 0)
    system_total = cpu_stats.get("system_cpu_usage", 0)
    presystem_total = precpu_stats.get("system_cpu_usage", 0)
    cpu_delta = cpu_total - precpu_total
    system_delta = system_total - presystem_total

    online_cpus = cpu_stats.get("online_cpus") or len(cpu_stats.get("cpu_usage", {}).get("percpu_usage", []) or [1])

    if cpu_delta <= 0 or system_delta <= 0:
        return 0.0

    return (cpu_delta / system_delta) * online_cpus * 100.0


def get_service_name(container):
    labels = container.labels or {}
    return labels.get("com.docker.compose.service") or container.name


def collect_container_sample(container):
    attrs = container.attrs or {}
    state_info = attrs.get("State", {})
    state = state_info.get("Status", "unknown")
    health = state_info.get("Health", {}).get("Status", "none")
    service = get_service_name(container)

    if service not in MONITORED_SERVICES:
        return None

    labels = {
        "service": service,
        "container_name": container.name,
        "state": state,
        "health": health,
    }

    restart_count = float(attrs.get("RestartCount", 0))

    start_time = 0.0
    started_at = state_info.get("StartedAt")
    if started_at:
        try:
            start_time = datetime.fromisoformat(started_at.replace("Z", "+00:00")).timestamp()
        except ValueError:
            start_time = 0.0

    if state == "running":
        try:
            stats = container.stats(stream=False)
            memory_usage = float(stats.get("memory_stats", {}).get("usage", 0))
            cpu_percent = float(parse_cpu_percent(stats))
        except Exception:
            memory_usage = 0.0
            cpu_percent = 0.0
    else:
        memory_usage = 0.0
        cpu_percent = 0.0

    return labels, restart_count, start_time, memory_usage, cpu_percent


def build_metrics_output():
    registry = CollectorRegistry()

    cpu_gauge = Gauge(
        "iot_docker_service_cpu_percent",
        "Docker service CPU usage percent",
        labelnames=["service", "container_name", "state", "health"],
        registry=registry,
    )
    memory_gauge = Gauge(
        "iot_docker_service_memory_usage_bytes",
        "Docker service memory usage in bytes",
        labelnames=["service", "container_name", "state", "health"],
        registry=registry,
    )
    restart_gauge = Gauge(
        "iot_docker_service_restart_count",
        "Docker service restart count",
        labelnames=["service", "container_name", "state", "health"],
        registry=registry,
    )
    start_time_gauge = Gauge(
        "iot_docker_service_start_time_seconds",
        "Docker service container start time as unix epoch seconds",
        labelnames=["service", "container_name", "state", "health"],
        registry=registry,
    )
    up_gauge = Gauge(
        "iot_docker_service_up",
        "Docker service up status where 1 is running",
        labelnames=["service", "container_name", "state", "health"],
        registry=registry,
    )

    containers = client.containers.list(
        all=True,
        filters={"label": f"com.docker.compose.project={COMPOSE_PROJECT}"},
    )

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(collect_container_sample, container) for container in containers]

        for future in as_completed(futures):
            result = future.result()
            if result is None:
                continue

            labels, restart_count, start_time, memory_usage, cpu_percent = result

            up_gauge.labels(**labels).set(1 if labels["state"] == "running" else 0)
            restart_gauge.labels(**labels).set(restart_count)
            start_time_gauge.labels(**labels).set(start_time)
            memory_gauge.labels(**labels).set(memory_usage)
            cpu_gauge.labels(**labels).set(cpu_percent)

    return generate_latest(registry)


def application(_environ, start_response):
    output = build_metrics_output()
    start_response("200 OK", [("Content-Type", CONTENT_TYPE_LATEST)])
    return [output]


if __name__ == "__main__":
    server = make_server("0.0.0.0", 9104, application)
    server.serve_forever()
