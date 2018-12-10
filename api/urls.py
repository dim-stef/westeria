from django.urls import path
from django.conf.urls import url, include
from rest_framework import routers
from rest_framework_nested import routers
from . import views

router = routers.DefaultRouter()
router.register(r'user', views.UserViewSet, base_name='user')
router.register(r'owned_branches', views.OwnedBranchesViewSet, base_name='owned_branches')
router.register(r'profile', views.UserProfileViewSet, base_name='profile')
router.register(r'public_profile', views.BranchPublicProfileSerializer, base_name='public_profile')
router.register(r'ROOT', views.BranchRootViewSet, base_name='branchroot')
router.register(r'branches', views.BranchViewSet, base_name='branch')  # lookup= 'branches'

branch_router = routers.NestedSimpleRouter(router, r'branches')  # lookup= 'children'
branch_router.register(r'children', views.ChildrenViewSet, base_name='children')

branchchat_router = routers.NestedSimpleRouter(router, r'branches')  # lookup= 'branchchat'
branchchat_router.register(r'chat', views.BranchChatViewSet, base_name='chat')

messages_router = routers.NestedSimpleRouter(branchchat_router, r'chat')
messages_router.register(r'messages', views.BranchChatMessageViewSet, base_name='messages')


urlpatterns = [
    url(r'^', include(router.urls)),
    url(r'^', include(branch_router.urls)),
    url(r'^', include(branchchat_router.urls)),
    url(r'^', include(messages_router.urls)),
    path('token/', views.CreateToken.as_view())
]