# Generated by Django 2.1.4 on 2019-04-06 17:33

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('branches', '0009_auto_20190320_1748'),
        ('branchposts', '0005_post_replies'),
    ]

    operations = [
        migrations.AddField(
            model_name='react',
            name='star',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='stars', to='branchposts.Post'),
        ),
        migrations.AlterUniqueTogether(
            name='react',
            unique_together={('post', 'branch')},
        ),
    ]