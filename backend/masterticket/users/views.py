from django.shortcuts import render  
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializer import UserSerializer,Login_token, LogoutSerializer, UserProfileSerializer
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from .permissions import IsAdmin

## User API Views

class RequestRole(generics.GenericAPIView):
    permission_classes= [IsAuthenticated]
    def post(self, request):
        requested_role = request.data.get("requested_role")
        if requested_role not in ["guest","participant","organizer"]:
            return Response(
                {"error": "Invalid role request"},
                status=status.HTTP_400_BAD_REQUEST            
                )
        request.user.requested_role = requested_role
        request.user.save()
        return Response(
            {"message": f"Role change requested to {requested_role}"},
            status=status.HTTP_200_OK
        )
        
class Register(generics.CreateAPIView):
    permission_classes= [AllowAny]
    serializer_class = UserSerializer
    def create(self, request, *args, **kwargs):
        
        serializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception = True)
        self.perform_create(serializer)
        return Response(
            {"message":"Registration successful. Awaiting admin approval\n"},
            status= status.HTTP_201_CREATED
        )
class UserProfile(generics.RetrieveUpdateAPIView):
    permission_classes= [IsAuthenticated]
    serializer_class = UserProfileSerializer
    def get_object(self):## because the user does not need to pass the id
        return self.request.user
    
class Login(TokenObtainPairView):
    permission_classes= [AllowAny]
    serializer_class= Login_token
class Logout(generics.GenericAPIView):
    permission_classes= [IsAuthenticated] ## not needed just for sure
    serializer_class = LogoutSerializer
    
    def post(self, request):
        serializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception = True)
        try:
            refresh_tok = serializer.validated_data["refresh"]
            token = RefreshToken(refresh_tok)
            if str(token.payload.get("user_id"))!= str(request.user.id):
                return Response(
                    {"error": "You do not have permission to blacklist this token"},
                    status= status.HTTP_403_FORBIDDEN,
                )
            token.blacklist()
            return Response(
                {"message": "Successfully logged out"},
                status= status.HTTP_205_RESET_CONTENT
            )
        except TokenError:
            return Response(
                {"error": "Invalid or expired token"},
                status= status.HTTP_400_BAD_REQUEST
            )
            
## Admin API Views

class ListUsers(generics.ListAPIView):
    permission_classes= [IsAdmin]
    serializer_class = UserProfileSerializer
    queryset = User.objects.all().order_by('-date_joined')

class RetrieveUser(generics.RetrieveAPIView):
    permission_classes= [IsAdmin]
    serializer_class= UserProfileSerializer
    queryset = User.objects.all()

class ApproveUser(generics.GenericAPIView):
    permission_classes= [IsAdmin]
    queryset = User.objects.all()
    
    def patch(self,request , *args, **kwargs):
        user= self.get_object()
        approve= request.data.get("approve")
        
        if not isinstance(approve,bool) :
            return Response(
                {"error": "Field \"approve\" must be boolean"},
                status=status.HTTP_400_BAD_REQUEST
            )
        askedforadmin = ""
        if approve:
            if user.requested_role == "admin":
                askedforadmin = "The user asked for admin. Fallback to Guest."
                user.role = "guest" 
            else:
                user.role = user.requested_role    
        user.requested_role = None 
        user.approved = approve
        user.save()
        approve_str = "approved" if approve else "rejected"
        return Response(
            {"message": f"User {user.username} with id {user.id} successfully {approve_str}. {askedforadmin}"},
            status=status.HTTP_200_OK
        )
            