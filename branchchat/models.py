from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import F
from accounts.models import User
import channels.layers
from asgiref.sync import async_to_sync
from django.core import serializers
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.contrib.contenttypes.models import ContentType
from push_notifications.models import APNSDevice, GCMDevice
from notifications.models import Notification
import uuid


def should_be_disabled(instance):
    if instance.personal and instance.members.first() and instance.members.last():

        # if both people have dm's enabled chat is open for both
        if instance.members.first().direct_messages_accessibility == 'EO' \
                and instance.members.last().direct_messages_accessibility == 'EO':
            return False
        # make sure the person with private dm's follows the other person
        else:
            if instance.members.first().direct_messages_accessibility != 'EO':
                # user doesn't follow the other person, disable the chat
                if not instance.members.first().follows.filter(pk=instance.members.last().pk).exists():
                    return True

            # check for the other person
            if instance.members.last().direct_messages_accessibility != 'EO':
                # user doesn't follow the other person, disable the chat
                if not instance.members.last().follows.filter(pk=instance.members.first().pk).exists():
                    return True

            return False
    else:
        return False

from django.db.models import Q
class BranchChat(models.Model):
    class Meta:
        unique_together = ('owner', 'id')
        constraints = [
            models.UniqueConstraint(fields=['owner', 'auto_invite_followers'],
                                    name='unique_auto_invite_followers_chat',
                                    condition=Q(auto_invite_followers=True))
        ]

    TYPE_DIRECT = 'DR'
    TYPE_FOLLOW_ONLY = 'FO'
    TYPE_PUBLIC = 'PU'
    TYPE_INVITE_ONLY = 'IO'
    TYPE_CHOICES = (
        (TYPE_DIRECT, 'Direct'),
        (TYPE_FOLLOW_ONLY, 'Follow only'),
        (TYPE_PUBLIC, 'Public'),
        (TYPE_INVITE_ONLY, 'Invite only'),
    )

    type = models.CharField(
        max_length=2,
        choices=TYPE_CHOICES,
        default=TYPE_DIRECT,
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)
    image = models.ImageField(upload_to='images/chat_groups/profile_image',
                            default='images/group_images/profile/default.jpeg',
                            blank=False)
    icon = models.ImageField(upload_to='images/chat_groups/icons',
                              blank=True)
    name = models.CharField(default="default", blank=False, null=False, max_length=80)
    owner = models.ForeignKey('branches.Branch', null=True, on_delete=models.CASCADE, related_name="chat")
    members = models.ManyToManyField('branches.Branch', null=True, related_name="chat_groups")
    personal = models.BooleanField(default=False)
    is_disabled = models.BooleanField(default=False)
    auto_invite_followers = models.BooleanField(default=False)

    def __str__(self):
        return '%s - %s' % (self.name,self.type)

    @property
    def latest_message(self):
        latest = self.messages.latest('created')
        video_count = latest.videos.count()
        image_count = latest.images.count()

        def media_message():
            image_message = ''
            video_message = ''
            if image_count > 0:
                image_message = str(image_count) + ' photos'
            if video_count > 0:
                video_message = str(video_count) + ' videos'
            if image_count > 0 and video_count > 0:
                return ', '.join([image_message,video_message])
            else:
                return video_message or image_message

        if latest.message and video_count == 0 and image_count == 0:
            composed_message = latest.message
        elif not latest.message:
            composed_message = latest.author.name + ' sent ' + media_message()
        else:
            composed_message = latest.message + ' + ' + media_message()
        return composed_message

    def save(self, *args, **kwargs):
        im = Image.open(self.image)
        im.load()
        rbg_img = im.convert('RGB')
        rbg_img.load()
        im_io = BytesIO()
        rbg_img.save(im_io, 'JPEG', quality=75)
        self.image = InMemoryUploadedFile(im_io, 'ImageField', "%s.jpg" % self.image.name.split('.')[0],
                                              'image/jpeg', im_io.getbuffer().nbytes, None)
        if self.pk:
            self.is_disabled = should_be_disabled(self)

        '''try:
            icon,im_io = JPEGSaveWithTargetSize(self.image,"%s_icon.jpg" % self.image.name,3000)
            self.icon = InMemoryUploadedFile(im_io, 'ImageField', "%s_icon.jpg" % self.image.name.split('.')[0],
                                              'image/jpeg', im_io.getbuffer().nbytes, None)
        except Exception as e:
            # File too big to be compressed to 3kb
            pass'''
        super().save(*args, **kwargs)


