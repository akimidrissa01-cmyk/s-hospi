from django.db import models
from accounts.models import User

class Patient(models.Model):
    PATIENT_TYPE_CHOICES = [
        ('ambulant', 'Ambulant (Externe)'),
        ('interne', 'Interne (Hospitalisé)'),
    ]
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=[('M', 'Male'), ('F', 'Female')])
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    patient_type = models.CharField(max_length=20, choices=PATIENT_TYPE_CHOICES, default='ambulant')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Visit(models.Model):
    STATUS_CHOICES = [
        ('in_progress', 'En cours'),
        ('completed', 'Terminée'),
        ('cancelled', 'Annulée'),
    ]
    
    VISIT_TYPE_CHOICES = [
        ('ambulant', 'Ambulant'),
        ('interne', 'Interne'),
    ]
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='visits')
    visit_date = models.DateTimeField(auto_now_add=True)
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'doctor'}, related_name='visits')
    service = models.CharField(max_length=100)
    visit_type = models.CharField(max_length=20, choices=VISIT_TYPE_CHOICES, default='ambulant')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    notes = models.TextField(blank=True)
    
    # Service tracking for ambulant patients
    consultation_done = models.BooleanField(default=True)  # Always True for ambulant
    laboratory_done = models.BooleanField(default=False)
    prescription_done = models.BooleanField(default=False)
    pharmacy_done = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Visit {self.id} - {self.patient} - {self.visit_date}"
