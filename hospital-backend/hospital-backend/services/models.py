from django.db import models


class Service(models.Model):
    SERVICE_TYPE_CHOICES = (
        ('ambulant', 'Ambulant'),
        ('interne', 'Interne'),
    )

    name = models.CharField(max_length=150)
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPE_CHOICES)

    class Meta:
        unique_together = ('name', 'service_type')

    def __str__(self):
        return f"{self.name} ({self.service_type})"