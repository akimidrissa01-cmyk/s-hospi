from django.urls import path
from . import views

urlpatterns = [
    path('', views.PatientListCreateView.as_view(), name='patient-list-create'),
    path('<int:pk>/', views.PatientRetrieveUpdateDestroyView.as_view(), name='patient-detail'),
]
