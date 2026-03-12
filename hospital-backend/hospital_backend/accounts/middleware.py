from django.utils import timezone
from .models import User

class UpdateLastSeenMiddleware:
    """
    Middleware pour mettre à jour last_seen et is_online
    pour tout utilisateur authentifié à chaque requête.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            # Mettre à jour last_seen
            user.last_seen = timezone.now()
            # Marquer en ligne si last_seen récent (< 5 minutes)
            user.is_online = True
            user.save(update_fields=["last_seen", "is_online"])

        return response
