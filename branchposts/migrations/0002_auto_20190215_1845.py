# Generated by Django 2.1.4 on 2019-02-15 16:45

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('branchposts', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='post',
            options={'ordering': ['-created']},
        ),
        migrations.RenameField(
            model_name='post',
            old_name='created_at',
            new_name='created',
        ),
        migrations.RenameField(
            model_name='post',
            old_name='updated_at',
            new_name='updated',
        ),
    ]