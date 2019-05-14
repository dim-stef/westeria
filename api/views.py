from django.contrib.auth import get_user_model
from django.db.models import Count
from django.core.exceptions import PermissionDenied
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from rest_framework import viewsets, views, mixins,generics,filters,permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.pagination import LimitOffsetPagination, PageNumberPagination, CursorPagination
from rest_framework_jwt.settings import api_settings
from rest_framework.parsers import MultiPartParser,JSONParser,FileUploadParser
from branches.models import Branch, BranchRequest
from branchchat.models import BranchChat, BranchMessage
from branchposts.models import Post,React,Spread
from . import serializers
from itertools import chain

jwt_payload_handler = api_settings.JWT_PAYLOAD_HANDLER
jwt_encode_handler = api_settings.JWT_ENCODE_HANDLER


class CreateToken(views.APIView):

    def __init__(self):
        super(CreateToken, self).__init__()

    def get(self, request, format=None):
        user_instance = get_user_model().objects.get(id=request.user.id)

        payload = jwt_payload_handler(user_instance)
        token = jwt_encode_handler(payload)
        return Response({'token': token})


class ChildrenPagination(PageNumberPagination):
    page_size = 2
    page_size_query_param = 'page_size'
    max_page_size = 50


class ChildrenLimitOffsetPagination(LimitOffsetPagination):
    default_limit = 2
    max_limit = 10


class BranchChatMessagePagination(CursorPagination):
    page_size = 50



class BranchPostPagination(CursorPagination):
    page_size = 15


class FeedPagination(CursorPagination):
    page_size = 30


class UserViewSet(# mixins.DestroyModelMixin,
                  mixins.ListModelMixin,
                  viewsets.GenericViewSet):
    permission_classes = (permissions.IsAuthenticated,)
    def get_serializer_class(self):
        user = self.request.user
        if user.is_superuser:
            return serializers.UserAdminSerializer
        else:
            return serializers.UserSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = get_user_model().objects.filter(id=user.id)
        return queryset


class SearchResults(viewsets.GenericViewSet,
                    mixins.ListModelMixin):
    lookup_value_regex = '(?i)[\w.@+-]+'
    lookup_field = 'uri'
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchSerializer

    def get_queryset(self):
        vector = SearchVector('uri')
        query = SearchQuery(self.kwargs.get('query'))
        queryset= Branch.objects.annotate(rank=SearchRank(vector,query))
        print(queryset)
        return queryset


@api_view(['GET'])
def search(request):
    vector = SearchVector('uri')
    query = SearchQuery(request.query_params.get('branch',None))
    queryset = Branch.objects.annotate(rank=SearchRank(vector, query)).order_by('-rank')
    serializer = serializers.BranchSerializer(queryset,many=True)
    return Response(serializer.data)


class BranchPublicProfileSerializer(mixins.RetrieveModelMixin,
                         mixins.ListModelMixin,
                         viewsets.GenericViewSet):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchPublicProfileSerializer

    def get_queryset(self):
        branch = self.kwargs['pk']
        queryset = Branch.objects.filter(id=branch)
        return queryset


class OwnedBranchesViewSet(mixins.RetrieveModelMixin,
                         mixins.ListModelMixin,
                         viewsets.GenericViewSet):
    serializer_class = serializers.OwnedBranchesSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = user.owned_groups.all()
        return queryset


@api_view(['GET'])
def defaultBranch(request):
    print("in")
    user = request.user
    default = user.owned_groups.get(default=True)
    serializer = serializers.BranchSerializer(default)
    return Response(serializer.data)


class DefaultBranchViewSet(mixins.RetrieveModelMixin,
                    viewsets.GenericViewSet,):

    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchSerializer

    def get_object(self):
        user = self.request.user
        queryset = user.owned_groups.get(default=True)
        return queryset


class BranchViewSet(mixins.RetrieveModelMixin,
                    viewsets.GenericViewSet,):
    lookup_value_regex = '(?i)[\w.@+-]+'
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchSerializer
    lookup_field = 'uri'

    def get_queryset(self):
        queryset = Branch.objects.none()
        if self.kwargs['uri']:
            queryset = Branch.objects.filter(uri__iexact=self.kwargs['uri'])
            print(queryset)
        return queryset


class BranchRootViewSet(viewsets.GenericViewSet,
                        mixins.ListModelMixin):
    serializer_class = serializers.BranchSerializer

    def get_queryset(self):
        queryset = Branch.objects.filter(name="ROOT", tag=None)
        return queryset


class ChildrenViewSet(viewsets.GenericViewSet,
                      mixins.RetrieveModelMixin,
                      mixins.ListModelMixin):
    lookup_value_regex = '(?i)[\w.@+-]+'
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchSerializer
    pagination_class = ChildrenLimitOffsetPagination

    def get_queryset(self):
        queryset = Branch.objects.none()
        if self.kwargs['nested_1_uri']:
            children = Branch.objects.get(uri__iexact=self.kwargs['nested_1_uri']).children.all()
            queryset = children
        return queryset

