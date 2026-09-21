from django.shortcuts import render
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.permissions import IsAdmin, IsGuest, IsOrganizer, IsParticipant
from .models import Message
from .serializers import CreateMessageSerializer,MessageDeleteSerializer,MessageOpenSerializer,MessageListSerializer

class ListReceivedView(generics.ListAPIView):
    serializer_class= MessageListSerializer
    permission_classes= [IsOrganizer|IsParticipant]
    
    def get_queryset(self):
        return Message.objects.filter(receiver= self.request.user,deleted_receiver= False).select_related("sender","receiver","event").order_by("-created_at")

class ListSendedView(generics.ListAPIView):
    serializer_class= MessageListSerializer
    permission_classes= [IsOrganizer|IsParticipant]
    
    def get_queryset(self):
        return Message.objects.filter(sender= self.request.user,deleted_sender= False).select_related("sender","receiver","event").order_by("-created_at")

class CreateMessageView(generics.CreateAPIView):
    serializer_class= CreateMessageSerializer
    permission_classes= [IsOrganizer|IsParticipant]
    
class OpenMessageView(generics.RetrieveAPIView):
    serializer_class= MessageOpenSerializer
    permission_classes= [IsOrganizer|IsParticipant]
    
    def get_queryset(self):
        return Message.objects.filter((Q(sender= self.request.user) & Q(deleted_sender= False))| (Q(receiver=self.request.user) & Q(deleted_receiver= False))).select_related("sender","receiver","event")
    
class DeleteMessageView(generics.GenericAPIView):
    serializer_class= MessageDeleteSerializer
    permission_classes= [IsOrganizer|IsParticipant]
    
    def post(self, request, *args, **kwargs):
        serializer= self.get_serializer(data= request.data,context= {"request":request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail":"Deleted successfully"},status=status.HTTP_200_OK)