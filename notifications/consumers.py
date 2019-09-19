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
        verb = event['verb']
        id = event['id']

        await self.send(text_data=json.dumps({
            'message': message,
            'request_to': request_to,
            'request_from': request_from,
            'verb': verb,
            'id': id
        }))

    async def send_react_notification(self, event):
        message = event['text']
        post = event['post']
        react_from = event['react_from']
        verb = event['verb']
        id = event['id']

        await self.send(text_data=json.dumps({
            'message': message,
            'post':post,
            'react_from':react_from,
            'verb': verb,
            'id': id
        }))

    async def send_message_notification(self,event):
        branch_chat = event['branch_chat']
        verb = event['verb']
        id = event['id']

        await self.send(text_data=json.dumps({
            'branch_chat': branch_chat,
            'verb': verb,
            'id': id
        }))

    async def send_new_follow(self, event):
        followed_by = event['followed_by']
        verb = event['verb']
        id = event['id']

        await self.send(text_data=json.dumps({
            'followed_by': followed_by,
            'verb': verb,
            'id': id
        }))

    async def send_chat_request(self, event):
        branch_chat = event['branch_chat']
        request_to = event['request_to']
        request_from = event['request_from']
        verb = event['verb']
        id = event['id']

        await self.send(text_data=json.dumps({
            'branch_chat': branch_chat,
            'request_to': request_to,
            'request_from': request_from,
            'verb': verb,
            'id': id
        }))

    async def send_reply_notification(self,event):
        reply_from = event['reply_from']
        post = event['post']
        reply = event['reply']
        verb = event['verb']
        id = event['id']

        await self.send(text_data=json.dumps({
            'reply_from': reply_from,
            'post': post,
            'reply': reply,
            'verb': verb,
            'id': id
        }))

    async def send_post_notification(self,event):
        poster = event['poster']
        post = event['post']
        verb = event['verb']
        created = event['created']
        id = event['id']

        await self.send(text_data=json.dumps({
            'poster': poster,
            'post': post,
            'verb': verb,
            'id': id
        }))