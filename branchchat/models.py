from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import User
import uuid


class BranchChat(models.Model):
    class Meta:
        unique_together = ('owner', 'id')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)
    name = models.CharField(default="default", blank=False, null=False, max_length=80)
    owner = models.ForeignKey('branches.Branch', null=True, on_delete=models.CASCADE, related_name="chat")
    members = models.ManyToManyField('branches.Branch', null=True, related_name="chat_groups")

    def __str__(self):
        return '%s' % self.name

    @property
    def latest_message(self):
        return self.messages.latest('created').message

    def save(self, *args, **kwargs):
        if not self.pk:
            self.name = str(self.owner)
        else:
            self.name = ",".join(str(i) for i in self.members.all())
            print(self.name)
        super().save(*args, **kwargs)


class BranchMessage(models.Model):
    branch_chat = models.ForeignKey(BranchChat, null=True, on_delete=models.CASCADE, related_name="messages")
    author = models.ForeignKey("branches.Branch", null=True, on_delete=models.SET_NULL)
    message = models.TextField(max_length=300,null=True,blank=True)
    message_html = models.TextField(null=True,blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.message


from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile

class ChatImage(models.Model):
    height = models.IntegerField()
    width = models.IntegerField()
    branch_message = models.ForeignKey(BranchMessage,on_delete=models.CASCADE,related_name="images")
    image = models.ImageField(upload_to='static/images',null=True,height_field='height', width_field='width')

    def save(self, *args, **kwargs):
        im = Image.open(self.image)
        im.load()
        rbg_img = im.convert('RGB')
        rbg_img.load()
        im_io = BytesIO()
        rbg_img.save(im_io, 'JPEG', quality=75)
        self.image = InMemoryUploadedFile(im_io,'ImageField', "%s.jpg" %self.image.name.split('.')[0],
                                          'image/jpeg', im_io.getbuffer().nbytes, None)
        super().save(*args, **kwargs)

class ChatVideo(models.Model):
    branch_message = models.ForeignKey(BranchMessage,on_delete=models.CASCADE,related_name="videos")
    height = models.IntegerField()
    width = models.IntegerField()
    thumbnail = models.ImageField(upload_to='thumbnails',null=True,height_field='height', width_field='width')
    video = models.FileField(upload_to='static/videos',null=True)



import channels.layers
from asgiref.sync import async_to_sync
from django.core import serializers

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