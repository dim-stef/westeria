from django.test import TestCase
from .models import User
from django.contrib.auth import get_user_model
import uuid

# Create your tests here.


class UserTestCase(TestCase):

    def setup(self):
        User.objects.create_user(email="jimstef@outlook.com", password="stapapariamas99")

    def test_user(self):
        User.objects.filter(email="jimstef@outlook.com")