from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator

# Create your models here.
class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin'
        GUEST = 'guest'
        ORGANIZER = 'organizer'
        PARTICIPANT = 'participant'
    email = models.EmailField(unique=True)
    role = models.CharField(max_length= 20, choices= Role.choices, default= Role.GUEST)
    requested_role = models.CharField(max_length= 20, choices= Role.choices, default= Role.GUEST,null= True,blank=True)
    approved = models.BooleanField(default= False)
    telephone = models.CharField(max_length=20)
    address = models.CharField(max_length= 255)
    taxNumber = models.CharField(max_length= 15)
    postcode= models.PositiveIntegerField(validators=[MaxValueValidator(99999)])
    # latitude = models.DecimalField(max_digits= 9, decimal_places=6 , null=True , blank=True)
    # longitude = models.DecimalField(max_digits= 9, decimal_places=6 , null=True , blank=True)
    
    def __str__(self):  # For string representation
        return f"{self.username} ({self.role})"
