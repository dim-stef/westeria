from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    path('sw.js', TemplateView.as_view(template_name="templates/sw.js", content_type='application/javascript'),
         name='sw.js'),
    path('firebase-messaging-sw.js', TemplateView.as_view(template_name="templates/firebase-messaging-sw.js",
                                                          content_type='application/javascript'),
                                                          name='firebase-messaging-sw.js'),
]