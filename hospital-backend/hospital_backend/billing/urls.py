from django.urls import path
from . import views

urlpatterns = [
    path('bills/', views.BillListCreateView.as_view(), name='bill-list-create'),
    path('bills/<int:pk>/', views.BillRetrieveUpdateDestroyView.as_view(), name='bill-detail'),
    path('payments/', views.PaymentListCreateView.as_view(), name='payment-list-create'),
    path('payments/<int:pk>/', views.PaymentRetrieveUpdateDestroyView.as_view(), name='payment-detail'),
]
