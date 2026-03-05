from rest_framework import generics
from rest_framework.permissions import BasePermission, IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Patient, Visit
from .serializers import PatientSerializer, VisitSerializer


class IsDoctorOrNurse(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role.upper() in ['ADMIN', 'DOCTOR', 'NURSE', 'LAB']
        )


class CanCreatePatient(BasePermission):
    """
    Only Admin and Nurse can create patients
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Only admin and nurse can create
        if request.method == 'POST':
            return request.user.role.upper() in ['ADMIN', 'NURSE']
        
        # For other methods, check object permissions
        return True


class PatientListCreateView(generics.ListCreateAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role.upper() == 'ADMIN':
            return Patient.objects.all()
        elif user.role.upper() == 'DOCTOR':
            # Doctors can see all patients (read-only)
            return Patient.objects.all()
        elif user.role.upper() == 'NURSE':
            return Patient.objects.all()
        elif user.role.upper() == 'LAB':
            return Patient.objects.all()
        return Patient.objects.none()

    def create(self, request, *args, **kwargs):
        # Only admin and nurse can create patients
        if request.user.role.upper() not in ['ADMIN', 'NURSE']:
            return Response(
                {"error": "Vous n'avez pas la permission de créer des patients."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)


class PatientRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role.upper() == 'ADMIN':
            return Patient.objects.all()
        elif user.role.upper() in ['DOCTOR', 'NURSE', 'LAB']:
            return Patient.objects.all()
        return Patient.objects.none()

    def update(self, request, *args, **kwargs):
        # Only admin can update
        if request.user.role.upper() != 'ADMIN':
            return Response(
                {"error": "Vous n'avez pas la permission de modifier les patients."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # Only admin can delete
        if request.user.role.upper() != 'ADMIN':
            return Response(
                {"error": "Vous n'avez pas la permission de supprimer des patients."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class VisitListCreateView(generics.ListCreateAPIView):
    queryset = Visit.objects.all()
    serializer_class = VisitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role.upper() == 'ADMIN':
            return Visit.objects.all()
        elif user.role.upper() in ['DOCTOR', 'NURSE', 'LAB']:
            return Visit.objects.all()
        return Visit.objects.none()

    def create(self, request, *args, **kwargs):
        # Only admin and nurse can create visits
        if request.user.role.upper() not in ['ADMIN', 'NURSE']:
            return Response(
                {"error": "Vous n'avez pas la permission de créer des visites."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)


class VisitRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Visit.objects.all()
    serializer_class = VisitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role.upper() == 'ADMIN':
            return Visit.objects.all()
        elif user.role.upper() in ['DOCTOR', 'NURSE', 'LAB']:
            return Visit.objects.all()
        return Visit.objects.none()

    def update(self, request, *args, **kwargs):
        # Only admin can update
        if request.user.role.upper() != 'ADMIN':
            return Response(
                {"error": "Vous n'avez pas la permission de modifier les visites."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # Only admin can delete
        if request.user.role.upper() != 'ADMIN':
            return Response(
                {"error": "Vous n'avez pas la permission de supprimer des visites."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class VisitInProgressListView(generics.ListAPIView):
    """
    Retourne la liste des visites en cours (status='in_progress'),
    ordonnées par date d'ajout (les plus anciennes en premier).
    """
    serializer_class = VisitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role.upper() in ['ADMIN', 'DOCTOR', 'NURSE', 'LAB']:
            return Visit.objects.filter(status='in_progress').order_by('visit_date')
        return Visit.objects.none()


class DoctorAssignedVisitsView(generics.ListAPIView):
    """
    Retourne la liste des visites en cours attribuées au médecin connecté,
    ordonnées par date d'ajout (les plus anciennes en premier).
    """
    serializer_class = VisitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role.upper() in ['DOCTOR', 'ADMIN']:
            # For doctors, return only visits assigned to them
            # For admin, return all in-progress visits
            if user.role.upper() == 'DOCTOR':
                return Visit.objects.filter(
                    doctor=user,
                    status='in_progress'
                ).order_by('visit_date')
            else:
                return Visit.objects.filter(status='in_progress').order_by('visit_date')
        return Visit.objects.none()


class ConsultedPatientsListView(generics.ListAPIView):
    """
    Retourne la liste des patients consultés (avec consultations),
    ordonnés par date de consultation (les plus récentes en premier).
    """
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role.upper() not in ['ADMIN', 'DOCTOR', 'NURSE', 'LAB']:
            return Patient.objects.none()
        
        # Get distinct patients who have consultations, ordered by most recent consultation
        from consultations.models import Consultation
        from django.db.models import Max
        
        # Get patient IDs with their most recent consultation date
        patient_ids = Consultation.objects.values('patient').annotate(
            latest_consultation=Max('date')
        ).order_by('-latest_consultation')
        
        # Extract patient IDs in order
        ordered_patient_ids = [item['patient'] for item in patient_ids]
        
        # Return patients in that order
        return Patient.objects.filter(id__in=ordered_patient_ids).order_by('-id')


class PatientWithConsultationsView(generics.RetrieveAPIView):
    """
    Retourne les détails d'un patient avec toutes ses consultations.
    """
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    queryset = Patient.objects.all()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        # Get all consultations for this patient
        from consultations.models import Consultation
        from consultations.serializers import ConsultationSerializer
        
        consultations = Consultation.objects.filter(patient=instance.id).order_by('-date')
        consultations_data = ConsultationSerializer(consultations, many=True).data
        
        # Combine patient data with consultations
        data = serializer.data
        data['consultations'] = consultations_data
        
        return Response(data)
