from django import forms
from django.forms import ValidationError
from django.core.exceptions import NON_FIELD_ERRORS
from .models import Group


class GroupForm(forms.ModelForm):
    class Meta:
        model = Group
        exclude = ['owner', 'id', 'tag']

        error_messages = {
            NON_FIELD_ERRORS: {
                'unique_together': "You already have a group named %(name).",
            }
        }
