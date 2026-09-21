from django.apps import AppConfig
import sys

class UsersConfig(AppConfig):
    name = 'users'

    def ready(self):
        if 'runserver' in sys.argv:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if not User.objects.filter(username='admin').exists():
                User.objects.create_superuser(
                    username='admin',email='admin@admin.admin',
                    password='adminpassword123',role='admin',
                    approved=True,first_name='Admin',last_name='Admin',
                    taxNumber='000000000',postcode=00000
                    )