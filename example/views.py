from django import forms
from django.shortcuts import render_to_response
from django.template import RequestContext
from django_tokenfield import TokenField


TOKENS = (
    ("key",  {'myk': 'brad'}),
    ("key2", "value2"),
    ("key3", "value3"),
    ("key4", "value4"),
)


class SimpleForm(forms.Form):
    name = forms.CharField(max_length=200)
    path = TokenField(tokens=TOKENS)


def example(request):
    context = {}
    if request.method == "POST":
        form = SimpleForm(request.POST, request.FILES)
        if form.is_valid():
            context['message'] = repr(form.cleaned_data['path'])
    else:
        form = SimpleForm()
    context['form'] = form
    return render_to_response(
            'example.html', context, context_instance=RequestContext(request))
