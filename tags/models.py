from django.db import models
from django.utils.translation import ugettext_lazy as _
from taggit.models import CommonGenericTaggedItemBase, TaggedItemBase, GenericUUIDTaggedItemBase


class GenericStringTaggedItem(GenericUUIDTaggedItemBase, TaggedItemBase):
    dummy = models.CharField(max_length=1, null=True, blank=True)


class GenericBigIntTaggedItem(CommonGenericTaggedItemBase, TaggedItemBase):
    object_id = models.BigIntegerField(verbose_name=_('Object id'), db_index=True)
