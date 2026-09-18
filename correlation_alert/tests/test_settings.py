from correlation_alert import settings


def test_load_settings_reads_runtime_environment():
    configured = settings.load_settings(
        {
            "CORRELATION_HOST": "0.0.0.0",
            "CORRELATION_PORT": "5002",
            "CORRELATION_SERVICE_URL": "https://correlation.example.test",
            "CORRELATION_TIMEOUT_SECONDS": "45",
            "CORRELATION_LOG_LEVEL": "warning",
            "CORRELATION_LOG_FILE": "service.log",
            "CORRELATION_DEBUG": "true",
        }
    )

    assert configured.host == "0.0.0.0"
    assert configured.port == 5002
    assert configured.service_url == "https://correlation.example.test"
    assert configured.request_timeout_seconds == 45
    assert configured.log_level == "WARNING"
    assert configured.log_file == "service.log"
    assert configured.debug is True


def test_load_settings_uses_safe_defaults_for_invalid_values():
    configured = settings.load_settings(
        {
            "CORRELATION_HOST": "0.0.0.0",
            "CORRELATION_PORT": "0",
            "CORRELATION_TIMEOUT_SECONDS": "invalid",
            "CORRELATION_LOG_LEVEL": "verbose",
        }
    )

    assert configured.port == 5001
    assert configured.service_url == "http://0.0.0.0:5001"
    assert configured.request_timeout_seconds == 30
    assert configured.log_level == "INFO"
