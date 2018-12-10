from django.urls import path, include
from . import views

app_name = 'branchchat'

urlpatterns = [
    path('', views.indexgeneral),
    path('<str:room_name>', views.index),
]
