from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UserSerializer
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import User
from .serializers import CustomTokenObtainPairSerializer



class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class UserRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


class DoctorListView(generics.ListAPIView):
    """
    Liste des médecins (utilisateurs avec role='doctor' ou 'admin')
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(role__in=['doctor', 'admin'])


class OnlineDoctorListView(generics.ListAPIView):
    """
    Liste des médecins en ligne (is_online=True)
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(role__in=['doctor', 'admin'], is_online=True)


class SetDoctorOnlineView(generics.UpdateAPIView):
    """
    Mettre un médecin en ligne ou hors ligne
    """
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
        # Update last_seen timestamp
        user.last_seen = timezone.now()
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
