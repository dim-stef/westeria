from rest_framework import serializers
from branchchat.models import ChatRequest,BranchChat
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