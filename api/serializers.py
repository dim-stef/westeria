from django.contrib.auth import get_user_model
from rest_framework import serializers
from accounts.models import UserProfile, User
from branches.models import Branch
from branchchat.models import BranchMessage, BranchChat
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


class BranchPublicProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['uri','name', 'branch_image']  # '__all__'
        read_only_fields = ['uri','name', 'branch_image']


class UserAdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'

    def update(self, instance, validated_data):
        instance.profile_image = validated_data.get('profile_image', instance.profile_image)
        instance.save()
        return instance


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'owner', 'parents','parent_uri_field', 'children', 'name', 'uri', 'children_uri_field', 'description',
                  'branch_image', 'branch_banner','default']
        read_only_fields = ['id', 'owner', 'parents','parent_uri_field', 'children', 'name', 'uri', 'children_uri_field', 'description',
                            'branch_image', 'branch_banner','default']

    children_uri_field = serializers.SerializerMethodField('children_uri')
    parent_uri_field = serializers.SerializerMethodField('parents_uri')

    def children_uri(self, group):
        _branch = Branch.objects.get(uri=group)
        children = []
        for child in _branch.children.all():
            children.append(child.uri)
        return children

    def parents_uri(self, group):
        _branch = Branch.objects.get(uri=group)
        parents = []
        for parent in _branch.parents.all():
            parents.append(parent.uri)
        return parents


class BranchUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ('branch_image', 'branch_banner', 'parents', 'name', 'accessibility', 'description', 'over_18')

class BranchChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchChat
        fields = ['id', 'type', 'name', 'branch']

        branch_messages = serializers.SerializerMethodField('branch_message')

    def branch_message(self, branchchat):
        _branchchat = BranchChat.objects.get(id=branchchat.id)
        messages = []
        for message in _branchchat.messages.all():
            messages.append(message.message)
        return messages


class BranchMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchMessage
        fields = ['author', 'author_name', 'author_url', 'message', 'created', 'updated', 'branch_chat']

    author_name = serializers.SerializerMethodField('author_name_field')
    author_url = serializers.SerializerMethodField('author_url_field')

    def author_name_field(self, branchmessage):
        try:
            return branchmessage.author.name
        except AttributeError:
            return '[deleted]'

    def author_url_field(self, branchmessage):
        try:
            return branchmessage.author.uri
        except AttributeError:
            return 'deleted'

