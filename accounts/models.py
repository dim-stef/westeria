from django.db import models
from django.contrib.auth.models import AbstractUser
from annoying.fields import AutoOneToOneField
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid
import random
import string


def uid_generator(size=6, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))

class User(AbstractUser):
    class Meta:
        swappable = 'AUTH_USER_MODEL'
        db_table = 'auth_user'

    username = models.CharField(blank=True, null=True, unique=False, max_length=24)
    email = models.EmailField(unique=True)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)
    dummy = models.CharField(blank=True,null=True,max_length=2)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    def __str__(self):
        return '%s' % self.email

class UserProfile(models.Model):
    user = AutoOneToOneField(User, on_delete=models.CASCADE,related_name='profile')
    has_seen_tour = models.BooleanField(default=False)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)


