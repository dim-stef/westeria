from django.contrib.auth import get_user_model
from rest_framework import serializers
from accounts.models import UserProfile, User
from groups.models import Group
from groupchat.models import GroupMessage, GroupChat
import json


class TokenSerializer(serializers.Serializer):
    token = serializers.CharField()

    def create(self, validated_data):
        pass

    def update(self, instance, validated_data):
        pass


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


class UserPublicProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['url', 'profile_image']  # '__all__'
        read_only_fields = ['url', 'profile_image']


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
        fields = ['id', 'owner', 'parents', 'children', 'name', 'uri', 'children_uri_field', 'description',
                  'group_image', 'group_banner']
        read_only_fields = ['id', 'owner', 'parents', 'children', 'name', 'uri', 'children_uri_field', 'description',
                            'group_image', 'group_banner']

    children_uri_field = serializers.SerializerMethodField('children_uri')

    def children_uri(self, group):
        _group = Group.objects.get(uri=group)
        children = []
        for child in _group.children.all():
            children.append(child.uri)
        return children


class GroupChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupChat
        fields = ['id', 'type', 'name', 'group', 'group_messages']

    group_messages = serializers.SerializerMethodField('group_message')

    def group_message(self, groupchat):
        _groupchat = GroupChat.objects.get(id=groupchat.id)
        messages = []
        for message in _groupchat.messages.all():
            messages.append(message.message)
        return messages


class GroupMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupMessage
        fields = ['author', 'author_name', 'author_url', 'message', 'created', 'updated', 'group_chat']

    author_name = serializers.SerializerMethodField('author_name_field')
    author_url = serializers.SerializerMethodField('author_url_field')

    def author_name_field(self, groupmessage):
        return groupmessage.author.full_name

    def author_url_field(self, groupmessage):
        return groupmessage.author.profile.url

