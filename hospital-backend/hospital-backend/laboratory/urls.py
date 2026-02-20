from django.urls import path
from . import views

urlpatterns = [
    path('', views.LabTestListCreateView.as_view(), name='labtest-list-create'),
    path('<int:pk>/', views.LabTestRetrieveUpdateDestroyView.as_view(), name='labtest-detail'),
]
