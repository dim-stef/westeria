from django.apps import apps


def generate_unique_uri(name):
    invalid_names = ['admin','api','all','tree','messages','notifications',
                     'settings','logout','login','register']
    Branch = apps.get_model('branches.Branch')
    branch_name = ''.join(name.split())
    tester = branch_name
    x = 0
    while Branch.objects.filter(uri_iexact=tester).exists() or branch_name in invalid_names:
        tester = branch_name
        tester = tester + str(x)
        x += 1
    return tester