from django.contrib import admin
from django import forms
from .models import Post, React, Star, Spread, PostImage

class PostAdminForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = "__all__"

class PostAdmin(admin.ModelAdmin):
    form = PostAdminForm
    filter_horizontal = ('posted_to',)

admin.site.register(Post,PostAdmin)
admin.site.register(React)
admin.site.register(Star)
admin.site.register(Spread)
admin.site.register(PostImage)