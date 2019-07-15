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
from rest_framework.parsers import MultiPartParser,JSONParser,FileUploadParser,FormParser
from branches.models import Branch, BranchRequest
from branchchat.models import BranchChat, BranchMessage
from branchposts.models import Post,React,Spread
from notifications.models import Notification
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
    default_limit = 10
    max_limit = 20


class BranchChatMessagePagination(CursorPagination):
    page_size = 50



class BranchPostPagination(CursorPagination):
    page_size = 15


class FeedPagination(CursorPagination):
    page_size = 12

class TrendingPagination(CursorPagination):
    page_size = 5

class ReplyTreePagination(CursorPagination):
    page_size = 5


class IsOwnerOfBranch(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        print(request.resolver_match.kwargs.get('branch_uri'))
        branch = Branch.objects.get(uri=request.resolver_match.kwargs.get('branch_uri'))
        if request.user.owned_groups.filter(uri=branch).exists():
            return True
        return False

class IsMemberOfChat(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        print(request.resolver_match.kwargs.get('branch_uri'))
        branch = Branch.objects.get(uri=request.resolver_match.kwargs.get('branch_uri'))
        branch_chat = BranchChat.objects.get(id=request.resolver_match.kwargs.get('id_pk'))
        if branch_chat.members.filter(uri=branch).exists():
            return True
        return False



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


class BranchRelationsMixin(viewsets.GenericViewSet,
                      mixins.RetrieveModelMixin,
                      mixins.ListModelMixin):
    lookup_value_regex = '(?i)[\w.@+-]+'
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchSerializer
    pagination_class = ChildrenLimitOffsetPagination

class ChildrenViewSet(BranchRelationsMixin):

    def get_queryset(self):
        queryset = Branch.objects.none()
        if self.kwargs['branch_uri']:
            children = Branch.objects.get(uri__iexact=self.kwargs['branch_uri']).children.all()
            queryset = children
        return queryset

class ParentViewSet(BranchRelationsMixin):

    def get_queryset(self):
        queryset = Branch.objects.none()
        if self.kwargs['branch_uri']:
            parents = Branch.objects.get(uri__iexact=self.kwargs['branch_uri']).parents.all()
            queryset = parents
        return queryset

class SiblingsViewSet(BranchRelationsMixin):

    def get_queryset(self):
        queryset = Branch.objects.none()
        if self.kwargs['branch_uri']:
            parents = Branch.objects.get(uri__iexact=self.kwargs['branch_uri']).parents.all()
            siblings = Branch.objects.filter(parents__in=parents)\
                .exclude(uri__iexact=self.kwargs['branch_uri'])\
                .distinct()
            queryset = siblings
        return queryset


class BranchUpdateMixin(viewsets.GenericViewSet,
                        mixins.UpdateModelMixin,):
    lookup_field = 'uri'
    permission_classes = (permissions.IsAuthenticated,)

    def partial_update(self, request, *args, **kwargs):
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
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,IsOwnerOfBranch)
    serializer_class = serializers.BranchChatSerializer
    lookup_field = 'name'

    def get_queryset(self):
        queryset = BranchChat.objects.none()
        if self.kwargs['name']:
            branch = Branch.objects.get(uri__iexact=self.kwargs['branch_uri'])
            queryset = BranchChat.objects.filter(name__iexact=self.kwargs['branch'], branch=branch)
        return queryset

class BranchChatRoomsViewSet(viewsets.GenericViewSet,
                        mixins.RetrieveModelMixin,
                        mixins.ListModelMixin):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchChatSerializer

    def get_queryset(self):
        branch = Branch.objects.get(uri__iexact=self.kwargs['branch_uri'])
        queryset = branch.chat_groups.all()
        return queryset


class ChatRoomViewSet(viewsets.GenericViewSet,
                        mixins.RetrieveModelMixin,
                        mixins.ListModelMixin):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchChatSerializer

    def get_queryset(self):
        queryset = BranchChat.objects.get(id=self.kwargs['id_pk'])
        return queryset


class BranchChatMessageViewSet(viewsets.GenericViewSet,
                               mixins.RetrieveModelMixin,
                               mixins.ListModelMixin):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchMessageSerializer
    pagination_class = BranchChatMessagePagination

    def get_queryset(self):
        queryset = BranchMessage.objects.none()
        print(self.kwargs)
        if self.kwargs['id_pk']:
            #branch = Branch.objects.get(uri__iexact=self.kwargs['branch_uri'])
            branch_chat = BranchChat.objects.get(id=self.kwargs['id_pk'])
            queryset = BranchMessage.objects.filter(branch_chat=branch_chat)
        return queryset


class NewMessageViewSet(viewsets.GenericViewSet,
                           mixins.CreateModelMixin):
    parser_classes = (JSONParser, MultiPartParser)
    permission_classes = (permissions.IsAuthenticated,IsMemberOfChat)
    serializer_class = serializers.NewMessageSerializer
    queryset = Branch.objects.all()

    def create(self, request, *args, **kwargs):
        branch_chat = BranchChat.objects.get(id=self.kwargs['id_pk'])
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request,'branch_chat':branch_chat})
        if serializer.is_valid():
            serializer.save(branch_chat=branch_chat)
            return Response(serializer.data)
        else:
            return Response(serializer.errors)


