from django.urls import path
from django.conf.urls import url, include
from rest_framework import routers
from rest_framework_nested import routers
from .views import UserViewSet, UserProfileViewSet, GroupViewSet, GroupRootViewSet, ChildrenViewSet

router = routers.DefaultRouter()
router.register(r'users', UserViewSet, base_name='users')
router.register(r'profile', UserProfileViewSet, base_name='profile')
router.register(r'ROOT', GroupRootViewSet, base_name='grouproot')
router.register(r'groups', GroupViewSet, base_name='group')

group_router = routers.NestedSimpleRouter(router, r'groups')
group_router.register(r'children', ChildrenViewSet, base_name='children')

#children_router = routers.NestedSimpleRouter(group_router, r'children', lookup='uri')

urlpatterns = [
    url(r'^', include(router.urls)),
    url(r'^', include(group_router.urls)),
    #url(r'^', include(children_router.urls)),
]

#urlpatterns += router.urls
