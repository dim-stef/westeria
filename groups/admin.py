from django.contrib import admin
from django import forms
from django.core.exceptions import ValidationError
from .models import Group, Subscription


class GroupAdminForm(forms.ModelForm):
    class Meta:
        model = Group
        fields = "__all__"

    def clean(self):
        super().clean()
        if self.instance in self.cleaned_data['parents'].all():
            raise ValidationError({"parents": "Cannot branch group to self"})
        for parent in self.cleaned_data['parents'].all():
            # In case of duplicate branch
            if self.instance in parent.children.all():
                raise ValidationError({"parents": "Your group has already branched group %s" % parent.name})
            # In case a parent tries to become a child to one of its children
            if self.instance in parent.parents.all():
                raise ValidationError({
                    "parents": "Cannot assign your group to %s as it is higher in the hierarchy" % parent.name})
            # In case a child tries to become a parent to one of its parents
            if parent in self.instance.parents.all():
                raise ValidationError({
                    "parents": "Cannot assign your group to %s as it is lower in the hierarchy" % parent.name})


class GroupAdmin(admin.ModelAdmin):
    form = GroupAdminForm
    filter_horizontal = ('parents',)


admin.site.register(Group, GroupAdmin)
admin.site.register(Subscription)
