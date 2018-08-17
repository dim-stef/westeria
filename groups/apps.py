from django.apps import AppConfig


class GroupsConfig(AppConfig):
    name = 'groups'

    def ready(self):
        # noinspection PyUnresolvedReferences
        import groups.signals
