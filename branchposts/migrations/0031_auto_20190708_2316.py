# Generated by Django 2.1.4 on 2019-07-08 20:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('branchposts', '0030_postimage_url'),
    ]

    operations = [
        migrations.AlterField(
            model_name='postimage',
            name='image',
            field=models.ImageField(height_field='height', null=True, upload_to='static/images', width_field='width'),
        ),
        migrations.AlterField(
            model_name='postvideo',
            name='video',
            field=models.FileField(null=True, upload_to='static/videos'),
        ),
    ]