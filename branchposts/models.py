from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.validators import MaxValueValidator, MinValueValidator
from django.utils.translation import ugettext_lazy as _
from django.core.exceptions import ValidationError
from accounts.models import User
import uuid
from datetime import datetime
from math import log,exp
import sys


epoch = datetime(1970, 1, 1)

def sigmoid(x):
  return 1 / (1 + exp(-log(max(x + 1,1),10)))

def epoch_seconds(date):
    td = date - epoch
    return td.days * 86400 + td.seconds + (float(td.microseconds) / 1000000)

def hot(ups,spreads, date):
    s = ups * 10
    spread_s = sigmoid(spreads) * 30 - 15
    up_s = log(max(abs(s), 1), 10)
    order = spread_s + up_s
    print(spread_s,up_s)
    seconds = epoch_seconds(date) - 1134028003
    return round(order + seconds / 45000, 7)

def calculate_score(votes,spreads, item_hour_age, gravity=1.8):
    spread_points = sigmoid(spreads)
    vote_points = log(max(votes,1),10)
    weight = spread_points + vote_points
    return weight / pow((item_hour_age+2), gravity)

def uuid_int():
    uid = uuid.uuid4()
    uid = str(uid.int)
    return uid[0:16]


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
from django.core.files import File


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
    TYPE_CHOICES = (
        (TYPE_STAR, 'Star'),
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


@receiver(post_save, sender=Post, dispatch_uid="update_post")
def update_post_score(sender, instance, **kwargs):
    for post in Post.objects.all():
     naive = post.created.replace(tzinfo=None)
     post.hot_score = hot(post.reacts.filter(type="star").count(),post.spreads.count(), naive)
     post.save()
         
@receiver(post_save, sender=React, dispatch_uid="update_react")
def update_post_score(sender, instance, **kwargs):
    for post in Post.objects.all():
     naive = post.created.replace(tzinfo=None)
     post.hot_score = hot(post.reacts.filter(type="star").count(),post.spreads.count(), naive)
     post.save()