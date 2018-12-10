from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import User, UserProfile
import uuid


class BranchChat(models.Model):
    class Meta:
        unique_together = ('branch', 'name')

    BRANCH = 'BR'
    LEAF = 'LF'
    TYPES = (
        (BRANCH, 'Branch'),
        (LEAF, 'Leaf'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)
    type = models.CharField(default=BRANCH, choices=TYPES, max_length=2)
    name = models.CharField(default="general", blank=False, null=False, max_length=25)
    branch = models.ForeignKey('branches.Branch', null=True, on_delete=models.CASCADE, related_name="chat")

    def __str__(self):
        return '%s - %s' % (self.name, self.branch)


class BranchMessage(models.Model):
    branch_chat = models.ForeignKey(BranchChat, null=True, on_delete=models.CASCADE, related_name="messages")
    author = models.ForeignKey("branches.Branch", null=True, on_delete=models.SET_NULL)
    message = models.TextField(max_length=300)
    message_html = models.TextField()
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.message


@receiver(post_save, sender=BranchMessage)
def create_group_chat(sender, instance, created, **kwargs):
    if created:
        print(instance.branch_chat.id)