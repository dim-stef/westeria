from channels.generic.websocket import AsyncWebsocketConsumer
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

    async def send_react_notification(self, event):
        message = event['text']
        post = event['post']
        react_from = event['react_from']
        id = event['id']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'post':post,
            'react_from':react_from,
            'id': id
        }))