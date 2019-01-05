from django.views.generic import TemplateView


class CoreView(TemplateView):
    def dispatch(self, *args, **kwargs):
        self.template_name = "core/content.html"
        return super().dispatch(*args, **kwargs)


class GoogleView(TemplateView):
    template_name = "core/google0677b618caac6923.html"
