from django import forms
from django.shortcuts import render_to_response
from django.template import RequestContext
from django_tokenfield import TokenField


TOKENS = (
    ("firstName",  "First name"),
    ("lastName", "Last name"),
    ("age", "Age"),
)


class SimpleForm(forms.Form):
    name = forms.CharField(max_length=200)
    source = TokenField(tokens=TOKENS)
    destination = TokenField(tokens=TOKENS)


def example(request):
    context = {}
    if request.method == "POST":
        form = SimpleForm(request.POST, request.FILES)
        if form.is_valid():
            context['message'] = "Source: %r; Destination: %r" % (
                    form.cleaned_data['source'],
                    form.cleaned_data['destination'])
    else:
        form = SimpleForm()
    context['form'] = form
    return render_to_response(
            'example.html', context, context_instance=RequestContext(request))
