from django.contrib.auth import get_user_model
import json
from django.contrib.auth.mixins import UserPassesTestMixin
from rest_framework import viewsets
from rest_framework import viewsets, mixins
from rest_framework import authentication, permissions
from accounts.models import UserProfile
from groups.models import Group
from . import serializers


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
                   viewsets.GenericViewSet):
    serializer_class = serializers.GroupSerializer

    def get_queryset(self):
        queryset = Group.objects.none()
        if self.kwargs['pk']:
            queryset = Group.objects.filter(id=self.kwargs['pk'])

        return queryset


class GroupRootViewSet(viewsets.GenericViewSet,
                       mixins.ListModelMixin):
    serializer_class = serializers.GroupSerializer

    def get_queryset(self):
        queryset = Group.objects.filter(name="ROOT", tag=None)
        return queryset
