from django.urls import path
from . import views

urlpatterns = [
    path('medications/', views.MedicationListCreateView.as_view(), name='medication-list-create'),
    path('medications/<int:pk>/', views.MedicationRetrieveUpdateDestroyView.as_view(), name='medication-detail'),
    path('dispensations/', views.DispensationListCreateView.as_view(), name='dispensation-list-create'),
    path('dispensations/<int:pk>/', views.DispensationRetrieveUpdateDestroyView.as_view(), name='dispensation-detail'),
]
