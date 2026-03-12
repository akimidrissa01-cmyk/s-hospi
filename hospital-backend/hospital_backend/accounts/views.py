from .serializers import UserSerializer, CustomTokenObtainPairSerializer
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone
from .models import User
from rest_framework.views import APIView

# 🔹 Login JWT personnalisé pour mettre l'utilisateur en ligne
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        # Si login réussi, mettre l'utilisateur en ligne
        if response.status_code == 200:
            try:
                user = User.objects.get(username=request.data['username'])
                user.is_online = True
                user.last_seen = timezone.now()
                user.save(update_fields=["is_online", "last_seen"])
            except User.DoesNotExist:
                pass
        return response


# 🔹 Liste de tous les utilisateurs
class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


# 🔹 CRUD utilisateurs
class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


class UserRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


# 🔹 Liste des docteurs (doctor + admin)
class DoctorListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(role__in=['doctor', 'admin'])


# 🔹 Liste des docteurs en ligne
class OnlineDoctorListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Tous les utilisateurs en ligne
        return User.objects.filter(role__in=['doctor', 'admin'], is_online=True)


# 🔹 Mettre un docteur en ligne ou hors ligne
class SetDoctorOnlineView(generics.UpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()

    def update(self, request, *args, **kwargs):
        user = request.user
        is_online = request.data.get('is_online', True)

        if user.role not in ['doctor', 'admin']:
            return Response(
                {"error": "Seuls les médecins peuvent modifier leur statut en ligne"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.is_online = is_online
        user.last_seen = timezone.now()
        user.save(update_fields=["is_online", "last_seen"])

        serializer = self.get_serializer(user)
        return Response(serializer.data)


# 🔹 Logout pour marquer un utilisateur hors ligne
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.is_online = False
        user.last_seen = timezone.now()
        user.save(update_fields=["is_online", "last_seen"])
        return Response({"detail": "Logged out successfully"}, status=status.HTTP_200_OK)
