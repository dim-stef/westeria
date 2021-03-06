from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from branches.models import Branch
from branchchat.models import BranchMessage, BranchChat
import json
from django.core.serializers.json import DjangoJSONEncoder


class GroupChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = self.scope["user"]
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        #self.branch = self.scope['url_route']['kwargs']['branch']
        self.room_branch_name = 'chat_%s' % self.room_name

        self.isMember = await self.is_member_of_chat(self.user,self.room_name)
        # Join room group

        if self.isMember:
            await self.channel_layer.group_add(
                self.room_branch_name,
                self.channel_name
            )

            await self.accept()
        else:
            pass

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_branch_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        room_name = text_data_json['room_name']
        images = text_data_json['images']
        videos = text_data_json['videos']
        #branch = text_data_json['branch']
        from_branch = await self.get_sender_branch(text_data_json['from_branch'])
        can_send = await self.can_send_message(room_name, from_branch.uri)

        # Send message to room group
        if can_send:
            message = await self.create_message(room_name, message, from_branch)

            await self.channel_layer.group_send(
                self.room_branch_name,
                {
                    'type': 'chat_message',
                    'author_name': message.author.name,
                    'author_url': message.author.uri,
                    'author': str(message.author.id),
                    'message': message.message,
                    'message_html': message.message,
                    'created':str(message.created),
                    'message_id':str(message.pk),
                    'images':[],
                    'videos':[],
                    'can_send':can_send
                }
            )


    @database_sync_to_async
    def create_message(self, room_name, message, from_branch):
        branch_chat = BranchChat.objects.get(id=room_name)
        if not message.isspace() and message is not None and len(message)>0:
            return BranchMessage.objects.create(branch_chat=branch_chat,
                                         author=from_branch,
                                         message=message,
                                         message_html=message
                                         )

    @database_sync_to_async
    def get_sender_branch(self, uri):
        return Branch.objects.get(uri=uri)

    @database_sync_to_async
    def is_member_of_chat(self, user, room_name):

        branch_chat = BranchChat.objects.get(id=room_name)
        is_member = branch_chat.members.filter(uri__in=[branch.uri for branch in user.owned_groups.all()]).exists()
        #is_member = branch_chat.members.filter(uri=branch).exists()
        return is_member

    @database_sync_to_async
    def can_send_message(self, room_name, branch):
        branch_chat = BranchChat.objects.get(id=room_name)
        can_send = branch_chat.members.filter(uri=branch).exists()
        return can_send

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        images = event['images']
        videos = event['videos']
        author_name = event['author_name']
        author_url = event['author_url']
        author = event['author']
        created = event['created']
        message_id = event['message_id']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'author_name': author_name,
            'author_url': author_url,
            'author': author,
            'created': created,
            'id':message_id,
            'message': message,
            'images':images,
            'videos':videos,
        }))
