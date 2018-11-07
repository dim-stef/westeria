from django.urls import path, include
from . import views

app_name = 'groupchat'

urlpatterns = [
    path('<str:room_name>', views.index),
]
