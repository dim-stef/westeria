from django.contrib.auth import get_user_model
from accounts.models import UserProfile
from rest_framework import viewsets
from django.contrib.auth.mixins import UserPassesTestMixin
from rest_framework import authentication, permissions
from . import serializers
from rest_framework import viewsets, mixins


class UserViewSet(mixins.RetrieveModelMixin,
                    #mixins.DestroyModelMixin,
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
