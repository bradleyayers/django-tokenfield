# -*- coding: utf-8 -*-
from attest import AssertImportHook, Tests

# Django's django.utils.module_loading.module_has_submodule is busted
AssertImportHook.disable()

from django.conf import settings

# It's important to configure prior to importing the tests, as some of them
# import Django's DB stuff.
settings.configure(
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    },
    INSTALLED_APPS = ['django_tokenfield']
)


from .field import fieldtests

everything = Tests([fieldtests])
