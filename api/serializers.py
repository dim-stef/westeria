from django.contrib.auth import get_user_model
from rest_framework import serializers
from accounts.models import User
from branches.models import Branch, BranchRequest
from branchchat.models import BranchMessage, BranchChat
from branchposts.models import Post,React,Spread,PostImage,PostVideo
from datetime import datetime, timedelta
from math import log


epoch = datetime(1970, 1, 1)

def epoch_seconds(date):
    print(date,epoch)
    td = date - epoch
    return td.days * 86400 + td.seconds + (float(td.microseconds) / 1000000)

def score(ups, downs):
    return ups - downs

def hot(ups, date):
    s = ups
    order = log(max(abs(s), 1), 10)
    print(order)
    seconds = epoch_seconds(date) - 1134028003
    return round(order + seconds / 45000, 7)

class TokenSerializer(serializers.Serializer):
    token = serializers.CharField()

    def create(self, validated_data):
        pass

    def update(self, instance, validated_data):
        pass


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ['id', 'last_login', 'email', 'is_active', 'is_staff']
        read_only_fields = ['id', 'last_login', 'email', 'is_active', 'is_staff']


class UserAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = '__all__'


class BranchPublicProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['uri','name', 'branch_image']
        read_only_fields = ['uri','name', 'branch_image']


class OwnedBranchesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['uri','id']
        read_only_fields = ['uri','id']


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'owner', 'parents',
                  'parent_uri_field','followers_count','following_count',
                  'children', 'name', 'uri',
                  'children_uri_field','follows',
                  'followed_by', 'description',
                  'branch_image', 'branch_banner','default',
                  'post_context','spread_count','trending_score']
        read_only_fields = ['id', 'owner', 'parents',
                  'parent_uri_field','followers_count','following_count',
                  'children', 'name', 'uri',
                  'children_uri_field', 'follows',
                  'followed_by', 'description',
                  'branch_image', 'branch_banner', 'default','spread_count'
                  ,'trending_score']

    follows = serializers.StringRelatedField(many=True)
    followed_by = serializers.StringRelatedField(many=True)
    followers_count = serializers.SerializerMethodField('get_followed_by_count')
    following_count = serializers.SerializerMethodField()
    children_uri_field = serializers.SerializerMethodField('children_uri')
    parent_uri_field = serializers.SerializerMethodField('parents_uri')
    post_context = serializers.SerializerMethodField()
    spread_count = serializers.SerializerMethodField()


    def get_post_context(self,branch):
        if 'post' in self.context:
            return self.context['post']
        else:
            return None

    def get_spread_count(self,branch):
        if 'post' in self.context:
            return branch.spreads.filter(post=self.context['post']).count()
        else:
            return 0

    def get_followed_by_count(self,branch):
        return branch.followed_by.count()

    def get_following_count(self,branch):
        return branch.follows.count()

    def children_uri(self, branch):
        children = []
        for child in branch.children.all():
            children.append(child.uri)
        return children

    def parents_uri(self, branch):
        parents = []
        for parent in branch.parents.all():
            parents.append(parent.uri)
        return parents

class BranchUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ('branch_image', 'branch_banner', 'parents', 'name', 'accessibility', 'description', 'over_18')

class BranchAddFollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ('follows',)

    def update(self, instance, validated_data):
        if 'follows' in validated_data:
            new_follow = validated_data.pop('follows',None)
            instance.follows.add(*new_follow)
        return super().update(instance, validated_data)

class BranchRemoveFollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ('follows',)

    def update(self, instance, validated_data):
        if 'follows' in validated_data:
            new_follow = validated_data.pop('follows',None)
            instance.follows.remove(*new_follow)
        return super().update(instance, validated_data)

class AddReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ('replies',)

    def update(self, instance, validated_data):
        if 'replies' in validated_data:
            new_reply = validated_data.pop('replies',None)
            instance.replies.add(*new_reply)
        return super().update(instance, validated_data)

class RemoveReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ('replies',)

    def update(self, instance, validated_data):
        if 'replies' in validated_data:
            new_reply = validated_data.pop('replies',None)
            instance.replies.remove(*new_reply)
        return super().update(instance, validated_data)

class BranchChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchChat
        fields = ['id', 'type', 'name', 'branch']
        branch_messages = serializers.SerializerMethodField('branch_message')

    def branch_message(self, branchchat):
        messages = []
        for message in branchchat.messages.all():
            messages.append(message.message)
        return messages


class BranchMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchMessage
        fields = ['author', 'author_name', 'author_url', 'message', 'created', 'updated', 'branch_chat']

    author_name = serializers.SerializerMethodField('author_name_field')
    author_url = serializers.SerializerMethodField('author_url_field')

    def author_name_field(self, branchmessage):
        try:
            return branchmessage.author.name
        except AttributeError:
            return '[deleted]'

    def author_url_field(self, branchmessage):
        try:
            return branchmessage.author.uri
        except AttributeError:
            return 'deleted'


class PostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model=PostImage
        fields='__all__'
        read_only_fields = ['post']


class PostVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model=PostVideo
        fields='__all__'
        read_only_fields = ['post']

from moviepy.editor import VideoFileClip
import os
import base64
from random import random
from random import uniform
from PIL import Image
import tempfile
from django.core.files.uploadedfile import InMemoryUploadedFile
from uuid import uuid4
import io
import sys
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.images import ImageFile
from django.core.files import File

class NewPostSerializer(serializers.ModelSerializer):
    replied_to = serializers.PrimaryKeyRelatedField(queryset=Post.objects.all(),required=False)
    images = PostImageSerializer(many=True)
    videos = PostVideoSerializer(many=True)

    def generate_thumbnail(self,file):
        '''with tempfile.TemporaryFile() as tmp:
            # Do stuff with tmp
            tmp.write(file.read())
            print(tmp)
            # Clean up a NamedTemporaryFile on your own
            # delete=True means the file will be deleted on close
            tmp = tempfile.NamedTemporaryFile(delete=True)
            try:
                # do stuff with temp
                clip = VideoFileClip(tmp.name)
                thumbnail = os.path.join(file.name, "thumbnail.png")
                clip.save_frame(thumbnail, t=random.uniform(0.1, clip.duration))
                img = Image.open(thumbnail)
                return img
            finally:
                tmp.close()  # deletes the file'''
        _id = uuid4()
        path = 'C:\\Users\\Dimitris\\Desktop\\tmp\\%s' % _id
        with open(path, 'ab+') as f:
            f.write(file.read())
            clip = VideoFileClip(f.name)
            thumbnail = os.path.join('%s.png' % path)
            clip.save_frame(thumbnail, t=uniform(0.1, clip.duration))
            #img = Image.open(thumbnail)
            #img.thumbnail((220, 130), Image.ANTIALIAS)
            #output = BytesIO()
            #img.save(output,format='PNG', quality=85)

            image_file = ImageFile(open(thumbnail, 'rb'))
            image_file.name = "%s.png" % str(_id)
            #image_file = File(open(thumbnail, 'rb'))
            print("image file",image_file)

            '''output.seek(0)
            return InMemoryUploadedFile(output, 'ImageField',
                                        str(_id),
                                        'image/png',
                                        len(output.getvalue()), None)'''
            clip.close()
            return image_file

    def create(self, validated_data):
        request = self.context['request']
        posted_to = validated_data.pop('posted_to')

        # files are not accessible in validated data, use request.FILES instead
        validated_data.pop('images')
        validated_data.pop('videos')

        if not validated_data['text'] and not request.FILES:
            raise serializers.ValidationError('text and media are None')
        post = Post.objects.create(**validated_data)
        for branch in posted_to:
            post.posted_to.add(branch)

        if post.replied_to:
            level = post.replied_to.level + 1
            post.level = level
            post.save()


        print("files",type(request.FILES))
        if 'images' in request.FILES:
            for image_data in request.FILES.getlist('images'):
                print(image_data)
                PostImage.objects.create(post=post, image=image_data)

        if 'videos' in request.FILES:
            for video_data in request.FILES.getlist('videos'):
                print(video_data)
                thumbnail = self.generate_thumbnail(video_data)
                PostVideo.objects.create(post=post, video=video_data, thumbnail=thumbnail)

        return post

    class Meta:
        model = Post
        fields = ('id','type','poster','posted','posted_to','replied_to','text','level','images','videos')
        read_only_fields = ('id','poster','level')


