from django.forms import ModelForm, CharField
from django import forms
from branches.models import Branch

class BranchSettingsForm(ModelForm):
    class Meta:
        model = Branch
        fields  = ('branch_image','branch_banner','parents','name','accessibility','description','over_18')