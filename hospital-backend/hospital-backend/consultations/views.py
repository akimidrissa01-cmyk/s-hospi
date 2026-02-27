from rest_framework import generics
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import Consultation
from .serializers import ConsultationSerializer

class IsDoctorOrNurse(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['doctor', 'nurse', 'admin']

class ConsultationListCreateView(generics.ListCreateAPIView):
    queryset = Consultation.objects.all()
    serializer_class = ConsultationSerializer
    permission_classes = [IsAuthenticated, IsDoctorOrNurse]

    def create(self, request, *args, **kwargs):
        patient_id = request.data.get('patient')
        
        # Vérifier si une consultation existe déjà pour ce patient aujourd'hui
        today = timezone.now().date()
        existing_consultation = Consultation.objects.filter(
            patient=patient_id,
            date__date=today
        ).exists()
        
        if existing_consultation:
            return Response(
                {"error": "Ce patient a déjà été consulté aujourd'hui. Une seule consultation par jour est autorisée."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ConsultationRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Consultation.objects.all()
    serializer_class = ConsultationSerializer
    permission_classes = [IsAuthenticated, IsDoctorOrNurse]


class ConsultationByPatientListView(generics.ListAPIView):
    """
    Retourne toutes les consultations pour un patient spécifique,
    triées par date (les plus récentes en premier).
    """
    serializer_class = ConsultationSerializer
    permission_classes = [IsAuthenticated, IsDoctorOrNurse]

    def get_queryset(self):
        patient_id = self.kwargs['patient_id']
        return Consultation.objects.filter(patient=patient_id).order_by('-date')
