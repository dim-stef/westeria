from django.db import models
from django.contrib.auth.models import AbstractUser
from accounts.models import User
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

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_groups')
    parents = models.ManyToManyField('self', blank=True, symmetrical=False, related_name="children")
    name = models.CharField(blank=False, null=False, default='unnamed', max_length=30)
    accessibility = models.CharField(default=PUBLIC, choices=ACCESSIBILITY, max_length=2)
    description = models.TextField(blank=False, null=False, default="No description.", max_length=200)
    over_18 = models.BooleanField(default=False)
    tag = models.IntegerField(blank=True, null=True)
    uri = models.CharField(blank=False, null=False, default=uuid.uuid4, max_length=60)

    '''@property
    def uri(self):
        if self.tag:
            return '%s.%d' % (self.name, self.tag)
        else:
            return '%s' % self.name'''

    def __str__(self):
        return self.uri

    def save(self, *args, **kwargs):
        if self.tag:
            self.uri = '%s.%d' % (self.name, self.tag)
        else:
            self.uri = '%s' % self.name
        super().save(*args, **kwargs)


class GroupMessage(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    user = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    message = models.TextField(max_length=300)
    message_html = models.TextField()
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.message


class Subscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='group')
