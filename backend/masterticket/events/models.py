from django.db import models
from django.conf import settings

class Event_type(models.Model):
    name = models.CharField(max_length=50,unique=True)
    def save(self, *args, **kwargs):
            if self.name:
                self.name = self.name.strip().upper()
            super().save(*args, **kwargs)
    
class Category(models.Model):
    name = models.CharField(max_length=50,unique=True)
    def save(self, *args, **kwargs):
        if self.name:
            self.name = self.name.strip().upper()
        super().save(*args, **kwargs)
    
class Event(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft"
        PUBLISHED = "published"
        COMPLETED = "completed"
        CANCELLED = "cancelled"
    
    title= models.CharField(max_length=200)
    venue= models.CharField(max_length=200)
    address= models.CharField(max_length=200)
    city= models.CharField(max_length=200)
    country= models.CharField(max_length=200)
    latitude = models.DecimalField(max_digits= 9, decimal_places=6 , null=True , blank=True)
    longitude = models.DecimalField(max_digits= 9, decimal_places=6 , null=True , blank=True)
    start_date_time= models.DateTimeField()
    end_date_time= models.DateTimeField()
    capacity= models.PositiveIntegerField()
    status= models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    description= models.TextField()
    
    ## Foreign keys
    event_type = models.ForeignKey(Event_type,on_delete=models.PROTECT,related_name="events")
    organizer= models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="organized_events",null=True)
    categories= models.ManyToManyField(Category, related_name="events")
    
    @property
    def current_status(self):
        from django.utils import timezone
        if self.status in ["cancelled","completed"]:
            return self.status
        if self.end_date_time and self.end_date_time<= timezone.now() and self.status != "draft":
            self.status= "completed"
            self.save()
            return "completed"
        return self.status
    
class Ticket_type(models.Model):
    name= models.CharField(max_length=100)
    price= models.DecimalField(decimal_places=2,max_digits=9)
    quantity= models.PositiveIntegerField()
    available= models.PositiveIntegerField()
    event= models.ForeignKey(Event,on_delete=models.CASCADE, related_name="ticket_types")

class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending"
        CONFIRMED = "confirmed"
        CANCELLED = "cancelled"
    
    event_title= models.CharField(max_length=200)
    number_of_tickets= models.PositiveIntegerField()
    total_cost= models.DecimalField(max_digits=10, decimal_places=2)
    status= models.CharField(choices=Status.choices, max_length=20, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    ## Foreign keys
    event= models.ForeignKey(Event,on_delete=models.SET_NULL, related_name="bookings",null=True)
    attendee= models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="bookings")
    ticket_type= models.ForeignKey(Ticket_type,on_delete=models.SET_NULL, related_name="bookings", null=True)
    
class Media(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="media")
    photo = models.ImageField(upload_to="event_photos/")