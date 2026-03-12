from django.urls import path
from . import views

urlpatterns = [
    path('', views.UserListCreateView.as_view(), name='user-list-create'),
    path('doctors/', views.DoctorListView.as_view(), name='doctor-list'),
    path('doctors/online/', views.OnlineDoctorListView.as_view(), name='online-doctor-list'),
    path('set-online/', views.SetDoctorOnlineView.as_view(), name='set-doctor-online'),
    path('<int:pk>/', views.UserRetrieveUpdateDestroyView.as_view(), name='user-detail'),
]