class ParentViewSet(viewsets.GenericViewSet,
                      mixins.RetrieveModelMixin,
                      mixins.ListModelMixin):
    lookup_value_regex = '(?i)[\w.@+-]+'
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchSerializer
    pagination_class = ChildrenLimitOffsetPagination

    def get_queryset(self):
        queryset = Branch.objects.none()
        if self.kwargs['nested_1_uri']:
            parents = Branch.objects.get(uri__iexact=self.kwargs['nested_1_uri']).parents.all()
            queryset = parents
        return queryset


class BranchUpdateMixin(viewsets.GenericViewSet,
                        mixins.UpdateModelMixin,):
    lookup_field = 'uri'
    permission_classes = (permissions.IsAuthenticated,)

    def partial_update(self, request, *args, **kwargs):
        print('request', request.data)
        instance = self.get_object()
        serializer = self.serializer_class(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors)

    def get_queryset(self):
        try:
            queryset = Branch.objects.filter(owner=self.request.user, uri=self.kwargs['uri'])
        except Branch.DoesNotExist:
            queryset = Branch.objects.none()
        return queryset


class BranchUpdateViewSet(BranchUpdateMixin,):
    serializer_class = serializers.BranchUpdateSerializer
    parser_classes = (MultiPartParser,JSONParser,FileUploadParser,)


class BranchAddFollowViewSet(BranchUpdateMixin):
    serializer_class = serializers.BranchAddFollowSerializer

class BranchRemoveFollowViewSet(BranchUpdateMixin):
    serializer_class = serializers.BranchRemoveFollowSerializer


class BranchChatViewSet(viewsets.GenericViewSet,
                        mixins.RetrieveModelMixin,
                        mixins.ListModelMixin):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchChatSerializer
    lookup_field = 'name'

    def get_queryset(self):
        queryset = BranchChat.objects.none()
        if self.kwargs['name']:
            branch = Branch.objects.get(uri__iexact=self.kwargs['nested_1_uri'])
            queryset = BranchChat.objects.filter(name__iexact=self.kwargs['branch'], branch=branch)
        return queryset


class BranchChatMessageViewSet(viewsets.GenericViewSet,
                               mixins.RetrieveModelMixin,
                               mixins.ListModelMixin):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchMessageSerializer
    pagination_class = BranchChatMessagePagination
    lookup_field = 'name'

    def get_queryset(self):
        queryset = BranchMessage.objects.none()
        if self.kwargs['nested_2_name']:
            branch = Branch.objects.get(uri__iexact=self.kwargs['nested_1_uri'])
            branch_chat = BranchChat.objects.get(name__iexact=self.kwargs['nested_2_name'], branch=branch)
            queryset = BranchMessage.objects.filter(branch_chat=branch_chat)
        return queryset


class BranchNewPostViewSet(viewsets.GenericViewSet,
                           mixins.CreateModelMixin):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = serializers.NewPostSerializer
    queryset = Branch.objects.all()

    def create(self, request, *args, **kwargs):
        self.poster = Branch.objects.get(uri=self.kwargs['nested_1_uri'])
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            print(serializer.data)
            return Response(serializer.data)
        else:
            return Response(serializer.errors)

    def perform_create(self, serializer):
        if self.poster not in self.request.user.owned_groups.all():
            raise PermissionDenied
        serializer.save(poster=self.poster)
        print(serializer)


class BranchPostListViewSet(viewsets.GenericViewSet,
                        mixins.RetrieveModelMixin,
                        mixins.ListModelMixin):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchPostSerializer
    pagination_class = BranchPostPagination
    lookup_field = "id"

    def get_queryset(self):
        branch = Branch.objects.get(uri__iexact=self.kwargs['nested_1_uri'])
        self_list = branch.posts.all()
        from_list = branch.posts_from.all()
        final_q = self_list | from_list
        return final_q

    def get_serializer_context(self):
        context = super(BranchPostListViewSet, self).get_serializer_context()
        branch = Branch.objects.filter(uri__iexact=self.kwargs['nested_1_uri'])
        context.update({
            "spreaders": branch
        })
        return context


class UserFollowViewSet(viewsets.GenericViewSet,mixins.ListModelMixin):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = serializers.FollowSerializer

    def get_queryset(self):
        user = self.request.user
        return user.following.all()


class BranchFollowsViewSet(viewsets.GenericViewSet,mixins.ListModelMixin):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.FollowSerializer

    def get_queryset(self):
        branch = Branch.objects.filter(uri__iexact=self.kwargs['nested_1_uri'])
        return branch


class BranchNewFollowViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.NewFollowSerializer

    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    def get_queryset(self):
        branch = Branch.objects.filter(uri__iexact=self.kwargs['nested_1_uri'])
        return branch


