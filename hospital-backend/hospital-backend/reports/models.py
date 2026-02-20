from django.db import models
from patients.models import Patient
from accounts.models import User

class Report(models.Model):
    REPORT_TYPE_CHOICES = [
        ('consultation', 'Consultation Report'),
        ('lab', 'Lab Report'),
        ('billing', 'Billing Report'),
        ('pharmacy', 'Pharmacy Report'),
    ]
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, blank=True, null=True)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    content = models.TextField()
    generated_by = models.ForeignKey(User, on_delete=models.CASCADE)
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.report_type} - {self.title}"
