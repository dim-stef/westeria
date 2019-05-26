from django.urls import path
from django.conf.urls import url, include
from rest_framework_nested import routers
from rest_framework_swagger.views import get_swagger_view
schema_view = get_swagger_view(title='Pastebin API')
from . import views

router = routers.DefaultRouter()
router.register(r'user', views.UserViewSet, base_name='user')
router.register(r'user/following', views.UserFollowViewSet, base_name='user_following')
router.register(r'reacts',views.ReactsViewSet,base_name="reacts"),
router.register(r'post/add_reply', views.AddPostReply, base_name='add_reply')
router.register(r'post/remove_reply', views.RemovePostReply, base_name='remove_reply')
router.register(r'post',views.BranchPost,base_name="post"),
router.register(r'owned_branches', views.OwnedBranchesViewSet, base_name='owned_branches')
router.register(r'public_profile', views.BranchPublicProfileSerializer, base_name='public_profile')
router.register(r'ROOT', views.BranchRootViewSet, base_name='branchroot')
router.register(r'branches', views.BranchViewSet, base_name='branch')
router.register(r'branches/update', views.BranchUpdateViewSet, base_name='update')
router.register(r'branches/add_follow', views.BranchAddFollowViewSet, base_name='add_follow')
router.register(r'branches/remove_follow', views.BranchRemoveFollowViewSet, base_name='remove_follow')

branch_router = routers.NestedSimpleRouter(router, r'branches', lookup='branch')
branch_router.register(r'create_branch_request', views.CreateBranchRequest,base_name='create_branch_request')
branch_router.register(r'requests', views.ReceivedBranchRequest,base_name='received_requests')
branch_router.register(r'request/update', views.UpdateReceivedBranchRequest,base_name='update_request')
branch_router.register(r'newfollow', views.BranchNewFollowViewSet, base_name='new_follow')
branch_router.register(r'children', views.ChildrenViewSet, base_name='children')
branch_router.register(r'parents', views.ParentViewSet, base_name='parents')
branch_router.register(r'posts/new', views.BranchNewPostViewSet, base_name='new_post')
branch_router.register(r'posts', views.BranchPostListViewSet, base_name='posts')
branch_router.register(r'spreads/new', views.NewSpread, base_name='new_spread')
branch_router.register(r'follows', views.BranchFollowsViewSet, base_name='follows')
branch_router.register(r'feed', views.FeedViewSet, base_name='feed')

branchupdate_router = routers.NestedSimpleRouter(router, r'branches', lookup='branch')
branchupdate_router.register(r'settings', views.BranchUpdateViewSet, base_name='settings')

branchchat_router = routers.NestedSimpleRouter(router, r'branches', lookup='branch')
branchchat_router.register(r'chat', views.BranchChatViewSet, base_name='chat')

messages_router = routers.NestedSimpleRouter(branchchat_router, r'chat')
messages_router.register(r'messages', views.BranchChatMessageViewSet, base_name='messages')


urlpatterns = [
    url(r'^$', schema_view),
    path('search/',views.search),
    path('branches/<str:uri>/reactions/', views.BranchReactions.as_view()),
    path('token/', views.CreateToken.as_view()),
    path('user/default_branch/', views.defaultBranch),

    url(r'^', include(router.urls)),
    url(r'^', include(branch_router.urls)),
    url(r'^', include(branchupdate_router.urls)),
    url(r'^', include(branchchat_router.urls)),
    url(r'^', include(messages_router.urls)),
]