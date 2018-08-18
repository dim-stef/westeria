from django.urls import path
from .views import CoreView, GoogleView

app_name = 'core'

urlpatterns = [
    path('', CoreView.as_view(), name='home'),
    path('google0677b618caac6923.html', GoogleView.as_view()),
]