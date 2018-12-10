from django.shortcuts import render
from django.utils.safestring import mark_safe
import json


def indexgeneral(request, uri):
    return render(request, 'groupchat/index.html', {})


def index(request, uri, room_name):
    return render(request, 'groupchat/index.html', {})
