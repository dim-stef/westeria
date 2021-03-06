from django.contrib import admin
from .models import BranchMessage, BranchChat,ChatImage,ChatVideo,ChatRequest


class GroupMessageInline(admin.TabularInline):
    model = BranchMessage


class GroupChatAdmin(admin.ModelAdmin):
    filter_horizontal = ('members',)


admin.site.register(BranchChat, GroupChatAdmin)
admin.site.register(BranchMessage)
admin.site.register(ChatImage)
admin.site.register(ChatVideo)
admin.site.register(ChatRequest)
