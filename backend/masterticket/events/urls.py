from django.urls import path
from .views import ListEvents,CreateEvent,RetrieveEvent,ManageEvent
from .views import ListBooking,CreateBooking,ModifyBooking,ConfirmBooking,CancelBooking

app_name="events"

urlpatterns = [
    ##events
    path("",ListEvents.as_view(),name="ListEvents"),
    path("<int:pk>/",RetrieveEvent.as_view(),name= "GetEvent"),
    path("create/",CreateEvent.as_view(),name="CreateEvent"),
    path("MyEvents/<int:pk>/",ManageEvent.as_view(),name="ManageEvent"),
    
    ##booking
    path("bookings/",ListBooking.as_view(),name="ListBooking"),
    path("bookings/create/",CreateBooking.as_view(),name="CreateBooking"),
    path("bookings/<int:pk>/modify/",ModifyBooking.as_view(),name="ModifyBooking"),
    path("bookings/<int:pk>/confirm/",ConfirmBooking.as_view(),name="ConfirmBooking"),
    path("bookings/<int:pk>/cancel/",CancelBooking.as_view(),name="CancelBooking")
]
