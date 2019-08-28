# Generated by Django 2.1.4 on 2018-12-04 16:28

import django.contrib.auth.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0009_auto_20181204_0228'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='fakeprofile',
            name='url',
        ),
        migrations.AddField(
            model_name='userprofile',
            name='username',
            field=models.CharField(default='Anon', max_length=24),
        ),
    ]
