from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('doctor', 'Doctor'),
        ('nurse', 'Nurse'),
        ('lab', 'Lab'),
        ('pharmacy', 'Pharmacy'),
        ('cashier', 'Cashier'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_online = models.BooleanField(default=False, help_text="Indique si le médecin est actuellement en ligne")
    last_seen = models.DateTimeField(null=True, blank=True, help_text="Dernière fois que le médecin était en ligne")
