from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid
import random
import string


def uid_generator(size=6, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))


class CommonUserTypeInfo(models.Model):
    url = models.CharField(unique=True, null=False, max_length=60)

    class Meta:
        abstract = True


class User(AbstractUser):

    class Meta:
        swappable = 'AUTH_USER_MODEL'
        db_table = 'auth_user'

    email = models.EmailField(unique=True)
    username = models.CharField(blank=True, null=True, max_length=150)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)

    def __str__(self):
        return '%s' % self.id

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']


class UserProfile(CommonUserTypeInfo):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='profile',
    )

    profile_image = models.ImageField(upload_to='images',
                                      default='images\default.jpeg',
                                      blank=False)
    fake_count = models.IntegerField(default=0)

    def __str__(self):
        return '%s' % self.user.id


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
        instance.profile.url = instance.id
        instance.profile.save()


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()


class FakeProfile(CommonUserTypeInfo):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)

    def save(self, *args, **kwargs):
        user = User.objects.get(id=self.user)
        user.fake_count += 1
        user.save()
        super(FakeProfile, self).save(*args, **kwargs)

    def __str__(self):
        return '%s' % self.user_id
