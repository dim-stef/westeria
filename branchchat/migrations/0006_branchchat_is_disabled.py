# Generated by Django 2.2.4 on 2020-02-28 00:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('branchchat', '0005_branchchat_icon'),
    ]

    operations = [
        migrations.AddField(
            model_name='branchchat',
            name='is_disabled',
            field=models.BooleanField(default=False),
        ),
    ]
