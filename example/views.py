from django.shortcuts import render_to_response
from django.template import RequestContext


def example(request):
    return render_to_response(
            'example.html', context_instance=RequestContext(request))
