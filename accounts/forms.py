from django import forms
from allauth.account.forms import SignupForm
from .models import UserProfile
from branches.models import Branch

class CustomSignupForm(SignupForm):

    name = forms.CharField(max_length=24, label='name', required=True, widget=forms.TextInput(
                    attrs={
                        'placeholder': 'name'
                    }
    ))

    def save(self, request):
        user = super().save(request)
        Branch.objects.create(owner=user, name=self.cleaned_data['name'], default=True)
        return user