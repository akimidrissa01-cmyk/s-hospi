from rest_framework import generics
from rest_framework.permissions import BasePermission, IsAuthenticated
from .models import LabTest
from .serializers import LabTestSerializer

class IsLab(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['lab', 'admin']

class LabTestListCreateView(generics.ListCreateAPIView):
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer
    permission_classes = [IsAuthenticated, IsLab]

class LabTestRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer
    permission_classes = [IsAuthenticated, IsLab]
