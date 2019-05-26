from django.contrib.auth import get_user_model
from rest_framework import serializers
from accounts.models import User
from branches.models import Branch, BranchRequest
from branchchat.models import BranchMessage, BranchChat
from branchposts.models import Post,React,Spread,PostImage
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
                  'post_context','spread_count']
        read_only_fields = ['id', 'owner', 'parents',
                  'parent_uri_field','followers_count','following_count',
                  'children', 'name', 'uri',
                  'children_uri_field', 'follows',
                  'followed_by', 'description',
                  'branch_image', 'branch_banner', 'default','spread_count']

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


class NewPostSerializer(serializers.ModelSerializer):
    replied_to = serializers.PrimaryKeyRelatedField(queryset=Post.objects.all(),required=False)
    images = PostImageSerializer(many=True)

    def create(self, validated_data):
        posted_to = validated_data.pop('posted_to')
        validated_data.pop('images') # files are not accessible in validated data, use request.FILES instead
        post = Post.objects.create(**validated_data)
        for branch in posted_to:
            post.posted_to.add(branch)

        if post.replied_to:
            level = post.replied_to.level + 1
            post.level = level
            post.save()

        request = self.context['request']
        print("files",type(request.FILES))
        if 'images' in request.FILES:
            for image_data in request.FILES.getlist('images'):
                print(image_data)
                PostImage.objects.create(post=post, image=image_data)
        return post

    class Meta:
        model = Post
        fields = ('id','type','poster','posted','posted_to','replied_to','text','level','images')
        read_only_fields = ('id','poster','level')


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
        return [i.image.url for i in post.images.all()]

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
                  'replies','replies_count','spreads_count','level','stars','hot_score','images')
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