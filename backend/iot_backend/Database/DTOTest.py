import pytest
from uuid import UUID
from datetime import datetime
from dto import (
    UserRegistrationDTO, UserLoginDTO, AuthResponseDTO,
    DeviceRegistrationDTO, DeviceResponseDTO, DeviceLocationDTO, DeviceListDTO,
    SensorStreamDTO, SensorDataPointDTO, SensorDataResponseDTO, BulkDataUploadDTO,
    CorrelationResultDTO, AnomalyDetectionDTO,
    FileUploadRequestDTO, FileUploadResponseDTO,
    ChatMessageDTO, ChatSessionDTO, ChatRequestDTO,
    SystemStatusDTO, ErrorResponseDTO
)


def test_user_registration_dto_valid():
    # Arrange
    email = "testuser@example.com"
    password = "SecurePassword123!"
    mfa_enabled = True

    # Act
    dto = UserRegistrationDTO(email=email, password=password, mfa_enabled=mfa_enabled)

    # Assert
    assert dto.email == email
    assert dto.password == password
    assert dto.mfa_enabled == mfa_enabled


def test_user_registration_dto_invalid():
    # Test missing required fields
    with pytest.raises(TypeError):
        UserRegistrationDTO(password="SecurePassword123!")  # Missing email

    # Test invalid email (if validation is implemented)
    email = "invalid-email"
    password = "SecurePassword123!"
    dto = UserRegistrationDTO(email=email, password=password)
    assert dto.email == email  # Should still pass unless validation is added

def test_device_response_dto():
    # Arrange
    device_id = UUID("123e4567-e89b-12d3-a456-426614174000")
    user_id = UUID("123e4567-e89b-12d3-a456-426614174001")
    name = "Temperature Sensor 1"
    device_type = "temperature"
    registered_at = datetime(2025, 4, 24)
    location = {"latitude": 40.7128, "longitude": -74.0060}
    status = "active"

    # Act
    dto = DeviceResponseDTO(
        device_id=device_id,
        user_id=user_id,
        name=name,
        device_type=device_type,
        registered_at=registered_at,
        location=location,
        status=status,
    )

    # Assert
    assert dto.device_id == device_id
    assert dto.user_id == user_id
    assert dto.name == name
    assert dto.type == device_type  # Verify type is correctly mapped
    assert dto.registered_at == registered_at
    assert dto.location == location
    assert dto.status == status

def test_device_location_dto():
    # Arrange
    latitude = 40.7128
    longitude = -74.0060

    # Act
    dto = DeviceLocationDTO(latitude=latitude, longitude=longitude)

    # Assert
    assert dto.latitude == latitude
    assert dto.longitude == longitude


# --- Authentication Domain Tests ---
def test_user_login_dto_with_mfa():
    dto = UserLoginDTO(
        email="user@example.com",
        password="Password123!",
        mfa_code="123456"
    )
    assert dto.mfa_code == "123456"

def test_auth_response_dto_token_types():
    dto = AuthResponseDTO(
        access_token="access_123",
        refresh_token="refresh_123",
        expires_in=3600,
        token_type="bearer",
        mfa_required=True
    )
    assert dto.token_type == "bearer"
    assert dto.mfa_required is True

# --- Device Management Tests ---
def test_device_registration_without_location():
    dto = DeviceRegistrationDTO(
        name="Motion Sensor 1",
        device_type="motion"
    )
    assert dto.location is None
    assert dto.type == "motion"

def test_device_list_pagination():
    devices = [
        DeviceResponseDTO(
            device_id=UUID(int=i),
            user_id=UUID(int=1),
            name=f"Sensor {i}",
            device_type="temperature",
            registered_at=datetime.now()
        ) for i in range(3)
    ]
    dto = DeviceListDTO(devices=devices, total_count=3)
    assert len(dto.devices) == 3
    assert dto.total_count == 3

# --- Sensor Data Tests ---
def test_sensor_data_point_normalization():
    now = datetime.now()
    dto = SensorDataPointDTO(
        timestamp=now,
        value=25.4,
        normalized_value=1.2
    )
    assert dto.normalized_value == 1.2
    assert dto.timestamp == now

def test_bulk_data_upload_timestamps():
    test_time = datetime(2025, 1, 1, 12, 0)
    dto = BulkDataUploadDTO(
        device_id=UUID(int=1),
        metric_name="temperature",
        readings=[{test_time: 22.5}]
    )
    assert test_time in dto.readings[0]

# --- Analytics Tests ---
def test_correlation_result_boundaries():
    dto = CorrelationResultDTO(
        correlation_id=UUID(int=1),
        stream_a=UUID(int=2),
        stream_b=UUID(int=3),
        coefficient=0.85,
        window_start=datetime(2025, 1, 1),
        window_end=datetime(2025, 1, 2),
        algorithm="pearson"
    )
    assert -1 <= dto.coefficient <= 1
    assert dto.window_end > dto.window_start

def test_anomaly_detection_statuses():
    for status in ["pending", "confirmed", "resolved"]:
        dto = AnomalyDetectionDTO(
            anomaly_id=UUID(int=1),
            stream_id=UUID(int=2),
            detected_at=datetime.now(),
            anomaly_type="spike",
            raw_value=100.5,
            confidence_score=0.99,
            status=status
        )
        assert dto.status == status

# --- File Operations Tests ---
def test_file_upload_format_validation():
    for fmt in ["csv", "json", "xlsx"]:
        dto = FileUploadRequestDTO(file_format=fmt)
        assert dto.format == fmt

# --- Chat System Tests ---
def test_chat_session_message_ordering():
    messages = [
        ChatMessageDTO(
            message_id=UUID(int=i),
            content=f"Message {i}",
            is_bot=(i % 2 == 0),
            sent_at=datetime.now() - timedelta(minutes=i)
        ) for i in range(3)
    ]
    dto = ChatSessionDTO(
        session_id=UUID(int=1),
        user_id=UUID(int=1),
        started_at=datetime.now() - timedelta(hours=1),
        messages=messages
    )
    assert dto.messages[0].message_id.int == 0  # First message has ID=0
    assert dto.messages[-1].content == "Message 2"

# --- System Health Tests ---
def test_system_status_components():
    dto = SystemStatusDTO(
        database=True,
        storage=False,
        analytics_engine=True,
        last_updated=datetime.now()
    )
    assert dto.database is True
    assert dto.storage is False

# --- Error Handling Tests ---
def test_error_response_with_details():
    details = {"field": "email", "issue": "already exists"}
    dto = ErrorResponseDTO(
        error_code="CONFLICT_409",
        message="Resource conflict",
        details=details
    )
    assert dto.details["field"] == "email"

# --- Edge Case Tests ---
def test_empty_device_list():
    dto = DeviceListDTO(devices=[], total_count=0)
    assert len(dto.devices) == 0

def test_high_frequency_sensor_stream():
    dto = SensorStreamDTO(
        stream_id=UUID(int=1),
        device_id=UUID(int=1),
        metric_name="vibration",
        sampling_rate=1000,  # 1kHz sampling
        created_at=datetime.now()
    )
    assert dto.sampling_rate == 1000
