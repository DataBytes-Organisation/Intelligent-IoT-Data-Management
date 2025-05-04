# iot_backend/urls.py
from django.urls import path
from .views import UserRegistrationView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),  # User registration
    path('login/', TokenObtainPairView.as_view(), name='login'),  # JWT login
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # JWT refresh token
]
