from rest_framework import serializers
from .models import TimeSeriesData, ProcessedSensorData

class TimeSeriesDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSeriesData
        fields = '__all__'

class ProcessedSensorDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessedSensorData
        fields = '__all__'
