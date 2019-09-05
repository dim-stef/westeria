# Generated by Django 2.2.4 on 2019-09-04 23:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('branchposts', '0002_postimage_original_image'),
    ]

    operations = [
        migrations.AlterField(
            model_name='postimage',
            name='image',
            field=models.ImageField(blank=True, height_field='height', null=True, upload_to='static/images', width_field='width'),
        ),
        migrations.AlterField(
            model_name='postimage',
            name='original_image',
            field=models.ImageField(blank=True, height_field='height', null=True, upload_to='static/original_images', width_field='width'),
        ),
    ]
