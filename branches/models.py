from django.db import models
from django.db.models import Count
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save, post_init, pre_save, m2m_changed
from django.core.exceptions import ValidationError,SuspiciousOperation
from django.dispatch import receiver
from django.core.files.uploadedfile import InMemoryUploadedFile
from push_notifications.models import APNSDevice, GCMDevice
from taggit.managers import TaggableManager
from io import BytesIO
from PIL import Image
from accounts.models import User
from branchchat.models import BranchChat
from branchposts.models import Post
from notifications.models import Notification
from tags.models import GenericStringTaggedItem
from core.utils import JPEGSaveWithTargetSize
from .utils import generate_unique_uri
import uuid
import hashlib
import datetime

def generate_sha(file):
    sha = hashlib.sha1()
    file.seek(0)
    while True:
        buf = file.read(104857600)
        if not buf:
            break
        sha.update(buf)
    sha1 = sha.hexdigest()
    file.seek(0)

    return sha1

def uuid_int():
    uid = uuid.uuid4()
    uid = str(uid.int)
    return uid[0:16]

def calculate_trending_score(posts):
    spread_count = 0
    for post in posts:
        spread_count+=post.spreads.count()
    return spread_count

def deEmojify(inputString):
    return inputString.encode('ascii', 'ignore').decode('ascii')


class BranchQuerySet(models.QuerySet):
    def siblings(self, uri):
        parents = Branch.objects.get(uri__iexact=uri).parents.all()
        siblings = Branch.objects.filter(parents__in=parents) \
            .exclude(uri__iexact=uri) \
            .distinct()
        return siblings


class Branch(models.Model):
    class Meta:
        unique_together = ('owner', 'name')

    FOLLOWING_ONLY = 'FO'
    EVERYONE = 'EO'

    DIRECT_MESSAGE_TYPE = (
        (FOLLOWING_ONLY, 'Following only'),
        (EVERYONE, 'Everyone')
    )

    PUBLIC = 'PU'
    INVITE_ONLY = 'IO'
    ACCESSIBILITY = (
        (PUBLIC, 'Public'),
        (INVITE_ONLY, 'Invite only'),
    )

    USER = 'US'
    COMMUNITY = 'CM'
    HUB = 'HB'

    TYPE = (
        (USER, 'User'),
        (COMMUNITY, 'Community'),
        (HUB, 'Hub')
    )

    branch_image = models.ImageField(upload_to='images/group_images/profile',
                                    default='images/group_images/profile/default.jpeg',
                                    blank=False)
    #branch_image_sha1 = models.CharField(max_length=40)
    branch_banner = models.ImageField(upload_to='images/group_images/banner',
                                     default='images/group_images/banner/default.png',
                                     blank=False)
    icon = models.ImageField(upload_to='images/group_images/icons',
                             blank=True)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_groups')
    branch_type = models.CharField(default=USER, choices=TYPE, max_length=2)
    parents = models.ManyToManyField('self', blank=True, symmetrical=False, related_name="children")
    follows = models.ManyToManyField('self', blank=True, null=True, symmetrical=False, related_name='followed_by')
    name = models.CharField(blank=False, null=False, default='unnamed', max_length=30)
    accessibility = models.CharField(default=PUBLIC, choices=ACCESSIBILITY, max_length=2)
    description = models.TextField(blank=True, null=True, max_length=140)
    over_18 = models.BooleanField(default=False)
    uri = models.CharField(blank=False, null=False, default=uuid.uuid4, unique=True, max_length=60, db_index=True)
    default = models.BooleanField(default=False)
    created = models.DateTimeField(auto_now_add=True)
    trending_score = models.DecimalField(max_digits=14, decimal_places=5,default=0.0)
    tags = TaggableManager(through=GenericStringTaggedItem, blank=True)
    is_branchable = models.BooleanField(default=False)
    direct_messages_accessibility = models.CharField(default=EVERYONE, choices=DIRECT_MESSAGE_TYPE,max_length=2)

    # Whether the branch can "host" tags
    # By default all posts tagged with "example_tag" will appear in the branches which contain
    # the tag "example_tag"
    is_hostable = models.BooleanField(default=True)

    def __str__(self):
        return self.uri

    def clean(self, *args, **kwargs):
        self.uri = deEmojify(self.uri)
        owned_branches = self.owner.owned_groups.exclude(pk=self.pk)
        if self.default:
            for branch in owned_branches:
                branch.default = False
                branch.save()

    def encode_image(self,image):
        try:
            if image:
                im = Image.open(image)
                im.load()
                rbg_img = im.convert('RGB')
                rbg_img.load()
                # create a BytesIO object
                im_io = BytesIO()
                # save image to BytesIO object
                rbg_img.save(im_io, 'JPEG', quality=75)
                return InMemoryUploadedFile(im_io, 'ImageField', "%s.jpg" % image.name.split('.')[0],
                                            'image/jpeg', im_io.getbuffer().nbytes, None)
            return None
        except OSError as e:
            return None

    def save(self, *args, **kwargs):
        if not Branch.objects.filter(pk=self.pk).exists():  #in case of new model instance
            self.uri = generate_unique_uri(self.name,self.uri)
        '''else:
            branch = Branch.objects.get(pk=self.pk)
            if branch.uri != self.uri:                     #need validation if uri updated
                self.uri = generate_unique_uri(self.name)'''
        if self.pk:
            self.full_clean()

        super().save(*args, **kwargs)

    objects = BranchQuerySet.as_manager()

