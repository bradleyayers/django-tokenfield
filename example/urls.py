# -*- coding: utf-8 -*-
from django.conf.urls.defaults import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns


urlpatterns = staticfiles_urlpatterns() + patterns('',
    url(r'^$', 'example.views.example', name='example'),
)
