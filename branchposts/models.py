from django.db import models
from django.apps import apps
from django.db.models import Sum,Count,F
from django.db.models.signals import post_save,m2m_changed
from django.dispatch import receiver
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.validators import MaxValueValidator, MinValueValidator
from django.utils.translation import ugettext_lazy as _
from django.core.exceptions import ValidationError
from push_notifications.models import APNSDevice, GCMDevice
from taggit.managers import TaggableManager
from accounts.models import User
from tags.models import GenericBigIntTaggedItem
from notifications.models import Notification
import uuid
from datetime import datetime
from math import log,exp
import sys
import shutil


epoch = datetime(1970, 1, 1)


def sigmoid(x):
    return 1 / (1 + exp(-log(max(x*0.1,1),20)))


def epoch_seconds(date):
    td = date - epoch
    return td.days * 86400 + td.seconds + (float(td.microseconds) / 1000000)


def score(ups, downs):
    return ups - downs


def hot(ups, downs, spreads, date):
    s = score(ups, downs)
    spread_s = sigmoid(spreads) + 0.5
    sign = 1 if s > 0 else -1 if s < 0 else 0
    if sign > 0:
        order = log(max(abs(s), 1), 10) * max(spread_s, 1)
    else:
        order = log(max(abs(s), 1), 10)

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
    tags = TaggableManager(through=GenericBigIntTaggedItem, blank=True)

    @property
    def description(self):
        image_count = self.images.count()
        video_count = self.videos.count()

        if self.text:
            return self.text
        elif image_count > 0 or video_count > 0:
            return "%s Media" % str(image_count + video_count)
        else:
            return 'Media'

    class Meta:
        unique_together = (("posted","id"),)
        ordering = ['-created']

    def __str__(self):
        return str(self.id)

    def clean(self):
        super().clean()
        if not self.text:
            pass
        if not self.images.exists():
            pass
        if not self.text and not self.images.exists():
            raise ValidationError('Field1 or field2 are both None')

from io import BytesIO
from PIL import Image

class PostImage(models.Model):
    height = models.IntegerField()
    width = models.IntegerField()
    post = models.ForeignKey(Post,on_delete=models.CASCADE,related_name="images")
    url = models.URLField(null=True)
    image = models.ImageField(upload_to='static/images',null=True,blank=True,height_field='height', width_field='width')
    original_image = models.ImageField(upload_to='static/original_images',null=True,blank=True,height_field='height',
                                       width_field='width')

    def save(self, *args, **kwargs):
        if self.pk is None:
            self.original_image = self.image

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
            convert_image()
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

from django.core.validators import MaxValueValidator

class Spread(models.Model):
    class Meta:
        unique_together = ('branch','post')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)
    branch = models.ForeignKey('branches.Branch', on_delete=models.CASCADE, related_name="spreads")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="spreads")
    times = models.PositiveSmallIntegerField( validators=[MaxValueValidator(50)],default=0)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    @property
    def times_score(self):
        return log(self.times + 1.3,1.3)

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
    '''branches = Branch.objects.filter(posts_from_all__spreads__updated__gte=last_day) \
    .aggregate(Sum('posts_from_all__spreads__times'))'''
    # get and then exclude posters branches
    posters_branches = instance.poster.owner.owned_groups.all()
    sps = instance.spreads.exclude(branch__in=posters_branches)
    sps_sum = 0
    for sp in sps:
        sps_sum += log(sp.times + 1.3,1.3)
    return sps_sum

def update_score(instance):
    naive = instance.created.replace(tzinfo=None)
    stars = instance.reacts.filter(type="star").count()
    downs = instance.reacts.filter(type="dislike").count()
    spreads = get_spreads(instance)
    instance.hot_score = hot(stars, downs, spreads, naive)
    instance.save()

@receiver(post_save, sender=Post, dispatch_uid="init_score")
def init_post_score(sender, instance,created, **kwargs):
    if created:
        update_score(instance)
         
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
from django.contrib.contenttypes.models import ContentType

'''@receiver(m2m_changed,sender=Post.posted_to.through)
def posted_to_fallback(sender, instance, **kwargs):
    action = kwargs.pop('action', None)
    pk_set = kwargs.pop('pk_set', None)
    # On follow create direct chat
    print("m2mchanges",instance.posted_to.filter(pk=instance.poster.pk),instance.poster)
    if not instance.posted_to.filter(pk=instance.poster.pk) and action == "post_add":
        print("add")
        instance.posted_to.add(instance.poster)'''

@receiver(post_save, sender=Post)
def posted_to_fallback(sender, instance, created, **kwargs):
    # always post on posters branch
    if not instance.posted_to.filter(pk=instance.poster.pk):
        instance.posted_to.add(instance.poster)