class FeedViewSet(viewsets.GenericViewSet,mixins.ListModelMixin):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchPostSerializer
    pagination_class = FeedPagination
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ('-hot_score',)
    ordering = ('-hot_score',)

    def get_queryset(self):
        branch = Branch.objects.prefetch_related('follows').get(uri__iexact=self.kwargs['nested_1_uri'])
        following = branch.follows.all()
        posts_from_following = Post.objects.filter(poster__in=following)
        posted_in_following = Post.objects.filter(posted_to__in=following)
        spread_in_following = Post.objects.filter(spreads__branch__in=following)
        spreads = Spread.objects.filter(branch__in=following)
        for index, (spread, post) in enumerate(zip(spreads, spread_in_following)):
            spread_in_following[index].spreader = spread.branch.uri
        for post in spread_in_following:
            if hasattr(post, 'spreader'):
                print(post.spreader)

        posts = posted_in_following | posts_from_following | spread_in_following
        posts = posts.distinct()
        return posts

    def get_serializer_context(self):
        context = super(FeedViewSet, self).get_serializer_context()
        branch = Branch.objects.prefetch_related('follows').get(uri__iexact=self.kwargs['nested_1_uri'])
        following = branch.follows.all()
        context.update({
            "spreaders": following
        })
        return context


class ReactsViewSet(mixins.CreateModelMixin,
                    mixins.RetrieveModelMixin,
                    mixins.UpdateModelMixin,
                    mixins.DestroyModelMixin,
                    viewsets.GenericViewSet):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.ReactSerializer
    queryset = React.objects.all()

class BranchReactions(generics.GenericAPIView,
                      mixins.ListModelMixin):

    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.ReactSerializer

    def get_queryset(self):
        branch = Branch.objects.get(uri=self.kwargs['uri'])
        return branch.reacts.all()

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)


class IsOwnerOfBranch(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        print(request.resolver_match.kwargs.get('nested_1_uri'))
        branch = Branch.objects.get(uri=request.resolver_match.kwargs.get('nested_1_uri'))
        if request.user.owned_groups.filter(uri=branch).exists():
            return True
        return False


class BranchRequestMixin(viewsets.GenericViewSet,
                         mixins.CreateModelMixin):
    lookup_field = 'uri'
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        try:
            queryset = Branch.objects.filter(owner=self.request.user, uri=self.kwargs['uri'])
        except Branch.DoesNotExist:
            queryset = Branch.objects.none()
        return queryset


class CreateBranchRequest(BranchRequestMixin):
    serializer_class = serializers.CreateBranchRequestSerializer
    lookup_field = 'uri'

    def perform_create(self, serializer):
        status = BranchRequest.STATUS_ON_HOLD
        request_from = Branch.objects.get(uri__iexact=self.kwargs['nested_1_uri'])
        request_to = serializer.validated_data['request_to']
        owned_branches = self.request.user.owned_groups.all()

        if request_from not in owned_branches:
            raise PermissionDenied

        if all(i in owned_branches for i in [request_from,request_to]):
            status = BranchRequest.STATUS_ACCEPTED

        serializer.save(request_from=request_from,status=status)


class IsOwnerOfPost(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        if request.method == 'GET':
            return True
        branches = request.user.owned_groups.all()
        for branch in branches:
            if branch.posts.all().filter(id=obj.id):
                return True
        return False


class BranchPost(mixins.CreateModelMixin,
                    mixins.RetrieveModelMixin,
                    mixins.UpdateModelMixin,
                    mixins.DestroyModelMixin,
                    viewsets.GenericViewSet):

    lookup_field = 'id'
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,IsOwnerOfPost)
    serializer_class = serializers.BranchPostSerializer
    queryset = Post.objects.all()

    def get_serializer_context(self):
        context = super(BranchPost, self).get_serializer_context()
        branches = Branch.objects.annotate(count=Count('followed_by')).order_by('-count')
        context.update({
            "spreaders": branches
        })
        return context

class IsOwnerOfReply(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        print(request.data['replies'][0])
        branches = request.user.owned_groups.all()
        for branch in branches:
            if branch.posts.all().filter(id=request.data['replies'][0]):
                return True
        return False

class UpdatePostRepliesMixin(viewsets.GenericViewSet,
                            mixins.UpdateModelMixin,):
    lookup_field = 'id'
    permission_classes = (permissions.IsAuthenticated,IsOwnerOfReply)


    def partial_update(self, request, *args, **kwargs):
        print('request', request.data)
        instance = self.get_object()
        serializer = self.serializer_class(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors)

    def get_queryset(self):
        try:
            queryset = Post.objects.filter(id=self.kwargs['id'])
        except Post.DoesNotExist:
            queryset = Post.objects.none()
        return queryset

class AddPostReply(UpdatePostRepliesMixin):
    serializer_class = serializers.AddReplySerializer

class RemovePostReply(UpdatePostRepliesMixin):
    serializer_class = serializers.RemoveReplySerializer