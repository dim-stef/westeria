# Generated by Django 2.1.4 on 2019-05-08 00:39

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('branchposts', '0016_auto_20190508_0323'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='post',
            name='replies',
        ),
        migrations.AddField(
            model_name='post',
            name='replied_to',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='replies', to='branchposts.Post'),
        ),
    ]