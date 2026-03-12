from rest_framework import serializers
from .models import Room, Bed, RoomAssignment
from patients.serializers import PatientSerializer


class PatientWithServicesSerializer(serializers.Serializer):
    """Serializer for patient with service info"""
    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    patient_type = serializers.CharField()
    # Latest visit info
    consultation_done = serializers.BooleanField()
    laboratory_done = serializers.BooleanField()
    has_active_assignment = serializers.BooleanField()


class BedSerializer(serializers.ModelSerializer):
    """Serializer for Bed model"""
    patient_name = serializers.SerializerMethodField()
    patient_type = serializers.SerializerMethodField()
    
    class Meta:
        model = Bed
        fields = ['id', 'bed_number', 'room', 'status', 'patient', 'patient_name', 'patient_type', 'notes', 'created_at', 'updated_at']
    
    def get_patient_name(self, obj):
        if obj.patient:
            return f"{obj.patient.first_name} {obj.patient.last_name}"
        return None
    
    def get_patient_type(self, obj):
        if obj.patient:
            return obj.patient.get_patient_type_display()
        return None


class RoomSerializer(serializers.ModelSerializer):
    """Serializer for Room model"""
    beds = BedSerializer(many=True, read_only=True)
    occupied_beds = serializers.IntegerField(read_only=True)
    available_beds = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    room_type_display = serializers.CharField(source='get_room_type_display', read_only=True)
    
    class Meta:
        model = Room
        fields = [
            'id', 'room_number', 'floor', 'room_type', 'room_type_display',
            'status', 'status_display', 'capacity', 'price_per_day', 
            'features', 'beds', 'occupied_beds', 'available_beds',
            'created_at', 'updated_at'
        ]


class RoomAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for RoomAssignment model"""
    patient_name = serializers.SerializerMethodField()
    bed_number = serializers.SerializerMethodField()
    room_number = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = RoomAssignment
        fields = [
            'id', 'patient', 'patient_name', 'bed', 'bed_number', 
            'room_number', 'assignment_type', 'assigned_by', 'assigned_by_name',
            'assigned_at', 'discharge_date', 'notes'
        ]
    
    def get_patient_name(self, obj):
        if obj.patient:
            return f"{obj.patient.first_name} {obj.patient.last_name}"
        return None
    
    def get_bed_number(self, obj):
        return obj.bed.bed_number
    
    def get_room_number(self, obj):
        return obj.bed.room.room_number
    
    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            return f"{obj.assigned_by.first_name} {obj.assigned_by.last_name}"
        return None


class RoomAssignmentHistorySerializer(serializers.ModelSerializer):
    """Serializer for room assignment history"""
    patient_name = serializers.SerializerMethodField()
    bed_number = serializers.SerializerMethodField()
    room_number = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = RoomAssignment
        fields = [
            'id', 'patient', 'patient_name', 'bed', 'bed_number', 
            'room_number', 'assignment_type', 'assigned_by', 'assigned_by_name',
            'assigned_at', 'discharge_date', 'notes'
        ]
    
    def get_patient_name(self, obj):
        if obj.patient:
            return f"{obj.patient.first_name} {obj.patient.last_name}"
        return None
    
    def get_bed_number(self, obj):
        return obj.bed.bed_number
    
    def get_room_number(self, obj):
        return obj.bed.room.room_number
    
    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            return f"{obj.assigned_by.first_name} {obj.assigned_by.last_name}"
        return None
