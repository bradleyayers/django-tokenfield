from django.utils.safestring import mark_safe
from django.utils.html import conditional_escape


class LiteralToken(unicode):
    """
    Represents a literal token (i.e. some text).
    """

class VariableToken(object):
    """
    Represents a variable token (i.e. a placeholder).
    """
    def __init__(self, key, value):
        self.key = key
        self.value = value


class AttributeDict(dict):
    """A wrapper around :class:`dict` that knows how to render itself as HTML
    style tag attributes.

    The returned string is marked safe, so it can be used safely in a template.
    See :meth:`.as_html` for a usage example.

    """
    def as_html(self):
        """
        Render to HTML tag attributes.

        Example:

        .. code-block:: python

            >>> from django_tables2.utils import AttributeDict
            >>> attrs = AttributeDict({'class': 'mytable', 'id': 'someid'})
            >>> attrs.as_html()
            'class="mytable" id="someid"'

        :rtype: :class:`~django.utils.safestring.SafeUnicode` object

        """
        return mark_safe(' '.join([u'%s="%s"' % (k, conditional_escape(v))
                                   for k, v in self.iteritems()]))
