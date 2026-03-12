from rest_framework.permissions import BasePermission

class IsMedicalStaff(BasePermission):
    """
    Autorise uniquement :
    admin, doctor, nurse
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['admin', 'doctor', 'nurse']
        )
