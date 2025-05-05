import json
from django.core.management.base import BaseCommand
from timeseries.models import ProcessedSensorData
from django.utils.dateparse import parse_datetime

class Command(BaseCommand):
    help = "Import processed sensor data from JSON"

    def add_arguments(self, parser):
        parser.add_argument("file_path", type=str)

    def handle(self, *args, **kwargs):
        path = kwargs["file_path"]
        with open(path) as f:
            data = json.load(f)

        count = 0
        for entry in data:
            try:
                ProcessedSensorData.objects.create(
                    created_at=parse_datetime(entry["created_at"]),
                    entry_id=entry["entry_id"],
                    temperature=entry["Temperature"],
                    humidity=entry["RH Humidity"],
                    light_index=entry["Usable Light Index"],
                    atmosphere=entry["Atmosphere hPa"],
                    voltage=entry["Voltage Charge"],
                    was_interpolated=entry["was_interpolated"],
                )
                count += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"⚠️ Skipping entry: {e}"))

        self.stdout.write(self.style.SUCCESS(f"Imported {count} records."))
