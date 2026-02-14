
from .models import UserAction
from datetime import datetime

class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            UserAction.objects.create(user=request.user, action=request.path, timestamp=datetime.now())
        return self.get_response(request)
