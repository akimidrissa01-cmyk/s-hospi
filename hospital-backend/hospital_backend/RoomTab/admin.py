from django.contrib import admin
from .models import Room, Bed, RoomAssignment


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['room_number', 'floor', 'room_type', 'status', 'capacity', 'price_per_day']
    list_filter = ['status', 'room_type', 'floor']
    search_fields = ['room_number']


@admin.register(Bed)
class BedAdmin(admin.ModelAdmin):
    list_display = ['bed_number', 'room', 'status', 'patient']
    list_filter = ['status', 'room__floor']
    search_fields = ['bed_number', 'room__room_number']


@admin.register(RoomAssignment)
class RoomAssignmentAdmin(admin.ModelAdmin):
    list_display = ['patient', 'bed', 'assignment_type', 'assigned_by', 'assigned_at', 'discharge_date']
    list_filter = ['assignment_type', 'assigned_at']
    search_fields = ['patient__first_name', 'patient__last_name']
