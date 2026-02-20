from django.db import models
from patients.models import Patient
from accounts.models import User

class LabTest(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    test_name = models.CharField(max_length=200)
    result = models.TextField(blank=True)
    performed_by = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'lab'})
    performed_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.test_name} for {self.patient}"
