from django.db.models.signals import m2m_changed
from django.core.exceptions import ValidationError
from branches.models import Branch


'''def parent_changed(instance, action, **kwargs):
    if action == "post_add":
        if instance in instance.parents.all():
            raise ValidationError({"parents": "Cannot branch group to self"})


m2m_changed.connect(parent_changed, sender=Group.parents.through, dispatch_uid="branches.signals.parent_changed")'''
