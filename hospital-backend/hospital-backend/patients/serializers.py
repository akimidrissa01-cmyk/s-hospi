from rest_framework import serializers
from .models import Patient, Visit

class PatientSerializer(serializers.ModelSerializer):
    patient_id_format = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = '__all__'
    
    def get_patient_id_format(self, obj):
        return f"P{str(obj.id).zfill(3)}"

class VisitSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.__str__', read_only=True)
    doctor_name = serializers.CharField(source='doctor.__str__', read_only=True)
    patient_type = serializers.CharField(source='patient.patient_type', read_only=True)
    patient_id_format = serializers.SerializerMethodField()
    
    # Patient details
    patient_first_name = serializers.CharField(source='patient.first_name', read_only=True)
    patient_last_name = serializers.CharField(source='patient.last_name', read_only=True)
    patient_date_of_birth = serializers.DateField(source='patient.date_of_birth', read_only=True)
    patient_gender = serializers.CharField(source='patient.gender', read_only=True)
    patient_phone = serializers.CharField(source='patient.phone', read_only=True)
    patient_email = serializers.EmailField(source='patient.email', read_only=True)
    patient_address = serializers.CharField(source='patient.address', read_only=True)
    
    class Meta:
        model = Visit
        fields = '__all__'
    
    def get_patient_id_format(self, obj):
        return f"P{str(obj.patient.id).zfill(3)}"
