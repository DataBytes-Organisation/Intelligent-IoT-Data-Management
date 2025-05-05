from rest_framework import viewsets
from .models import TimeSeriesData, ProcessedSensorData
from .serializers import TimeSeriesDataSerializer, ProcessedSensorDataSerializer

class TimeSeriesDataViewSet(viewsets.ModelViewSet):
    queryset = TimeSeriesData.objects.all().order_by('timestamp')  # sort by time
    serializer_class = TimeSeriesDataSerializer

class ProcessedSensorDataViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProcessedSensorData.objects.all().order_by('created_at')
    serializer_class = ProcessedSensorDataSerializer
