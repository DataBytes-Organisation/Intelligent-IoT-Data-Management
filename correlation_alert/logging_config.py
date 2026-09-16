"""Logging configuration for the Correlation Change Alert service."""

import logging
import os
import sys

from .settings import ServiceSettings, load_settings


ROOT_NAME = "correlation"
_configuration_signature = None


def configure_logging(service_settings: ServiceSettings | None = None):
    """Configure one logger tree from the supplied runtime settings."""
    global _configuration_signature

    configured = service_settings or load_settings()
    signature = (configured.log_level, configured.log_file)
    root_logger = logging.getLogger(ROOT_NAME)
    if signature == _configuration_signature and root_logger.handlers:
        return root_logger

    level = getattr(logging, configured.log_level, logging.INFO)
    formatter = logging.Formatter(
        fmt="%(asctime)s %(levelname)-7s %(name)-24s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )

    for handler in root_logger.handlers:
        handler.close()
    root_logger.handlers.clear()
    root_logger.setLevel(level)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    if configured.log_file:
        directory = os.path.dirname(os.path.abspath(configured.log_file))
        if directory:
            os.makedirs(directory, exist_ok=True)
        file_handler = logging.FileHandler(configured.log_file, encoding="utf-8")
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

    root_logger.propagate = False
    _configuration_signature = signature
    return root_logger


def get_logger(name: str, service_settings: ServiceSettings | None = None):
    """Return a configured child logger for one service module."""
    configure_logging(service_settings)
    return logging.getLogger(f"{ROOT_NAME}.{name}")