class BranchNewPostViewSet(viewsets.GenericViewSet,
                           mixins.CreateModelMixin):
    parser_classes = (JSONParser, MultiPartParser)
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = serializers.NewPostSerializer
    queryset = Branch.objects.all()

    def create(self, request, *args, **kwargs):
        self.poster = Branch.objects.get(uri=self.kwargs['branch_uri'])
        serializer = self.serializer_class(data=request.data,context={'request': self.request})
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data)
        else:
            return Response(serializer.errors)

    def perform_create(self, serializer):
        print("files", self.request.FILES)
        if self.poster not in self.request.user.owned_groups.all():
            raise PermissionDenied
        serializer.save(poster=self.poster)
        print(serializer)

from django.db.models import Q
from django.utils import timezone
from datetime import datetime,timedelta

class BranchPostListViewSet(viewsets.GenericViewSet,
                        mixins.RetrieveModelMixin,
                        mixins.ListModelMixin):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchPostSerializer
    pagination_class = BranchPostPagination
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ('hot_score', 'created')
    ordering = ('-hot_score',)
    lookup_field = "id"

    def get_queryset(self):
        content = self.request.query_params.get('content', None)
        past = self.request.query_params.get('past', None)
        branch = Branch.objects.get(uri__iexact=self.kwargs['branch_uri'])

        self_list = branch.posts.all()
        from_list = branch.posts_from_all.all()

        posts = self_list | from_list

        if content=='leaves':
            posts = posts.exclude(type="reply")
        elif content=='media':
            posts = posts.filter(Q(images__isnull=False) | Q(videos__isnull=False))
        else:
            # Leaves and Replies
            pass

        print("past", past)
        if past == 1 or past == "1":
            posts = posts.filter(created__gte = timezone.now() - timedelta(hours=1))
        elif past == 24 or past == "24":
            posts = posts.filter(created__gte = timezone.now() - timedelta(hours=24))
        elif past == 24*7 or past == str(24*7):
            posts = posts.filter(created__gte=timezone.now() - timedelta(hours=24*7))
        elif past == 24*7*30 or past == str(24*7*30):
            posts = posts.filter(created__gte=timezone.now() - timedelta(hours=24 * 7*30))
        elif past == 24*7*30*365 or past == str(24*7*30*365):
            posts = posts.filter(created__gte=timezone.now() - timedelta(hours=24 * 7 * 30*365))
        else:
            # all time
            pass
        return posts.distinct()

    def get_serializer_context(self):
        context = super(BranchPostListViewSet, self).get_serializer_context()
        branch = Branch.objects.filter(uri__iexact=self.kwargs['branch_uri'])
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
        branch = Branch.objects.filter(uri__iexact=self.kwargs['branch_uri'])
        return branch


class BranchNewFollowViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.NewFollowSerializer

    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    def get_queryset(self):
        branch = Branch.objects.filter(uri__iexact=self.kwargs['branch_uri'])
        return branch


