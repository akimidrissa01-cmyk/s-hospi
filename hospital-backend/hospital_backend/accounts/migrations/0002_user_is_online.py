# Generated migration for adding is_online field to User model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_online',
            field=models.BooleanField(default=False, help_text='Indique si le médecin est actuellement en ligne'),
        ),
    ]

