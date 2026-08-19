from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    FitWise's user record.

    There is deliberately no separate "role" enum. The three roles from the
    spec map onto this model as:
      - NORMAL USER: any authenticated User (the default/base case)
      - COACH:       a User with is_coach=True, set only by an admin
                      approving a CoachApplication (see coaching app)
      - ADMIN:       a User with is_staff/is_superuser=True, using Django's
                      built-in admin

    A coach is always still a normal user underneath — every normal-user
    feature keeps working for them, exactly as the spec requires.
    """

    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)

    is_coach = models.BooleanField(
        default=False,
        help_text="Set automatically when an admin approves this user's CoachApplication.",
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self):
        return self.email

    @property
    def full_name(self) -> str:
        name = f"{self.first_name} {self.last_name}".strip()
        return name or self.email.split("@")[0]
