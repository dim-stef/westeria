from django.urls import path
from .views import settings, SettingsUserProfileFormView

urlpatterns = [
    path('settings/', SettingsUserProfileFormView.as_view()),
]