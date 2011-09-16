(function() {
    var script  = document.createElement("script");
    script.type = "text/html";
    script.id = 'django_tokenfield-token_template';
    script.text = [
        "<li data-bind=\"css: { 'django_tokenfield-variable': type == 'variable',",
        "                      'django_tokenfield-literal': type == 'literal',",
        "                      'django_tokenfield-selected': selected },",
        '               click: function(event) { select(); event.stopPropagation(); }">',
        '{{if type == "literal"}}',
        '    <input type="text"',
        '           data-bind="value: value,',
        "                      valueUpdate: 'afterkeydown',",
        '                      fit: value,',
        '                      focus: selected,',
        '                      hop: {',
        '                          left: function() {',
        '                              var prev = this.previous();',
        '                              if (prev)',
        '                                  prev.select();',
        '                          },',
        '                          leftBubble: false,',
        '                          right: function() {',
        '                              var next = this.next();',
        '                              if (next)',
        '                                  next.select();',
        '                          },',
        '                          rightBubble: false,',
        '                          active: selected',
        '                      }"/>',
        '{{else}}',
        '    <span type="text" class="value"',
        "          data-bind=\"text: '{' + value() + '}',",
        '                     hop: {',
        '                         left: function() {',
        '                             var prev = this.previous();',
        '                             if (prev)',
        '                                 prev.select();',
        '                             return false;',
        '                         },',
        '                         right: function() {',
        '                             var next = this.next();',
        '                             if (next)',
        '                                 next.select();',
        '                             return false;',
        '                         },',
        '                         active: selected',
        '                     }" ></span>',
        '   <span class="delete" data-bind="click: remove">×</span>',
        '   {{/if}}',
        '   </li>',
        '</script>'
    ].join('\n');
    $(function() {
        document.body.appendChild(script);
    });
})();

var DjangoTokenFieldViewModel = function() {
    var viewModel = {
        /*
         * The next ID to use for a token.
         */
        nextTokenId: 0,

        /*
         * Create and return a new token.
         *
         * Arguments:
         * `type` -- "literal" or "variable"
         * `value` -- any string
         *
         * Returns:
         * <token object>
         */
        newToken: function(type, value) {
            var model = this;
            var obj = {
                id: model.nextTokenId++,
                type: type,
                value: ko.observable(value),
                selected: ko.observable(false),
                select: function() {
                    this.selected(true);
                },
                remove: function() {
                    model.tokens.remove(this);
                },
                next: function() {
                    if (model.tokens()[model.tokens().length-1] == this)
                        // This is the most right token already, bail out.
                        return null;
                    return model.tokens()[model.tokens.indexOf(this) + 1];
                },
                previous: function() {
                    if (model.tokens()[0] == this)
                        // This is the most left token already, bail out.
                        return null;
                    return model.tokens()[model.tokens.indexOf(this) - 1];
                },
                toString: function() {
                    return this.value() + ' [' + this.type + ']';
                }
            };
            obj.selected.subscribe(function(newValue) {
                if (newValue) {
                    ko.utils.arrayForEach(model.tokens(), function(token) {
                        if (token != obj)
                            token.selected(false);
                    });
                }
            });
            return obj;
        },

        // All the tokens that are currently in the input
        tokens: ko.observableArray([]),

        // Is the variable selection dropdown currently visible?
        choicesVisible: ko.observable(false),

        /**
          * Adds a literal at the end. If a literal is already at the end of the list, combine
          * both values.
          */
        addLiteral: function(value) {
            var token = this.newToken("literal", value);
            this.tokens.push(token);
        },

        /** Adds a variable at the end. */
        addVariable: function(value) {
            var token = this.newToken("variable", value);
            this.tokens.push(token);
        },

        reset: function() {
            while (this.tokens().length)
                this.tokens.pop();
            this.addLiteral('');
        }
    };

    viewModel.tokens.subscribe(function() {
        if (viewModel._cleaning)
            return;
        viewModel._cleaning = true;

        // At a minimum, have a literal
        if (viewModel.tokens().length == 0)
            viewModel.tokens.push(viewModel.newToken('literal', ''));

        var token = viewModel.tokens()[0],
            next;

        if (token.type == 'variable')
            viewModel.tokens.unshift(viewModel.newToken('literal', ''));

        token = viewModel.tokens()[0];

        while (true) {
            if (next)
                token = next;
            next = token.next();

            // always end with a literal
            if (token.type == 'variable' && !next) {
                viewModel.tokens.push(viewModel.newToken('literal', ''));
                break;
            }

            if (!next)
                break;

            if (token.type == 'literal' && next.type == 'literal') {
                token.value(token.value() + next.value());
                next.remove();
                next = token.next();
            }
        }
        viewModel._cleaning = false;
    });

    viewModel.selectedToken = ko.dependentObservable(function() {
        for (var i = 0, len = this.tokens().length; i < len; i++) {
            var token = this.tokens()[i];
            if (token.selected())
                return token;
        }
    }, viewModel);

    viewModel.inputValue = ko.dependentObservable({
        read: function() {
            return ko.toJSON(this.tokens)
        },
        write: function(value) {
            this.reset();
            ko.utils.arrayForEach(JSON.parse(value), function(token) {
                var newToken = viewModel.newToken(token.type, token.value);
                viewModel.tokens.push(newToken);
            });
        },
        owner: viewModel
    });

    return viewModel;
}
