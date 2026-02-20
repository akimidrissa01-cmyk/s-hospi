
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from accounts.views import CustomTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/accounts/', include('accounts.urls')),
    path('api/patients/', include('patients.urls')),
    path('api/consultations/', include('consultations.urls')),
    path('api/prescriptions/', include('prescriptions.urls')),
    path('api/laboratory/', include('laboratory.urls')),
    path('api/pharmacy/', include('pharmacy.urls')),
    path('api/billing/', include('billing.urls')),
    path('api/reports/', include('reports.urls')),
]
