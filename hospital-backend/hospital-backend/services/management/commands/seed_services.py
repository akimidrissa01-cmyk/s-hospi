from django.core.management.base import BaseCommand
from services.models import Service


class Command(BaseCommand):
    help = 'Seed the database with hospital services'

    def handle(self, *args, **options):
        # Clear existing services
        Service.objects.all().delete()

        # Services for interne patients (hospitalized)
        interne_services = [
            "Médecine interne",
            "Chirurgie générale",
            "Gynécologie – Obstétrique (maternité)",
            "Pédiatrie",
            "Réanimation / Soins intensifs (ICU)",
            "Urgences – Hospitalisation",
            "Cardiologie",
            "Neurologie",
            "Pneumologie",
            "Gastro-entérologie",
            "Néphrologie",
            "Urologie",
            "Orthopédie – Traumatologie",
            "Oncologie",
            "Psychiatrie",
            "Maladies infectieuses",
        ]

        # Services for ambulant patients (external)
        ambulant_services = [
            "Médecine générale",
            "Pédiatrie",
            "Gynécologie – Obstétrique",
            "Médecine interne",
            "Cardiologie",
            "Dermatologie",
            "ORL",
            "Ophtalmologie",
            "Neurologie",
            "Pneumologie",
            "Gastro-entérologie",
            "Urologie",
            "Rhumatologie",
            "Endocrinologie",
            "Psychiatrie",
            "Dentisterie / Stomatologie",
        ]

        # Create interne services
        for service_name in interne_services:
            Service.objects.create(name=service_name, service_type='interne')
            self.stdout.write(f'Created service: {service_name} (interne)')

        # Create ambulant services
        for service_name in ambulant_services:
            Service.objects.create(name=service_name, service_type='ambulant')
            self.stdout.write(f'Created service: {service_name} (ambulant)')

        self.stdout.write(self.style.SUCCESS(f'Successfully created {Service.objects.count()} services'))
