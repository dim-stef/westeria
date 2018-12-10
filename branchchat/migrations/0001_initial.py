# Generated by Django 2.1.4 on 2018-12-06 21:01

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('accounts', '0015_auto_20181206_1933'),
        ('branches', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='BranchChat',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('type', models.CharField(choices=[('BR', 'Branch'), ('LF', 'Leaf')], default='BR', max_length=2)),
                ('name', models.CharField(default='general', max_length=25)),
                ('branch', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='chat', to='branches.Branch')),
            ],
        ),
        migrations.CreateModel(
            name='BranchMessage',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message', models.TextField(max_length=300)),
                ('message_html', models.TextField()),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('updated', models.DateTimeField(auto_now=True)),
                ('author', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='accounts.UserProfile')),
                ('branch_chat', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='branchchat.BranchChat')),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='branchchat',
            unique_together={('branch', 'name')},
        ),
    ]
