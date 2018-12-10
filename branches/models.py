from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import User, UserProfile
from branchchat.models import BranchChat
import uuid


class Branch(models.Model):
    class Meta:
        unique_together = (('owner', 'name'), ('name', 'tag'))

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
    #owners_profile = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, related_name='profiles_owned_groups')
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
        name = ''.join(self.name.split())
        print("name=", name)
        if self.tag:
            self.uri = '%s.%d' % (name, self.tag)
        else:
            self.uri = '%s' % name
        super().save(*args, **kwargs)


@receiver(post_save, sender=Branch)
def create_group_chat(sender, instance, created, **kwargs):
    if created:
        print(instance)
        BranchChat.objects.create(branch=instance)


class Subscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='branch')
