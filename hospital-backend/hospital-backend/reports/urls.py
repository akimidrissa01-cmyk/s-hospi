from django.urls import path
from . import views

urlpatterns = [
    path('', views.ReportListCreateView.as_view(), name='report-list-create'),
    path('<int:pk>/', views.ReportRetrieveUpdateDestroyView.as_view(), name='report-detail'),
    path('dashboard-stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
]