class ChatRequest(models.Model):
    class Meta:
        unique_together = ('request_to', 'branch_chat')

    STATUS_ACCEPTED = 'accepted'
    STATUS_DECLINED = 'declined'
    STATUS_ON_HOLD = 'on hold'
    STATUS_CHOICES = (
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_DECLINED, 'Declined'),
        (STATUS_ON_HOLD, 'On hold'),
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ON_HOLD,
    )

    branch_chat = models.ForeignKey(BranchChat, null=True, on_delete=models.CASCADE, related_name="requests")
    request_from = models.ForeignKey('branches.Branch',on_delete=models.CASCADE,related_name="chat_requests_sent")
    request_to = models.ForeignKey('branches.Branch',on_delete=models.CASCADE,related_name="chat_requests_received")

    def save(self, *args, **kwargs):
        if self.status == self.STATUS_ACCEPTED:
            self.branch_chat.members.add(self.request_to)
        super(ChatRequest, self).save()


class BranchMessage(models.Model):
    branch_chat = models.ForeignKey(BranchChat, null=True, on_delete=models.CASCADE, related_name="messages")
    author = models.ForeignKey("branches.Branch", null=True, on_delete=models.SET_NULL)
    message = models.TextField(max_length=300,null=True,blank=True)
    message_html = models.TextField(null=True,blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.message


class ChatImage(models.Model):
    height = models.IntegerField()
    width = models.IntegerField()
    branch_message = models.ForeignKey(BranchMessage,on_delete=models.CASCADE,related_name="images")
    image = models.ImageField(upload_to='static/images',null=True,height_field='height', width_field='width')

    def save(self, *args, **kwargs):
        im = Image.open(self.image)

        def convert_image():
            im.load()
            rbg_img = im.convert('RGB')
            rbg_img.load()
            im_io = BytesIO()
            rbg_img.save(im_io, 'JPEG', quality=75)
            self.image = InMemoryUploadedFile(im_io, 'ImageField', "%s.jpg" % self.image.name.split('.')[0],
                                              'image/jpeg', im_io.getbuffer().nbytes, None)
        try:
            if not im.is_animated:
                convert_image()
        except Exception:
            # Exception happens in file is image instead of gif
            convert_image()
        super().save(*args, **kwargs)


class ChatVideo(models.Model):
    branch_message = models.ForeignKey(BranchMessage,on_delete=models.CASCADE,related_name="videos")
    height = models.IntegerField()
    width = models.IntegerField()
    thumbnail = models.ImageField(upload_to='thumbnails',null=True,height_field='height', width_field='width')
    video = models.FileField(upload_to='static/videos',null=True)


#@receiver(post_save, sender=BranchMessage)
def create_message(sender, instance, created, **kwargs):

    serialized_message  = serializers.serialize('json', [ instance, ])
    channel_layer = channels.layers.get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        str('chat_%s' % str(instance.branch_chat.id)),
        {
            'type': 'chat.message',
            'author_name': instance.author.name,
            'author_url': instance.author.uri,
            'author': str(instance.author.id),
            'created': str(instance.created),
            'message': instance.message,
            'images': [image.url for image in instance.images.all()],
            'videos': [video.url for video in instance.videos.all()]
        }
    )


@receiver(post_save, sender=BranchChat)
def create_init_branch_chat(sender, instance, created, **kwargs):
    if created:
        instance.members.add(instance.owner)
        instance.save()


