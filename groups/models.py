from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import User
from groupchat.models import GroupChat
import uuid


class Group(models.Model):
    class Meta:
        unique_together = (('owner', 'name'), ('name', 'tag'))

    PUBLIC = 'PU'
    INVITE_ONLY = 'IO'
    ACCESSIBILITY = (
        (PUBLIC, 'Public'),
        (INVITE_ONLY, 'Invite only'),
    )

    group_image = models.ImageField(upload_to='images/group_images/profile',
                                    default='/images/group_images/profile/default.jpeg',
                                    blank=False)
    group_banner = models.ImageField(upload_to='images/group_images/banner',
                                     default='/images/group_images/banner/default.jpeg',
                                     blank=False)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_groups')
    parents = models.ManyToManyField('self', blank=True, symmetrical=False, related_name="children")
    name = models.CharField(blank=False, null=False, default='unnamed', max_length=30)
    accessibility = models.CharField(default=PUBLIC, choices=ACCESSIBILITY, max_length=2)
    description = models.TextField(blank=False, null=False, default="No description.", max_length=200)
    over_18 = models.BooleanField(default=False)
    tag = models.IntegerField(blank=True, null=True)
    uri = models.CharField(blank=False, null=False, default=uuid.uuid4, max_length=60)

    def __str__(self):
        return self.uri

    def save(self, *args, **kwargs):
        if self.tag:
            self.uri = '%s.%d' % (self.name, self.tag)
        else:
            self.uri = '%s' % self.name
        super().save(*args, **kwargs)


@receiver(post_save, sender=Group)
def create_group_chat(sender, instance, created, **kwargs):
    if created:
        print(instance)
        GroupChat.objects.create(group=instance)


class Subscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='group')
