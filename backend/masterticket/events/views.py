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
from MyMessages.models import Message
from users.models import User
from rest_framework.pagination import PageNumberPagination
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from django_filters import BaseInFilter, CharFilter
from .models import EventRating
import os
import numpy as np
from django.conf import settings
import threading
from django.core.management import call_command


##Event views
def perm_event_list(user):
    if user.role == "admin":
        return Event.objects.all()
    if user.role == "organizer":
        return Event.objects.filter(Q(status="published")|Q(status="completed")| Q(status="cancelled")|Q(organizer=user))
    return Event.objects.filter(Q(status="published")|Q(status="completed")| Q(status="cancelled"))

class EventPagination(PageNumberPagination):
    page_size = 10 
    page_size_query_param = "size" 
    max_page_size = 100
    
class CharInFilter(BaseInFilter, CharFilter):
    pass
class EventFilter(django_filters.FilterSet):
    price_min= django_filters.NumberFilter(field_name="ticket_types__price", lookup_expr="gte", distinct=True)
    price_max= django_filters.NumberFilter(field_name="ticket_types__price", lookup_expr="lte", distinct=True)
    start_date= django_filters.DateTimeFilter(field_name="start_date_time", lookup_expr="gte")    
    end_date= django_filters.DateTimeFilter(field_name="end_date_time", lookup_expr="lte")
    category= CharInFilter(field_name="categories__name",lookup_expr="in",distinct=True)
    class Meta:
        model= Event
        fields= ["start_date", "end_date", "price_min", "price_max", "category"]  
                                  
class ListEvents(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class= EventReadSerializer
    
    pagination_class= EventPagination
    
    filter_backends= [DjangoFilterBackend,filters.SearchFilter]
    filterset_class= EventFilter
    search_fields= ["title","description","city","country","venue","address"]
    
    def get_queryset(self):
        return perm_event_list(self.request.user).order_by('-start_date_time').distinct()

class CreateEvent(generics.CreateAPIView):
    permission_classes= [IsOrganizer]
    serializer_class= EventCreateSerializer
    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)
        if not Recommend.IS_TRAINING:
            Recommend.IS_TRAINING = True
            threading.Thread(target=Recommend.full_training).start()


class RetrieveEvent(generics.RetrieveAPIView):
    permission_classes= [IsAuthenticated]
    serializer_class= EventReadSerializer
    def get_queryset(self):
        return perm_event_list(self.request.user)
    def get_object(self):
        event= super().get_object()
        user= self.request.user
        
        if user.role in ["admin","organizer"]:
            return event
        
        rating= EventRating.objects.filter(user=user, event= event).first()
        if not rating:
            rating= EventRating.objects.create(user= user,event= event)    
        rating.rating = max((min(1.0 + (0.25 + rating.rating), 2.5)),rating.rating)
        rating.save()
        return event

