from django.db import models
from accounts.models import User

class BaseFeedback(models.Model):
    class Meta:
        abstract = True

    user = models.ForeignKey(User, on_delete=models.CASCADE,null=True,blank=True)
    email = models.EmailField(null=True,blank=True)

    def save(self, *args,**kwargs):
        if self.user:
            self.email = self.user.email
        super().save(*args, **kwargs)

class Feedback(BaseFeedback):
    subject = models.CharField(max_length=200, blank=False)
    details = models.TextField(max_length=3000, blank=False)
