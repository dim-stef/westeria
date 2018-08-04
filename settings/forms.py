from django.forms import ModelForm, CharField
from django import forms
from accounts.models import User, UserProfile


class SettingsUserProfileForm(ModelForm):

    class Meta:
        model = UserProfile
        exclude = ['user', 'fake_count']
