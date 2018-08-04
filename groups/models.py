from django.db import models
from accounts.models import User
from django.contrib.auth.models import AbstractUser
import uuid


class Group(models.Model):
    class Meta:
        unique_together = ('owner', 'name')

    PUBLIC = 'PU'
    INVITE_ONLY = 'IO'
    ACCESSIBILITY = (
        (PUBLIC, 'Public'),
        (INVITE_ONLY, 'Invite only'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_groups')
    name = models.CharField(blank=False, null=False, default='unnamed', max_length=30)
    accessibility = models.CharField(default=PUBLIC, choices=ACCESSIBILITY, max_length=2)
    description = models.TextField(blank=False, null=False, default="No description.", max_length=200)
    over_18 = models.BooleanField(default=False)
    tag = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return '%s.%d' % (self.name, self.tag)


class Subscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='group')