from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone
from uuid import uuid4


class Tag(models.Model):
    tag = models.UUIDField(primary_key=True, default=uuid4)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=255)
    content_object = GenericForeignKey('content_type', 'object_id')
