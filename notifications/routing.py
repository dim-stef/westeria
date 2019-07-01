from django.conf.urls import url

from . import consumers

websocket_urlpatterns = [
    url(r'^ws/notifications/(?P<branch>[^/]+)/$', consumers.NotificationConsumer),
]