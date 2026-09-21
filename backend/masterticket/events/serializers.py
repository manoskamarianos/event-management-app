from rest_framework import serializers
from users.models import User
from django.db import transaction
from .models import Booking, Event, Event_type, Category, Ticket_type, Media
import html

##General Serializers
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
        

## Event Serializers         
class EventReadSerializer(serializers.ModelSerializer):
    event_type = EventTypeSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    ticket_types = TicketTypeSerializer(many=True, read_only=True)
    media = MediaSerializer(many=True, read_only=True)
    organizer = serializers.ReadOnlyField(source="organizer.username")
    status = serializers.ReadOnlyField(source="current_status")
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
        
    def to_representation(self,instance):
        return EventReadSerializer(instance,context=self.context).data
    
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
        for tick in ticket_types:
            capacity += tick["quantity"]
        event= Event.objects.create(capacity=capacity,event_type=event_t,**validated_data)
        
        cats= []
        for cat in categories:
            category,_= Category.objects.get_or_create(name= str(cat).strip().upper())
            cats.append(category)
        event.categories.set(cats)
        
        for tick in ticket_types:
            Ticket_type.objects.create(event=event,available= tick["quantity"],**tick)
        
        return event
    
    @transaction.atomic
    def update(self,instance,validated_data):
        event_type= validated_data.pop("event_type",None)
        categories= validated_data.pop("categories",None)
        ticket_types= validated_data.pop("ticket_types",None)
        
        if event_type is not None:
            event_t, _ = Event_type.objects.get_or_create(name=str(event_type).strip().upper())
            instance.event_type = event_t
        if ticket_types is not None:
            instance.ticket_types.all().delete()
            capacity = 0
            for tick in ticket_types:
                capacity += tick["quantity"]
                Ticket_type.objects.create(event=instance,available=tick["quantity"],**tick)
            instance.capacity = capacity     
        if categories is not None:    
            cats= []
            for cat in categories:
                category,_= Category.objects.get_or_create(name= str(cat).strip().upper())
                cats.append(category)
            instance.categories.set(cats)
        
        for attr,value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
    
##booking serializers
class BookingSerializer(serializers.ModelSerializer):
    event= serializers.ReadOnlyField(source="event.title" )
    attendee= serializers.ReadOnlyField(source= "attendee.username")
    ticket_type= serializers.PrimaryKeyRelatedField(queryset= Ticket_type.objects.all(),required= True)
    
    class Meta:
        model= Booking
        fields= "__all__"
        read_only_fields = ["id","event_title", "total_cost", "status", "created_at","event","attendee"]
        
    def validate(self, attrs):
        ticket_type= attrs.get("ticket_type")
        num_ticket= attrs.get("number_of_tickets")
        
        if not ticket_type:
            raise serializers.ValidationError({"ticket_type": "Ticket type is required"})
        if num_ticket is None or num_ticket<= 0 :
            raise serializers.ValidationError({"number_of_tickets": "Tickets number must be at least 1"})
        if ticket_type.event.current_status != "published": ##might change later (side channel attack)
            raise serializers.ValidationError({"event_status": "Can not request booking for unpublished event"})
        if ticket_type.available < num_ticket:
            raise serializers.ValidationError({"number_of_tickets": f"Not enough tickets available : {ticket_type.available}"})
        
        attrs["event"]=ticket_type.event
        attrs["event_title"]= ticket_type.event.title
        attrs["total_cost"]= ticket_type.price*num_ticket
        attrs["status"]= "pending"
        attrs['attendee']= self.context['request'].user
        return attrs
    
class BookingModifySerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields= ["ticket_type", "number_of_tickets"]
    
    def validate(self, attrs):
        ticket_type= attrs.get("ticket_type",self.instance.ticket_type)
        num_ticket= attrs.get("number_of_tickets",self.instance.number_of_tickets)
        
        if num_ticket<= 0 :
            raise serializers.ValidationError({"number_of_tickets": "Tickets number must be at least 1"})
        if ticket_type.available < num_ticket:
            raise serializers.ValidationError({"number_of_tickets": f"Not enough tickets available : {ticket_type.available}"})
        
        
        return attrs
        
    