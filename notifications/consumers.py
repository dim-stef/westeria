from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from branches.models import Branch
import channels.layers
from asgiref.sync import async_to_sync
import json

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.branch = self.scope['url_route']['kwargs']['branch']
        self.branch_name = 'branch_%s' % self.branch

        # Join room group
        await self.channel_layer.group_add(
            self.branch_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.branch_name,
            self.channel_name
        )

    '''async def send_message(self,event):
        message = event['text']
        print('\n\n\n\n\n\n\n\n\n\n\n\n\n\n', message)
        channel_layer = channels.layers.get_channel_layer()
        # Send message to WebSocket
        await channel_layer.send(channel=self.channel_name,message=message)'''

    async def send_message(self, event):
        message = event['text']
        request_to = event['request_to']
        request_from = event['request_from']
        id = event['id']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'request_to': request_to,
            'request_from': request_from,
            'id': id
        }))