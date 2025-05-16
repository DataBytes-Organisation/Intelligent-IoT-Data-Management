from datetime import datetime
import smtplib
from email.mime.text import MIMEText
import requests

class AlertManager:
    def __init__(self, config):
        self.config = config
        self.alert_history = []
        
    async def send_alert(self, alert_type, message, severity="high"):
        """Send alerts through multiple channels"""
        alert = {
            "timestamp": datetime.now(),
            "type": alert_type,
            "message": message,
            "severity": severity
        }
        self.alert_history.append(alert)
        
        # Email alerts
        if "email" in self.config["channels"]:
            await self._send_email_alert(alert)
            
        # Webhook alerts (for integration with external systems)
        if "webhook" in self.config["channels"]:
            await self._send_webhook_alert(alert)
            
        # In-app notifications
        if "in_app" in self.config["channels"]:
            await self._send_in_app_alert(alert)
    
    async def _send_email_alert(self, alert):
        """Send email notifications"""
        msg = MIMEText(alert["message"])
        msg["Subject"] = f"IoT Alert: {alert['type']} - {alert['severity'].upper()}"
        msg["From"] = self.config["email"]["sender"]
        msg["To"] = self.config["email"]["recipients"]
        
        with smtplib.SMTP(self.config["email"]["smtp_server"]) as server:
            server.send_message(msg)
    
    async def _send_webhook_alert(self, alert):
        """Send webhook notifications"""
        requests.post(self.config["webhook"]["url"], json=alert)
    
    async def _send_in_app_alert(self, alert):
        """Send in-app notifications through WebSocket"""
        # Implementation depends on your WebSocket setup
        pass