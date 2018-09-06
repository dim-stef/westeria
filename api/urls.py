from django.urls import path
from django.conf.urls import url
from rest_framework import routers
from .views import UserViewSet, UserProfileViewSet, GroupViewSet, GroupRootViewSet

router = routers.DefaultRouter()
router.register(r'users', UserViewSet, base_name='users')
router.register(r'profile', UserProfileViewSet, base_name='profile')
router.register(r'groups', GroupViewSet, base_name='group')
router.register(r'ROOT', GroupRootViewSet, base_name='grouproot')


urlpatterns = [

]

urlpatterns += router.urls
