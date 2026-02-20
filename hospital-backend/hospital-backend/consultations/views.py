from rest_framework import generics
from rest_framework.permissions import BasePermission, IsAuthenticated
from .models import Consultation
from .serializers import ConsultationSerializer

class IsDoctorOrNurse(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['doctor', 'nurse', 'admin']

class ConsultationListCreateView(generics.ListCreateAPIView):
    queryset = Consultation.objects.all()
    serializer_class = ConsultationSerializer
    permission_classes = [IsAuthenticated, IsDoctorOrNurse]

class ConsultationRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Consultation.objects.all()
    serializer_class = ConsultationSerializer
    permission_classes = [IsAuthenticated, IsDoctorOrNurse]
