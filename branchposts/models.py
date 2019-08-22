from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.validators import MaxValueValidator, MinValueValidator
from django.utils.translation import ugettext_lazy as _
from django.core.exceptions import ValidationError
from accounts.models import User
from notifications.models import Notification
import uuid
from datetime import datetime
from math import log,exp
import sys
import shutil


epoch = datetime(1970, 1, 1)

def sigmoid(x):
  return 1 / (1 + exp(-log(max(x + 1,1),10)))

def epoch_seconds(date):
    td = date - epoch
    return td.days * 86400 + td.seconds + (float(td.microseconds) / 1000000)

def score(ups, downs):
    return ups - downs

def hot(ups, downs, spreads , date):
    s = score(ups, downs)
    spread_s = sigmoid(spreads) * 30 - 15
    order = log(max(abs(s), 1), 10) + spread_s
    sign = 1 if s > 0 else -1 if s < 0 else 0
    seconds = epoch_seconds(date) - 1134028003
    return round(sign * order + seconds / 45000, 7)


def calculate_score(votes,spreads, item_hour_age, gravity=1.8):
    spread_points = sigmoid(spreads)
    vote_points = log(max(votes,1),10)
    weight = spread_points + vote_points
    return weight / pow((item_hour_age+2), gravity)

def uuid_int():
    uid = uuid.uuid4()
    uid = str(uid.int)
    return uid[0:15]


class Post(models.Model):
    TYPE_REPLY = 'reply'
    TYPE_POST = 'post'
    TYPE_SPREAD = 'spread'
    TYPE_CHOICES = (
        (TYPE_REPLY, 'Reply'),
        (TYPE_POST, 'Post'),
        (TYPE_SPREAD, 'Spread'),
    )

    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default=TYPE_POST,
        blank=True,
        null=True,
    )

    id = models.BigIntegerField(primary_key=True, default=uuid_int, editable=True)
    poster = models.ForeignKey('branches.Branch', on_delete=models.CASCADE, related_name="posts")
    posted = models.ForeignKey('branches.Branch', on_delete=models.CASCADE, related_name="posts_from")
    posted_to = models.ManyToManyField('branches.Branch',related_name="posts_from_all")
    replied_to = models.ForeignKey('self',blank=True,null=True, on_delete=models.CASCADE,related_name="replies")
    level = models.IntegerField(
        default=0, # 0 for top level posts
        validators=[
            MaxValueValidator(5),
            MinValueValidator(0)
        ]
    )
    text = models.TextField(_("Text"),null=True,blank=True, max_length=3000)
    hot_score = models.DecimalField(max_digits=19,decimal_places=10,default=0.0)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (("posted","id"),)
        ordering = ['-created']

    def __str__(self):
        return str(self.id)

    def clean(self):
        super().clean()
        if not self.text:
            print("None")
        if not self.images.exists():
            print("not exists")
        if not self.text and not self.images.exists():
            raise ValidationError('Field1 or field2 are both None')


from io import BytesIO
from PIL import Image


class PostImage(models.Model):
    height = models.IntegerField()
    width = models.IntegerField()
    post = models.ForeignKey(Post,on_delete=models.CASCADE,related_name="images")
    url = models.URLField(null=True)
    image = models.ImageField(upload_to='static/images',null=True,height_field='height', width_field='width')

    def save(self, *args, **kwargs):
        im = Image.open(self.image)
        im.load()
        rbg_img = im.convert('RGB')
        rbg_img.load()
        # create a BytesIO object
        im_io = BytesIO()
        # save image to BytesIO object
        rbg_img.save(im_io, 'JPEG', quality=75)
        self.image = InMemoryUploadedFile(im_io,'ImageField', "%s.jpg" %self.image.name.split('.')[0],
                                          'image/jpeg', im_io.getbuffer().nbytes, None)
        super().save(*args, **kwargs)




from moviepy.editor import VideoFileClip
import os
from random import random

