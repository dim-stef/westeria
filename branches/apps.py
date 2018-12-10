from django.apps import AppConfig


class GroupsConfig(AppConfig):
    name = 'branches'

    def ready(self):
        # noinspection PyUnresolvedReferences
        import branches.signals
