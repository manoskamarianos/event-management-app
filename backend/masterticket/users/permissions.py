from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        perm = request.user and request.user.is_authenticated and request.user.role == 'admin'
        return perm

class IsGuest(BasePermission):
    def has_permission(self, request, view):
        perm = request.user and request.user.is_authenticated and request.user.role == 'guest'
        return perm

class IsOrganizer(BasePermission):
    def has_permission(self, request, view):
        perm = request.user and request.user.is_authenticated and request.user.role == 'organizer'
        return perm

class IsParticipant(BasePermission):
    def has_permission(self, request, view):
        perm = request.user and request.user.is_authenticated and request.user.role == 'participant'
        return perm