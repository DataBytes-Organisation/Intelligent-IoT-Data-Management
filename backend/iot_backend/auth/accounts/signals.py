
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from django.core.mail import send_mail
from axes.signals import user_locked_out

@receiver(user_logged_in)
def notify_login(sender, request, user, **kwargs):
    ip = request.META.get('REMOTE_ADDR')
    send_mail("New Login Notification", f"New login from IP: {ip}", "no-reply@example.com", [user.email])

@receiver(user_locked_out)
def notify_lockout(sender, request, username, **kwargs):
    send_mail("Account Locked", "Your account was locked due to suspicious activity.", "no-reply@example.com", [username])
