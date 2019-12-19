from rest_framework import serializers
from django.db import models
from django.db.models import Count
from django.core.exceptions import ObjectDoesNotExist
from branchchat.models import ChatRequest,BranchChat
from branches.models import Branch
from feedback.models import Feedback
from api import serializers as serializers_v0
from notifications.models import Notification


class ChatRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatRequest
        fields = '__all__'
        read_only_fields = ['branch_chat','request_from','request_to']


class NewChatRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchChat
        fields = ['image','name','members','owner']
        read_only_fields = ['owner']

    def create(self, validated_data):
        room_owner = self.context['owner']
        members = validated_data.pop('members')
        new_room = BranchChat.objects.create(**validated_data)

        for member in members:
            if room_owner.owner.owned_groups.filter(pk=member.pk).exists():
                new_room.members.add(member)
            else:
                if member is not room_owner:
                    request = ChatRequest.objects.create(status=ChatRequest.STATUS_ON_HOLD,
                                               branch_chat=new_room,
                                               request_from=room_owner,
                                               request_to=member)
        return new_room

class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['subject','details','email']

class FeedbackWithUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['subject','details','user']
        read_only_fields = ['user']


class PathSerializer(serializers.ListSerializer):
    def to_representation(self, data):
        print(data)
        iterable = data.all() if isinstance(data, models.Manager) else data

        return {
            kwdGroup: super().to_representation(Branch.objects.filter(kwdGroup=kwdGroup))
            for kwdGroup in Branch.objects.all()
        }

import itertools,random
from collections import OrderedDict


class BranchPathSerializer(serializers.ModelSerializer):
    paths = serializers.SerializerMethodField()

    def get_paths(self,branch):
        branch_to_param = self.context.get('request').query_params.get('to')
        branch_from_param = self.context.get('request').query_params.get('from')

        try:
            branch_to = Branch.objects.get(uri__iexact = branch_to_param)
        except ObjectDoesNotExist:
            return None

        try:
            branch_from = Branch.objects.get(uri__iexact=branch_from_param)
        except ObjectDoesNotExist:
            branch_from = Branch.objects.none()

        def find_parent_paths(start, path=[]):
            '''
            Finds all paths from a nodes parents and beyond to exhaustion
            :param start: Starting node
            :param path: Should not be populated
            :return: List containing the paths
            '''
            path = path + [start]
            if not start.parents.count():
                return [path]
            paths = []
            for node in start.parents.all():
                if node not in path:
                    newpaths = find_parent_paths(node, path)
                    for newpath in newpaths:
                        paths.append(newpath)
            return paths or [path]

        def find_children_paths(start, path=[]):
            '''
            Finds all paths from a nodes children and beyond to exhaustion
            :param start: Starting node
            :param path: Should not be populated
            :return: List containing the paths
            '''
            path = path + [start]
            if not start.children.count():
                return [path]
            paths = []
            for node in start.children.all():
                if node not in path:
                    newpaths = find_children_paths(node, path)
                    for newpath in newpaths:
                        paths.append(newpath)
            return paths or [path]

        def find_all_paths(start, end, path=[]):
            '''
            Finds all paths between 2 nodes
            :param start: Starting node
            :param end: Ending node
            :param path: Should not be populated
            :return: List containing the paths
            '''
            path = path + [start]
            if start == end:
                return [path]
            paths = []
            for node in start.children.all():
                if node not in path:
                    newpaths = find_all_paths(node, end, path)
                    for newpath in newpaths:
                        paths.append(newpath)
            return paths or [path]

        def find_nodes_beneath(start, searched_nodes=[]):
            for node in start.children.all():
                if node not in searched_nodes:
                    searched_nodes.append(node)
                    find_nodes_beneath(node, searched_nodes)
            return searched_nodes

        try:
            if not branch_from:
                left = find_parent_paths(branch_to)
                for i, path in enumerate(left):
                    left[i].reverse()
            else:
                left = find_all_paths(branch_from,branch_to)
            right = find_children_paths(branch_to)
            # fill both lists with the same amount of values in order to combine them 1-1 later
            # try except block is there in case of len(list) == 0

            while len(right) > len(left):
                try:
                    left.append(left[random.randrange(0, len(left))])
                except ValueError:
                    pass
            while len(left) > len(right):
                try:
                    right.append(right[random.randrange(0, len(right))])
                except ValueError:
                    pass

            data = []
            for l, r in zip(left, right):
                # exclude first item from the right list
                # because it is the same as the last item from the left list

                if not branch_from:
                    # if starting branch is not defined show 5 branches before and after the desired branch
                    # to simulate a "path"

                    data.append(l[:5] + r[1:5])
                else:
                    # if starting branch is defined we need the whole left path as is
                    # but also show 5 children just for visual presentation

                    data.append(l + r[1:5])

            sorted_data = list()

            for sublist in data:
                if sublist not in sorted_data:
                    sorted_data.append(sublist)
            for path in sorted_data:
                for i, branch in enumerate(path):
                    path[i] = serializers_v0.BranchSerializer(branch).data
            return sorted_data
        except RecursionError:
            return None

    class Meta:
        model = Branch
        fields = ('uri', 'name', 'paths')


class BranchNodesBeneathSerializer(serializers.ModelSerializer):
    nodes = serializers.SerializerMethodField()

    def get_nodes(self, branch):
        def find_nodes_beneath(start, searched_nodes=[]):
            for node in start.children.all():
                if node not in searched_nodes:
                    searched_nodes.append(node)
                    find_nodes_beneath(node, searched_nodes)
            return searched_nodes

        nodes = find_nodes_beneath(branch)
        nodes = sorted(nodes, key=lambda node: node.followed_by.count(), reverse=True)
        data = serializers_v0.BranchSerializer(nodes, many=True).data
        return data

    class Meta:
        model = Branch
        fields = ('uri', 'name', 'nodes',)
