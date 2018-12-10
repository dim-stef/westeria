from django.urls import path, include
from rest_framework_jwt.views import obtain_jwt_token, refresh_jwt_token
from .views import BaseUserView

urlpatterns = [
    path('token/', obtain_jwt_token),
    path('token-refresh/', refresh_jwt_token),
]
