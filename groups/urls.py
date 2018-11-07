from django.urls import path, include
from .views import GroupFormView, GroupTreeView, GroupView

app_name = 'groups'

urlpatterns = [
    path('creategroup/', GroupFormView.as_view()),
    path('map/<str:uri>', GroupTreeView.as_view()),
    path('map/', GroupTreeView.as_view()),
    path('<str:uri>/', GroupView.as_view()),
    path('<str:uri>/chat/', include("groupchat.urls")),
]
