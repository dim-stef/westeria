# Generated by Django 2.2.4 on 2019-09-04 21:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('branches', '0003_auto_20190828_1835'),
    ]

    operations = [
        migrations.AddField(
            model_name='branch',
            name='icon',
            field=models.ImageField(blank=True, upload_to='images/group_images/icons'),
        ),
    ]
