# Generated by Django 2.1.4 on 2019-05-02 19:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('branches', '0009_auto_20190320_1748'),
        ('branchposts', '0011_auto_20190427_2024'),
    ]

    operations = [
        migrations.AddField(
            model_name='post',
            name='all_posted',
            field=models.ManyToManyField(related_name='all_posts_from', to='branches.Branch'),
        ),
    ]
