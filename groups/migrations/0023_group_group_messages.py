# Generated by Django 2.0 on 2018-11-06 14:51

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('groupchat', '0002_auto_20181106_0209'),
        ('groups', '0022_auto_20181105_1736'),
    ]

    operations = [
        migrations.AddField(
            model_name='group',
            name='group_messages',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='groupchat.GroupMessage'),
        ),
    ]