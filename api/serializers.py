from django.contrib.auth import get_user_model
from django.core.files.images import ImageFile
from django.db.models import Sum, Count
from django.core import serializers as ser
import channels.layers
from asgiref.sync import async_to_sync
from rest_framework import serializers
from rest_framework import viewsets, views, mixins,generics,filters,permissions,status
from rest_framework.response import Response
from accounts.models import User, UserProfile
from branches.models import Branch, BranchRequest
from branchchat.models import BranchMessage, BranchChat, ChatImage,ChatVideo,ChatRequest
from branchposts.models import Post,React,Spread,PostImage,PostVideo
from notifications.models import Notification
from datetime import datetime, timedelta
from moviepy.editor import VideoFileClip
import os
from random import uniform
from uuid import uuid4
import json
from datetime import datetime, timedelta
import math


temp_path = os.path.join(os.path.expanduser('~'), 'temp_thumbnails')

def generate_thumbnail(file):
    _id = uuid4()
    path = os.path.join(temp_path,str(_id))
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
        clip.close()
        return image_file

class TokenSerializer(serializers.Serializer):
    token = serializers.CharField()

    def create(self, validated_data):
        pass

    def update(self, instance, validated_data):
        pass


class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    def get_profile(self,user):
        return UserProfileSerializer(user.profile).data

    class Meta:
        model = get_user_model()
        fields = ['id', 'last_login', 'email', 'is_active', 'is_staff','profile']
        read_only_fields = ['id', 'last_login', 'email', 'is_active', 'is_staff','profile']


class UserAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
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
                  'parent_uri_field','followers_count','following_count','branch_count',
                  'children', 'name', 'uri','sibling_count','children_count','parent_count',
                  'children_uri_field','follows',
                  'followed_by', 'description',
                  'branch_image', 'branch_banner','default',
                  'post_context','spread_count','last_day_spread_count']
        read_only_fields = ['id', 'owner', 'parents',
                  'parent_uri_field','followers_count','following_count',
                  'children', 'name', 'uri','sibling_count','children_count','parent_count',
                  'children_uri_field', 'follows',
                  'followed_by', 'description',
                  'branch_image', 'branch_banner', 'default','spread_count'
                  ,'last_day_spread_count']

    follows = serializers.StringRelatedField(many=True)
    followed_by = serializers.StringRelatedField(many=True)
    followers_count = serializers.SerializerMethodField('get_followed_by_count')
    following_count = serializers.SerializerMethodField()
    branch_count = serializers.SerializerMethodField()
    sibling_count = serializers.SerializerMethodField()
    parent_count = serializers.SerializerMethodField()
    children_count = serializers.SerializerMethodField()
    last_day_spread_count = serializers.SerializerMethodField()
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
            return branch.spreads.filter(post=self.context['post']).aggregate(Sum('times'))['times__sum']
        else:
            return 0

    def get_last_day_spread_count(self,branch):
        last_day = datetime.today() - timedelta(days=1)
        '''branches = Branch.objects.filter(posts_from_all__spreads__updated__gte=last_day,
                                         posts__spreads__updated__gte=last_day) \
            .aggregate(Sum('posts_from_all__spreads__times'))'''
        dd = branch.posts_from_all.filter(spreads__updated__gte=last_day).aggregate(Sum('spreads__times'))['spreads__times__sum']
        return dd

    def get_followed_by_count(self,branch):
        return branch.followed_by.count()

    def get_following_count(self,branch):
        return branch.follows.count()

    def get_branch_count(self,branch):
        return branch.children.count() + branch.parents.count()

    def get_sibling_count(self,branch):
        parents = Branch.objects.get(uri__iexact=branch.uri).parents.all()
        siblings = Branch.objects.filter(parents__in=parents) \
            .exclude(uri__iexact=branch.uri) \
            .distinct().count()
        return siblings

    def get_parent_count(self,branch):
        return branch.parents.count()

    def get_children_count(self,branch):
        return branch.children.count()

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

