# Generated by Django 2.0 on 2018-10-30 22:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('groups', '0019_auto_20181031_0022'),
    ]

    operations = [
        migrations.AlterField(
            model_name='groupmessage',
            name='group_banner',
            field=models.ImageField(default='images/group_banners/default.jpeg', upload_to='images/group_banners'),
        ),
    ]