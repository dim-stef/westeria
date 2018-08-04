from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.views.generic.edit import UpdateView
from accounts.models import UserProfile
from .forms import SettingsUserProfileForm
from .mixins import AjaxFormMixin



def settings(request):
    if request.method == 'GET':
        return render(request, 'settings/settings.html')


class SettingsUserProfileFormView(AjaxFormMixin, UpdateView):
    success_url = '/settings/'
    form_class = SettingsUserProfileForm
    model = UserProfile
    template_name = 'settings/settings.html'

    def get_object(self, queryset=None):
        obj = UserProfile.objects.get(user=self.request.user)
        return obj

    '''def get(self, request, *args, **kwargs):
        if not request.is_ajax():
            return HttpResponseRedirect(reverse("core:home"))
        return super().get(self)'''