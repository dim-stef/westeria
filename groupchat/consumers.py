from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from groupchat.models import GroupMessage, GroupChat
import json


class GroupChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'chat_%s' % self.room_name

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        room_name = text_data_json['room_name']
        group = text_data_json['group']

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'author_name': self.scope["user"].full_name,
                'author_url': self.scope["user"].profile.url,
                'author': str(self.scope["user"].id),
                'message': message,
                'message_html': message,
            }
        )

        await self.create_message(room_name, group, message)

    @database_sync_to_async
    def create_message(self, room_name, group, message):
        group_chat = GroupChat.objects.get(name__iexact=room_name, group=group)
        GroupMessage.objects.create(group_chat=group_chat,
                                    author=self.scope["user"],
                                    message=message,
                                    message_html=message
                                    )

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
