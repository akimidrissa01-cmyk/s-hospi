from rest_framework import serializers
from .models import Report

class ReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Report
        fields = ['id', 'patient', 'report_type', 'title', 'content', 
                  'generated_by', 'generated_by_name', 'generated_at']
    
    def get_generated_by_name(self, obj):
        if obj.generated_by:
            return f"{obj.generated_by.first_name} {obj.generated_by.last_name}"
        return None
