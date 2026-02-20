from django.urls import path
from . import views

urlpatterns = [
    path('', views.ConsultationListCreateView.as_view(), name='consultation-list-create'),
    path('<int:pk>/', views.ConsultationRetrieveUpdateDestroyView.as_view(), name='consultation-detail'),
]
