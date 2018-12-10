from django import forms
from allauth.account.forms import SignupForm
from .models import UserProfile
from branches.models import Branch
from random import randint

def unique_tag():
    while True:
        tag = randint(100, 999)
        if not Branch.objects.filter(tag=tag).exists():
            return tag

class CustomSignupForm(SignupForm):

    name = forms.CharField(max_length=24, label='name', required=True, widget=forms.TextInput(
                    attrs={
                        'placeholder': 'name'
                    }
    ))

    def save(self, request):
        user = super().save(request)
        profile_group = Branch.objects.create(owner=user, name=self.cleaned_data['name'], tag=unique_tag())
        UserProfile.objects.create(user=user,name=self.cleaned_data['name'], url=profile_group.uri)
        return user