class BranchPostSerializer2(serializers.ModelSerializer):
    poster = serializers.StringRelatedField()
    posted = serializers.StringRelatedField()
    posted_to = serializers.SerializerMethodField()
    poster_name = serializers.SerializerMethodField('poster_name_field')
    poster_id = serializers.SerializerMethodField()
    posted_name = serializers.SerializerMethodField('posted_name_field')
    spreaders = serializers.SerializerMethodField()
    posted_id = serializers.SerializerMethodField()
    stars = serializers.SerializerMethodField()
    replied_to = serializers.SerializerMethodField()
    replies_count = serializers.SerializerMethodField()
    spreads_count = serializers.SerializerMethodField()

    def get_posted_to_uri(self,post):
        uri_list = []
        for branch in post.posted_to.all():
            uri_list.append(branch.uri)
        return uri_list

    def get_posted_to(self,post):
        posted_to = post.posted_to.all()
        return BranchSerializer(posted_to,many=True).data

    def poster_picture_field(self,post):
        return post.poster.branch_image.url

    def poster_banner_field(self,post):
        return post.poster.branch_banner.url

    def poster_name_field(self,post):
        return post.poster.name

    def get_poster_id(self,post):
        return post.poster.id

    def posted_picture_field(self,post):
        return post.posted.branch_image.url

    def posted_banner_field(self,post):
        return post.posted.branch_banner.url

    def posted_name_field(self,post):
        return post.posted.name

    def get_posted_id(self,post):
        return post.posted.id

    def get_stars(self,post):
        return post.reacts.filter(type="star").count()

    def get_replied_to(self,post):
        if post.type == "reply":
            return {
                'uri':post.replied_to.poster.uri,
                'id':post.replied_to.id
            }
        else:
            return None

    def get_replies_count(self,post):
        def count_comments(post):
                count = post.replies.count()
                for reply in post.replies.all():
                    count += count_comments(reply)
                return count
        return count_comments(post)

    def get_spreads_count(self,post):
        return post.spreads.count()

    def get_images(self,post):
        #return [i.image.url for i in post.images.all()]
        return PostImageSerializer(post.images.all(), many=True).data

    def get_videos(self,post):
        return PostVideoSerializer(post.videos.all(), many=True).data

    def get_thumbnails(self,post):
        return [i.thumbnail.url for i in post.videos.all()]

    def get_spreaders(self,post):
        spreads = post.spreads.filter(branch__in=self.context['spreaders']).distinct('branch')
        context = {"post": post.id}
        branches = []
        for spread in spreads:
            branches.append(spread.branch)
        return BranchSerializer(branches,many=True,context=context).data

    class Meta:
        model = Post
        fields = ('spreaders','id','posted','posted_id','posted_name','poster','poster_id','poster_name',
                  'posted_to','text','type',
                  'created','updated',
                  'replied_to','replies','replies_count','spreads_count',
                  'level','stars','hot_score')
        read_only_fields = ('level',)

