from django.contrib.auth import get_user_model
from rest_framework import serializers
from accounts.models import UserProfile
from groups.models import Group


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ['id', 'last_login', 'email', 'is_active', 'is_staff']  # '__all__'
        read_only_fields = ['id', 'last_login', 'email', 'is_active', 'is_staff']


class UserAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = '__all__'


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['user', 'url', 'profile_image', 'fake_count']  # '__all__'
        read_only_fields = ['user', 'fake_count']

    def update(self, instance, validated_data):
        instance.profile_image = validated_data.get('profile_image', instance.profile_image)
        instance.save()
        return instance


class UserAdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'

    def update(self, instance, validated_data):
        instance.profile_image = validated_data.get('profile_image', instance.profile_image)
        instance.save()
        return instance


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'owner', 'parents', 'children', 'name', 'uri']
        read_only_fields = ['id', 'owner', 'parents', 'children', 'name', 'uri']
