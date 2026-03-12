from rest_framework import serializers
from .models import Medication, Dispensation

class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = '__all__'

class DispensationSerializer(serializers.ModelSerializer):
    dispensed_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Dispensation
        fields = '__all__'

    def create(self, validated_data):
        validated_data['dispensed_by'] = self.context['request'].user
        return super().create(validated_data)

