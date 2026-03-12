from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import Room, Bed, RoomAssignment
from .serializers import (
    RoomSerializer, 
    BedSerializer, 
    RoomAssignmentSerializer,
    RoomAssignmentHistorySerializer,
    PatientWithServicesSerializer
)


class RoomViewSet(viewsets.ModelViewSet):
    """ViewSet for Room management"""
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['room_number', 'floor', 'room_type', 'status']
    ordering_fields = ['room_number', 'floor', 'status', 'created_at']
    ordering = ['floor', 'room_number']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by floor
        floor_filter = self.request.query_params.get('floor')
        if floor_filter:
            queryset = queryset.filter(floor=floor_filter)
        
        # Filter by room type
        room_type = self.request.query_params.get('room_type')
        if room_type:
            queryset = queryset.filter(room_type=room_type)
        
        # Filter available rooms
        available_only = self.request.query_params.get('available_only')
        if available_only == 'true':
            queryset = queryset.filter(status='free')
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update room status"""
        room = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in ['free', 'occupied', 'cleaning', 'maintenance']:
            return Response(
                {'error': 'Statut invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        room.status = new_status
        room.save()
        
        # Update all beds status accordingly
        if new_status == 'free':
            Bed.objects.filter(room=room).update(status='free', patient=None)
        elif new_status == 'cleaning':
            Bed.objects.filter(room=room).update(status='cleaning')
        
        serializer = self.get_serializer(room)
        return Response(serializer.data)


class BedViewSet(viewsets.ModelViewSet):
    """ViewSet for Bed management"""
    queryset = Bed.objects.all()
    serializer_class = BedSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['bed_number', 'room__room_number']
    ordering_fields = ['bed_number', 'room', 'status', 'created_at']
    ordering = ['room', 'bed_number']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by room
        room_id = self.request.query_params.get('room')
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        
        # Filter available beds only
        available_only = self.request.query_params.get('available_only')
        if available_only == 'true':
            queryset = queryset.filter(status='free')
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def eligible_patients(self, request):
        """Get list of patients eligible for room assignment"""
        from patients.models import Patient, Visit
        
        # Get patients with internal type
        internal_patients = Patient.objects.filter(patient_type='interne')
        
        eligible_patients = []
        for patient in internal_patients:
            # Get the latest visit for this patient
            latest_visit = Visit.objects.filter(
                patient=patient, 
                visit_type='interne'
            ).order_by('-visit_date').first()
            
            # Check if patient already has an active assignment
            has_active_assignment = RoomAssignment.objects.filter(
                patient=patient,
                discharge_date__isnull=True
            ).exists()
            
            # Check if patient is eligible
            consultation_done = latest_visit.consultation_done if latest_visit else False
            laboratory_done = latest_visit.laboratory_done if latest_visit else False
            
            eligible_patients.append({
                'id': patient.id,
                'first_name': patient.first_name,
                'last_name': patient.last_name,
                'patient_type': patient.patient_type,
                'consultation_done': consultation_done,
                'laboratory_done': laboratory_done,
                'has_active_assignment': has_active_assignment,
                'is_eligible': consultation_done and laboratory_done and not has_active_assignment
            })
        
        return Response(eligible_patients)
    
    @action(detail=True, methods=['post'])
    def assign_patient(self, request, pk=None):
        """Assign a patient to a bed"""
        bed = self.get_object()
        patient_id = request.data.get('patient_id')
        
        if not patient_id:
            return Response(
                {'error': 'ID patient requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if bed.status != 'free':
            return Response(
                {'error': 'Ce lit n\'est pas disponible'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from patients.models import Patient, Visit
        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Patient non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validation: Patient must be interne
        if patient.patient_type != 'interne':
            return Response(
                {'error': 'Seuls les patients internes peuvent être hospitalisés'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validation: Check if patient already has an active assignment
        existing_assignment = RoomAssignment.objects.filter(
            patient=patient,
            discharge_date__isnull=True
        ).first()
        
        if existing_assignment:
            return Response(
                {'error': 'Ce patient a déjà une chambre attribuée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validation: Patient must have consultation_done = True
        latest_visit = Visit.objects.filter(
            patient=patient,
            visit_type='interne'
        ).order_by('-visit_date').first()
        
        if not latest_visit:
            return Response(
                {'error': 'Ce patient n\'a pas de visite enregistrée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not latest_visit.consultation_done:
            return Response(
                {'error': 'Le patient doit avoir passé la consultation avant l\'hospitalisation'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not latest_visit.laboratory_done:
            return Response(
                {'error': 'Le patient doit avoir passé au laboratoire avant l\'hospitalisation'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update bed status
        bed.patient = patient
        bed.status = 'occupied'
        bed.save()
        
        # Update room status
        room = bed.room
        room.status = 'occupied'
        room.save()
        
        # Create assignment record
        assignment = RoomAssignment.objects.create(
            patient=patient,
            bed=bed,
            assignment_type='admission',
            assigned_by=request.user if request.user.is_authenticated else None,
            notes=request.data.get('notes', '')
        )
        
        serializer = self.get_serializer(bed)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def discharge_patient(self, request, pk=None):
        """Discharge patient from bed"""
        bed = self.get_object()
        
        if bed.status != 'occupied':
            return Response(
                {'error': 'Ce lit n\'est pas occupé'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        patient = bed.patient
        
        # Create discharge record
        assignment = RoomAssignment.objects.filter(
            bed=bed,
            patient=patient,
            discharge_date__isnull=True
        ).first()
        
        if assignment:
            assignment.discharge_date = timezone.now()
            assignment.assignment_type = 'discharge'
            assignment.save()
        
        # Update bed status
        bed.patient = None
        bed.status = 'cleaning'
        bed.save()
        
        # Update room status
        room = bed.room
        other_occupied = Bed.objects.filter(room=room, status='occupied').exclude(id=bed.id).exists()
        if not other_occupied:
            room.status = 'cleaning'
            room.save()
        
        serializer = self.get_serializer(bed)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_cleaning_done(self, request, pk=None):
        """Mark bed cleaning as done"""
        bed = self.get_object()
        bed.status = 'free'
        bed.save()
        
        # Update room status if all beds are free
        room = bed.room
        all_free = not Bed.objects.filter(room=room, status__in=['occupied', 'cleaning']).exists()
        if all_free:
            room.status = 'free'
            room.save()
        
        serializer = self.get_serializer(bed)
        return Response(serializer.data)


class RoomAssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Room Assignment management"""
    queryset = RoomAssignment.objects.all()
    serializer_class = RoomAssignmentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['patient__first_name', 'patient__last_name', 'bed__room__room_number']
    ordering_fields = ['assigned_at', 'discharge_date', 'assignment_type']
    ordering = ['-assigned_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by assignment type
        assignment_type = self.request.query_params.get('assignment_type')
        if assignment_type:
            queryset = queryset.filter(assignment_type=assignment_type)
        
        # Filter by patient
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        # Filter active assignments (not discharged)
        active_only = self.request.query_params.get('active_only')
        if active_only == 'true':
            queryset = queryset.filter(discharge_date__isnull=True)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get assignment history"""
        queryset = self.get_queryset()
        
        # Filter by patient
        patient_id = request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        # Filter by bed
        bed_id = request.query_params.get('bed_id')
        if bed_id:
            queryset = queryset.filter(bed_id=bed_id)
        
        # Limit results
        limit = request.query_params.get('limit')
        if limit:
            queryset = queryset[:int(limit)]
        
        serializer = RoomAssignmentHistorySerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current active assignments"""
        queryset = self.get_queryset().filter(discharge_date__isnull=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def transfer(self, request, pk=None):
        """Transfer patient to another bed"""
        assignment = self.get_object()
        new_bed_id = request.data.get('new_bed_id')
        
        if not new_bed_id:
            return Response(
                {'error': 'ID du nouveau lit requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            new_bed = Bed.objects.get(id=new_bed_id)
        except Bed.DoesNotExist:
            return Response(
                {'error': 'Nouveau lit non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if new_bed.status != 'free':
            return Response(
                {'error': 'Le nouveau lit n\'est pas disponible'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Discharge from current bed
        old_bed = assignment.bed
        patient = assignment.patient
        
        assignment.discharge_date = timezone.now()
        assignment.save()
        
        old_bed.patient = None
        old_bed.status = 'cleaning'
        old_bed.save()
        
        # Update old room status
        old_room = old_bed.room
        other_occupied = Bed.objects.filter(room=old_room, status='occupied').exclude(id=old_bed.id).exists()
        if not other_occupied:
            old_room.status = 'cleaning'
            old_room.save()
        
        # Assign to new bed
        new_bed.patient = patient
        new_bed.status = 'occupied'
        new_bed.save()
        
        new_room = new_bed.room
        new_room.status = 'occupied'
        new_room.save()
        
        # Create new assignment
        new_assignment = RoomAssignment.objects.create(
            patient=patient,
            bed=new_bed,
            assignment_type='transfer',
            assigned_by=request.user if request.user.is_authenticated else None,
            notes=request.data.get('notes', '')
        )
        
        serializer = self.get_serializer(new_assignment)
        return Response(serializer.data)


from django.utils import timezone
