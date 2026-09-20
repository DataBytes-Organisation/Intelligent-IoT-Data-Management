FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt /tmp/root-requirements.txt
COPY data_science/requirements.txt /tmp/data-science-requirements.txt

RUN pip install --no-cache-dir -r /tmp/root-requirements.txt -r /tmp/data-science-requirements.txt prometheus-client

COPY analytics_integration /app/analytics_integration
COPY analytics_validation /app/analytics_validation
COPY correlation_alert /app/correlation_alert
COPY data_science /app/data_science
COPY algorithms /app/algorithms

ENV PYTHONPATH=/app

EXPOSE 5002

CMD ["python", "-m", "analytics_integration.api.server"]
