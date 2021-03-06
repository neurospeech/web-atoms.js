﻿/// <reference path="AtomControl.js" />
/// <reference path="AtomViewStack.js" />

(function (baseType) {
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
            replaceUrl: '',
            layout: null,
            items: [],
            removeOnBack: true
        },
        methods: {
            set_replaceUrl: function (v) {
                //var item = Atom.query(this._items).firstOrDefault({ index: this._selectedIndex });
                //this.replaceItemWithUrl(item, v);
                var ae = new AtomEnumerator(this._items);

                var remove = [];

                this.set_url(v);

                while (ae.next()) {
                    var item = ae.current();
                    if (item.url != v) {
                        this.replaceItemWithUrl(item);
                    }
                }


            },

            set_url: function (v) {
                if (!v) {
                    return;
                }

                if (/replace\:/.test(v)) {
                    this.set_replaceUrl(v.substr(8));
                    this._url = v;
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
                    t._logicalParent = this._element;
                    item = {
                        url: u,
                        index: items.length,
                        opener: this._url,
                        element: t
                    };
                    Atom.add(items, item);
                    var c = AtomUI.createControl(t, AtomUI.getAtomType(t) || WebAtoms.AtomControl);
                    item.control = c;
                    WebAtoms.dispatcher.callLater(function () {
                        c.init();
                        self._element.appendChild(t);
                        Atom.set(self, "selectedIndex", item.index);
                        self.updateUI();
                    });
                } else {
                    Atom.set(this, "selectedIndex", item.index);
                    this.updateUI();
                }

                if (q) {
                    //WebAtoms.dispatcher.callLater(function () {
                    //    location.hash = q;
                    //});
                    this.invokeAction({ appScope: AtomUI.parseUrl(q) });
                }
                this._url = v;
            },

            replaceItemWithUrl: function (item, url) {
                if (url) {
                    this.set_url(url);
                }
                if (item) {
                    var self = this;
                    setTimeout(function () {
                        self.removeItem(item);
                    }, 1000);
                }

            },

            removeItem: function (item) {
                Atom.remove(this._items, item);
                item.control.dispose();
                $(item.element).remove();

                var ae = new AtomEnumerator(this._items);
                while (ae.next()) {
                    item = ae.current();
                    item.index = ae.currentIndex();
                }
            },

            onBackCommand: function () {
                var index = this._selectedIndex;
                if (index) {
                    var item = Atom.query(this._items).firstOrDefault({ index: index });
                    if (item) {
                        var self = this;
                        index = index - 1;
                        Atom.set(this, "selectedIndex", index);
                        if (self._removeOnBack) {
                            this.replaceItemWithUrl(item, item.opener);
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
})(WebAtoms.AtomViewStack.prototype);