from rest_framework import serializers
from django.db import models
from django.core.exceptions import ObjectDoesNotExist
from branchchat.models import ChatRequest,BranchChat
from branches.models import Branch
from feedback.models import Feedback
from api import serializers as serializers_v0
from notifications.models import Notification

class ChatRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatRequest
        fields = '__all__'
        read_only_fields = ['branch_chat','request_from','request_to']


class NewChatRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchChat
        fields = ['image','name','members','owner']
        read_only_fields = ['owner']

    def create(self, validated_data):
        room_owner = self.context['owner']
        members = validated_data.pop('members')
        new_room = BranchChat.objects.create(**validated_data)

        for member in members:
            if room_owner.owner.owned_groups.filter(pk=member.pk).exists():
                new_room.members.add(member)
            else:
                if member is not room_owner:
                    request = ChatRequest.objects.create(status=ChatRequest.STATUS_ON_HOLD,
                                               branch_chat=new_room,
                                               request_from=room_owner,
                                               request_to=member)
        return new_room

class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['subject','details','email']

class FeedbackWithUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['subject','details','user']
        read_only_fields = ['user']


class PathSerializer(serializers.ListSerializer):
    def to_representation(self, data):
        print(data)
        iterable = data.all() if isinstance(data, models.Manager) else data

        return {
            kwdGroup: super().to_representation(Branch.objects.filter(kwdGroup=kwdGroup))
            for kwdGroup in Branch.objects.all()
        }

class BranchSerializer(serializers.ModelSerializer):
    paths = serializers.SerializerMethodField()

    def get_paths(self,branch):
        branch_to_param = self.context.get('request').query_params.get('to')
        branch_from_param = self.context.get('request').query_params.get('from')

        try:
            branch_to = Branch.objects.get(uri__iexact = branch_to_param) or Branch.objects.none()
            branch_from = Branch.objects.get(uri__iexact = branch_from_param) or Branch.objects.none()
        except ObjectDoesNotExist:
            return None

        def find_all_paths(start, end, path=[]):
            path = path + [start]
            if start == end:
                return [path]
            paths = []
            for node in start.children.all():
                if node not in path:
                    newpaths = find_all_paths(node, end, path)
                    for newpath in newpaths:
                        paths.append(newpath)
            return paths

        try:
            paths = find_all_paths(branch_from,branch_to)
            for path in paths:
                for i,branch in enumerate(path):
                    path[i] = serializers_v0.BranchSerializer(branch).data
            return paths
        except RecursionError:
            return None


    class Meta:
        model = Branch
        fields = ('uri','name','paths')
