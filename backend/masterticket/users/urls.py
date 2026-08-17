from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import Login,Logout, Register, UserProfile, ListUsers, RetrieveUser,ApproveUser,RequestRole

urlpatterns = [
    path('register/', Register.as_view(), name='register'),
    path('login/', Login.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', Logout.as_view(),name= 'logout'),
    path('profile/', UserProfile.as_view(), name='user_profile'),  
    path('admin/users/', ListUsers.as_view(), name='list_user'),
    path('admin/users/<int:pk>/', RetrieveUser.as_view(), name='retrieve_user'),  
    path('admin/users/<int:pk>/approve/', ApproveUser.as_view(), name='approve_user') ,
    path('request/role/', RequestRole.as_view(), name="request_role")
]