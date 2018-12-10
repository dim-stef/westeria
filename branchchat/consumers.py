from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from branches.models import Branch
from branchchat.models import BranchMessage, BranchChat
import json


class GroupChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_branch_name = 'chat_%s' % self.room_name

        # Join room group
        await self.channel_layer.group_add(
            self.room_branch_name,
            self.channel_name
        )

        await self.accept()

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
        branch = text_data_json['branch']
        from_branch = await self.get_sender_branch(text_data_json['from_branch'])

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_branch_name,
            {
                'type': 'chat_message',
                'author_name': from_branch.name,
                'author_url': from_branch.uri,
                'author': str(from_branch.id),
                'message': message,
                'message_html': message,
            }
        )

        await self.create_message(room_name, branch, message, from_branch)

    @database_sync_to_async
    def create_message(self, room_name, branch, message, from_branch):
        branch_chat = BranchChat.objects.get(name__iexact=room_name, branch=branch)
        BranchMessage.objects.create(branch_chat=branch_chat,
                                     author=from_branch,
                                     message=message,
                                     message_html=message
                                     )

    @database_sync_to_async
    def get_sender_branch(self, id):
        return Branch.objects.get(id=id)


    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        author_name = event['author_name']
        author_url = event['author_url']
        author = event['author']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'author_name': author_name,
            'author_url': author_url,
            'author': author,
            'message': message
        }))
