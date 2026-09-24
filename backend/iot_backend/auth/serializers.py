# iot_backend/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import password_validation

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']

    def validate(self, data):
        # Check if passwords match
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords must match.")
        
        # Validate password strength
        password_validation.validate_password(data['password'])
        return data

    def create(self, validated_data):
        # Remove password2 as it is not needed
        validated_data.pop('password2')
        
        # Create the user
        user = User.objects.create_user(**validated_data)
        return user