class ManageEvent(generics.GenericAPIView):
    permission_classes= [IsOrganizer|IsAdmin]
    
    def get_queryset(self):
        if self.request.user.role == "admin":
            return Event.objects.all()
        return Event.objects.filter(organizer= self.request.user)
    

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return EventCreateSerializer
        return EventReadSerializer

    def  my_validate(self, event):
        if event.organizer != self.request.user and self.request.user.role != "admin":
            return Response({"error": "Invalid permissions"},status=status.HTTP_403_FORBIDDEN)
        
        if event.current_status == "cancelled" or event.current_status == "completed" :
            return Response({"error": "Event cannot be modified"},status=status.HTTP_400_BAD_REQUEST)
        
        if event.bookings.exists():
            if self.request.method=="DELETE":
                return Response({"error": "Event cannot be deleted"},status=status.HTTP_400_BAD_REQUEST)
            if self.request.data.get("status") != "cancelled":
                return Response({"error": "Event cannot be modified"},status=status.HTTP_400_BAD_REQUEST)
        
        return None
    
    def broadcast_cancel(self,event):
        attendees= User.objects.filter(bookings__event= event).distinct()
        
        cancel_messages=[]
        for attendee in attendees:
            cancel_messages.append(Message(sender= event.organizer,receiver= attendee,event= event,
                                           subject= f"Event cancellation: {event.title}",
                                           body=f"The event with title \"{event.title}\" was cancelled"
                                           )
                                   )
        if cancel_messages:
            Message.objects.bulk_create(cancel_messages)
        
            

    def patch(self, request, *args, **kwargs):
        event = self.get_object()
        error= self.my_validate(event)
        if error:
            return error

        serializer = self.get_serializer(event, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        if serializer.validated_data.get("status")== "cancelled":
            self.broadcast_cancel(event)
        return Response(serializer.data, status=status.HTTP_200_OK)


    def delete(self, request, *args, **kwargs):
        event = self.get_object()
        error = self.my_validate(event)
        if error:
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
    
class ListBookingsOfEvent(generics.ListAPIView):
    permission_classes= [IsAdmin|IsOrganizer]
    serializer_class= BookingSerializer
    
    def get_queryset(self):
        eid= self.kwargs.get("pk")
        user= self.request.user
        
        if user.role== "admin":
            return Booking.objects.filter(event_id= eid).order_by("-created_at")
        if user.role== "organizer":
            return Booking.objects.filter(event_id= eid, event__organizer= user).order_by("-created_at")
        
        return Booking.objects.none()
    
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
    
    def booking_rating(self,user,event):
        if user.role in ["admin","organizer"]:
            return
        EventRating.objects.update_or_create(user= user,event= event, defaults={"rating":5.0})
    
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
        self.booking_rating(request.user,booking.event)
        
        return Response(self.get_serializer(booking).data, status= status.HTTP_200_OK)
    
##Recommendation View
    

class Recommend(generics.ListAPIView):
    permission_classes= [IsParticipant]
    serializer_class= EventReadSerializer
    Rec_vectors= None
    IS_TRAINING= False
    
    @staticmethod
    def Rec_vectors_load():
        if Recommend.Rec_vectors is None:
            path= os.path.join(settings.BASE_DIR, "Recommendation_Vec",  "Recommendation_Vec.npz")
            if os.path.exists(path):
                data = np.load(path, allow_pickle=True)
                Recommend.Rec_vectors= {"V":data["V"],"F":data["F"],"b":data["b"],"c":data["c"],"m":data["m"],"users_map":data["users_map"].item(),"events_map":data["events_map"].item()}
        return Recommend.Rec_vectors

    @staticmethod
    def full_training():
        try:
            call_command("Full_Matrix_Factorization")
        finally:
            Recommend.IS_TRAINING = False
    
    @staticmethod
    def user_fold_in(uid):
        ratings= EventRating.objects.filter(user_id=uid).values("event_id","rating")
        if not ratings:
            return False

        users_map= Recommend.Rec_vectors["users_map"]
        events_map= Recommend.Rec_vectors["events_map"]
        V= Recommend.Rec_vectors["V"]
        F= Recommend.Rec_vectors["F"]
        b= Recommend.Rec_vectors["b"]
        c= Recommend.Rec_vectors["c"]
        m= Recommend.Rec_vectors["m"]
        
        rated_mapped_events = []
        for rat in ratings:
            if rat["event_id"] in events_map:
                rated_mapped_events.append((events_map[rat["event_id"]], rat["rating"]))
        if not rated_mapped_events:
            return False
        V_u= np.mean([F[i] for i, _ in rated_mapped_events],axis=0)
        b_u= 0.0
        myeta= 0.02
        mylamda= 0.1
        for j in range(50):
            for i, rat in rated_mapped_events:
                x= m + b_u + c[i] + np.dot(V_u,F[i])
                e= rat - x 
                b_u+= myeta*(e-mylamda*b_u)
                V_u = myeta*(e*F[i] - mylamda*V_u) + V_u
        users_map[uid]= len(users_map)
        Recommend.Rec_vectors["V"]= np.vstack([V, V_u])
        Recommend.Rec_vectors["b"]= np.append(b, b_u)
        Recommend.Rec_vectors["users_map"]= users_map
        return True

        
        
    def get(self,request, *args, **kwargs):
        
        uid= request.user.id 
        try:
            Rec_vectors= self.Rec_vectors_load()
            if not Rec_vectors:
                raise FileNotFoundError
        except FileNotFoundError:
            if not Recommend.IS_TRAINING:
                Recommend.IS_TRAINING = True
                threading.Thread(target=Recommend.full_training).start()
            return Response([], status=status.HTTP_200_OK)

        users_map= Rec_vectors["users_map"]
        events_map= Rec_vectors["events_map"]

        Recommendation= []
        
        if uid not in users_map: 
            if not Recommend.user_fold_in(uid):
                if not Recommend.IS_TRAINING:
                    Recommend.IS_TRAINING = True
                    threading.Thread(target=Recommend.full_training).start()        
                return Response([], status=status.HTTP_200_OK)
            else:
                users_map= Rec_vectors["users_map"]
            if not Recommend.IS_TRAINING:
                Recommend.IS_TRAINING = True
                threading.Thread(target=Recommend.full_training).start()
        
        V= Rec_vectors["V"]
        F= Rec_vectors["F"]
        b= Rec_vectors["b"]
        c= Rec_vectors["c"]
        m= Rec_vectors["m"]

        Prediction_vector= m+b[users_map[uid]]+c+np.dot(F,V[users_map[uid]])
        top_events= np.argsort(Prediction_vector)[::-1][:20]
        
        events_map_inverted= {}
        for id, idx in events_map.items():
            events_map_inverted[idx]= id
        
        rec_event_ids = []
        for idx in top_events:
            if idx in events_map_inverted:
                rec_event_ids.append(events_map_inverted[idx])
        database_events= Event.objects.filter(id__in= rec_event_ids,status="published")
        
        dict_event= {}
        for event in database_events:
            dict_event[event.id]= event
        
        for id in rec_event_ids:
            if id in dict_event:
                Recommendation.append(dict_event[id])
                 
        
        
        serializer=  self.get_serializer(Recommendation, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
            