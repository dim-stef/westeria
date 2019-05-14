from django.contrib import admin
from django import forms
from django.core.exceptions import ValidationError
from branchchat.models import BranchChat
from .models import Branch,BranchRequest


class GroupChatInline(admin.TabularInline):
    model = BranchChat


class GroupAdminForm(forms.ModelForm):
    class Meta:
        model = Branch
        fields = "__all__"
        exclude = ['id']

    def clean(self):
        super().clean()
        if self.instance in self.cleaned_data['parents'].all():
            raise ValidationError({"parents": "Cannot branch group to self"})
        for parent in self.cleaned_data['parents'].all():
            # In case of duplicate branch
            '''if self.instance in parent.children.all():
                raise ValidationError({"parents": "Your group has already branched group %s" % parent.name})'''
            # In case a parent tries to become a child to one of its children
            if self.instance in parent.parents.all():
                raise ValidationError({
                    "parents": "Cannot assign your group to %s as it is higher in the hierarchy" % parent.name})
            # In case a child tries to become a parent to one of its parents
            '''if parent in self.instance.parents.all():
                raise ValidationError({
                    "parents": "Cannot assign your group to %s as it is lower in the hierarchy" % parent.name})'''


class GroupAdmin(admin.ModelAdmin):
    inlines = [
        GroupChatInline,
    ]
    form = GroupAdminForm
    filter_horizontal = ('parents','follows',)


admin.site.register(Branch, GroupAdmin)
admin.site.register(BranchRequest)
