from django.urls import path
from . import views

urlpatterns = [
    path('', views.ReportListCreateView.as_view(), name='report-list-create'),
    path('<int:pk>/', views.ReportRetrieveUpdateDestroyView.as_view(), name='report-detail'),
]
