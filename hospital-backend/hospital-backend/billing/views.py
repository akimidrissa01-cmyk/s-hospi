from rest_framework import generics
from rest_framework.permissions import BasePermission, IsAuthenticated, AllowAny
from .models import Bill, Payment
from .serializers import BillSerializer, PaymentSerializer

class IsCashier(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['cashier', 'admin']

# Pour le développement, utilisez AllowAny. En production, utilisez IsAuthenticated
class BillListCreateView(generics.ListCreateAPIView):
    queryset = Bill.objects.all()
    serializer_class = BillSerializer
    permission_classes = [AllowAny]  # Changé pour permettre l'accès sans authentification

class BillRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Bill.objects.all()
    serializer_class = BillSerializer
    permission_classes = [AllowAny]

class PaymentListCreateView(generics.ListCreateAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [AllowAny]

class PaymentRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [AllowAny]
