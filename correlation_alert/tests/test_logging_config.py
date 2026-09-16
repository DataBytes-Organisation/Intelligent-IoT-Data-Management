import logging

from correlation_alert import logging_config
from correlation_alert.settings import ServiceSettings


def test_configure_logging_uses_supplied_level_without_duplicate_handlers():
    configured = ServiceSettings(
        host="127.0.0.1",
        port=5001,
        service_url="http://127.0.0.1:5001",
        request_timeout_seconds=30,
        log_level="WARNING",
        log_file=None,
        debug=False,
    )

    root_logger = logging_config.configure_logging(configured)
    logging_config.configure_logging(configured)

    try:
        assert root_logger.level == logging.WARNING
        assert len(root_logger.handlers) == 1
    finally:
        root_logger.handlers.clear()
