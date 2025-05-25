from django.core.management.base import BaseCommand
from timeseries.models import TimeSeriesData
from django.utils.timezone import make_aware

import pandas as pd
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Import time-series data from an Excel file'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to the Excel file')

    def handle(self, *args, **kwargs):
        file_path = kwargs['file_path']

        # Try loading the Excel sheet
        try:
            df = pd.read_excel(file_path, sheet_name="Simple Data Relation")
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Failed to load Excel: {e}"))
            return

        # Helper to safely parse float
        def safe_float(value):
            try:
                return float(value)
            except (ValueError, TypeError):
                return None

        # Looping through each row
        for index, row in df.iterrows():
            try:
                # Parse time column
                raw_time = row['time']

                if isinstance(raw_time, str):
                    timestamp = datetime.strptime(raw_time.strip(), "%H:%M:%S")
                elif isinstance(raw_time, (int, float)):
                    timestamp = datetime(1900, 1, 1) + timedelta(minutes=raw_time)
                elif isinstance(raw_time, pd.Timestamp):
                    timestamp = raw_time.to_pydatetime()
                else:
                    raise ValueError("Unsupported time format")

                # Make timezone-aware
                timestamp = make_aware(timestamp)

                # Save row to DB
                TimeSeriesData.objects.create(
                    timestamp=timestamp,
                    sensor1=row['sensor 1'],
                    sensor2=row['sensor 2'],
                    sensor3=row['sensor 3'],
                    correlation_s1_s2=safe_float(row.get('c(s1, s2)', None)),
                    correlation_s2_s3=safe_float(row.get('c(s2, s3)', None)),
                    correlation_s1_s3=safe_float(row.get('c(s1, s3)', None)),
                )

            except Exception as row_error:
                self.stdout.write(self.style.WARNING(f"Skipping row {index}: {row_error}"))

        self.stdout.write(self.style.SUCCESS(" Data import complete."))
