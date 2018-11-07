from django.urls import path
from django.conf.urls import url, include
from rest_framework import routers
from rest_framework_nested import routers
from . import views

router = routers.DefaultRouter()
router.register(r'users', views.UserViewSet, base_name='users')
router.register(r'profile', views.UserProfileViewSet, base_name='profile')
router.register(r'ROOT', views.GroupRootViewSet, base_name='grouproot')
router.register(r'groups', views.GroupViewSet, base_name='group')  # lookup= 'groups'

group_router = routers.NestedSimpleRouter(router, r'groups')  # lookup= 'children'
group_router.register(r'children', views.ChildrenViewSet, base_name='children')

groupchat_router = routers.NestedSimpleRouter(router, r'groups')  # lookup= 'groupchat'
groupchat_router.register(r'chat', views.GroupChatViewSet, base_name='chat')

messages_router = routers.NestedSimpleRouter(groupchat_router, r'chat')
messages_router.register(r'messages', views.GroupChatMessageViewSet, base_name='messages')


urlpatterns = [
    url(r'^', include(router.urls)),
    url(r'^', include(group_router.urls)),
    url(r'^', include(groupchat_router.urls)),
]
