from rest_framework import generics
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Prescription
from .serializers import PrescriptionSerializer


class IsDoctor(BasePermission):
    """Permission pour les médecins - Accès complet (CRUD)"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'doctor'


class IsAdminReadOnly(BasePermission):
    """Permission pour l'admin - Lecture seule"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == 'admin'
    
    def has_object_permission(self, request, view, obj):
        return request.user.role == 'admin'


class PrescriptionListCreateView(generics.ListCreateAPIView):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.request.user.role == 'admin':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsDoctor()]
    
    def create(self, request, *args, **kwargs):
        if request.user.role != 'doctor':
            return Response(
                {"error": "Seul un médecin peut créer une prescription."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)


class PrescriptionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.request.user.role == 'admin':
            return [IsAuthenticated(), IsAdminReadOnly()]
        return [IsAuthenticated(), IsDoctor()]
    
    def update(self, request, *args, **kwargs):
        if request.user.role != 'doctor':
            return Response(
                {"error": "Seul un médecin peut modifier une prescription."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'doctor':
            return Response(
                {"error": "Seul un médecin peut supprimer une prescription."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