from branches.utils import generate_unique_uri
from rest_framework.exceptions import APIException

class APIException400(APIException):
    status_code = 400

class BranchUpdateSerializer(serializers.ModelSerializer):

    def update(self, instance, validated_data):
        uri = validated_data.pop('uri')
        if uri and uri != instance.uri:
            validated_uri = generate_unique_uri(uri)
            instance.uri = validated_uri

        name = validated_data.pop('name')
        if name:
            if instance.owner.owned_groups.filter(name=name).exists() and instance.name != name:
                raise APIException400("You already own a branch with this name")
            else:
                instance.name = name
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    class Meta:
        model = Branch
        fields = ('branch_image', 'branch_banner', 'parents',
                  'name', 'uri', 'accessibility', 'description', 'over_18','default')

class CreateNewBranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ('owner','branch_image', 'branch_banner',
                  'name', 'uri', 'accessibility', 'description', 'default')
        read_only_fields = ('owner','accessibility',)

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

class ChatImageSerializer(serializers.ModelSerializer):
    class Meta:
        model=ChatImage
        fields='__all__'


class ChatVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model=ChatVideo
        fields='__all__'


class BranchChatSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField()
    members = serializers.StringRelatedField(many=True)

    class Meta:
        model = BranchChat
        fields = ['id', 'name', 'owner','members','latest_message','image','personal']


class ChatRequestWithRoomSerializer(serializers.ModelSerializer):
    branch_chat = serializers.SerializerMethodField()

    def get_branch_chat(self,request):
        return BranchChatSerializer(request.branch_chat).data

    class Meta:
        model = ChatRequest
        fields = ['branch_chat','request_from','request_to','status','id']
        read_only_fields = ['branch_chat','request_from','request_to']


class CreateChatRequestSerializer(serializers.ModelSerializer):

    class Meta:
        model = ChatRequest
        fields = ['branch_chat','request_from','request_to','status','id']
        read_only_fields = ['request_from','status']


class BranchMessageSerializer(serializers.ModelSerializer):
    images = ChatImageSerializer(many=True)
    videos = ChatVideoSerializer(many=True)
    author_name = serializers.SerializerMethodField('author_name_field')
    author_url = serializers.SerializerMethodField('author_url_field')

    class Meta:
        model = BranchMessage
        fields = ['author', 'author_name', 'author_url',
                  'message', 'created', 'updated', 'branch_chat','images','videos','id']

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



def create_message(instance):
    serialized_images = ser.serialize('python', instance.images.all())

    image_dict = [{
        'image':image_obj.image.url,
        'width':image_obj.width,
        'height':image_obj.height
    } for image_obj in instance.images.all()]
    json_images = json.dumps(image_dict)

    video_dict = [{
        'video': video_obj.video.url,
        'thumbnail': video_obj.thumbnail.url,
        'width':video_obj.width,
        'height':video_obj.height
    } for video_obj in instance.videos.all()]
    json_videos = json.dumps(video_dict)

    channel_layer = channels.layers.get_channel_layer()
    if instance.images.count() > 0 or instance.videos.count() > 0:
        async_to_sync(channel_layer.group_send)(
            str('chat_%s' % str(instance.branch_chat.id)),
            {
                'type': 'chat.message',
                'author_name': instance.author.name,
                'author_url': instance.author.uri,
                'author': str(instance.author.id),
                'created': str(instance.created),
                'message': instance.message,
                'message_id':instance.id,
                'images': json_images,
                'videos': json_videos
            }
        )

