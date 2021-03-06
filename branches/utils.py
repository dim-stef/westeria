from django.apps import apps


def generate_unique_uri(name, uri):
    url_safe_chars = ['.','_']
    Branch = apps.get_model('branches.Branch')

    if uri:
        # if uri is the default UUID it won't be iterable and will throw an exception on iteration
        try:
            url_safe_uri = ''.join(c for c in uri if c.isalpha() or c.isnumeric() or c in url_safe_chars)
        except TypeError:
            url_safe_uri = ''.join(c for c in name if c.isalpha() or c.isnumeric() or c in url_safe_chars)
    else:
        url_safe_uri = ''.join(c for c in name if c.isalpha() or c.isnumeric() or c in url_safe_chars)

    invalid_names = ['admin','api','all','tree','messages','notifications',
                     'settings','logout','login','register']
    branch_name = ''.join(url_safe_uri.split())
    tester = branch_name
    x = 0
    while Branch.objects.filter(uri__iexact=tester).exists() or branch_name in invalid_names:
        tester = branch_name
        tester = tester + str(x)
        x += 1
    return tester


def get_nodes_beneath(branch):
    '''
    Finds all branches beneath requested branch
    :return: List containing the branches
    '''
    def find_nodes_beneath(start, searched_nodes=[]):
        for node in start.children.all():
            if node not in searched_nodes:
                searched_nodes.append(node)
                find_nodes_beneath(node, searched_nodes)
        return searched_nodes

    nodes = find_nodes_beneath(branch)
    return nodes


def get_nodes_above(branch):
    '''
    Finds all branches above requested branch
    :return: List containing the branches
    '''
    def find_nodes_above(start, searched_nodes=[]):
        for node in start.parents.all():
            if node not in searched_nodes:
                searched_nodes.append(node)
                find_nodes_above(node, searched_nodes)
        return searched_nodes

    nodes = find_nodes_above(branch)
    return nodes


def get_tags_beneath(branch):
    beneath_branches = get_nodes_beneath(branch)
    GenericStringTaggedItem = apps.get_model('tags.GenericStringTaggedItem')
    tags = GenericStringTaggedItem.objects.none()
    for node in beneath_branches:
        tags |= GenericStringTaggedItem.objects.filter(tag__in=node.tags.all())
    return tags


def get_tags_above(branch):
    above_branches = get_nodes_above(branch)
    GenericStringTaggedItem = apps.get_model('tags.GenericStringTaggedItem')
    tags = GenericStringTaggedItem.objects.none()
    for node in above_branches:
        tags |= GenericStringTaggedItem.objects.filter(tag__in=node.tags.all())
    return tags


def get_all_related_tags(branch):
    tags = get_tags_above(branch) | get_tags_beneath(branch)
    return tags