# Remove previous uri and name from tags in case they changes
@receiver(pre_save, sender=Branch)
def remove_old_tags(sender, instance, **kwargs):
    instance.tags.remove(instance.uri)
    instance.tags.remove(instance.name)

# Add the new uri and name to tags in case they changes
@receiver(post_save, sender=Branch)
def add_new_tags(sender, instance, **kwargs):
    instance.tags.add(instance.uri, instance.name)


def validate_manytomany(self,instance,target):
    if instance == target:
        raise ValidationError('Cannot branch to the same branch')


class BranchRequest(models.Model):
    class Meta:
        unique_together = ('request_to','request_from','type',)

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

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
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
    if created and instance.request_from is not instance.request_to:
        verb = instance.relation_type

        if instance.relation_type == BranchRequest.RELATION_TYPE_CHILD:
            description = "wants to become child of"
            verb = "become_child"

        else:
            description = "wants to become parent of"
            verb = "become_parent"


        notification = Notification.objects.create(recipient=instance.request_to.owner,actor=instance.request_from
                                    ,verb=verb,target=instance.request_to,
                                    action_object=instance,description=description)

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
                'verb': verb,
                'id': notification.id
            }
        )

        fcm_device = GCMDevice.objects.filter(user=instance.request_to.owner)

        title = "Branch Request from - %s" % instance.request_from.name
        body = "%s (@%s) %s %s (@%s)" % \
               (
               instance.request_from.name, instance.request_from.uri,description,
               instance.request_to.name, instance.request_to.uri)

        icon = ''
        if instance.request_from.icon:
            icon = instance.request_from.icon.url

        fcm_device.send_message(body,
                                extra={"title": title,
                                       "sound": 'default',
                                       "icon": icon,
                                       "badge": '/static/favicon-72x72.jpg',
                                       "click_action": '/%s/branches' % instance.request_to.uri}),


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
def follow_self(sender, instance, created, **kwargs):
    if created:
        instance.follows.add(instance)


@receiver(post_save, sender=Branch)
def validate_default(sender, instance, created, **kwargs):
    if created:
        instance.full_clean()


@receiver(m2m_changed,sender=Branch.follows.through)
def modify_chat_room2(sender, instance, **kwargs):
    action = kwargs.pop('action', None)
    pk_set = kwargs.pop('pk_set', None)

    # returns None or the object if it exists
    def already_exists(query_member):
        instance_personal_rooms = (
            BranchChat.objects
                .annotate(num_members=Count("members"))
                .filter(num_members=2)
                .filter(members=query_member)
                .filter(members=instance)
        )

        if not instance_personal_rooms.exists():
            return None
        return instance_personal_rooms[0]

    # On follow create direct chat
    if action == "post_add":
        for pk in pk_set:
            member = Branch.objects.get(pk=pk)
            is_following = True if instance in member.follows.all() else False
            is_being_followed_back = True if member in instance.follows.all() else False
            if is_being_followed_back and is_following and not already_exists(member):
                members = [member, instance]
                new_room = BranchChat.objects.create(owner=instance,image=member.branch_image,name=member.name,
                                                     personal=True)
                new_room.members.add(*members)

    # On unfollow disable direct chat
    if action == "post_remove":
        for pk in pk_set:
            member = Branch.objects.get(pk=pk)
            chat = already_exists(member)
            if chat:
                chat.is_disabled = True


