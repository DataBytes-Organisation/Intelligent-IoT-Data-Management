
from rest_framework_simplejwt.tokens import OutstandingToken, BlacklistedToken

def blacklist_user_tokens(user):
    for token in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=token)
