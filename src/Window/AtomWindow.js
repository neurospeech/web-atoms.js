/// <reference path="../Controls/AtomControl.js" />

(function (baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomWindow",
        base: baseType,
        start: function () {
            this._presenters = ["windowDiv", "windowTitleDiv", "windowCloseButton", "iframe", "windowPlaceholder"];
        },
        properties: {
            opener: null,
            openerData: null,
            windowTemplate: null,
            isOpen: false,
            windowHeight: 300,
            windowWidth: 500,
            url: undefined,
            title: undefined
        },
        methods: {


            get_openerData: function () {
                var v = this.get_opener();
                if (!v)
                    return;
                return v.get_data();
            },

            onCloseCommand: function (scope, sender) {
                AtomBinder.setValue(this, "isOpen", false);
                var val = this._value;
                var caller = this;
                this._value = null;

                this.disposeChildren(this._element);

                setTimeout(function () {
                    AtomBinder.setValue(caller, "value", val);
                    caller.invokeAction(caller._next);
                }, 1);
            },

            refresh: function (scope, sender) {
                this.openWindow(scope, sender);
            },

            openWindow: function (scope, sender) {

                var tt = this.getTemplate("frameTemplate");

                tt = AtomUI.cloneNode(tt);

                var wdiv = $(tt).find("[atom-presenter=windowDiv]").get(0);
                var wtitle = $(tt).find("[atom-presenter=windowTitleDiv]").get(0);

                var wt = this.getTemplate("windowTemplate");

                $(wt).addClass("atom-window-template");

                if (!($(wt).attr("atom-dock"))) {
                    $(wt).attr("atom-dock", "Fill");
                }

                if (wt.length) {
                    for (var i = 0; i < wt.length; i++) {
                        wdiv.appendChild(wt[i]);
                    }
                } else {
                    wdiv.appendChild(wt);
                }

                var wct = this.getTemplate("commandTemplate");
                if (wct) {
                    wct.setAttribute("atom-dock", "Bottom");
                    wct.setAttribute("class", "atom-wizard-command-bar");
                    wdiv.appendChild(wct);
                }

                this.set_innerTemplate(tt);

                if (this._iframe) {
                    this._iframe.atomWindow = this;
                }

                if (sender) {
                    this._opener = sender;
                    AtomBinder.refreshValue(this, "opener");
                    AtomBinder.refreshValue(this, "openerData");
                }

                var _this = this;
                WebAtoms.dispatcher.callLater(function () {
                    AtomBinder.setValue(_this, "isOpen", true);
                    if (!_this._url) {
                        var children = $(_this._windowPlaceholder).find("input");
                        if (children.length > 0) {
                            var item = children.get(0);
                            try {
                                item.focus();
                            } catch (er) {
                            }
                        }
                    }
                });
            },

            initialize: function () {



                $(this._element).addClass("atom-window-placeholder");
                baseType.initialize.call(this);

                var _this = this;
                this.closeCommand = function () {
                    _this.onCloseCommand.apply(_this, arguments);
                };

                this.openCommand = function () {
                    _this.openWindow.apply(_this, arguments);
                };

                WebAtoms.dispatcher.callLater(function () {
                    _this._element._logicalParent = _this._element.parentNode;
                    $(_this._element).remove();
                    document.body.appendChild(_this._element);
                });
            }
        }
    });
})(WebAtoms.AtomControl.prototype);