class NewMessageSerializer(serializers.ModelSerializer):
    images = ChatImageSerializer(many=True,required=False)
    videos = ChatVideoSerializer(many=True,required=False)
    author_name = serializers.SerializerMethodField()
    author_url = serializers.SerializerMethodField()

    def get_author_name(self,message):
        return message.author.name

    def get_author_url(self,message):
        return message.author.uri


    def create(self, validated_data):
        request = self.context['request']
        branch_chat = self.context['branch_chat']
        if not branch_chat.members.filter(uri=validated_data['author']).exists():
            raise serializers.ValidationError('Not member of chat')

        # files are not accessible in validated data, use request.FILES instead
        '''validated_data.pop('images')
        validated_data.pop('videos')'''

        if not validated_data['message'] and not request.FILES:
            raise serializers.ValidationError('message and media are None')
        message = BranchMessage.objects.create(**validated_data)

        if 'images' in request.FILES:
            for image_data in request.FILES.getlist('images'):
                print(image_data)
                ChatImage.objects.create(branch_message=message,image=image_data)

        if 'videos' in request.FILES:
            for video_data in request.FILES.getlist('videos'):
                print(video_data)
                thumbnail = generate_thumbnail(video_data)
                ChatVideo.objects.create(branch_message=message, video=video_data, thumbnail=thumbnail)

        # send message to websocket
        create_message(message)
        return message

    class Meta:
        model = BranchMessage
        fields = '__all__'
        read_only_fields = ('id','author_name','author_url')

class NewPostSerializer(serializers.ModelSerializer):
    replied_to = serializers.PrimaryKeyRelatedField(queryset=Post.objects.all(),required=False)
    images = PostImageSerializer(many=True,required=False)
    videos = PostVideoSerializer(many=True,required=False)

    def create(self, validated_data):
        print("got this fat")
        request = self.context['request']
        branch_uri = self.context['branch_uri']
        required_posted_to = request.user.owned_groups.get(uri=branch_uri)
        posted_to = validated_data.pop('posted_to')

        # files are not accessible in validated data, use request.FILES instead
        '''validated_data.pop('images')
        validated_data.pop('videos')'''

        if not validated_data['text'] and not validated_data['text'].isspace() and not request.FILES:
            raise serializers.ValidationError('text and media are None')

        post = Post.objects.create(**validated_data)

        if post.replied_to:
            level = post.replied_to.level + 1
            post.level = level
            post.save()
        else:
            for branch in posted_to:
                post.posted_to.add(branch)

        post.posted_to.add(required_posted_to)

        print("files",type(request.FILES))
        if 'images' in request.FILES:
            for image_data in request.FILES.getlist('images'):
                print(image_data)
                PostImage.objects.create(post=post, image=image_data)

        if 'videos' in request.FILES:
            for video_data in request.FILES.getlist('videos'):
                print(video_data)
                thumbnail = generate_thumbnail(video_data)
                PostVideo.objects.create(post=post, video=video_data, thumbnail=thumbnail)

        return post

    class Meta:
        model = Post
        fields = ('id','type','poster','posted','posted_to','replied_to','text','level','images','videos')
        read_only_fields = ('id','poster','level')


