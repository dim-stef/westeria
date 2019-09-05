from django.urls import path, include
from django.conf.urls import url, include
from push_notifications.api.rest_framework import APNSDeviceAuthorizedViewSet, GCMDeviceAuthorizedViewSet
from rest_framework_swagger.views import get_swagger_view
schema_view = get_swagger_view(title='Pastebin API')
from rest_framework_nested import routers
from api import views as views_v0
from . import views

router = routers.DefaultRouter()
router.register(r'device/apns', APNSDeviceAuthorizedViewSet)
router.register(r'device/gcm', GCMDeviceAuthorizedViewSet)

router.register(r'owned_branches',views.OwnedBranchesViewSet,base_name="owned_branches")
router.register(r'branches', views_v0.BranchViewSet, base_name='branch')

branch_router = routers.NestedSimpleRouter(router, r'branches', lookup='branch')
branch_router.register(r'follows', views.FollowingBranchesViewSet,base_name='following_branches')
branch_router.register(r'mutual_follows', views.MutualFollowsViewSet,base_name='mutual_follows')

branchchat_router = routers.NestedSimpleRouter(router, r'branches', lookup='branch')
branchchat_router.register(r'create_conversation', views.CreateConversationViewSet,base_name='create_conversation')
branchchat_router.register(r'conversation_invitations', views.ConversationInvitationsViewSet,base_name='conversation_invitations')


urlpatterns = [
    url(r'^$', schema_view),
    url(r'^', include(router.urls)),
    url(r'^', include(branch_router.urls)),
    url(r'^', include(branchchat_router.urls)),
    path('', include('api.urls'))
]