# Generated by Django 2.2.4 on 2019-08-22 13:43

import branchposts.models
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('branches', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Post',
            fields=[
                ('type', models.CharField(blank=True, choices=[('reply', 'Reply'), ('post', 'Post'), ('spread', 'Spread')], default='post', max_length=20, null=True)),
                ('id', models.BigIntegerField(default=branchposts.models.uuid_int, primary_key=True, serialize=False)),
                ('level', models.IntegerField(default=0, validators=[django.core.validators.MaxValueValidator(5), django.core.validators.MinValueValidator(0)])),
                ('text', models.TextField(blank=True, max_length=3000, null=True, verbose_name='Text')),
                ('hot_score', models.DecimalField(decimal_places=10, default=0.0, max_digits=19)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('updated', models.DateTimeField(auto_now=True)),
                ('posted', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='posts_from', to='branches.Branch')),
                ('posted_to', models.ManyToManyField(related_name='posts_from_all', to='branches.Branch')),
                ('poster', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='posts', to='branches.Branch')),
                ('replied_to', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='replies', to='branchposts.Post')),
            ],
            options={
                'ordering': ['-created'],
                'unique_together': {('posted', 'id')},
            },
        ),
        migrations.CreateModel(
            name='React',
            fields=[
                ('type', models.CharField(blank=True, choices=[('star', 'Star'), ('dislike', 'Dislike')], max_length=20, null=True)),
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('branch', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reacts', to='branches.Branch')),
                ('post', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reacts', to='branchposts.Post')),
            ],
            options={
                'unique_together': {('post', 'branch')},
            },
        ),
        migrations.CreateModel(
            name='Star',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('react', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='stars', to='branchposts.React')),
            ],
        ),
        migrations.CreateModel(
            name='Spread',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('branch', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='spreads', to='branches.Branch')),
                ('post', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='spreads', to='branchposts.Post')),
            ],
        ),
        migrations.CreateModel(
            name='PostVideo',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('height', models.IntegerField()),
                ('width', models.IntegerField()),
                ('thumbnail', models.ImageField(height_field='height', null=True, upload_to='thumbnails', width_field='width')),
                ('video', models.FileField(null=True, upload_to='static/videos')),
                ('post', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='videos', to='branchposts.Post')),
            ],
        ),
        migrations.CreateModel(
            name='PostImage',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('height', models.IntegerField()),
                ('width', models.IntegerField()),
                ('url', models.URLField(null=True)),
                ('image', models.ImageField(height_field='height', null=True, upload_to='static/images', width_field='width')),
                ('post', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='branchposts.Post')),
            ],
        ),
        migrations.CreateModel(
            name='Dislikes',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('react', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='dislikes', to='branchposts.React')),
            ],
        ),
    ]
