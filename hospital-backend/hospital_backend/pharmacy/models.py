from django.db import models
from prescriptions.models import Prescription
from accounts.models import User

class Medication(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    expiry_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Dispensation(models.Model):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE)
    medication = models.ForeignKey(Medication, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    dispensed_by = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'pharmacy'})
    dispensed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dispensation of {self.medication} for {self.prescription}"
