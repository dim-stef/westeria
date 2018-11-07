from django.views.generic.edit import FormView
from django.views.generic import ListView, DetailView
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.http import JsonResponse
from django.http import Http404
from .models import Group
from .forms import GroupForm
from .mixins import AjaxFormMixin
from random import randint


def unique_tag():
    while True:
        tag = randint(100, 999)
        if not Group.objects.filter(tag=tag).exists():
            return tag


class GroupFormView(FormView):
    success_url = '/creategroup/'
    form_class = GroupForm
    model = Group
    template_name = "groups/creategroup.html"

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs.update({'user': self.request.user})
        return kwargs

    def form_valid(self, form):
        group = form.save(commit=False)
        group.owner = self.request.user
        group.tag = unique_tag()
        group.save()
        '''group = form.save(commit=False)
        if Group.objects.filter(name=group.name).count() is 100:
            data = {
                'error': "Too many groups with the same name"
            }
            return JsonResponse(data)
        group.owner = self.request.user
        group.tag = unique_tag()

        try:
            group.save()
        except ValidationError:
            data = {
                'error': "You already have a group named '%s'" % group.name
            }
            return JsonResponse(data, safe=False, status=400)'''

        if self.request.is_ajax():
            print(form.cleaned_data)
            data = {
                'success': "Successfully submitted form data."
            }
            return JsonResponse(data)
        else:
            return super().form_valid(form)

    def form_invalid(self, form):
        if self.request.is_ajax():
            return JsonResponse(form.errors, safe=False, status=400)
        else:
            return super().form_invalid(form)

    def get(self, request, *args, **kwargs):
        if not request.is_ajax():
            return HttpResponseRedirect(reverse("core:home"))
        return super().get(self)


class GroupTreeView(ListView):
    model = Group
    template_name = "groups/tree.html"

    def get(self, request, *args, **kwargs):
        if 'uri' in kwargs:
            if not Group.objects.filter(uri__exact=kwargs['uri']).exists():
                if Group.objects.filter(uri__iexact=kwargs['uri']).exists():
                    return HttpResponseRedirect(Group.objects.get(uri__iexact=kwargs['uri']).uri)
                else:
                    raise Http404()
        return super().get(self)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if 'uri' in self.kwargs:
            context['group'] = Group.objects.get(uri__exact=self.kwargs['uri'])
        else:
            context['group'] = Group.objects.get(uri__exact='global')
        return context


class GroupView(ListView):
    model = Group
    template_name = "groups/index.html"
    group = Group.objects.none()

    def get_queryset(self):
        nametag = self.kwargs['uri']
        if Group.objects.filter(name__iexact=nametag).exists():
            self.group = Group.objects.filter(name__iexact=nametag)
        else:
            name = nametag[:-4]
            tag = nametag[-3:]
            if tag.isnumeric():
                self.group = Group.objects.filter(name__iexact=name, tag=tag)
        if self.group:
            return self.group
        else:
            raise Http404

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['group'] = self.group.first()
        print(context['group'])
        return context
