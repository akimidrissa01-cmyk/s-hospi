from rest_framework import generics
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import LabTest
from .serializers import LabTestSerializer

class IsLab(BasePermission):
    def has_permission(self, request, view):
        # Allow lab technicians, doctors, and admins
        return request.user.is_authenticated and request.user.role in ['lab', 'doctor', 'admin']

class LabTestListCreateView(generics.ListCreateAPIView):
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer
    permission_classes = [IsAuthenticated, IsLab]

    def get_queryset(self):
        # Doctors can see all tests, lab technicians see their own
        user = self.request.user
        if user.role == 'doctor' or user.role == 'admin':
            return LabTest.objects.all()
        return LabTest.objects.all()

    def create(self, request, *args, **kwargs):
        patient_id = request.data.get('patient')
        
        # Vérifier si un test existe déjà pour ce patient aujourd'hui
        today = timezone.now().date()
        existing_test = LabTest.objects.filter(
            patient=patient_id,
            performed_at__date=today
        ).exists()
        
        if existing_test:
            return Response(
                {"error": "Ce patient a déjà passé un test aujourd'hui. Un seul test par jour est autorisé."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class LabTestRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer
    permission_classes = [IsAuthenticated, IsLab]
