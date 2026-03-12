from django.urls import path
from . import views

urlpatterns = [
    path('', views.ConsultationListCreateView.as_view(), name='consultation-list-create'),
    path('<int:pk>/', views.ConsultationRetrieveUpdateDestroyView.as_view(), name='consultation-detail'),
    path('by-patient/<int:patient_id>/', views.ConsultationByPatientListView.as_view(), name='consultation-by-patient'),
]
