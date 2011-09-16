from django import forms
from django.forms import ValidationError
from django.utils import simplejson as json
from django.utils.translation import ugettext_lazy as _
from django.utils.safestring import mark_safe
from django.template.loader import get_template
from django.template import Context
from .utils import AttributeDict, LiteralToken, VariableToken


class TokenWidget(forms.Widget):
    """
    :param template_name: the template to render to create HTML for the form
            widget
    """
    template_name = "django_tokenfield/widget.html"

    def __init__(self, *args, **kwargs):
        self.template_name = kwargs.pop("template_name", self.template_name)
        self.tokens = ()
        super(TokenWidget, self).__init__(*args, **kwargs)

    class Media:
        css = {"screen": ("django_tokenfield/css/widget.css", )}
        js = ("django_tokenfield/js/ko-extensions.js",
              "django_tokenfield/js/widget.js")

    def render(self, name, value, attrs=None):
        """
        :param value: list of tokens
        :type value: list
        """
        if value is None:
            value = []
        elif isinstance(value, list):
            raw = []
            for token in value:
                if isinstance(token, LiteralToken):
                    raw.append({'type': 'literal', 'value': token})
                elif isinstance(token, VariableToken):
                    raw.append({'type': 'variable', 'value': token.key})
            value = json.dumps(raw)
        attrs = self.build_attrs(attrs, name=name, type="hidden")
        # In Django the ID is usually applied to the input so that the label's
        # for="" attribute can be hooked up properly, in our case however,
        # we're using a hidden field so this doesn't make much sense for us.
        id = attrs.pop('id')
        return get_template(self.template_name).render(Context({
            "id": id,
            "value": value,
            "tokens": self.tokens,
            "attrs": AttributeDict(attrs),
        }))


class TokenField(forms.Field):
    """

    :param tokens: QuerySet or tuple or pairs.
    """
    widget = TokenWidget
    default_error_messages = {
        'invalid': _(u'Enter a token string'),
    }

    def __init__(self, tokens=None, *args, **kwargs):
        super(TokenField, self).__init__(*args, **kwargs)
        # It's important to do this second, so that widget is already hooked up
        # with this field.
        self.tokens = tokens

    @property
    def tokens(self):
        return self._tokens

    @tokens.setter
    def tokens(self, value):
        # Setting tokens also sets the choices on the widget.
        # tokens can be any iterable, but we call list() on it because
        # it will be consumed more than once.
        self.widget.tokens = self._tokens = value

    def to_python(self, value):
        value = super(TokenField, self).to_python(value)
        if isinstance(value, basestring):
            try:
                raw = json.loads(value)
                lookup = dict(self.tokens)
                value = []
                for token in raw:
                    if token['type'] == 'literal':
                        token = LiteralToken(token['value'])
                    else:
                        token = VariableToken(key=token['value'],
                                              value=lookup[token['value']])
                    value.append(token)
            except (TypeError, OverflowError):
                raise
                raise ValidationError(self.error_messages['invalid'])

        if isinstance(value, list):
            return value
        return []

    def clean(self, value):
        result = []
        for token in self.to_python(value):
            if isinstance(token, VariableToken):
                result.append(token.value)
            elif isinstance(token, LiteralToken):
                result.append(unicode(token))
        return result
