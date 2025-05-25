from uuid import UUID
from datetime import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, EmailStr
from django.contrib.gis.geos import Point

class UserRegistrationDTO(BaseModel):
    """DTO for user registration requests"""
    def __init__(self, email: EmailStr, password: str, mfa_enabled: Optional[bool] = False):
        self.email = email
        self.password = password
        self.mfa_enabled = mfa_enabled

class UserLoginDTO(BaseModel):
    """DTO for user login requests"""
    def __init__(self, email: EmailStr, password: str, mfa_code: Optional[str] = None):
        self.email = email
        self.password = password
        self.mfa_code = mfa_code

class AuthResponseDTO(BaseModel):
    """DTO for authentication responses"""
    def __init__(self, access_token: str, refresh_token: str, expires_in: int, token_type: str = "bearer", mfa_required: bool = False):
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.token_type = token_type
        self.expires_in = expires_in
        self.mfa_required = mfa_required

class TokenInfoDTO(BaseModel):
    """DTO for token information"""
    def __init__(self, scopes: List[str], expires_at: datetime, created_at: datetime):
        self.scopes = scopes
        self.expires_at = expires_at
        self.created_at = created_at

class DeviceLocationDTO(BaseModel):
    """DTO for device location coordinates"""
    def __init__(self, latitude: float, longitude: float):
        self.latitude = latitude
        self.longitude = longitude

class DeviceRegistrationDTO(BaseModel):
    """DTO for registering new devices"""
    def __init__(self, name: str, device_type: str,  # 'temperature', 'pressure', or 'motion'
        location: Optional[DeviceLocationDTO] = None
    ):
        self.name = name
        self.type = device_type
        self.location = location

class DeviceResponseDTO(BaseModel):
    """DTO for device information responses"""
    def __init__(self, device_id: UUID, user_id: UUID, name: str, device_type: str, registered_at: datetime, location: Optional[Dict[str, float]] = None, status: str = "active"):
        self.device_id = device_id
        self.user_id = user_id
        self.name = name
        self.type = device_type
        self.registered_at = registered_at
        self.location = location
        self.status = status

class DeviceListDTO(BaseModel):
    """DTO for listing devices with pagination"""
    def __init__(self, devices: List[DeviceResponseDTO], total_count: int):
        self.devices = devices
        self.total_count = total_count

class SensorStreamDTO(BaseModel):
    """DTO for sensor stream information"""
    def __init__(self, stream_id: UUID, device_id: UUID, metric_name: str, sampling_rate: int, created_at: datetime):
        self.stream_id = stream_id
        self.device_id = device_id
        self.metric_name = metric_name
        self.sampling_rate = sampling_rate
        self.created_at = created_at

class SensorDataPointDTO(BaseModel):
    """DTO for individual sensor data points"""
    def __init__(self, timestamp: datetime, value: float, normalized_value: Optional[float] = None):
        self.timestamp = timestamp
        self.value = value
        self.normalized_value = normalized_value

class SensorDataResponseDTO(BaseModel):
    """DTO for sensor data responses"""
    def __init__(self, stream: SensorStreamDTO, data: List[SensorDataPointDTO], time_range: Dict[str, datetime], stats: Dict[str, float]):
        self.stream = stream
        self.data = data
        self.time_range = time_range
        self.stats = stats

class BulkDataUploadDTO(BaseModel):
    """DTO for bulk sensor data uploads"""
    def __init__(self, device_id: UUID, metric_name: str, readings: List[Dict[datetime, float]]):
        self.device_id = device_id
        self.metric_name = metric_name
        self.readings = readings

class CorrelationResultDTO(BaseModel):
    """DTO for correlation analysis results"""
    def __init__(self, correlation_id: UUID, stream_a: UUID, stream_b: UUID, coefficient: float, window_start: datetime, window_end: datetime, algorithm: str):
        self.correlation_id = correlation_id
        self.stream_a = stream_a
        self.stream_b = stream_b
        self.coefficient = coefficient
        self.window_start = window_start
        self.window_end = window_end
        self.algorithm = algorithm

class AnomalyDetectionDTO(BaseModel):
    """DTO for anomaly detection results"""
    def __init__(self, anomaly_id: UUID, stream_id: UUID, detected_at: datetime, anomaly_type: str, raw_value: float, confidence_score: float, status: str = "pending"):
        self.anomaly_id = anomaly_id
        self.stream_id = stream_id
        self.detected_at = detected_at
        self.anomaly_type = anomaly_type
        self.raw_value = raw_value
        self.confidence_score = confidence_score
        self.status = status

class FileUploadRequestDTO(BaseModel):
    """DTO for file upload requests"""
    def __init__(self, file_format: str,  # 'csv', 'json', or 'xlsx' 
        expected_columns: Optional[List[str]] = None
    ):
        self.format = file_format
        self.expected_columns = expected_columns

class FileUploadResponseDTO(BaseModel):
    """DTO for file upload responses"""
    def __init__(self, file_id: UUID, status: str, upload_url: Optional[str] = None, fields: Optional[Dict[str, str]] = None):
        self.file_id = file_id
        self.status = status
        self.upload_url = upload_url
        self.fields = fields

class ChatMessageDTO(BaseModel):
    """DTO for chat messages"""
    def __init__(self, message_id: UUID, content: str, is_bot: bool, sent_at: datetime):
        self.message_id = message_id
        self.content = content
        self.is_bot = is_bot
        self.sent_at = sent_at

class ChatSessionDTO(BaseModel):
    """DTO for chat sessions"""
    def __init__(self, session_id: UUID, user_id: Optional[UUID], started_at: datetime, messages: List[ChatMessageDTO], ended_at: Optional[datetime] = None, escalation_level: int = 0):
        self.session_id = session_id
        self.user_id = user_id
        self.started_at = started_at
        self.ended_at = ended_at
        self.messages = messages
        self.escalation_level = escalation_level

class ChatRequestDTO(BaseModel):
    """DTO for chat requests"""
    def __init__(self, message: str, session_id: Optional[UUID] = None):
        self.message = message
        self.session_id = session_id

class SystemStatusDTO(BaseModel):
    """DTO for system status information"""
    def __init__(self, database: bool, storage: bool, analytics_engine: bool, last_updated: datetime):
        self.database = database
        self.storage = storage
        self.analytics_engine = analytics_engine
        self.last_updated = last_updated

class ErrorResponseDTO(BaseModel):
    """DTO for error responses"""
    def __init__(self, error_code: str, message: str, details: Optional[Dict[str, Any]] = None, timestamp: datetime = datetime.now()):
        self.error_code = error_code
        self.message = message
        self.details = details
        self.timestamp = timestamp
        


# # Creating a device registration DTO
# device_dto = DeviceRegistrationDTO(
#     name="Temperature Sensor 1",
#     device_type="temperature",
#     location=DeviceLocationDTO(latitude=40.7128, longitude=-74.0060)
# )

# # Creating a sensor data response DTO
# sensor_response = SensorDataResponseDTO(
#     stream=SensorStreamDTO(...),
#     data=[SensorDataPointDTO(...), ...],
#     time_range={"start": ..., "end": ...},
#     stats={"min": ..., "max": ..., "avg": ...}
# )