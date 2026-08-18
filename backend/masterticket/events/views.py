from django.shortcuts import render  
from rest_framework import generics, status
from rest_framework.response import Response
from .serializers import MediaSerializer,CategorySerializer,EventReadSerializer,EventTypeSerializer,TicketTypeSerializer,EventCreateSerializer
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.exceptions import TokenError
from users.permissions import IsAdmin,IsGuest,IsParticipant,IsOrganizer
from .models import Event, Category, Event_type
from rest_framework.permissions import IsAuthenticated

class ListEvents(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EventReadSerializer
    queryset = Event.objects.all().order_by('-start_date_time')

class CreateEvent(generics.CreateAPIView):
    permission_classes = [IsOrganizer]
    serializer_class = EventCreateSerializer
    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

class RetrieveEvent(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EventReadSerializer
    queryset = Event.objects.all()



###################################  
class ManageEvent(generics.GenericAPIView):
    permission_classes = [IsOrganizer]
    queryset = Event.objects.all()

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return EventCreateSerializer
        return EventReadSerializer

    def check_permissions_and_status(self, event):
        if event.organizer != self.request.user and self.request.user.role != 'admin':
            return Response(
                {"error": "You do not have permission to modify this event."},
                status=status.HTTP_403_FORBIDDEN
            )
        if getattr(event, 'status', None) == 'published':
            return Response(
                {"error": "Published events cannot be modified or deleted."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return None

    def patch(self, request, *args, **kwargs):
        event = self.get_object()
        if error := self.check_permissions_and_status(event):
            return error

        serializer = self.get_serializer(event, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, *args, **kwargs):
        event = self.get_object()
        if error := self.check_permissions_and_status(event):
            return error

        serializer = self.get_serializer(event, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        event = self.get_object()
        if error := self.check_permissions_and_status(event):
            return error

        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)