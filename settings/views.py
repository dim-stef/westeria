from django.views.generic.edit import UpdateView
from django.http import JsonResponse
from branches.models import Branch
from .forms import SettingsUserProfileForm
from .mixins import AjaxFormMixin


class SettingsUserProfileFormView(AjaxFormMixin, UpdateView):
    success_url = '/settings/'
    form_class = SettingsUserProfileForm
    model = Branch
    template_name = 'settings/settings.html'

    def get_object(self, queryset=None):
        obj = Branch.objects.get(user=self.request.user)
        return obj

    def form_invalid(self, form):
        print("invalid")
        if self.request.is_ajax():
            return JsonResponse(form.errors, safe=False, status=400)
        else:
            return super().form_invalid(form)

    def form_valid(self, form):
        print("valid")
        return super().form_valid(form)
    '''def get(self, request, *args, **kwargs):
        if not request.is_ajax():
            return HttpResponseRedirect(reverse("core:home"))
        return super().get(self)'''