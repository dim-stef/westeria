# Generated by Django 2.0 on 2018-11-06 19:58

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('groupchat', '0005_auto_20181106_2143'),
    ]

    operations = [
        migrations.AlterField(
            model_name='groupchat',
            name='group',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='chat', to='groups.Group'),
        ),
    ]