class BranchPostSerializer(serializers.ModelSerializer):
    poster = serializers.StringRelatedField()
    posted = serializers.StringRelatedField()
    posted_to = serializers.SerializerMethodField()
    poster_picture = serializers.SerializerMethodField('poster_picture_field')
    poster_banner = serializers.SerializerMethodField('poster_banner_field')
    poster_name = serializers.SerializerMethodField('poster_name_field')
    poster_id = serializers.SerializerMethodField()
    posted_picture = serializers.SerializerMethodField('posted_picture_field')
    posted_banner = serializers.SerializerMethodField('posted_banner_field')
    posted_name = serializers.SerializerMethodField('posted_name_field')
    spreaders = serializers.SerializerMethodField()
    posted_id = serializers.SerializerMethodField()
    stars = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    videos = serializers.SerializerMethodField()
    thumbnails = serializers.SerializerMethodField()
    replied_to = serializers.SerializerMethodField()
    replies_count = serializers.SerializerMethodField()
    spreads_count = serializers.SerializerMethodField()

    def get_posted_to_uri(self,post):
        uri_list = []
        for branch in post.posted_to.all():
            uri_list.append(branch.uri)
        return uri_list

    def get_posted_to(self,post):
        posted_to = post.posted_to.all()
        return BranchSerializer(posted_to,many=True).data

    def poster_picture_field(self,post):
        return post.poster.branch_image.url

    def poster_banner_field(self,post):
        return post.poster.branch_banner.url

    def poster_name_field(self,post):
        return post.poster.name

    def get_poster_id(self,post):
        return post.poster.id

    def posted_picture_field(self,post):
        return post.posted.branch_image.url

    def posted_banner_field(self,post):
        return post.posted.branch_banner.url

    def posted_name_field(self,post):
        return post.posted.name

    def get_posted_id(self,post):
        return post.posted.id

    def get_stars(self,post):
        return post.reacts.filter(type="star").count()

    def get_replied_to(self,post):
        if post.type == "reply":
            return {
                'uri':post.replied_to.poster.uri,
                'id':post.replied_to.id
            }
        else:
            return None

    def get_replies_count(self,post):
        def count_comments(post):
                count = post.replies.count()
                for reply in post.replies.all():
                    count += count_comments(reply)
                return count
        return count_comments(post)

    def get_spreads_count(self,post):
        return post.spreads.count()

    def get_images(self,post):
        #return [i.image.url for i in post.images.all()]
        return PostImageSerializer(post.images.all(), many=True).data

    def get_videos(self,post):
        return PostVideoSerializer(post.videos.all(), many=True).data

    def get_thumbnails(self,post):
        return [i.thumbnail.url for i in post.videos.all()]

    def get_spreaders(self,post):
        spreads = post.spreads.filter(branch__in=self.context['spreaders']).distinct('branch')
        context = {"post": post.id}
        branches = []
        for spread in spreads:
            branches.append(spread.branch)
        return BranchSerializer(branches,many=True,context=context).data

    class Meta:
        model = Post
        fields = ('spreaders','id','posted','posted_id','posted_name','poster','poster_id','poster_name',
                  'posted_to','text','type',
                  'created','updated','poster_picture','poster_banner',
                  'posted_picture','posted_banner',
                  'replied_to','replies','replies_count','spreads_count',
                  'level','stars','hot_score','images','videos','thumbnails')
        read_only_fields = ('level',)


class FollowSerializer(serializers.ModelSerializer):
    follows = serializers.StringRelatedField(many=True)
    followed_by = serializers.StringRelatedField(many=True)

    class Meta:
        model = Branch
        fields = ['follows', 'followed_by']
        read_only_fields = ['follows', 'followed_by']


class NewFollowSerializer(serializers.ModelSerializer):
    follows = serializers.StringRelatedField(many=True)

    class Meta:
        model = Branch
        fields = ['follows']


class CreateBranchRequestSerializer(serializers.ModelSerializer):

    class Meta:
        model = BranchRequest
        fields = '__all__'
        read_only_fields = ['id','status','request_from']


class UpdateBranchRequestSerializer(serializers.ModelSerializer):

    class Meta:
        model = BranchRequest
        fields = ['status',]


class BranchRequestSerializer(serializers.ModelSerializer):
    request_to = BranchSerializer(read_only=True)
    request_from = BranchSerializer(read_only=True)

    class Meta:
        model = BranchRequest
        fields = '__all__'


class ReactSerializer(serializers.ModelSerializer):

    class Meta:
        model = React
        fields = ('type','branch','post','id')
        read_only_fields = ('id',)


class NewSpreadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Spread
        fields = '__all__'
        read_only_fields = ('id','branch')


class GenericNotificationRelatedField(serializers.RelatedField):
    def to_representation(self, value):
        if isinstance(value, Branch):
            serializer = BranchSerializer(value)

        return serializer.data


class NotificationSerializer(serializers.Serializer):
    recipient = UserSerializer(User,read_only=True)
    unread = serializers.BooleanField(read_only=True)
    description = serializers.CharField()
    target = GenericNotificationRelatedField(read_only=True)
    actor = GenericNotificationRelatedField(read_only=True)
    id = serializers.IntegerField()