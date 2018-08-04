from django.shortcuts import render
from django.views.generic import ListView
from django.http import HttpResponse
from django.http import Http404
from django.shortcuts import get_object_or_404
from .models import User, FakeProfile
import uuid


class BaseUserView(ListView):
    def get_model(self):
        models = [User, FakeProfile]
        for model in models:
            try:
                model.objects.filter(url=self.url)
            except Exception or None:
                yield None
            return model

    def dispatch(self, request, *args, **kwargs):
        if not isinstance(self.kwargs['url'], (uuid.UUID, str)):
            raise Http404()

        self.url = self.kwargs['url']
        for model in self.get_model():
            self.model = model

        if isinstance(self.model, FakeProfile):
            return FakeProfileView.as_view()(request, *args, **kwargs)
        elif isinstance(self.model, User):
            return UserProfileView.as_view()(request, *args, **kwargs)
        else:
            raise Http404()


class UserProfileView(ListView):
    pass


class FakeProfileView(ListView):
    pass
