import yaml
from pathlib import Path

class AlertConfig:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AlertConfig, cls).__new__(cls)
            cls._instance._load_config()
        return cls._instance
    
    def _load_config(self):
        config_path = Path(__file__).parent / 'alert_config.yaml'
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
    
    def get_thresholds(self, metric_type):
        """Get thresholds for a specific metric type"""
        return self.config['thresholds'].get(metric_type, {})
    
    def get_alert_rules(self):
        """Get all alert rules"""
        return self.config['alert_rules']
    
    def get_notification_settings(self):
        """Get notification settings"""
        return self.config['notification_settings']
    
    def get_severity_config(self, severity):
        """Get configuration for a specific severity level"""
        return self.config['severity_levels'].get(severity, {})
    
    def get_channel_config(self, channel):
        """Get configuration for a specific notification channel"""
        return self.config['channels'].get(channel, {})

# Usage example:
# config = AlertConfig()
# temperature_thresholds = config.get_thresholds('temperature')
# alert_rules = config.get_alert_rules()