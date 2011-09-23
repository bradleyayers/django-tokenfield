(function() {
    /*
     * Utility function that is capable of setting or retrieving the current
     * caret position inside a text input
     */
    var caret = function(element, begin, end) {
        var text = ko.selectExtensions.readValue(element);
        begin = begin == "left" ? 0 : begin == "right" ? text.length : begin;
        end   = end   == "left" ? 0 : end   == "right" ? text.length : end;

        // set
        if (typeof begin == 'number') {
            end = (typeof end == 'number') ? end : begin;
            if (element.setSelectionRange) {
                setTimeout(function() { viewModel.log.push(element+'.setSelectionRange('+begin+', '+end+')'); }, 0);
                element.setSelectionRange(begin, end);
            } else if (element.createTextRange) {
                var range = element.createTextRange();
                range.collapse(true);
                range.moveEnd('character', end);
                range.moveStart('character', begin);
                range.select();
            }
        // get
        } else {
            if (element.setSelectionRange) {
                begin = element.selectionStart;
                end = element.selectionEnd;
            } else if (document.selection && document.selection.createRange) {
                var range = document.selection.createRange();
                begin = 0 - range.duplicate().moveStart('character', -100000);
                end = begin + range.text.length;
            }
            return { begin: begin, end: end };
        }
        return null;
    };

    ko.bindingHandlers.focus = {
        init: function(element, valueAccessor) {
            if (element.tagName !== "INPUT") {
                ko.utils.registerEventHandler(document, "click", function(event) {
                    if (event.target != element) {
                        $(element).trigger('blur');
                    }
                });
            }
            $(element).focus(function() { valueAccessor()(true);  });
            $(element).blur(function()  { valueAccessor()(false); });
        },
        update: function(element, valueAccessor) {
            if (ko.utils.unwrapObservable(valueAccessor())) {
                // If this isn't actually something that can be 'focused', we
                // need to at least blur everything else.
                if (document.activeElement != element)
                    document.activeElement.blur();
                if (element.focus)
                    element.focus();
            } else {
                if (element.blur)
                    element.blur();
            }
        }
    }

    ko.bindingHandlers.fit = {
        /*
         * Requires jQuery
         */
        init: function(element, valueAccessor) {
            element.resizeToFit = function() {
                var value = ko.utils.unwrapObservable(valueAccessor()),
                    elem = $(this),
                    testSubject = $('<tester/>').css({
                    position: 'absolute',
                    top: -9999,
                    left: -9999,
                    width: 'auto',
                    fontSize: elem.css('fontSize'),
                    fontFamily: elem.css('fontFamily'),
                    fontWeight: elem.css('fontWeight'),
                    letterSpacing: elem.css('letterSpacing'),
                    whiteSpace: 'nowrap'
                });
                testSubject.insertAfter(elem);
                // Enter new content into testSubject
                var escaped = value.replace(/&/g, '&amp;').replace(/\s/g, '&nbsp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                testSubject.html(escaped);
                // Calculate new width (include 2px for edge cursor)
                elem.width(testSubject.width() + 2);
                testSubject.remove();
            };
        },
        update: function(element) {
            element.resizeToFit();
        }
    };

    ko.bindingHandlers.hop = {
        /*
         * Do something when an element is hopped off.
         *
         * Example:
         *
         *     hop: { left:  function() { alert('hopped left'); },
         *            right: function() { alert('hopped right'); },
         *            active: selected }
         */
        init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var LEFT = 37,
                RIGHT = 39,
                options = ko.utils.unwrapObservable(valueAccessor());
            options.left  = options.left  || function() {};
            options.right = options.right || function() {};
            options.leftBubble  = options.leftBubble  !== undefined ? options.leftBubble  : true;
            options.rightBubble = options.rightBubble !== undefined ? options.rightBubble : true;

            if (options.active == undefined)
                throw new Error('hop binding must have "active" attribute defined');

            if (element.tagName == "INPUT" || element.tagName == "TEXTAREA") {
                // input and textarea can be hooked by using the "keydown"
                // event and inspecting "selection[Start|End]".
                ko.utils.registerEventHandler(element, "keydown", function(event) {
                    handlers = [
                        // left
                        {
                            condition: function() {
                                var pos = caret(element);
                                // Ensure that no selection is being made
                                // i.e. pos.begin == pos.end
                                return event.keyCode == LEFT
                                        && pos.begin == 0
                                        && pos.end   == 0;
                            },
                            action: options.left,
                            bubble: options.leftBubble
                        },
                        // right
                        {
                            condition: function() {
                                var rightIndex = ko.selectExtensions.readValue(element).length;
                                var pos = caret(element);
                                // Ensure that no selection is being made
                                // i.e. pos.begin == pos.end
                                return event.keyCode == RIGHT
                                        && pos.begin == rightIndex
                                        && pos.end   == rightIndex;
                            },
                            action: options.right,
                            bubble: options.rightBubble
                        }
                    ]

                    ko.utils.arrayForEach(handlers, function(handler) {
                        if (!handler.condition())
                            return;
                        try {
                            result = ko.utils.unwrapObservable(handler.action).apply(viewModel);
                        } finally {
                            // By default the handler will preset default
                            // action. In cases where this is undesirable,
                            // handler must return true.
                            if (result !== true) {
                                if (event.preventDefault)
                                    event.preventDefault();
                                else
                                    event.returnValue = false;
                            }
                        }
                        if (ko.utils.unwrapObservable(handler.bubble) === false) {
                            event.cancelBubble = true;
                            if (event.stopPropagation)
                                event.stopPropagation();
                        }
                    });
                });
            } else {
                // We're going to need a global "keydown" handler.
                ko.utils.registerEventHandler(document, "keydown", function(event) {
                    if (ko.utils.unwrapObservable(options.active)) {
                        if (event.keyCode == LEFT) {
                            try {
                                returnValue = ko.utils.unwrapObservable(options.left).apply(viewModel);
                            } finally {
                                 // Normally we want to prevent default action.
                                 // Developer can override this be explicitly
                                 // returning true.
                                if (returnValue !== true) {
                                    if (event.preventDefault)
                                        event.preventDefault();
                                    else
                                        event.returnValue = false;
                                }
                            }
                            if (ko.utils.unwrapObservable(options.leftBubble) === false) {
                                event.cancelBubble = true;
                                if (event.stopPropagation)
                                    event.stopPropagation();
                            }
                        } else if (event.keyCode == RIGHT) {
                            try {
                                returnValue = ko.utils.unwrapObservable(options.right).apply(viewModel);
                            } finally {
                                 // Normally we want to prevent default action.
                                 // Developer can override this be explicitly
                                 // returning true.
                                if (returnValue !== true) {
                                    if (event.preventDefault)
                                        event.preventDefault();
                                    else
                                        event.returnValue = false;
                                }
                            }
                            if (ko.utils.unwrapObservable(options.rightBubble) === false) {
                                event.cancelBubble = true;
                                if (event.stopPropagation)
                                    event.stopPropagation();
                            }
                        }
                    }
                });
            }
        }
    };
})();
