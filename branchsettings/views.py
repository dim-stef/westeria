from django.shortcuts import get_object_or_404
from django.views.generic.edit import UpdateView
from django.http import JsonResponse
from branches.models import Branch

class BranchSettingsFormView(UpdateView):
    model = Branch
    template_name = "templates/index.html"
    fields = ('branch_image','branch_banner','parents','name','accessibility','description','over_18')

    def get_object(self, queryset=None):
        branch_name = self.kwargs['branch_name']
        branch = get_object_or_404(Branch, owner=self.request.user, name=branch_name)
        return branch
