(function() {
    var script  = document.createElement("script");
    script.type = "text/html";
    script.id = 'django_tokenfield-token_template';
    script.text = [
        "<li data-bind=\"css: { 'django_tokenfield-variable': type == 'variable',",
        "                       'django_tokenfield-literal': type == 'literal',",
        "                       'django_tokenfield-selected': selected },",
        "               click: function(event) { select(); }\">",
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
        '          data-bind="text: value(),',
        '                     focus: selected,',
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
    var viewModel = {};
    // The next ID to use for a token.
    viewModel.nextTokenId = 0;
    // All the tokens that are currently in the input
    viewModel.tokens = ko.observableArray([]);
    // The last token
    viewModel.tokens.last = function() { return this()[this().length-1]; };
    // The first token
    viewModel.tokens.first = function() { return this()[0]; };
    // Return the token that is currently selected, or null.
    viewModel.tokens.selected = ko.dependentObservable(function() {
        return ko.utils.arrayFirst(this.tokens(), function(token) {
            if (token.selected())
                return token;
        });
    }, viewModel);
    // Is the variable selection dropdown currently visible?
    viewModel.choicesVisible = ko.observable(false);
    // Adds a variable at the end.
    viewModel.addVariable = function(value) {
        var token = new Token("variable", value);
        this.tokens.push(token);
    };
    // Reset the field back to a single empty literal.
    viewModel.reset = function() {
        this.tokens.remove(function() { return true; });
        this.tokens.push(new Token('literal', ''));
    };

    /*
     * Create and return a new token.
     *
     * Arguments:
     * `type` -- "literal" or "variable"
     * `value` -- any string
     *
     * Returns:
     * <Token object>
     */
    var Token = function(type, value) {
        this.id = viewModel.nextTokenId++;
        this.type = type;
        this.value = ko.observable(value);
        this.selected = ko.observable(false);
        this.select = function() { this.selected(true); };
        this.remove = function() { viewModel.tokens.remove(this); };
        this.focus = function() {};
        this.next = function() {
            if (viewModel.tokens.last() == this)
                // This is the most right token already, bail out.
                return null;
            return viewModel.tokens()[viewModel.tokens.indexOf(this) + 1];
        };
        this.previous = function() {
            if (viewModel.tokens.first() == this)
                // This is the most left token already, bail out.
                return null;
            return viewModel.tokens()[viewModel.tokens.indexOf(this) - 1];
        };
        // When this token is selected, deselect all the others.
        var self = this;
        this.selected.subscribe(function(newValue) {
            if (newValue) {
                ko.utils.arrayForEach(viewModel.tokens(), function(token) {
                    if (token != self)
                        token.selected(false);
                });
            }
        });
    };

    // Return the value of the widget (i.e. the hidden input's value)
    viewModel.inputValue = ko.dependentObservable({
        read: function() {
            return ko.toJSON(this.tokens)
        },
        write: function(value) {
            this.reset();
            ko.utils.arrayForEach(JSON.parse(value), function(token) {
                viewModel.tokens.push(new Token(token.type, token.value));
            });
        },
        owner: viewModel
    });

    /*
     * "Clean" the field by collapsing sibling literals and ensuring a literal
     * at each end.
     */
    (function() {
        var cleaning = false;
        viewModel.tokens.subscribe(function() {
            if (cleaning)
                return;
            cleaning = true;

            // At a minimum, have a literal
            if (viewModel.tokens().length == 0)
                viewModel.tokens.push(new Token('literal', ''));

            var token = viewModel.tokens.first(),
                next;

            if (token.type == 'variable')
                viewModel.tokens.unshift(new Token('literal', ''));

            token = viewModel.tokens.first();

            while (true) {
                if (next)
                    token = next;
                next = token.next();

                // always end with a literal
                if (token.type == 'variable' && !next) {
                    viewModel.tokens.push(new Token('literal', ''));
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
            cleaning = false;
        });
    })();

    return viewModel;
};
