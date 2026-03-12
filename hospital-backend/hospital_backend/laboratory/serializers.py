from rest_framework import serializers
from .models import LabTest

class LabTestSerializer(serializers.ModelSerializer):
    performed_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = LabTest
        fields = '__all__'
        
    def create(self, validated_data):
        # Automatically set performed_by to the current user
        validated_data['performed_by'] = self.context['request'].user
        return super().create(validated_data)
