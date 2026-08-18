from rest_framework import serializers
from users.models import User
from django.db import transaction
from .models import Event, Event_type, Category, Ticket_type, Media
import html

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model= Category
        fields= ["id","name"]
        
class EventTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model= Event_type
        fields= ["id","name"]
        
class TicketTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model= Ticket_type
        fields= ["id","name","price","quantity","available"]
        read_only_fields = ["id","available"]

class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model= Media
        fields= ["id","photo"]
        
class EventReadSerializer(serializers.ModelSerializer):
    event_type = EventTypeSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    ticket_types = TicketTypeSerializer(many=True, read_only=True)
    media = MediaSerializer(many=True, read_only=True)
    organizer = serializers.ReadOnlyField(source="organizer.username")

    class Meta:
        model = Event
        fields = "__all__"

class EventCreateSerializer(serializers.ModelSerializer):
    categories= serializers.ListField(child= serializers.CharField(),required=True,allow_empty=False)
    event_type = serializers.CharField(write_only=True, required=True, allow_blank=False)
    ticket_types= TicketTypeSerializer(many=True,required=True,allow_empty=False)
    ##Autocompleted fields
    organizer= serializers.ReadOnlyField(source="organizer.username")
    capacity= serializers.ReadOnlyField()
    class Meta:
        model= Event
        fields = "__all__"
        read_only_fields= ["id"]
    
    def validate(self, attrs):
        start = attrs.get("start_date_time")
        end = attrs.get("end_date_time")
        if start and end and start >= end:
            raise serializers.ValidationError({"end_date_time": "End datetime must be after start datetime"})
        return super().validate(attrs)
    
    @transaction.atomic
    def create(self, validated_data):
        event_type= validated_data.pop("event_type")
        categories= validated_data.pop("categories")
        ticket_types= validated_data.pop("ticket_types")
        
        event_t, _ = Event_type.objects.get_or_create(name=str(event_type).strip().upper())
        
        capacity = 0
        for ticket in ticket_types:
            capacity += ticket["quantity"]
        event= Event.objects.create(capacity=capacity,event_type=event_t,**validated_data)
        
        cats= []
        for cat in categories:
            category,_= Category.objects.get_or_create(name= str(cat).strip().upper())
            cats.append(category)
        event.categories.set(cats)
        
        for tick in ticket_types:
            Ticket_type.objects.create(event=event,available= tick["quantity"],**tick)
        
        return event