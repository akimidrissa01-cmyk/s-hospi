from django.db import models
from patients.models import Patient


class Room(models.Model):
    """Model representing a hospital room"""
    
    ROOM_STATUS_CHOICES = [
        ('free', 'Libre'),
        ('occupied', 'Occupée'),
        ('cleaning', 'Nettoyage'),
        ('maintenance', 'Maintenance'),
    ]
    
    ROOM_TYPE_CHOICES = [
        ('standard', 'Standard'),
        ('private', 'Privée'),
        ('semi_private', 'Semi-Privée'),
        ('intensive', 'Soins Intensifs'),
    ]
    
    room_number = models.CharField(max_length=10, unique=True)
    floor = models.IntegerField(default=1)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES, default='standard')
    status = models.CharField(max_length=20, choices=ROOM_STATUS_CHOICES, default='free')
    capacity = models.IntegerField(default=1)  # Number of beds in room
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    features = models.TextField(blank=True, help_text="Equipment and features in the room")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['floor', 'room_number']
    
    def __str__(self):
        return f"Chambre {self.room_number} - {self.get_status_display()}"
    
    @property
    def occupied_beds(self):
        return self.beds.filter(status='occupied').count()
    
    @property
    def available_beds(self):
        return self.beds.filter(status='free').count()


class Bed(models.Model):
    """Model representing a bed in a room"""
    
    BED_STATUS_CHOICES = [
        ('free', 'Libre'),
        ('occupied', 'Occupée'),
        ('cleaning', 'Nettoyage'),
        ('reserved', 'Réservée'),
    ]
    
    bed_number = models.CharField(max_length=10)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='beds')
    status = models.CharField(max_length=20, choices=BED_STATUS_CHOICES, default='free')
    patient = models.ForeignKey(Patient, on_delete=models.SET_NULL, null=True, blank=True, related_name='beds')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['room', 'bed_number']
        ordering = ['room', 'bed_number']
    
    def __str__(self):
        return f"Lit {self.bed_number} - {self.room.room_number}"


class RoomAssignment(models.Model):
    """Model tracking patient room assignments"""
    
    ASSIGNMENT_TYPE_CHOICES = [
        ('admission', 'Admission'),
        ('transfer', 'Transfert'),
        ('discharge', 'Sortie'),
    ]
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='room_assignments')
    bed = models.ForeignKey(Bed, on_delete=models.CASCADE, related_name='assignments')
    assignment_type = models.CharField(max_length=20, choices=ASSIGNMENT_TYPE_CHOICES, default='admission')
    assigned_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='room_assignments')
    assigned_at = models.DateTimeField(auto_now_add=True)
    discharge_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-assigned_at']
    
    def __str__(self):
        return f"{self.patient} - {self.bed} - {self.get_assignment_type_display()}"
