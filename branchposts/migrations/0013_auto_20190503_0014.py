# Generated by Django 2.1.4 on 2019-05-02 21:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('branches', '0009_auto_20190320_1748'),
        ('branchposts', '0012_post_all_posted'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='post',
            name='all_posted',
        ),
        migrations.AddField(
            model_name='post',
            name='posted_to',
            field=models.ManyToManyField(related_name='posts_from_all', to='branches.Branch'),
        ),
    ]
