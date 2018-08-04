from django.urls import path
from .views import GroupFormView
from django.views.generic.base import RedirectView

app_name = 'groups'

urlpatterns = [
    path('creategroup/', GroupFormView.as_view()),
]