class BranchPostSerializer(serializers.ModelSerializer):
    poster = serializers.StringRelatedField()
    posted = serializers.StringRelatedField()
    posted_to = serializers.SerializerMethodField()
    poster_picture = serializers.SerializerMethodField('poster_picture_field')
    poster_banner = serializers.SerializerMethodField('poster_banner_field')
    poster_name = serializers.SerializerMethodField('poster_name_field')
    poster_id = serializers.SerializerMethodField()
    poster_description = serializers.SerializerMethodField()
    posted_picture = serializers.SerializerMethodField('posted_picture_field')
    posted_banner = serializers.SerializerMethodField('posted_banner_field')
    posted_name = serializers.SerializerMethodField('posted_name_field')
    spreaders = serializers.SerializerMethodField()
    posted_id = serializers.SerializerMethodField()
    stars = serializers.SerializerMethodField()
    dislikes = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    videos = serializers.SerializerMethodField()
    thumbnails = serializers.SerializerMethodField()
    replied_to = serializers.SerializerMethodField()
    replies_count = serializers.SerializerMethodField()
    spreads_count = serializers.SerializerMethodField()
    matches = serializers.SerializerMethodField()
    engagement = serializers.SerializerMethodField()

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

    def get_poster_description(self,post):
        return post.poster.description

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

    def get_dislikes(self,post):
        return post.reacts.filter(type="dislike").count()

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
        return post.spreads.aggregate(Sum('times'))['times__sum']

    def get_images(self,post):
        #return [i.image.url for i in post.images.all()]
        return PostImageSerializer(post.images.all(), many=True).data

    def get_videos(self,post):
        return PostVideoSerializer(post.videos.all(), many=True).data

    def get_thumbnails(self,post):
        return [i.thumbnail.url for i in post.videos.all()]

    def get_spreaders(self,post):
        if 'spreaders' in self.context:
            spreads = post.spreads.filter(branch__in=self.context['spreaders']).distinct('branch')
            context = {"post": post.id}
            branches = []
            for spread in spreads:
                if spread.times > 0:
                    branches.append({
                        'branch': BranchSerializer(spread.branch,context=context).data,
                        'times': spread.times,
                        'id':spread.id
                    })
            return branches
        return []

    def get_matches(self,post):
        if 'matches' in self.context:
            for match in self.context['matches']:
                if post.poster in match['nodes']:
                    return {
                        'from':match['root'],
                        'to':post.poster,
                        'nodes':match['nodes']
                    }

                for posted_to in post.posted_to.all():
                    if posted_to.uri in match['nodes']:
                        return {
                            'from':match['root'],
                            'to': posted_to.uri,
                            'nodes':match['nodes']
                        }
            return {
                    'from':None,
                    'to': None,
                    'nodes':[]
                }
        else:
            return {
                    'from':None,
                    'to': None,
                    'nodes':[]
                }

    def get_engagement(self, post):
        difference = post.reacts.filter(type="star").count() - post.reacts.filter(type="dislike").count()
        react_sum = post.reacts.filter(type="star").count() + post.reacts.filter(type="dislike").count()
        print(post.reacts.all())
        if difference <= 0:
            ratio = -1
        else:
            ratio = 1

        # add 1 in case of difference being 1
        like_score_selector = difference + 1

        print("react",react_sum)
        if ratio == 1:
            like_score = math.log(max(react_sum + 1, 1) * 10, 10)
        else:
            like_score = math.log(max(react_sum + 1, 1) * 20, 20)

        print(like_score)
        comment_score = math.log(max(post.replies.count(), 3), 3) * like_score
        order = comment_score
        return order

    class Meta:
        model = Post
        fields = ('spreaders','id','posted','posted_id','posted_name','poster','poster_id','poster_name',
                  'poster_description','posted_to','text','type',
                  'created','updated','poster_picture','poster_banner',
                  'posted_picture','posted_banner','description',
                  'replied_to','replies','replies_count','spreads_count',
                  'level','stars','dislikes','hot_score','images','videos','thumbnails','matches','engagement')
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


class UpdateSpreadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Spread
        fields = '__all__'
        read_only_fields = ('id','branch','post','created','updated')


class GenericNotificationRelatedField(serializers.RelatedField):
    def to_representation(self, value):
        print(value)
        if isinstance(value, Branch):
            serializer = BranchSerializer(value)
        elif isinstance(value, BranchRequest):
            serializer = BranchRequestSerializer(value)
        elif isinstance(value,Post):
            serializer = BranchPostSerializer(value)
        elif isinstance(value,BranchMessage):
            serializer = BranchMessageSerializer(value)
        elif isinstance(value,ChatRequest):
            serializer = ChatRequestWithRoomSerializer(value)
        return serializer.data


class NotificationSerializer(serializers.Serializer):
    recipient = UserSerializer(User,read_only=True)
    unread = serializers.BooleanField(read_only=True)
    description = serializers.CharField()
    verb = serializers.CharField()
    timestamp = serializers.CharField()
    target = GenericNotificationRelatedField(read_only=True)
    actor = GenericNotificationRelatedField(read_only=True)
    action_object = GenericNotificationRelatedField(read_only=True)
    id = serializers.IntegerField()