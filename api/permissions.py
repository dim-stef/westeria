from rest_framework import permissions
from branches.models import Branch
from branchchat.models import BranchChat


class IsOwnerOfPost(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        if request.method == 'GET':
            return True
        branches = request.user.owned_groups.all()
        for branch in branches:
            if branch.posts.all().filter(id=obj.id):
                return True
        return False


class IsOwnerOfReply(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        branches = request.user.owned_groups.all()
        for branch in branches:
            if branch.posts.all().filter(id=request.data['replies'][0]):
                return True
        return False


class IsOwnerOfBranch(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):

        lookup = 'branch__uri' if 'branch__uri' in request.resolver_match.kwargs else 'branch_uri'
        print(request.resolver_match.kwargs)
        branch = Branch.objects.get(uri=request.resolver_match.kwargs.get(lookup))
        if request.user.owned_groups.filter(uri=branch).exists():
            return True
        return False


class IsMemberOfChat(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        lookup_branch = 'branch__uri' if 'branch__uri' in request.resolver_match.kwargs else 'branch_uri'
        lookup_id = 'id__pk' if 'id__pk' in request.resolver_match.kwargs else 'id_pk'

        branch = Branch.objects.get(uri=request.resolver_match.kwargs.get(lookup_branch))
        branch_chat = BranchChat.objects.get(id=request.resolver_match.kwargs.get(lookup_id))
        if branch_chat.members.filter(uri=branch).exists():
            return True
        return False
