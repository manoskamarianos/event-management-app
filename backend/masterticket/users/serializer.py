from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from .models import User
import html

class Login_token(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        if not self.user.approved and self.user.role != 'admin' :
            raise AuthenticationFailed("Your account is pending admin approval\n")
        
        data['username']= self.user.username
        data['role']= self.user.role
        data['first_name']= self.user.first_name 
        
        return data

## Log out refresh token  blacklisting
class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

##for overwriting the to_internal_value function and adding sanitization


class UserSerializer(serializers.ModelSerializer):
    ##Sanitization
    location = serializers.SerializerMethodField() #ignored as read only
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ["id","username","password","password_confirm", "location","latitude", "longitude","role","requested_role","approved","first_name","last_name","email","telephone","address","taxNumber"]
        extra_kwargs = {"password":{"write_only": True, "required": True},
                        "approved":{"read_only": True},
                        "role":{"read_only": True},
                        "email":{"required": True},
                        "longitude": {"write_only": True},
                        "latitude": {"write_only": True},
                        }
    
    def get_location(self, obj):
        if obj.latitude is not None and obj.longitude is not None:
            return {
                "latitude": obj.latitude,
                "longitude": obj.longitude
            }
        return None
    
    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password_confirm"):
            raise serializers.ValidationError({"password": "Passwords do not match."})
        for field,value in attrs.items():
            if isinstance(value, str):
                attrs[field] = html.escape(value.strip())
        return attrs
    
    def create(self, validated_data):
        ##Uses libs AbstractUser create that also hashes the password
        validated_data.pop("password_confirm")
        return User.objects.create_user(**validated_data)
    
class UserProfileSerializer(serializers.ModelSerializer):
    ##Sanitization
    location = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ["id","username", "location","latitude", "longitude","requested_role","approved","first_name","last_name","email","telephone","address","taxNumber"]
        extra_kwargs = {"approved":{"read_only": True},
                        "role":{"read_only": True},
                        "requested_role":{"read_only": True},
                        "id":{"read_only": True},
                        "username":{"read_only": True},
                        "longitude": {"write_only": True}, ## handled by the get 
                        "latitude": {"write_only": True},
                        }
    
    def validate(self, attrs):
        for field,value in attrs.items():
            if isinstance(value, str):
                attrs[field] = html.escape(value.strip())
        return super().validate(attrs)
    def get_location(self, obj):
        if obj.latitude is not None and obj.longitude is not None:
            return {
                "latitude": obj.latitude,
                "longitude": obj.longitude
            }
        return None