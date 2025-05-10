from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TimeSeriesDataViewSet , ProcessedSensorDataViewSet

router = DefaultRouter()
router.register(r'data', TimeSeriesDataViewSet, basename='timeseries')
router.register(r'processed', ProcessedSensorDataViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
