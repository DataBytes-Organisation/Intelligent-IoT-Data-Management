from django.db import models

class TimeSeriesData(models.Model):
    timestamp = models.DateTimeField()
    sensor1 = models.FloatField()
    sensor2 = models.FloatField()
    sensor3 = models.FloatField()
    correlation_s1_s2 = models.FloatField(null=True, blank=True)
    correlation_s2_s3 = models.FloatField(null=True, blank=True)
    correlation_s1_s3 = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.timestamp} | s1: {self.sensor1}, s2: {self.sensor2}, s3: {self.sensor3}"

class ProcessedSensorData(models.Model):
    created_at = models.DateTimeField()
    entry_id = models.IntegerField()
    temperature = models.FloatField()
    humidity = models.FloatField()
    light_index = models.FloatField()
    atmosphere = models.FloatField()
    voltage = models.FloatField()
    was_interpolated = models.BooleanField()

    def __str__(self):
        return f"{self.created_at} | Temp: {self.temperature}"