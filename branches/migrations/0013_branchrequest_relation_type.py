# Generated by Django 2.1.4 on 2019-05-24 00:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('branches', '0012_auto_20190517_1723'),
    ]

    operations = [
        migrations.AddField(
            model_name='branchrequest',
            name='relation_type',
            field=models.CharField(blank=True, choices=[('parent', 'Parent'), ('child', 'Child')], max_length=20, null=True),
        ),
    ]