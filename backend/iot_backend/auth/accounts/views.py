
from rest_framework import generics, status
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.core.mail import send_mail
from .permissions import IsAdminUser
from .models import UserAction
from .token_blacklist import blacklist_user_tokens

class LogoutView(generics.GenericAPIView):
    def post(self, request):
        blacklist_user_tokens(request.user)
        return Response({"msg": "Logged out and tokens blacklisted."}, status=200)

class DeactivateAccountView(generics.GenericAPIView):
    def post(self, request):
        user = request.user
        user.is_active = False
        user.save()
        return Response({"msg": "Account deactivated."}, status=200)

class UserActivityView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    def get_queryset(self):
        return UserAction.objects.filter(user=self.request.user)
