==============================================================
django-tokenfield - A token based form field+widget for Django
==============================================================

django-tokenfield provides a token based form field for Django. Its interface
is very similar to the message recipient input on Facebook or iOS. It behaves
as a normal text field but allows custom placeholders to be inserted at any
position.

It allows normal string data that may contain predefined placeholder
tokens.

One use-case is when you want to collect a "destination filename" for a
set of records

It's original use was in a tool that allowed database records to be
dumped to individual files.

Its features include:

Dependencies
============

- knockout.js
- jQuery


Using the field is as simple as::

    from django_tokenfield import TokenField

    class ArticleTemplate(forms.Form):
        title = TokenField()

    import django_tables2 as tables

    class SimpleTable(tables.Table):
        class Meta:
            model = Simple

This would then be used in a view::

    def simple_list(request):
        queryset = Simple.objects.all()
        table = SimpleTable(queryset)
        return render_to_response("simple_list.html", {"table": table},
                                  context_instance=RequestContext(request))

And finally in the template::

    {% load django_tables2 %}
    {% render_table table %}


This example shows one of the simplest cases, but django-tables2 can do a lot
more! Check out the `documentation`__ for more details.

.. __: http://django-tables2.readthedocs.org/en/latest/


Building the documentation
==========================

If you want to build the docs from within a virtualenv, use::

    make html SPHINXBUILD="python $(which sphinx-build)"
