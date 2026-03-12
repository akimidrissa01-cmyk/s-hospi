from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta

from .models import Report
from .serializers import ReportSerializer
from patients.models import Patient
from consultations.models import Consultation
from laboratory.models import LabTest
from prescriptions.models import Prescription
from billing.models import Bill
from accounts.models import User


class ReportListCreateView(generics.ListCreateAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Report.objects.all().select_related('patient', 'generated_by').order_by('-generated_at')
        
        # Filter by report_type
        report_type = self.request.query_params.get('report_type')
        if report_type:
            queryset = queryset.filter(report_type=report_type)
        
        # Filter by patient
        patient = self.request.query_params.get('patient')
        if patient:
            queryset = queryset.filter(patient_id=patient)
        
        # Filter by start_date
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(generated_at__date__gte=start_date)
        
        # Filter by end_date
        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(generated_at__date__lte=end_date)
        
        return queryset

    def perform_create(self, serializer):
        # Get the current user from the request
        user = self.request.user
        serializer.save(generated_by=user)


class ReportRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]


class DashboardStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Monthly statistics for the last 6 months
        six_months_ago = timezone.now() - timedelta(days=180)

        # Patients by month
        patients_by_month = Patient.objects.filter(
            created_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')

        # Consultations by month
        consultations_by_month = Consultation.objects.filter(
            date__gte=six_months_ago
        ).annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')

        # Lab tests by month
        lab_tests_by_month = LabTest.objects.filter(
            performed_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('performed_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')

        # Recent activities
        recent_activities = []

        # Recent patients
        recent_patients = Patient.objects.order_by('-created_at')[:5]
        for p in recent_patients:
            recent_activities.append({
                'type': 'patient',
                'action': 'Nouveau patient enregistré',
                'details': f"{p.first_name} {p.last_name}",
                'date': p.created_at.isoformat(),
            })

        # Recent consultations
        recent_consultations = Consultation.objects.select_related('patient').order_by('-date')[:5]
        for c in recent_consultations:
            recent_activities.append({
                'type': 'consultation',
                'action': 'Nouvelle consultation',
                'details': f"{c.patient.first_name} {c.patient.last_name}",
                'date': c.date.isoformat(),
            })

        # Recent lab tests
        recent_labs = LabTest.objects.select_related('patient').order_by('-performed_at')[:5]
        for lab in recent_labs:
            recent_activities.append({
                'type': 'laboratory',
                'action': f'Test laboratoire: {lab.test_name}',
                'details': f"{lab.patient.first_name} {lab.patient.last_name}",
                'date': lab.performed_at.isoformat(),
            })

        # Recent prescriptions
        recent_prescriptions = Prescription.objects.select_related('consultation__patient').order_by('-created_at')[:5]
        for pres in recent_prescriptions:
            try:
                patient_name = f"{pres.consultation.patient.first_name} {pres.consultation.patient.last_name}"
                recent_activities.append({
                    'type': 'prescription',
                    'action': f'Prescription: {pres.medication}',
                    'details': patient_name,
                    'date': pres.created_at.isoformat(),
                })
            except Exception:
                pass

        # Recent bills
        recent_bills = Bill.objects.select_related('patient').order_by('-created_at')[:5]
        for bill in recent_bills:
            recent_activities.append({
                'type': 'billing',
                'action': f'Facture créée: {bill.total_amount}€',
                'details': f"{bill.patient.first_name} {bill.patient.last_name} - {bill.status}",
                'date': bill.created_at.isoformat(),
            })

        # Sort all activities by date and take the most recent 15
        recent_activities.sort(key=lambda x: x['date'], reverse=True)
        recent_activities = recent_activities[:15]

        # Monthly data formatted for charts
        months = []
        patient_data = []
        consultation_data = []
        lab_data = []

        # Generate last 6 months
        for i in range(5, -1, -1):
            month_date = timezone.now().replace(day=1) - timedelta(days=i*30)
            month_key = month_date.strftime('%Y-%m')
            month_label = month_date.strftime('%b')

            months.append(month_label)

            # Find matching data
            p_count = next((item['count'] for item in patients_by_month if item['month'].strftime('%Y-%m') == month_key), 0)
            c_count = next((item['count'] for item in consultations_by_month if item['month'].strftime('%Y-%m') == month_key), 0)
            l_count = next((item['count'] for item in lab_tests_by_month if item['month'].strftime('%Y-%m') == month_key), 0)

            patient_data.append(p_count)
            consultation_data.append(c_count)
            lab_data.append(l_count)

        # Current totals
        total_patients = Patient.objects.count()
        total_consultations = Consultation.objects.count()
        total_lab_tests = LabTest.objects.count()
        total_prescriptions = Prescription.objects.count()
        total_bills = Bill.objects.count()

        # Pending bills count
        pending_bills = Bill.objects.filter(status='pending').count()

        return Response({
            'totals': {
                'patients': total_patients,
                'consultations': total_consultations,
                'lab_tests': total_lab_tests,
                'prescriptions': total_prescriptions,
                'bills': total_bills,
                'pending_bills': pending_bills,
            },
            'charts': {
                'months': months,
                'patients': patient_data,
                'consultations': consultation_data,
                'lab_tests': lab_data,
            },
            'recent_activities': recent_activities,
        })
