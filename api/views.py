from django.contrib.auth import get_user_model
from rest_framework import viewsets, views, mixins
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination, PageNumberPagination, CursorPagination
from rest_framework_jwt.serializers import (
    JSONWebTokenSerializer)
from rest_framework_jwt.settings import api_settings
from accounts.models import UserProfile
from groups.models import Group
from groupchat.models import GroupChat, GroupMessage
from . import serializers

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


class GroupChatMessagePagination(CursorPagination):
    page_size = 50


class UserViewSet(mixins.RetrieveModelMixin,
                  # mixins.DestroyModelMixin,
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


class UserProfileViewSet(mixins.RetrieveModelMixin,
                         mixins.UpdateModelMixin,
                         mixins.ListModelMixin,
                         viewsets.GenericViewSet):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_serializer_class(self):
        user = self.request.user
        if user.is_superuser:
            return serializers.UserAdminProfileSerializer
        else:
            return serializers.UserProfileSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = UserProfile.objects.filter(user=user.profile.user)
        return queryset


class UserPublicProfileViewSet(mixins.RetrieveModelMixin,
                         mixins.ListModelMixin,
                         viewsets.GenericViewSet):
    serializer_class = serializers.UserPublicProfileSerializer

    def get_queryset(self):
        user = self.kwargs['pk']
        queryset = UserProfile.objects.filter(user=user)
        return queryset


class GroupViewSet(mixins.RetrieveModelMixin,
                   mixins.ListModelMixin,
                   viewsets.GenericViewSet,
                   ):
    lookup_value_regex = '(?i)[\w.@+-]+'
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.GroupSerializer
    lookup_field = 'uri'

    def get_queryset(self):
        queryset = Group.objects.none()
        if self.kwargs['uri']:
            queryset = Group.objects.filter(uri__iexact=self.kwargs['uri'])
            print(queryset)
        return queryset


class GroupRootViewSet(viewsets.GenericViewSet,
                       mixins.ListModelMixin):
    serializer_class = serializers.GroupSerializer

    def get_queryset(self):
        queryset = Group.objects.filter(name="ROOT", tag=None)
        return queryset


class ChildrenViewSet(viewsets.GenericViewSet,
                      mixins.RetrieveModelMixin,
                      mixins.ListModelMixin):
    lookup_value_regex = '(?i)[\w.@+-]+'
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.GroupSerializer
    pagination_class = ChildrenLimitOffsetPagination

    def get_queryset(self):
        queryset = Group.objects.none()
        if self.kwargs['nested_1__uri']:
            children = Group.objects.get(uri__iexact=self.kwargs['nested_1__uri']).children.all()
            queryset = children
        return queryset


class GroupChatViewSet(viewsets.GenericViewSet,
                       mixins.RetrieveModelMixin,
                       mixins.ListModelMixin):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.GroupChatSerializer
    lookup_field = 'name'

    def get_queryset(self):
        queryset = GroupChat.objects.none()
        if self.kwargs['name']:
            group = Group.objects.get(uri__iexact=self.kwargs['nested_1__uri'])
            queryset = GroupChat.objects.filter(name__iexact=self.kwargs['name'], group=group)
        return queryset


class GroupChatMessageViewSet(viewsets.GenericViewSet,
                           mixins.RetrieveModelMixin,
                           mixins.ListModelMixin):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.GroupMessageSerializer
    pagination_class = GroupChatMessagePagination

    def get_queryset(self):
        queryset = GroupMessage.objects.none()
        if self.kwargs['nested_2__name']:
            group = Group.objects.get(uri__iexact=self.kwargs['nested_1__uri'])
            group_chat = GroupChat.objects.get(name__iexact=self.kwargs['nested_2__name'], group=group)
            queryset = GroupMessage.objects.filter(group_chat=group_chat)
        return queryset
