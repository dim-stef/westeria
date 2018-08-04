from django.http import JsonResponse
from django.http import HttpResponse
from django.http import JsonResponse
from django.db import IntegrityError
from abc import ABCMeta, abstractmethod


class AjaxFormMixin(object):

    def form_invalid(self, form):
        if self.request.is_ajax():
            return JsonResponse(form.errors, status=400)
        else:
            return super(AjaxFormMixin, self).form_invalid(form)