@receiver(m2m_changed,sender=Branch.follows.through)
def modify_chat_room(sender, instance, **kwargs):
    action = kwargs.pop('action', None)
    pk_set = kwargs.pop('pk_set', None)

    # returns None or the object if it exists
    def already_exists(query_member):
        instance_personal_rooms = (
            BranchChat.objects
                .filter(personal=True)
                .filter(members=query_member)
                .filter(members=instance)
        )

        if not instance_personal_rooms.exists():
            return None
        return instance_personal_rooms[0]

    def create_room(other_member, members):
        new_room = BranchChat.objects.create(owner=instance, image=other_member.branch_image,
                                             name=other_member.name,
                                             personal=True)
        new_room.members.add(*members)

    # On follow create direct chat
    if action == "post_add":
        for pk in pk_set:
            member = Branch.objects.get(pk=pk)
            members = [instance, member]

            if not already_exists(member):
                if member.direct_messages_accessibility == Branch.EVERYONE:
                    create_room(member, members)
                else:
                    if member.follows.filter(pk=instance.pk):
                        create_room(member, members)

    # On unfollow disable direct chat
    if action == "post_remove":
        for pk in pk_set:
            member = Branch.objects.get(pk=pk)
            chat = already_exists(member)

            if chat:
                chat.is_disabled = True
                chat.save(update_fields=['is_disabled'])


@receiver(m2m_changed,sender=Branch.follows.through)
def create_follow_notification(sender, instance, **kwargs):
    action = kwargs.pop('action', None)
    pk_set = kwargs.pop('pk_set', None)

    if action == "post_add":
        for pk in pk_set:
            being_followed = Branch.objects.get(pk=pk)
            if not being_followed.owner.owned_groups.filter(pk=instance.pk).exists():
                verb = 'follow'
                description = 'has started following you'

                notification = Notification.objects.create(recipient=being_followed.owner, actor=instance
                                                           ,verb=verb, target=being_followed,
                                                           action_object=being_followed, description=description)

                followed_by = {
                    'uri': instance.uri,
                    'name': instance.name,
                    'image': instance.branch_image.url,
                    'banner': instance.branch_banner.url
                }

                branch_name = 'branch_%s' % being_followed

                channel_layer = channels.layers.get_channel_layer()

                async_to_sync(channel_layer.group_send)(
                    branch_name,
                    {
                        'type': 'send.new.follow',
                        'followed_by': followed_by,
                        'verb': verb,
                        'id': notification.id
                    }
                )

                fcm_device = GCMDevice.objects.filter(user=being_followed.owner)
                title = "New follower"
                body = "%s (@%s) is now following you %s (@%s)" % \
                       (instance.name, instance.uri, being_followed.name, being_followed.uri)

                icon = ''
                if instance.icon:
                    icon = instance.icon.url

                fcm_device.send_message(body,
                                        extra={"title":title,
                                               "sound": 'default',
                                               "icon": icon,
                                               "badge": '/static/favicon-72x72.jpg',
                                               "click_action": '/%s' % instance.uri}),

'''@receiver(post_save, sender=Post, dispatch_uid="update_post")
def update_post_score(sender, instance, **kwargs):
    date_from = datetime.datetime.now() - datetime.timedelta(days=1)
    for branch in Branch.objects.all():
        last_24_hour_posts = Post.objects.filter(posted_to=branch,created__gte=date_from)
        branch.trending_score = calculate_trending_score(last_24_hour_posts)
        print(branch.trending_score)
        branch.save()'''