from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save, post_init, pre_save
from django.core.exceptions import ValidationError,SuspiciousOperation
from django.dispatch import receiver
from accounts.models import User
from branchchat.models import BranchChat
from branchposts.models import Post
from notifications.models import Notification
from django.apps import apps
from .utils import generate_unique_uri
import uuid
import datetime


def uuid_int():
    uid = uuid.uuid4()
    uid = str(uid.int)
    return uid[0:16]

def calculate_trending_score(posts):
    spread_count = 0
    for post in posts:
        spread_count+=post.spreads.count()
    if posts.count()==0:
        avg = 0
    else:
        avg = spread_count/posts.count()
    return avg

class Branch(models.Model):
    class Meta:
        unique_together = ('owner', 'name')

    PUBLIC = 'PU'
    INVITE_ONLY = 'IO'
    ACCESSIBILITY = (
        (PUBLIC, 'Public'),
        (INVITE_ONLY, 'Invite only'),
    )

    branch_image = models.ImageField(upload_to='images/group_images/profile',
                                    default='/images/group_images/profile/default.jpeg',
                                    blank=False)
    branch_banner = models.ImageField(upload_to='images/group_images/banner',
                                     default='/images/group_images/banner/default.jpeg',
                                     blank=False)


    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_groups')
    parents = models.ManyToManyField('self', blank=True, symmetrical=False, related_name="children")
    follows = models.ManyToManyField('self', blank=True, null=True, symmetrical=False, related_name='followed_by')
    name = models.CharField(blank=False, null=False, default='unnamed', max_length=30)
    accessibility = models.CharField(default=PUBLIC, choices=ACCESSIBILITY, max_length=2)
    description = models.TextField(blank=True, null=True, max_length=140)
    over_18 = models.BooleanField(default=False)
    uri = models.CharField(blank=False, null=False, default=uuid.uuid4, max_length=60)
    default = models.BooleanField(default=False)
    created = models.DateTimeField(auto_now_add=True)
    trending_score = models.DecimalField(max_digits=14,decimal_places=5,default=0.0)

    def __str__(self):
        return self.uri

    def save(self, *args, **kwargs):

        if not Branch.objects.filter(pk=self.pk).first():  #in case of new model instance
            self.uri = generate_unique_uri(self.name)
        else:
            branch = Branch.objects.get(pk=self.pk)
            if branch.uri != self.uri:                     #need validation if uri updated
                self.uri = generate_unique_uri(self.name)
        super().save(*args, **kwargs)

def validate_manytomany(self,instance,target):
    self.delete()
    if instance == target:
        raise ValidationError('Cannot branch to the same branch')


@receiver(post_save, sender=Post, dispatch_uid="update_post")
def update_post_score(sender, instance, **kwargs):
    date_from = datetime.datetime.now() - datetime.timedelta(days=1)
    for branch in Branch.objects.all():
        last_24_hour_posts = Post.objects.filter(posted_to=branch,created__gte=date_from)
        branch.trending_score=calculate_trending_score(last_24_hour_posts)
        branch.save()


class BranchRequest(models.Model):
    previous_state = None

    TYPE_ADD = 'add'
    TYPE_REMOVE= 'remove'
    TYPE_CHOICES = (
        (TYPE_ADD, 'Add'),
        (TYPE_REMOVE, 'Remove'),
    )

    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        blank=True,
        null=True,
    )

    RELATION_TYPE_PARENT = 'parent'
    RELATION_TYPE_CHILD = 'child'
    RELATION_TYPE_CHOICES = (
        (RELATION_TYPE_PARENT, 'Parent'),
        (RELATION_TYPE_CHILD, 'Child'),
    )

    relation_type = models.CharField(
        max_length=20,
        choices=RELATION_TYPE_CHOICES,
        blank=True,
        null=True,
    )

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

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)
    request_from = models.ForeignKey(Branch,on_delete=models.CASCADE,related_name="requests_sent")
    request_to = models.ForeignKey(Branch,on_delete=models.CASCADE,related_name="requests_received")

    def save(self, *args, **kwargs):
        validate_manytomany(self,self.request_from,self.request_to)
        if self.status == self.STATUS_ACCEPTED:
            if self.type == self.TYPE_ADD:
                if self.relation_type == self.RELATION_TYPE_CHILD:
                    self.request_to.children.add(self.request_from)
                    print(self.request_from, 'has successfully become child to', self.request_to)
                elif self.relation_type == self.RELATION_TYPE_PARENT:
                    self.request_to.parents.add(self.request_from)
                    print(self.request_from, 'has successfully become parent to', self.request_to)
            if self.type == self.TYPE_REMOVE:
                if self.relation_type == self.RELATION_TYPE_CHILD:
                    self.request_to.children.remove(self.request_from)
                    print(self.request_from, 'was successfully removed as child from', self.request_to)
                elif self.relation_type == self.RELATION_TYPE_PARENT:
                    self.request_to.parents.add(self.request_from)
                    print(self.request_from, 'was successfully removed as parent from', self.request_to)
        super(BranchRequest, self).save()


    @staticmethod
    def pre_save(sender, **kwargs):
        instance = kwargs.get('instance')
        created = kwargs.get('created')
        print(instance.previous_state, instance.status)
        if instance.previous_state != instance.status or created and instance.type!=instance.TYPE_REMOVE:
            if instance.previous_state != instance.STATUS_ON_HOLD and instance.previous_state is not None:
                raise SuspiciousOperation('The request cannot change status after it has been accepted or declined')

    @staticmethod
    def remember_state(sender, **kwargs):
        instance = kwargs.get('instance')
        instance.previous_state = instance.status


import channels.layers
from asgiref.sync import async_to_sync
from django.core import serializers

# assuming obj is a model instance



@receiver(post_save, sender=BranchRequest)
def create_notification(sender, instance, created, **kwargs):
    verb = instance.relation_type

    if instance.relation_type == BranchRequest.RELATION_TYPE_CHILD:
        #description = str(instance.request_from) + " wants to become child of " + str(instance.request_to)
        description = " wants to become child of "

    else:
        #description = str(instance.request_from) + " wants to become parent of " + str(instance.request_to)
        description = " wants to become parent of "


    notification = Notification.objects.create(recipient=instance.request_to.owner,actor=instance.request_from,verb=verb,
                                target=instance.request_to,action_object=instance,description=description)

    serialized_notification  = serializers.serialize('json', [ notification, ])

    request_to={
        'uri': instance.request_to.uri,
        'name': instance.request_to.name,
        'image': instance.request_to.branch_image.url,
        'banner': instance.request_to.branch_banner.url
    }

    request_from={
        'uri': instance.request_from.uri,
        'name': instance.request_from.name,
        'image': instance.request_from.branch_image.url,
        'banner': instance.request_from.branch_banner.url
    }

    branch_name = 'branch_%s' % instance.request_to

    message = {
        'notification': serialized_notification
    }

    channel_layer = channels.layers.get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        branch_name,
        {
            'type': 'send.message',
            'text': message,
            'request_to': request_to,
            'request_from': request_from,
            'id': notification.id
        }
    )


class Follow(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    from_branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, related_name='followers')
    to_branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, related_name='following')
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "%s is now following %s" % (self.from_branch, self.to_branch)


pre_save.connect(BranchRequest.pre_save, sender=BranchRequest)
post_init.connect(BranchRequest.remember_state, sender=BranchRequest)


@receiver(post_save, sender=Branch)
def create_group_chat(sender, instance, created, **kwargs):
    if created:
        BranchChat.objects.create(branch=instance)



