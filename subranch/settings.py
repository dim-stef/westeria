"""
Django settings for subranch project.

Generated by 'django-admin startproject' using Django 2.0.

For more information on this file, see
https://docs.djangoproject.com/en/2.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/2.0/ref/settings/
"""

import os
import datetime
from google.oauth2 import service_account
from .settings_secret import *
# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/2.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

ACCOUNT_AUTHENTICATION_METHOD = "email"
ACCOUNT_USER_EMAIL_FIELD = "email"
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_UNIQUE_EMAIL = True

ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_USER_MODEL_USERNAME_FIELD = None


AUTH_USER_MODEL = 'accounts.User'

LOGIN_URL = "/accounts/login"
LOGIN_REDIRECT_URL = "/"
LOGOUT_REDIRECT_URL = "/accounts/signup"

#ACCOUNT_SIGNUP_FORM_CLASS = 'accounts.forms.SignupForm'
ACCOUNT_FORMS = {'signup':'accounts.forms.CustomSignupForm'}

REST_AUTH_REGISTER_SERIALIZERS = {
        'REGISTER_SERIALIZER': 'accounts.serializers.RegistrationSerializer',
}

REST_USE_JWT = True
OLD_PASSWORD_FIELD_ENABLED = True
LOGOUT_ON_PASSWORD_CHANGE = False

JWT_AUTH = {
    'JWT_EXPIRATION_DELTA': datetime.timedelta(days=7),
}

#DEFAULT_FILE_STORAGE = 'storages.backends.gcloud.GoogleCloudStorage'
DEFAULT_FILE_STORAGE = 'subranch.storage_backends.MediaStorage'
GS_BUCKET_NAME = 'subranch_bucket_test'

GS_CREDENTIALS = service_account.Credentials.from_service_account_file(
    os.path.join(BASE_DIR, 'subranch','credentials.json')
)

###
AWS_IS_GZIPPED = True
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=0',
}

AWS_S3_CALLING_FORMAT = 'boto.s3.connection.OrdinaryCallingFormat'
AWS_LOCATION = 'static'
STATIC_URL = 'https://%s/%s/' % (AWS_S3_CUSTOM_DOMAIN, AWS_LOCATION)
#STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
###

ASGI_APPLICATION = "subranch.routing.application"
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}

PWA_APP_NAME = 'Subranch'
PWA_APP_DESCRIPTION = "My app description"
PWA_APP_THEME_COLOR = '#ffffff'
PWA_APP_BACKGROUND_COLOR = '#ffffff'
PWA_APP_DISPLAY = 'standalone'
PWA_APP_SCOPE = '/',
PWA_APP_ORIENTATION = 'any'
PWA_APP_START_URL = '/'
PWA_SERVICE_WORKER_PATH = os.path.join(BASE_DIR, 'common', 'static','js', 'sw.js')
PWA_APP_ICONS = [
        {
            'src': '/static/apple-touch-icon.png',
            'sizes': '180x180'
        }
    ]
PWA_APP_SPLASH_SCREEN = [
        {
            'src': '/static/apple-touch-icon.png',
            'media': '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)'
        }
    ]
PWA_APP_DIR = 'ltr'
PWA_APP_LANG = 'en-US'

# Application definition

INSTALLED_APPS = [
    'django.contrib.sites',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.postgres',
    'django_filters',
    'widget_tweaks',
    'django_extensions',
    'annoying',
    'channels',
    'api',
    'react',
    'core',
    'branches',
    'branchchat',
    'branchsettings',
    'branchposts',
    'tags',
    'feedback',
    'settings',
    'notifications',
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_nested',
    'rest_framework_swagger',
    'rest_auth',
    'rest_auth.registration',
    'taggit',
    'taggit_serializer',
    'webpack_loader',
    'allauth',
    'accounts',
    'allauth.account',
    'allauth.socialaccount',
    'push_notifications',
]

SITE_ID = 2
TAGGIT_CASE_INSENSITIVE = True

MIDDLEWARE = [
    'django.middleware.gzip.GZipMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'subranch.urls'

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

'''
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_USE_TLS = True
EMAIL_HOST = 'mail.privateemail.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = 'contact@subranch.com'
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER'''


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'accounts', 'templates'),
            os.path.join(BASE_DIR, 'react', 'src'),
            os.path.join(BASE_DIR, 'common'),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

AUTHENTICATION_BACKENDS = (
    # Needed to login by username in Django admin, regardless of `allauth`
    'django.contrib.auth.backends.ModelBackend',

    #`allauth` specific authentication methods, such as login by e-mail
    'allauth.account.auth_backends.AuthenticationBackend',
)

WSGI_APPLICATION = 'subranch.wsgi.application'

REST_FRAMEWORK = {

    # Use Django's standard `django.contrib.auth` permissions,
    # or allow read-only access for unauthenticated users.
    'DEFAULT_SCHEMA_CLASS': 'rest_framework.schemas.coreapi.AutoSchema',
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.JSONParser'
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework_jwt.authentication.JSONWebTokenAuthentication',
        'rest_framework.authentication.BasicAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.NamespaceVersioning'
}

# Password validation
# https://docs.djangoproject.com/en/2.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/2.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.0/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR,'static')
MEDIA_URL = '/upload/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'upload')

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'react','dist'),
    os.path.join(BASE_DIR, 'common'),
    os.path.join(BASE_DIR, 'common', 'static'),
]



