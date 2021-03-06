# Generated by Django 2.2.4 on 2019-09-07 15:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('branches', '0004_branch_icon'),
        ('branchposts', '0003_auto_20190905_0219'),
    ]

    operations = [
        migrations.AddField(
            model_name='spread',
            name='count',
            field=models.PositiveSmallIntegerField(default=0, max_length=50),
        ),
        migrations.AddField(
            model_name='spread',
            name='updated',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterUniqueTogether(
            name='spread',
            unique_together={('branch', 'post')},
        ),
    ]
