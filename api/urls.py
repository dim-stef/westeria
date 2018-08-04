from .views import UserViewSet, UserProfileViewSet
from rest_framework import routers
from django.conf.urls import url

router = routers.DefaultRouter()
router.register(r'users', UserViewSet, base_name='users')
router.register(r'profile', UserProfileViewSet, base_name='profile')


urlpatterns = [

]

urlpatterns += router.urls