@receiver(post_save, sender=Post)
def create_post_notification(sender, instance, created, **kwargs):
    if created and not instance.replied_to:

        description = "added a new leaf"
        verb = "add_leaf"

        for follower in instance.poster.followed_by.distinct('owner'):
            if not follower.owner.owned_groups \
                    .filter(pk=instance.poster.pk).exists():
                notification = Notification.objects.create(recipient=follower.owner,
                                                           actor=instance.poster
                                                           ,verb=verb, target=follower,
                                                           action_object=instance, description=description)

                branch_name = 'branch_%s' % follower

                poster = {
                    'uri': instance.poster.uri,
                    'name': instance.poster.name,
                    'profile': instance.poster.branch_image.url
                }

                channel_layer = channels.layers.get_channel_layer()

                async_to_sync(channel_layer.group_send)(
                    branch_name,
                    {
                        'type': 'send.post.notification',
                        'poster': poster,
                        'post': instance.id,
                        'created': str(instance.created),
                        'verb': verb,
                        'id': notification.id
                    }
                )

                max_body_length = 200
                fcm_device = GCMDevice.objects.filter(user=follower.owner)

                if len(instance.description) > max_body_length:
                    body = "%s..." % instance.description[0:200]
                else:
                    body = instance.description

                title = '%s (@%s) Added a leaf' % (
                instance.poster.name, instance.poster.uri)

                icon = ''
                if instance.poster.icon:
                    icon = instance.poster.icon.url

                fcm_device.send_message(body,
                                        extra={"title": title,
                                               "sound": 'default',
                                               "icon": icon,
                                               "badge": '/static/favicon-72x72.jpg',
                                               "click_action": '/%s/leaves/%s' % (
                                               instance.poster.uri, instance.id)}),

@receiver(post_save, sender=Post)
def create_reply_notification(sender, instance, created, **kwargs):
    if created:
        if instance.replied_to and not instance.replied_to.poster.owner.owned_groups\
            .filter(pk=instance.poster.pk).exists():

            description = "replied to your leaf"
            verb = "reply"

            notification = Notification.objects.create(recipient=instance.replied_to.poster.owner,
                                                       actor=instance.poster
                                                       ,verb=verb, target=instance.replied_to.poster,
                                                       action_object=instance, description=description)

            branch_name = 'branch_%s' % instance.replied_to.poster

            reply_from = {
                'uri': instance.poster.uri,
                'name': instance.poster.name,
                'profile': instance.poster.branch_image.url
            }

            channel_layer = channels.layers.get_channel_layer()

            async_to_sync(channel_layer.group_send)(
                branch_name,
                {
                    'type': 'send.reply.notification',
                    'reply_from': reply_from,
                    'post':instance.replied_to.id,
                    'reply':instance.id,
                    'verb': verb,
                    'id': notification.id
                }
            )

            max_body_length = 200
            fcm_device = GCMDevice.objects.filter(user=instance.replied_to.poster.owner)

            if len(instance.replied_to.description) > max_body_length:
                replied_to_synopsis = "%s..." % instance.replied_to.description[0:200]
            else:
                replied_to_synopsis = instance.replied_to.description

            title = '%s (@%s) Replied to your leaf "%s" ' % (instance.poster.name, instance.poster.uri,replied_to_synopsis)

            if len(instance.description) > max_body_length:
                body = "%s..." % instance.description[0:200]
            else:
                body = instance.description

            icon = ''
            if instance.poster.icon:
                icon = instance.poster.icon.url

            fcm_device.send_message(body,
                                    extra={"title": title,
                                           "sound": 'default',
                                           "icon": icon,
                                           "badge": '/static/favicon-72x72.jpg',
                                           "click_action": '/%s/leaves/%s' % (
                                           instance.poster.uri, instance.id)}),

@receiver(post_save, sender=React)
def create_notification(sender, instance, created, **kwargs):
    notification_exists = Notification.objects.filter(actor_content_type=ContentType.objects.get_for_model(instance.branch),
                                    actor_object_id=instance.branch.id,
                                    action_object_content_type=ContentType.objects.get_for_model(instance.post),
                                    action_object_object_id=instance.post.id).exists()

    Branch = apps.get_model(app_label='branches', model_name='Branch')
    if created and not instance.post.poster.owner.owned_groups.filter(pk=instance.branch.pk).exists() and not \
            notification_exists:

        description = "reacted to your leaf"
        verb = "react"


        notification = Notification.objects.create(recipient=instance.post.poster.owner,actor=instance.branch
                                    ,verb=verb,target=instance.post.poster,
                                    action_object=instance.post,description=description)

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

        max_body_length = 200
        fcm_device = GCMDevice.objects.filter(user=instance.post.poster.owner)

        title = "%s (@%s) Reacted to your leaf" % (instance.branch.name,instance.branch.uri)

        if len(instance.post.description) > max_body_length:
            body = "%s..." % instance.post.description[0:200]
        else:
            body =instance.post.description

        icon = ''
        if instance.branch.icon:
            icon = instance.branch.icon.url

        fcm_device.send_message(body,
                                extra={"title": title,
                                       "sound": 'default',
                                       "icon": icon,
                                       "badge": '/static/favicon-72x72.jpg',
                                       "click_action": '/%s/leaves/%s' % (instance.post.poster.uri,instance.post.id)}),