from django.contrib import admin
from .models import BranchMessage, BranchChat


class GroupMessageInline(admin.TabularInline):
    model = BranchMessage


class GroupChatAdmin(admin.ModelAdmin):
    inlines = [
        GroupMessageInline,
    ]

    filter_horizontal = ('members',)


admin.site.register(BranchChat, GroupChatAdmin)
admin.site.register(BranchMessage)
