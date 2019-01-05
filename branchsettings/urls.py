from django.urls import path
from .views import BranchSettingsFormView

urlpatterns = [
    path('settings/<str:branch_name>/', BranchSettingsFormView.as_view())
]