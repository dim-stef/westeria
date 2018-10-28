from django.views.generic import TemplateView


class CoreView(TemplateView):
    def dispatch(self, *args, **kwargs):
        if self.request.user.is_authenticated:
            self.template_name = "core/content.html"
        else:
            self.template_name = "core/content_anon.html"
        return super().dispatch(*args, **kwargs)


class GoogleView(TemplateView):
    template_name = "core/google0677b618caac6923.html"