@receiver(post_save, sender=ChatRequest, dispatch_uid="chat_request_notification")
def create_chat_request_notification(sender,instance,created,**kwargs):

    if created:
        description = "invited you to a conversation"
        verb = "conversation_invite"

        notification = Notification.objects.create(recipient=instance.request_to.owner,
                                                   actor=instance.branch_chat.owner
                                               ,verb=verb, target=instance.request_to,
                                               action_object=instance, description=description)
        request_to = {
            'uri': instance.request_to.uri,
            'name': instance.request_to.name,
            'image': instance.request_to.branch_image.url,
            'banner': instance.request_to.branch_banner.url
        }

        request_from = {
            'uri': instance.request_from.uri,
            'name': instance.request_from.name,
            'image': instance.request_from.branch_image.url,
            'banner': instance.request_from.branch_banner.url
        }

        branch_chat = {
            'name':instance.branch_chat.name,
            'image':instance.branch_chat.image.url
        }

        branch_name = 'branch_%s' % instance.request_to

        channel_layer = channels.layers.get_channel_layer()

        async_to_sync(channel_layer.group_send)(
            branch_name,
            {
                'type': 'send.chat.request',
                'request_to': request_to,
                'request_from': request_from,
                'branch_chat': branch_chat,
                'verb': verb,
                'id': notification.id
            }
        )

        fcm_device = GCMDevice.objects.filter(user=instance.request_to.owner)

        title = "Conversation Invite - %s" % instance.branch_chat.name
        body = "%s (@%s) Invited you %s (@%s) to a conversation" % \
               (instance.request_from.name,instance.request_from.uri,instance.request_to.name,instance.request_to.uri)

        icon = ''
        if instance.branch_chat.icon:
            icon = instance.branch_chat.icon.url

        fcm_device.send_message(body,
                                extra={"title": title,
                                       "sound": 'default',
                                       "icon": icon,
                                       "badge": '/static/favicon-72x72.jpg',
                                       "click_action": '/messages',
                                       "tag": str(instance.branch_chat.id)}),


@receiver(post_save, sender=BranchMessage)
def create_notification(sender, instance, created, **kwargs):
    if created:
        # exluding authors branches
        non_author_members = instance.branch_chat.members.exclude(pk__in=instance.author.owner.owned_groups.all())

        # Push notifications
        for member in non_author_members.distinct('owner'):
            fcm_device = GCMDevice.objects.filter(user=member.owner)

            title = "%s: %s sent a message" % (instance.branch_chat.name, instance.author.name)

            icon = instance.branch_chat.image.url
            '''icon = ''
            if instance.branch_chat.icon:
                icon = instance.branch_chat.icon.url'''

            if instance.branch_chat.personal:
                title = "%s sent you a message" % instance.author.name

                # display other persons icon
                icon = instance.author.branch_image.url
                '''if instance.author.icon:
                    icon = instance.author.icon.url'''

            fcm_device.send_message("%s" % str(instance.branch_chat.latest_message),
                                    extra={"title": title,
                                           "sound": 'default',
                                           "icon": icon,
                                           "badge": '/static/favicon-72x72.jpg',
                                           "click_action": '/messages/%s' % str(instance.branch_chat.id),
                                           "tag": str(instance.branch_chat.id)}),

        # Regular notifications
        for member in non_author_members:
            description = "sent a message"
            verb = "message"


            notification = Notification.objects.create(recipient=member.owner,actor=instance.author
                                        ,verb=verb,target=member,
                                        action_object=instance,description=description)

            channel_layer = channels.layers.get_channel_layer()
            branch_name = 'branch_%s' % member
            async_to_sync(channel_layer.group_send)(
                branch_name,
                {
                    'type': 'send.message.notification',
                    'author_name': instance.author.name,
                    'author_url': instance.author.uri,
                    'author': str(instance.author.id),
                    'created': str(instance.created),
                    'message_id':instance.pk,
                    'branch_chat': str(instance.branch_chat.id),
                    'verb': verb,
                    'id': notification.id
                }
            )



