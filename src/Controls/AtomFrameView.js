/// <reference path="AtomControl.js" />
/// <reference path="AtomViewStack.js" />

(function (window, baseType) {
    return createClass({
        name: "WebAtoms.AtomFrameView",
        base: baseType,
        start: function (e) {
            var self = this;
            $(e).addClass("atom-frame-view");
            this._items = [];
            this._layout = WebAtoms.AtomViewBoxLayout.defaultInstance;
            this.backCommand = function () {
                self.onBackCommand.apply(self, arguments);
            };
        },
        properties: {
            url: '',
            layout: null,
            items: [],
            removeOnBack: true
        },
        methods: {
            set_url: function (v) {
                if (!v) {
                    return;
                }
                var i = v.indexOf('?');
                var u = v;
                var q = "";
                var self = this;
                if (i !== -1) {
                    u = v.substr(0,i);
                    q = v.substr(i + 1);
                }

                var items = this._items;

                var item = Atom.query(items).firstOrDefault({ url: u });
                if (!item) {

                    // get item from scope...
                    var scope = Atom.get(this, "scope");
                    var t = scope[u];
                    if (!t) {
                        if (console && console.error) {
                            console.error("Page Template " + t + " not found");
                        }
                        return;
                    }

                    t = AtomUI.cloneNode(t);

                    item = {
                        url: u,
                        index: items.length,
                        element: t
                    };
                    Atom.add(items, item);
                    this._element.appendChild(t);

                    var c = AtomUI.createControl(t, $(t).attr("atom-type") || WebAtoms.AtomControl );
                    item.control = c;
                    WebAtoms.dispatcher.callLater(function () {
                        c.init();
                    });
                }
                Atom.set(this, "selectedIndex", item.index);

                if (q) {
                    WebAtoms.dispatcher.callLater(function () {
                        location.hash = q;
                    });
                }

            },
            onBackCommand: function () {
                var index = this._selectedIndex;
                if (index) {
                    var item = Atom.query(this._items).firstOrDefault({ index: index });
                    if (item) {
                        var self = this;
                        Atom.set(this, "selectedIndex", index -1);
                        if (self._removeOnBack) {
                            setTimeout(function () {
                                item.control.dispose();
                                $(item.element).remove();
                                Atom.remove(self._items, item);
                                var a = Atom.query(self._items);
                                var i = 0;
                                while (a.next()) {
                                    a.current().index = i++;
                                }
                            }, 1000);
                        }

                    }
                }
            },
            init: function () {
                baseType.init.call(this);
                var self = this;
                var u = this._url;
                if (u) {
                    WebAtoms.dispatcher.callLater(function () {
                        self.set_url(u);
                    });
                }
            }
        }
    });
})(window, WebAtoms.AtomViewStack.prototype);