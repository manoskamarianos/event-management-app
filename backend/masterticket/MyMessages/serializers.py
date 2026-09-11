from rest_framework import serializers
from users.models import User
from django.db import transaction
from events.models import Event,Booking
from .models import Message
from django.db.models import Q
import html

class CreateMessageSerializer(serializers.ModelSerializer):
    
    class Meta:
        model= Message
        fields= ["id","subject","body","receiver","event"]
        read_only_fields= ["id"]

    def validate(self, attrs):
        request= self.context["request"]
        sender= request.user
        receiver= attrs["receiver"]
        event= attrs["event"]
        
        if sender == receiver or not (Booking.objects.filter(event=event).filter(Q(attendee= sender,event__organizer= receiver)|
            Q(attendee= receiver,event__organizer= sender)).exists()):
            raise serializers.ValidationError({"error": "Messaging allowed between organizer and attendee"})
        ## might remove for e2ee 
        for field in ["subject","body"]:
            attrs[field]= html.escape(attrs[field].strip())
        return attrs
    
    def create(self,validated_data):
        validated_data["sender"] = self.context["request"].user
        return super().create(validated_data)
    
class MessageListSerializer(serializers.ModelSerializer):
    sender_name= serializers.CharField(source="sender.username",read_only=True)
    receiver_name= serializers.CharField(source="receiver.username",read_only=True)
    event_title= serializers.CharField(source="event.title",read_only=True)

    class Meta:
        model = Message
        fields = ["id","sender","sender_name","receiver","receiver_name", 
            "event","event_title","subject","read","created_at"]

class MessageOpenSerializer(serializers.ModelSerializer):
    sender = serializers.CharField(source="sender.username",read_only=True)
    receiver = serializers.CharField(source="receiver.username",read_only=True)
    event = serializers.CharField(source="event.title",read_only=True)

    class Meta:
        model = Message
        fields = "__all__"
    
    def to_representation(self, instance):
        if self.context["request"].user == instance.receiver and not instance.read:
            Message.objects.filter(pk= instance.pk).update(read= True)
            instance.read= True
        return super().to_representation(instance)
    
class MessageDeleteSerializer(serializers.Serializer):
    message_ids = serializers.ListField(child=serializers.IntegerField(),required=True,allow_empty= False)
    
    def validate(self, attrs):
        ids = [id for id in attrs if id is not None]
        if not ids:
            raise serializers.ValidationError("No valid message ids")
        return super().validate(attrs)
    
    def save(self):
        user= self.context["request"].user
        message_ids= self.validated_data["message_ids"]
        
        Message.objects.filter(id__in= message_ids,sender= user).update(deleted_sender= True)
        
        Message.objects.filter(id__in= message_ids,receiver= user).update(deleted_receiver= True)
        
        return self.validated_data