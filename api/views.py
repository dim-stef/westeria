from django.contrib.auth import get_user_model
from rest_framework import viewsets, views, mixins
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination, PageNumberPagination, CursorPagination
from rest_framework_jwt.settings import api_settings
from rest_framework.parsers import MultiPartParser,JSONParser,FileUploadParser
from accounts.models import UserProfile
from branches.models import Branch
from branchchat.models import BranchChat, BranchMessage
from . import serializers

jwt_payload_handler = api_settings.JWT_PAYLOAD_HANDLER
jwt_encode_handler = api_settings.JWT_ENCODE_HANDLER


class CreateToken(views.APIView):

    def __init__(self):
        super(CreateToken, self).__init__()

    def get(self, request, format=None):
        user_instance = get_user_model().objects.get(id=request.user.id)

        payload = jwt_payload_handler(user_instance)
        token = jwt_encode_handler(payload)
        return Response({'token': token})


class ChildrenPagination(PageNumberPagination):
    page_size = 2
    page_size_query_param = 'page_size'
    max_page_size = 50


class ChildrenLimitOffsetPagination(LimitOffsetPagination):
    default_limit = 2
    max_limit = 10


class BranchChatMessagePagination(CursorPagination):
    page_size = 50


class UserViewSet(mixins.RetrieveModelMixin,
                  # mixins.DestroyModelMixin,
                  mixins.ListModelMixin,
                  viewsets.GenericViewSet):
    permission_classes = (permissions.IsAuthenticated,)
    def get_serializer_class(self):
        user = self.request.user
        if user.is_superuser:
            return serializers.UserAdminSerializer
        else:
            return serializers.UserSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = get_user_model().objects.filter(id=user.id)
        return queryset


class BranchPublicProfileSerializer(mixins.RetrieveModelMixin,
                         mixins.ListModelMixin,
                         viewsets.GenericViewSet):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchPublicProfileSerializer

    def get_queryset(self):
        branch = self.kwargs['pk']
        queryset = Branch.objects.filter(id=branch)
        return queryset


class OwnedBranchesViewSet(mixins.RetrieveModelMixin,
                         mixins.ListModelMixin,
                         viewsets.GenericViewSet):
    serializer_class = serializers.BranchSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = user.owned_groups.all()
        return queryset

class BranchViewSet(mixins.RetrieveModelMixin,
                    mixins.ListModelMixin,
                    viewsets.GenericViewSet,
                    ):
    lookup_value_regex = '(?i)[\w.@+-]+'
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchSerializer
    lookup_field = 'uri'

    def get_queryset(self):
        queryset = Branch.objects.none()
        if self.kwargs['uri']:
            queryset = Branch.objects.filter(uri__iexact=self.kwargs['uri'])
            print(queryset)
        return queryset


class BranchRootViewSet(viewsets.GenericViewSet,
                        mixins.ListModelMixin):
    serializer_class = serializers.BranchSerializer

    def get_queryset(self):
        queryset = Branch.objects.filter(name="ROOT", tag=None)
        return queryset


class ChildrenViewSet(viewsets.GenericViewSet,
                      mixins.RetrieveModelMixin,
                      mixins.ListModelMixin):
    lookup_value_regex = '(?i)[\w.@+-]+'
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchSerializer
    pagination_class = ChildrenLimitOffsetPagination

    def get_queryset(self):
        queryset = Branch.objects.none()
        if self.kwargs['nested_1_uri']:
            children = Branch.objects.get(uri__iexact=self.kwargs['nested_1_uri']).children.all()
            queryset = children
        return queryset

class ParentViewSet(viewsets.GenericViewSet,
                      mixins.RetrieveModelMixin,
                      mixins.ListModelMixin):
    lookup_value_regex = '(?i)[\w.@+-]+'
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchSerializer
    pagination_class = ChildrenLimitOffsetPagination

    def get_queryset(self):
        queryset = Branch.objects.none()
        if self.kwargs['nested_1_uri']:
            parents = Branch.objects.get(uri__iexact=self.kwargs['nested_1_uri']).parents.all()
            queryset = parents
        return queryset


class BranchUpdateViewSet(viewsets.GenericViewSet,
                          mixins.UpdateModelMixin,):
    lookup_field = 'uri'
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = serializers.BranchUpdateSerializer
    parser_classes = (MultiPartParser,JSONParser,FileUploadParser,)

    def partial_update(self,request, *args, **kwargs):
        print('request',request.data)
        instance = self.get_object()
        serializer = self.serializer_class(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)


    def get_queryset(self):
        try:
            queryset = Branch.objects.filter(owner=self.request.user,uri=self.kwargs['uri'])
        except Branch.DoesNotExist:
            queryset = Branch.objects.none()
        return queryset


class BranchChatViewSet(viewsets.GenericViewSet,
                        mixins.RetrieveModelMixin,
                        mixins.ListModelMixin):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchChatSerializer
    lookup_field = 'name'

    def get_queryset(self):
        queryset = BranchChat.objects.none()
        if self.kwargs['name']:
            branch = Branch.objects.get(uri__iexact=self.kwargs['nested_1_uri'])
            queryset = BranchChat.objects.filter(name__iexact=self.kwargs['branch'], branch=branch)
        return queryset


class BranchChatMessageViewSet(viewsets.GenericViewSet,
                               mixins.RetrieveModelMixin,
                               mixins.ListModelMixin):
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = serializers.BranchMessageSerializer
    pagination_class = BranchChatMessagePagination
    lookup_field = 'name'

    def get_queryset(self):
        print("in")
        queryset = BranchMessage.objects.none()
        if self.kwargs['nested_2_name']:
            branch = Branch.objects.get(uri__iexact=self.kwargs['nested_1_uri'])
            branch_chat = BranchChat.objects.get(name__iexact=self.kwargs['nested_2_name'], branch=branch)
            queryset = BranchMessage.objects.filter(branch_chat=branch_chat)
        return queryset
