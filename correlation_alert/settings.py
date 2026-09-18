"""Runtime settings for the Correlation Change Alert service."""

from dataclasses import dataclass
import os
from typing import Mapping


VALID_LOG_LEVELS = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}


def _positive_integer(environ, name, default):
    try:
        value = int(environ.get(name, default))
    except (TypeError, ValueError):
        return default
    return value if value > 0 else default


@dataclass(frozen=True)
class ServiceSettings:
    """Non-secret runtime values used by one service instance."""

    host: str
    port: int
    service_url: str
    request_timeout_seconds: int
    log_level: str
    log_file: str | None
    debug: bool

    def as_dict(self):
        """Return settings that are safe to expose on the status endpoint."""
        return {
            "service_url": self.service_url,
            "request_timeout_seconds": self.request_timeout_seconds,
            "log_level": self.log_level,
            "log_file": self.log_file,
            "debug": self.debug,
        }


def load_settings(environ: Mapping[str, str] | None = None):
    """Build settings from an environment mapping and safe defaults."""
    source = os.environ if environ is None else environ
    host = source.get("CORRELATION_HOST", "127.0.0.1")
    port = _positive_integer(source, "CORRELATION_PORT", 5001)
    service_url = source.get(
        "CORRELATION_SERVICE_URL",
        f"http://{host}:{port}",
    )
    timeout = _positive_integer(source, "CORRELATION_TIMEOUT_SECONDS", 30)
    log_level = source.get("CORRELATION_LOG_LEVEL", "INFO").strip().upper()
    if log_level not in VALID_LOG_LEVELS:
        log_level = "INFO"
    log_file = source.get("CORRELATION_LOG_FILE", "").strip() or None
    debug = source.get("CORRELATION_DEBUG", "false").strip().lower() == "true"

    return ServiceSettings(
        host=host,
        port=port,
        service_url=service_url,
        request_timeout_seconds=timeout,
        log_level=log_level,
        log_file=log_file,
        debug=debug,
    )
