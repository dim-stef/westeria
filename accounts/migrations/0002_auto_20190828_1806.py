# Generated by Django 2.2.4 on 2019-08-28 15:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='dummy',
            field=models.CharField(blank=True, max_length=2, null=True),
        ),
    ]
