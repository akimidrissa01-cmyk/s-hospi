from django.urls import path
from . import views

urlpatterns = [
    path('', views.PatientListCreateView.as_view(), name='patient-list-create'),
    path('<int:pk>/', views.PatientRetrieveUpdateDestroyView.as_view(), name='patient-detail'),
    path('<int:pk>/with-consultations/', views.PatientWithConsultationsView.as_view(), name='patient-with-consultations'),
    path('visits/', views.VisitListCreateView.as_view(), name='visit-list-create'),
    path('visits/<int:pk>/', views.VisitRetrieveUpdateDestroyView.as_view(), name='visit-detail'),
    path('visits/in-progress/', views.VisitInProgressListView.as_view(), name='visit-in-progress'),
    path('visits/my-visits/', views.DoctorAssignedVisitsView.as_view(), name='doctor-assigned-visits'),
    path('consulted/', views.ConsultedPatientsListView.as_view(), name='consulted-patients'),
]
