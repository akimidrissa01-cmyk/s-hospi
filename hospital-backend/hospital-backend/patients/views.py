from rest_framework import generics
from rest_framework.permissions import BasePermission, IsAuthenticated
from .models import Patient
from .serializers import PatientSerializer


class IsDoctorOrNurse(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role.upper() in ['ADMIN', 'DOCTOR', 'NURSE', 'LAB']  # utiliser des majuscules dans la liste

        )

class PatientListCreateView(generics.ListCreateAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated, IsDoctorOrNurse]

class PatientRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated, IsDoctorOrNurse]
