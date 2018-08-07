from django.urls import path
from django.contrib.auth.decorators import login_required
from .views import SettingsUserProfileFormView

urlpatterns = [
    path('settings/', login_required(SettingsUserProfileFormView.as_view())),
]