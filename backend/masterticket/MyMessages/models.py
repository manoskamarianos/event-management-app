from django.db import models
from django.conf import settings
from events.models import Event

class Message(models.Model):
    subject= models.CharField(max_length=255)
    body= models.TextField()
    read= models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_sender= models.BooleanField(default=False)
    deleted_receiver= models.BooleanField(default=False)
    ## Foreign keys
    sender= models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL, related_name="send_messages",null=True)
    receiver= models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL, related_name="received_messages",null=True)    
    event= models.ForeignKey(Event,on_delete=models.SET_NULL, related_name="messages",null=True)