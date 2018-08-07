from django.urls import path
from .views import GroupFormView, GroupView

app_name = 'groups'

urlpatterns = [
    path('creategroup/', GroupFormView.as_view()),
    path('map/', GroupView.as_view())
]
