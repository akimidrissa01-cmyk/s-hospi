from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Service
from .serializers import ServiceSerializer


class ServiceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Service.objects.all()  # ⚠️ obligatoire pour DRF router
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()  # utilise le queryset défini
        patient_type = self.request.query_params.get("patient_type")
        if patient_type in ["ambulant", "interne"]:
            qs = qs.filter(service_type=patient_type)
        return qs