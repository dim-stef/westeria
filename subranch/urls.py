from django.contrib import admin
from django.urls import path, include
from django.views.defaults import page_not_found
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('rest-auth/', include('rest_auth.urls')),
    path('rest-auth/registration/', include('rest_auth.registration.urls')),
    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),
    path('accounts/', include('accounts.urls')),
    path('email/', page_not_found, name="accounts_email", kwargs={'exception': Exception('Page not Found')}),
    path('api/', include('api.urls')),
    path('drf/', include('rest_framework.urls')),
    path('', include('core.urls')),
    path('', include('settings.urls')),
    path('', include('branches.urls')),
    path('', include('branchsettings.urls')),
    path('u/', include('accounts.urls'))
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)