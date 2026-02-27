from django.urls import path
from . import views

urlpatterns = [
    path('', views.UserListCreateView.as_view(), name='user-list-create'),
    path('doctors/', views.DoctorListView.as_view(), name='doctor-list'),
    path('<int:pk>/', views.UserRetrieveUpdateDestroyView.as_view(), name='user-detail'),
]
