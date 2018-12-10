from django.urls import path, include
from .views import GroupFormView, GroupTreeView, GroupView

app_name = 'branches'

urlpatterns = [
    path('creategroup/', GroupFormView.as_view()),
    path('<str:uri>/', GroupTreeView.as_view()),
    path('<str:uri>/chat/', include("branchchat.urls")),
    path('', GroupTreeView.as_view()),
    #path('<str:uri>/', GroupView.as_view()),

]
