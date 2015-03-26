/// <reference path="WebAtoms.Debug.js" />

CodeMirror.defineMode("htmlmixed", function (config) {
    var htmlMode = CodeMirror.getMode(config, {
        name: "xml", htmlMode: true,
        multilineTagIndentFactor: config.multilineTagIndentFactor,
        multilineTagIndentPastTag: config.multilineTagIndentPastTag
    });
    var jsMode = CodeMirror.getMode(config, "javascript");
    var cssMode = CodeMirror.getMode(config, "css");

    function html(stream, state) {
        var tagName = state.htmlState.tagName;

        var style = htmlMode.token(stream, state.htmlState);
        if (/\btag\b/.test(style) && stream.current() == ">" && state.htmlState.context) {
            if (/^script$/i.test(tagName)) {
                state.token = javascript;
                state.localMode = jsMode;
                state.localState = jsMode.startState(htmlMode.indent(state.htmlState, ""));
                return style;
            }
            else if (/^style$/i.test(tagName)) {
                state.token = css;
                state.localMode = cssMode;
                state.localState = cssMode.startState(htmlMode.indent(state.htmlState, ""));
            }
        }

        var t = stream.current();

        if (style == "attribute") {
            
            if (t.match(/atom-[a-z0-9\-]+/i)) {
                return "web-atom-attribute";
            }
            if (t.match(/atom-[a-z0-9\-]+/i)) {
                return "web-atom-event";
            }
            if (t.match(/style-[a-z0-9\-]+/i)) {
                return "web-atom-style";
            }
        }

        if (!style)
            return style;

        if (/string/i.test(style)) {
            var binding = t.match(/\[|\]/i);
            var exp = t.match(/\{|\}/i);
            if (binding || exp || t.match(/[a-z0-9\_\-]+\:/i) ) {
                stream.backUp(t.length - 1);
                state.token = attributes(t.substr(0, 1), state.token, binding ? "web-atom-binding" : ( exp ? "web-atom-exp" : null ));
                return style;
            } 
        }

        return style;
    }

    function attributes(ch,backup,def) {
        return function (stream, state)
        {

            var bg = " " + def || "";

            var m = stream.match(/^\$(data|get|url|json|owner|scope|appScope)[\.a-z0-9\_]*/i);
            if (m) {
                return "web-atom-binding-exp" + bg;
            }

            m = stream.match(/^(\$|\^)\[[^\]]+\]/i);
            if (m) {
                return "web-atom-two-way-binding";
            }

            m = stream.match(/\'(([^\']|\'\'))+\'/);
            if (m) {
                return "web-atom-string" + bg;
            }

            //m = stream.match(/(http|https)\:\/\/(\S)+/);

            m = stream.match(/[a-z0-9\_\-]+\:/i);
            if (m) {
                if (!stream.match(/(http|https)\:/i)) {
                    return "web-atom-string-attribute" + bg;
                }
            }

            var n = stream.next();
            if (n == ch) {
                state.token = backup;
                return "string";
            }

            return def || "string";
        };
    }

    function maybeBackup(stream, pat, style) {
        var cur = stream.current();
        var close = cur.search(pat), m;
        if (close > -1) stream.backUp(cur.length - close);
        else if (m = cur.match(/<\/?$/)) {
            stream.backUp(cur.length);
            if (!stream.match(pat, false)) stream.match(cur);
        }
        return style;
    }
    function javascript(stream, state) {
        if (stream.match(/^<\/\s*script\s*>/i, false)) {
            state.token = html;
            state.localState = state.localMode = null;
            return html(stream, state);
        }
        return maybeBackup(stream, /<\/\s*script\s*>/,
                           jsMode.token(stream, state.localState));
    }
    function css(stream, state) {
        if (stream.match(/^<\/\s*style\s*>/i, false)) {
            state.token = html;
            state.localState = state.localMode = null;
            return html(stream, state);
        }
        return maybeBackup(stream, /<\/\s*style\s*>/,
                           cssMode.token(stream, state.localState));
    }

    return {
        startState: function () {
            var state = htmlMode.startState();
            return { token: html, localState: null, mode: "html", htmlState: state };
        },

        copyState: function (state) {
            if (state.localState)
                var local = CodeMirror.copyState(state.token == css ? cssMode : jsMode, state.localState);
            return {
                token: state.token, localState: local, mode: state.mode,
                htmlState: CodeMirror.copyState(htmlMode, state.htmlState)
            };
        },

        token: function (stream, state) {
            return state.token(stream, state);
        },

        indent: function (state, textAfter) {
            if (state.token == html || /^\s*<\//.test(textAfter))
                return htmlMode.indent(state.htmlState, textAfter);
            else if (state.token == javascript)
                return jsMode.indent(state.localState, textAfter);
            else
                return cssMode.indent(state.localState, textAfter);
        },

        electricChars: "/{}:",

        innerMode: function (state) {
            var mode = state.token == html ? htmlMode : state.token == javascript ? jsMode : cssMode;
            return { state: state.localState || state.htmlState, mode: mode };
        }
    };
}, "xml", "javascript", "css");

CodeMirror.defineMIME("text/html", "htmlmixed");


//http://jsfiddle.net/cnZKY/

(function (baseType, CodeMirror, window, WebAtoms) {
    return classCreatorEx({
        name: "WebAtoms.AtomCodeView",
        base: baseType,
        start: function () {
            this._presenters = ["codeView"];
            this._template = document.createElement("textarea");
            this._template.setAttribute("atom-presenter", "codeView");
        },
        properties: {
            resize: true,
            codeFile: undefined,
            code: undefined
        },
        methods: {
            set_code: function (v) {
                if (!v) {
                    v = "";
                }
                this._code = v;
                $(this._element).val(v);
                this.editor.setValue(v);
                //this.editor.setSize( $(this._element).width(), $(this._element).height() );
                if (!this._resize)
                    return;
                var _this = this;
                WebAtoms.dispatcher.callLater(function () {
                    var a = _this.editor.getScrollInfo();
                    //console.log(JSON.stringify(a));
                    if (a.height) {
                        _this.editor.setSize(null, a.height);
                        if (window.frameElement) {
                            var h = $(window.frameElement).innerHeight();
                            if (h < a.height) {
                                window.frameElement.style.height = (a.height) + "px"
                            }
                        }
                    }
                });
            },

            onUpdateUI: function () {
                if (this.editor) {
                    this.editor.refresh();

                    var _this = this;
                    if (this._resize) {
                        WebAtoms.dispatcher.callLater(function () {
                            var a = _this.editor.getScrollInfo();
                            //console.log(JSON.stringify(a));
                            if (a.height) {
                                _this.editor.setSize(null, a.height);
                                if (window.frameElement) {
                                    var h = $(window.frameElement).innerHeight();
                                    if (h < a.height) {
                                        window.frameElement.style.height = (a.height) + "px"
                                    }
                                }
                            }
                        });
                    } else {
                        var width = $(this._element).innerWidth();
                        var height = $(this._element).innerHeight();
                        this.editor.setSize(width, height);
                    }
                }
            },

            init: function () {

                var _this = this;
                this.editor = CodeMirror.fromTextArea(this._codeView, {
                    lineNumbers: true,
                    matchBrackets: true,
                    mode: "text/html",
                    indentUnit: 2,
                    indentWithTabs: true,
                    enterMode: "keep",
                    tabMode: "shift",
                    viewportMargin: Infinity,
                    onChange: function (a) {
                        _this._code = a.getValue();
                        AtomBinder.refreshValue(_this, "code");
                    }
                });

                baseType.init.call(this);
            }
        }
    });
})(WebAtoms.AtomControl.prototype, CodeMirror, window, WebAtoms);
