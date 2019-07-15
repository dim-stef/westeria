from django.conf.urls import url

from . import consumers

websocket_urlpatterns = [
    #url(r'^ws/(?P<branch>[^/]+)/chat_rooms/(?P<room_name>[^/]+)/$', consumers.GroupChatConsumer),
    url(r'^ws/chat/(?P<room_name>[^/]+)/$', consumers.GroupChatConsumer),
]