# Generated by Django 2.1.4 on 2019-05-04 01:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('branchposts', '0013_auto_20190503_0014'),
    ]

    operations = [
        migrations.AddField(
            model_name='post',
            name='hot_score',
            field=models.DecimalField(decimal_places=10, default=0.0, max_digits=19),
            preserve_default=False,
        ),
    ]
