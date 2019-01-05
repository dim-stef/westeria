from django.contrib import admin
from django.contrib.auth.models import Permission
from django.contrib.auth.admin import UserAdmin
from .models import User, UserProfile
from django import forms
from django.contrib.admin.widgets import FilteredSelectMultiple


class CustomUserAdminForm(forms.ModelForm):

    class Meta:
        model = User
        fields = ('email','password','first_name','last_name','date_joined','is_superuser','is_staff'
                  ,'groups','permissions','last_login','is_active','id')

    permissions = forms.ModelMultipleChoiceField(
        Permission.objects.all(),
        widget=FilteredSelectMultiple("permissions", is_stacked=False),required=False)


class CustomUserAdmin(admin.ModelAdmin):
    form = CustomUserAdminForm


class UserProfileAdmin(admin.ModelAdmin):
    pass


admin.site.register(User, CustomUserAdmin)
admin.site.register(UserProfile, UserProfileAdmin)
admin.site.register(Permission)
