from django.http import JsonResponse
from abc import ABCMeta, abstractmethod


class AjaxFormMixin(object):

    def form_invalid(self, form):
        if self.request.is_ajax():
            return JsonResponse(form.errors, status=400)
        else:
            return super(AjaxFormMixin, self).form_invalid(form)

    def form_valid(self, form):

        profile = form.save(commit=False)
        profile.user = self.request.user
        profile.profile_image = form.cleaned_data['profile_image']

        profile.save()

        if self.request.is_ajax():
            print(form.cleaned_data)
            data = {
                'message': "Successfully submitted form data."
            }
            return JsonResponse(data)
        else:
            return super(AjaxFormMixin, self).form_valid(form)