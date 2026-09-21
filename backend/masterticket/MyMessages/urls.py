from django.urls import path
from .views import ListReceivedView,ListSendedView,CreateMessageView,OpenMessageView,DeleteMessageView

app_name="MyMessages"

urlpatterns = [
    path("inbox/",ListReceivedView.as_view(),name= "ListInbox"),
    path("outbox/",ListSendedView.as_view(),name= "ListOutbox"),
    path("send/", CreateMessageView.as_view(),name= "CreateMessage"),
    path("delete/", DeleteMessageView.as_view(),name= "DeleteMessage"),
    path("<int:pk>/", OpenMessageView.as_view(),name= "OpenMessage")    
]
