from django.urls import path, include
from .views import BaseUserView

urlpatterns = [
    path('<str:url>/', BaseUserView.as_view()),
]
