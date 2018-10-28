from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, mixins
from rest_framework import authentication, permissions
from rest_framework.pagination import LimitOffsetPagination,PageNumberPagination
from accounts.models import UserProfile
from groups.models import Group
from . import serializers


class CaseInsensitiveLookupMixin(object):
    """
    Stole majority of this mixin
    from http://www.django-rest-framework.org/api-guide/generic-views/
    """
    def get_object(self):
        queryset = self.get_queryset()             # Get the base queryset
        queryset = self.filter_queryset(queryset)  # Apply any filter backends
        filter = {self.lookup_field: self.kwargs[self.lookup_field].lower()}

        return get_object_or_404(queryset, **filter)  # Lookup the object


class ChildrenPagination(PageNumberPagination):
    page_size = 2
    page_size_query_param = 'page_size'
    max_page_size = 50


class ChildrenLimitOffsetPagination(LimitOffsetPagination):
    default_limit = 2
    max_limit = 10


class UserViewSet(mixins.RetrieveModelMixin,
                  # mixins.DestroyModelMixin,
                  mixins.ListModelMixin,
                  viewsets.GenericViewSet):

    def get_serializer_class(self):
        user = self.request.user
        if user.is_superuser:
            return serializers.UserAdminSerializer
        else:
            return serializers.UserSerializer

    def get_queryset(self):
        user = self.request.user
        '''if user.is_superuser:
            queryset = get_user_model().objects.all()
        else:'''
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
        '''if user.is_superuser:
            queryset = UserProfile.objects.all()
        else:'''
        queryset = UserProfile.objects.filter(user=user.profile.user)
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
        if self.kwargs['nested_1_uri']:
            children = Group.objects.get(uri__iexact=self.kwargs['nested_1_uri']).children.all()
            queryset = children
        return queryset


