from django.shortcuts import get_object_or_404, render  
from rest_framework import generics, status
from rest_framework.response import Response
from .serializers import BookingModifySerializer, MediaSerializer,CategorySerializer,EventReadSerializer,EventTypeSerializer,TicketTypeSerializer,EventCreateSerializer,BookingSerializer
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.exceptions import TokenError
from users.permissions import IsAdmin,IsGuest,IsParticipant,IsOrganizer
from .models import Event, Category, Event_type,Booking, Ticket_type
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

##Event views
def perm_event_list(user):
    if user.role == "admin":
        return Event.objects.all()
    if user.role == "organizer":
        return Event.objects.filter(Q(status="published")|Q(status="completed")| Q(status="cancelled")|Q(organizer=user))
    return Event.objects.filter(Q(status="published")|Q(status="completed")| Q(status="cancelled"))
                                
class ListEvents(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class= EventReadSerializer
    def get_queryset(self):
        return perm_event_list(self.request.user).order_by('-start_date_time')

class CreateEvent(generics.CreateAPIView):
    permission_classes= [IsOrganizer]
    serializer_class= EventCreateSerializer
    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

class RetrieveEvent(generics.RetrieveAPIView):
    permission_classes= [IsAuthenticated]
    serializer_class= EventReadSerializer
    def get_queryset(self):
        return perm_event_list(self.request.user)

class ManageEvent(generics.GenericAPIView):
    permission_classes= [IsOrganizer]
    
    def get_queryset(self):
        if self.request.user.role == "admin":
            return Event.objects.all()
        return Event.objects.filter(organizer= self.request.user)
    

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return EventCreateSerializer
        return EventReadSerializer

    def my_validate(self, event):
        if event.organizer != self.request.user and self.request.user.role != "admin":
            return Response(
                {"error": "Invalid permissions"},
                status=status.HTTP_403_FORBIDDEN
                )
        if event.current_status == "cancelled" or event.current_status == "completed" or event.bookings.exists():
            return Response(
                {"error": "Event cannot be modified"},
                status=status.HTTP_400_BAD_REQUEST
                )
        
        return None

    def patch(self, request, *args, **kwargs):
        event = self.get_object()
        if error := self.my_validate(event):
            return error

        serializer = self.get_serializer(event, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


    def delete(self, request, *args, **kwargs):
        event = self.get_object()
        if error := self.my_validate(event):
            return error

        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

##Booking views


class ListBooking(generics.ListAPIView):
    permission_classes= [IsParticipant]
    serializer_class= BookingSerializer
    def get_queryset(self):
        return Booking.objects.filter(attendee= self.request.user).select_related("ticket_type","event").order_by("-created_at")
    
class CreateBooking(generics.CreateAPIView):
    permission_classes= [IsParticipant]
    serializer_class= BookingSerializer
    
###should check    
class ModifyBooking(generics.GenericAPIView):
    permission_classes= [IsParticipant]
    serializer_class= BookingModifySerializer

    def get_queryset(self):
        return Booking.objects.filter(attendee= self.request.user,status= "pending")

    def patch(self,request,pk):
        booking= self.get_object()        
        serializer= self.get_serializer(booking,data=request.data,partial=True)
        serializer.is_valid(raise_exception=True)

        ticket_type= serializer.validated_data.get("ticket_type",booking.ticket_type)
        num_tickets= serializer.validated_data.get("number_of_tickets",booking.number_of_tickets)

        serializer.save(event=ticket_type.event,event_title=ticket_type.event.title,total_cost=ticket_type.price*num_tickets)
        return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)
    
class CancelBooking(generics.GenericAPIView):
    permission_classes= [IsParticipant]
    serializer_class= BookingSerializer
    
    def post(self,request,pk):
        booking = get_object_or_404(Booking, pk= pk , attendee= request.user)
        if booking.status == Booking.Status.CANCELLED:
            return Response({"error": "Booking is already cancelled"},status=status.HTTP_400_BAD_REQUEST)
        if booking.status != "pending":
            return Response({"error": f"Unmodifiable status {booking.status}"},status=status.HTTP_400_BAD_REQUEST)
        booking.status= "cancelled"
        booking.save()
        
        return Response(self.get_serializer(booking).data, status= status.HTTP_200_OK)
        
class ConfirmBooking(generics.GenericAPIView):
    permission_classes= [IsParticipant]
    serializer_class= BookingSerializer
    
    @transaction.atomic
    def post(self,request,pk):
        booking = get_object_or_404(Booking, pk= pk , attendee= request.user)
        
        if booking.status != "pending":
            return Response({"error": f"Unmodifiable status {booking.status}"},status=status.HTTP_400_BAD_REQUEST)
        
        ticket_type = Ticket_type.objects.select_for_update().get(id= booking.ticket_type.id)
        
        if ticket_type.available < booking.number_of_tickets:
            return Response({"error": f"Tickets sold out. {ticket_type.available} remaining"},status=status.HTTP_400_BAD_REQUEST)
        ticket_type.available -= booking.number_of_tickets
        ticket_type.save()
        booking.status= "confirmed"
        booking.save()
        
        return Response(self.get_serializer(booking).data, status= status.HTTP_200_OK)
            