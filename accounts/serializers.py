from rest_framework import serializers
from allauth.account.adapter import get_adapter
from allauth.account import app_settings as allauth_settings
from allauth.utils import email_address_exists
from allauth.account.utils import setup_user_email
from django.utils.translation import ugettext_lazy as _
from branches.models import Branch


class RegistrationSerializer(serializers.Serializer):
    name = serializers.CharField(allow_blank=False,allow_null=False,max_length=30,required=True)
    email = serializers.EmailField(required=allauth_settings.EMAIL_REQUIRED)
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    def validate_email(self, email):
        email = get_adapter().clean_email(email)
        if allauth_settings.UNIQUE_EMAIL:
            if email and email_address_exists(email):
                raise serializers.ValidationError(
                    _("A user is already registered with this e-mail address."))
        return email

    def validate_password1(self, password):
        return get_adapter().clean_password(password)

    def validate(self, data):
        if data['password1'] != data['password2']:
            raise serializers.ValidationError(_("The two password fields didn't match."))
        return data

    def custom_signup(self, request, user):
        name = self.validated_data.get('name')
        Branch.objects.create(owner=user, type=Branch.TYPE.USER, name=name, default=True)

    def get_cleaned_data(self):
        return {
            'password1': self.validated_data.get('password1', ''),
            'email': self.validated_data.get('email', '')
        }

    def save(self, request):
        adapter = get_adapter()
        user = adapter.new_user(request)
        self.cleaned_data = self.get_cleaned_data()
        adapter.save_user(request, user, self)
        self.custom_signup(request, user)
        setup_user_email(request, user, [])
        return user