# Generated by Django 2.1.4 on 2019-05-20 18:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('branchposts', '0020_spread_created'),
    ]

    operations = [
        migrations.AddField(
            model_name='post',
            name='photos',
            field=models.ImageField(null=True, upload_to='photos'),
        ),
    ]
