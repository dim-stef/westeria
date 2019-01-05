from django.apps import apps


def generate_unique_uri(name):
    Branch = apps.get_model('branches.Branch')
    branch_name = ''.join(name.split())
    tester = branch_name
    x = 0
    while Branch.objects.filter(uri=tester).exists():
        tester = branch_name
        tester = tester + str(x)
        x += 1
    return tester