# Generated by Django 2.1.4 on 2019-04-27 17:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('branchposts', '0009_auto_20190423_2047'),
    ]

    operations = [
        migrations.AddField(
            model_name='post',
            name='type',
            field=models.CharField(blank=True, choices=[('reply', 'Reply'), ('post', 'Post')], max_length=20, null=True),
        ),
    ]
