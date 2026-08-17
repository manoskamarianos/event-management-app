#########should delete later

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "role", "approved", "taxNumber", "is_staff")
    list_filter = ("approved", "role", "is_staff")
    
    fieldsets = UserAdmin.fieldsets + (
        ("Custom Specs Info", {
            "fields": ("role", "approved", "telephone", "address", "taxNumber")
        }),
    )

    actions = ["approve_users", "reject_users"]

    @admin.action(description="Approve selected users")
    def approve_users(self, request, queryset):
        queryset.update(approved=True)

    @admin.action(description="Reject selected users")
    def reject_users(self, request, queryset):
        queryset.update(approved=False)