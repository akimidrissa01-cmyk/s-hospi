from django.urls import path
from . import views

urlpatterns = [
    path('', views.PrescriptionListCreateView.as_view(), name='prescription-list-create'),
    path('<int:pk>/', views.PrescriptionRetrieveUpdateDestroyView.as_view(), name='prescription-detail'),
]
