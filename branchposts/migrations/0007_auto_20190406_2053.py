# Generated by Django 2.1.4 on 2019-04-06 17:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('branchposts', '0006_auto_20190406_2033'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='react',
            name='star',
        ),
        migrations.AddField(
            model_name='react',
            name='type',
            field=models.CharField(blank=True, choices=[('star', 'Star')], max_length=20, null=True),
        ),
    ]
