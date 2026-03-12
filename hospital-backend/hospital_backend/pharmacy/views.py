from rest_framework import generics
from .models import Medication, Dispensation
from .serializers import MedicationSerializer, DispensationSerializer

class MedicationListCreateView(generics.ListCreateAPIView):
    queryset = Medication.objects.all()
    serializer_class = MedicationSerializer

class MedicationRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Medication.objects.all()
    serializer_class = MedicationSerializer

class DispensationListCreateView(generics.ListCreateAPIView):
    queryset = Dispensation.objects.all()
    serializer_class = DispensationSerializer

class DispensationRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Dispensation.objects.all()
    serializer_class = DispensationSerializer
