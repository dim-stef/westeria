from django.db import models
from django.contrib.auth.models import AbstractUser
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

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    def __str__(self):
        return '%s' % self.email


'''@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
        instance.profile.url = instance.id
        instance.profile.save()'''


'''@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()'''