class PostVideo(models.Model):
    post = models.ForeignKey(Post,on_delete=models.CASCADE,related_name="videos")
    height = models.IntegerField()
    width = models.IntegerField()
    thumbnail = models.ImageField(upload_to='thumbnails',null=True,height_field='height', width_field='width')
    video = models.FileField(upload_to='static/videos',null=True)

    def filename(self):
        return os.path.basename(self.video.name)

    def generate_thumbnail(self):
        clip = VideoFileClip(os.path.basename(self.filename()))
        thumbnail = os.path.join(self.filename(), "thumbnail.png")
        clip.save_frame(thumbnail, t=random.uniform(0.1, clip.duration))
        return thumbnail

    '''def save(self, *args, **kwargs):
        if not self.pk:
            self.thumbnail = self.generate_thumbnail()
        super().save(*args, **kwargs)'''

class Spread(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)
    branch = models.ForeignKey('branches.Branch', on_delete=models.CASCADE, related_name="spreads")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="spreads")
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.branch)  + " spread " + str(self.post)

class React(models.Model):
    TYPE_STAR = 'star'
    TYPE_DISLIKE = 'dislike'
    TYPE_CHOICES = (
        (TYPE_STAR, 'Star'),
        (TYPE_DISLIKE, 'Dislike'),
    )

    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        blank=True,
        null=True,
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)
    branch = models.ForeignKey('branches.Branch', on_delete=models.CASCADE, related_name="reacts")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="reacts")
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together=(("post","branch"),)

    def __str__(self):
        return "%s reacted to %s" %(self.branch.uri,self.post)


class Star(models.Model):
    react = models.OneToOneField(React,on_delete=models.CASCADE,related_name="stars")

class Dislikes(models.Model):
    react = models.OneToOneField(React,on_delete=models.CASCADE,related_name="dislikes")


def get_spreads(instance):
    # get and then exclude posters branches
    posters_branches = instance.poster.owner.owned_groups.all()
    return instance.spreads.exclude(branch__in=posters_branches).count()

def update_score(instance):
    naive = instance.created.replace(tzinfo=None)
    stars = instance.reacts.filter(type="star").count()
    downs = instance.reacts.filter(type="dislike").count()
    spreads = get_spreads(instance)
    instance.hot_score = hot(stars, downs, spreads, naive)
    instance.save()

@receiver(post_save, sender=Post, dispatch_uid="update_post")
def update_post_score(sender, instance, **kwargs):
     update_score(instance.post)
         
@receiver(post_save, sender=React, dispatch_uid="update_react")
def update_post_score(sender, instance, **kwargs):
     update_score(instance.post)

@receiver(post_save,sender=PostVideo,dispatch_uid="postVideo_delete_temp_folder")
def delete_temp_folder(sender, instance, created, **kwargs):
    path = os.path.join(os.path.expanduser('~'), 'temp_thumbnails')
    if created and instance.video:
        for root, dirs, files in os.walk(path):
            for f in files:
                try:
                    os.unlink(os.path.join(root, f))
                except (OSError,FileNotFoundError) as e:
                    print("e",e)
            for d in dirs:
                try:
                    shutil.rmtree(os.path.join(root, d))
                except (OSError,FileNotFoundError) as e:
                    print("e",e)


import channels.layers
from asgiref.sync import async_to_sync
from django.core import serializers

@receiver(post_save, sender=React)
def create_notification(sender, instance, created, **kwargs):
    if created and instance.branch is not instance.post.poster:
        description = "reacted to your leaf"
        verb = "react"


        notification = Notification.objects.create(recipient=instance.post.poster.owner,actor=instance.branch
                                    ,verb=verb,target=instance.post.poster,
                                    action_object=instance,description=description)

        serialized_notification  = serializers.serialize('json', [ notification, ])

        branch_name = 'branch_%s' % instance.post.poster

        message = {
            'notification': serialized_notification
        }

        react_from = {
            'uri':instance.branch.uri,
            'name':instance.branch.name,
            'profile':instance.branch.branch_image.url
        }

        channel_layer = channels.layers.get_channel_layer()


        async_to_sync(channel_layer.group_send)(
            branch_name,
            {
                'type': 'send.react.notification',
                'text': message,
                'react_from':react_from,
                'post': instance.post.id,
                'verb': verb,
                'id': notification.id
            }
        )