from django.views.generic.edit import UpdateView
from accounts.models import UserProfile
from .forms import SettingsUserProfileForm
from .mixins import AjaxFormMixin


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