class FeedViewSet(viewsets.GenericViewSet,mixins.ListModelMixin):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,IsOwnerOfBranch)
    serializer_class = serializers.BranchPostSerializer
    pagination_class = FeedPagination
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ('hot_score','created')
    ordering = ('-hot_score',)

    def get_queryset(self):
        content = self.request.query_params.get('content', None)
        past = self.request.query_params.get('past', None)
        branch = Branch.objects.prefetch_related('follows').get(uri__iexact=self.kwargs['branch_uri'])
        following = branch.follows.all()

        posts_from_following = Post.objects.filter(poster__in=following)
        posted_in_following = Post.objects.filter(posted_to__in=following)
        posts = posted_in_following | posts_from_following

        if content=='leaves':
            posts = posts.exclude(type="reply")
        elif content=='media':
            posts = posts.filter(Q(images__isnull=False) | Q(videos__isnull=False))
        else:
            # Leaves and Replies
            pass

        if past == 1 or past == "1":
            posts = posts.filter(created__gte = timezone.now() - timedelta(hours=1))
            print(posts)
        elif past == 24 or past == "24":
            posts = posts.filter(created__gte = timezone.now() - timedelta(hours=24))
        elif past == 24*7 or past == str(24*7):
            posts = posts.filter(created__gte=timezone.now() - timedelta(hours=24*7))
        elif past == 24*7*30 or past == str(24*7*30):
            posts = posts.filter(created__gte=timezone.now() - timedelta(hours=24 * 7*30))
        elif past == 24*7*30*365 or past == str(24*7*30*365):
            posts = posts.filter(created__gte=timezone.now() - timedelta(hours=24 * 7 * 30*365))
        else:
            # all time
            pass

        #posts = posted_in_following | posts_from_following
        posts = posts.distinct()
        return posts

    def get_serializer_context(self):
        context = super(FeedViewSet, self).get_serializer_context()
        branch = Branch.objects.prefetch_related('follows').get(uri__iexact=self.kwargs['branch_uri'])
        following = branch.follows.all()
        context.update({
            "spreaders": following
        })
        return context


class TrendingScoreViewSet(viewsets.GenericViewSet,mixins.ListModelMixin):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    pagination_class = TrendingPagination
    serializer_class = serializers.BranchSerializer
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ('-trending_score',)
    ordering = ('-trending_score',)
    queryset = Branch.objects.all()

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
        request_from = Branch.objects.get(uri__iexact=self.kwargs['branch_uri'])
        request_to = serializer.validated_data['request_to']
        owned_branches = self.request.user.owned_groups.all()

        if request_from not in owned_branches:
            raise PermissionDenied

        if all(i in owned_branches for i in [request_from,request_to]):
            status = BranchRequest.STATUS_ACCEPTED

        serializer.save(request_from=request_from,status=status)


class UpdateReceivedBranchRequest(viewsets.GenericViewSet,
                                  mixins.UpdateModelMixin):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,IsOwnerOfBranch)
    serializer_class = serializers.UpdateBranchRequestSerializer

    def get_queryset(self):
        print(BranchRequest.objects.filter(id=self.kwargs['pk']))
        return BranchRequest.objects.filter(id=self.kwargs['pk'])

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.serializer_class(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors)


class ReceivedBranchRequest(viewsets.GenericViewSet,
                            mixins.RetrieveModelMixin,
                            mixins.ListModelMixin):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,IsOwnerOfBranch)
    serializer_class = serializers.BranchRequestSerializer

    def get_queryset(self):
        branch = Branch.objects.get(uri__iexact=self.kwargs['branch_uri'])
        return branch.requests_received.all()


class SentBranchRequest(viewsets.GenericViewSet,
                        mixins.RetrieveModelMixin,
                        mixins.ListModelMixin,
                        mixins.DestroyModelMixin):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,IsOwnerOfBranch)
    serializer_class = serializers.BranchRequestSerializer

    def get_queryset(self):
        branch = Branch.objects.get(uri__iexact=self.kwargs['branch_uri'])
        return branch.requests_sent.all()


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

class ReplyTree(mixins.ListModelMixin,
                viewsets.GenericViewSet):

    lookup_field = 'id'
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchPostSerializer
    pagination_class = ReplyTreePagination
    queryset = Post.objects.all()

    def get_queryset(self):
        return Post.objects.get(id=self.kwargs['id']).replies.all()

    def get_serializer_context(self):
        context = super(ReplyTree, self).get_serializer_context()
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

class NewSpread(viewsets.GenericViewSet,
                mixins.CreateModelMixin):
    serializer_class = serializers.NewSpreadSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,IsOwnerOfBranch)

    def perform_create(self, serializer):
        branch = Branch.objects.get(uri__iexact=self.kwargs['branch_uri'])
        owned_branches = self.request.user.owned_groups.all()

        if branch not in owned_branches:
            raise PermissionDenied
        serializer.save(branch=branch)



class NotificationsViewSet(viewsets.GenericViewSet,
                            mixins.ListModelMixin,
                            mixins.RetrieveModelMixin):

    serializer_class = serializers.NotificationSerializer
    permission_classes = (permissions.IsAuthenticated,)
    def get_queryset(self):
        return self.request.user.notifications.all()