from django import forms
from django.forms import ValidationError
from django.core.exceptions import NON_FIELD_ERRORS
from .models import Group


class GroupForm(forms.ModelForm):
    class Meta:
        model = Group
        exclude = ['owner', 'id', 'tag']

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user')
        super().__init__(*args, **kwargs)

    def clean(self):
        super().clean()
        if Group.objects.filter(owner=self.user, name=self.cleaned_data['name']).exists():
            self.add_error("name", "You already have a group named %s" % self.cleaned_data['name'])


class GroupBranchForm(forms.ModelForm):
    class Meta:
        model = Group
        fields = ['id']

    def clean(self):
        super().clean()
        if self.cleaned_data['parents'] in self.parents.all():
            raise ValidationError({'sameGroup': ["same group"]})
