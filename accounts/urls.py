from django.urls import path, include
from .views import BaseUserView

urlpatterns = [
    path('<url>/', BaseUserView.as_view()),
]
