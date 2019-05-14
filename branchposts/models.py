from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.validators import MaxValueValidator, MinValueValidator
from django.utils.translation import ugettext_lazy as _
from accounts.models import User
from branches.models import Branch
import uuid
from datetime import datetime, timedelta
from math import log


epoch = datetime(1970, 1, 1)

def epoch_seconds(date):
    td = date - epoch
    return td.days * 86400 + td.seconds + (float(td.microseconds) / 1000000)

def hot(ups, date):
    s = ups * 10
    order = log(max(abs(s), 1), 10)
    print(order)
    seconds = epoch_seconds(date) - 1134028003
    return round(order + seconds / 45000, 7)


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
    poster = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="posts")
    posted = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="posts_from")
    posted_to = models.ManyToManyField(Branch,related_name="posts_from_all")
    replied_to = models.ForeignKey('self',blank=True,null=True, on_delete=models.CASCADE,related_name="replies")
    level = models.IntegerField(
        default=0, # 0 for top level posts
        validators=[
            MaxValueValidator(5),
            MinValueValidator(0)
        ]
    )
    text = models.TextField(_("Text"), max_length=3000)
    hot_score = models.DecimalField(max_digits=19,decimal_places=10,default=0.0)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (("posted","id"),)
        ordering = ['-created']

    def __str__(self):
        return str(self.id)


class Spread(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="spreads")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="spreads")

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
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="reacts")
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
     post.hot_score = hot(post.reacts.filter(type="star").count(), naive)
     post.save()
         
@receiver(post_save, sender=React, dispatch_uid="update_react")
def update_post_score(sender, instance, **kwargs):
    for post in Post.objects.all():
     naive = post.created.replace(tzinfo=None)
     post.hot_score = hot(post.reacts.filter(type="star").count(), naive)
     post.save()