from rest_framework import serializers
from .models import Consultation

class ConsultationSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.username', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    
    class Meta:
        model = Consultation
        fields = ['id', 'patient', 'doctor', 'doctor_name', 'service', 'service_name', 'date', 'symptoms', 'diagnosis', 'treatment', 'notes', 'created_at', 'updated_at']
