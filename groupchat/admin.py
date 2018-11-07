from django.contrib import admin
from .models import GroupMessage, GroupChat


class GroupMessageInline(admin.TabularInline):
    model = GroupMessage


class GroupChatAdmin(admin.ModelAdmin):
    inlines = [
        GroupMessageInline,
    ]


admin.site.register(GroupChat, GroupChatAdmin)
admin.site.register(GroupMessage)
