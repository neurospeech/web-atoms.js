/// <reference path="AtomDockPanel.js" />

(function (window, name, base) {

    return classCreatorEx(
        {
            name: name,
            base: base,
            properties:{
                itemsPath: "items",
                totalPath: "total",
                pageSize: 25,
                currentPage: 0,
                items: null,
                total: 0,
                pages: []
            },

            start: function () {
                this._presenters = ["pageList"];

                var caller = this;

                var binder = AtomBinder;

                this.goFirstCommand = function () {
                    binder.setValue(caller, "currentPage", 0);
                };

                this.goLastCommand = function () {
                    binder.setValue(caller, "currentPage", caller._pages.length - 1);
                };

                this.goNextCommand = function () {
                    binder.setValue(caller, "currentPage", caller.get_currentPage() + 1);
                };

                this.goPrevCommand = function () {
                    binder.setValue(caller, "currentPage", caller.get_currentPage() - 1);
                };
            },

            methods:{
                preparePages: function () {
                    if (!this._items)
                        return;
                    if (!this._total)
                        return;
                    var l = this._items.length;
                    var t = this._total;
                    var count = Math.ceil(t / this._pageSize);

                    if (count == this._pages.length)
                        return;

                    var ps = this._pageSize;
                    var pages = [];
                    var i;
                    for (i = 0; i < count; i++) {
                        pages.push({
                            value: i,
                            label: i + 1
                        });
                    }
                    AtomBinder.setValue(this, "pages", pages);
                },

                set_items: function (v) {

                    if (v != this._items) {
                        if (this._items) {
                            this.unbindEvent(this._items, "CollectionChanged", "onCollectionChangedInternal");
                        }
                    }

                    if (!v)
                        return;
                    this._items = v;

                    if (v != null && this._created) {
                        this.bindEvent(this._items, "CollectionChanged", "onCollectionChangedInternal");
                        this.onCollectionChangedInternal("refresh", -1, null);
                    }

                },

                onCollectionChangedInternal: function () {
                    var v = this._items;
                    if (v.length === undefined) {
                        var val = v[this._itemsPath];

                        AtomBinder.setValue(this, "total", v[this._totalPath]);
                        AtomBinder.setValue(this, "value", val);
                    } else {
                        if (v.total) {
                            AtomBinder.setValue(this, "total", v.total);
                        } else {
                            AtomBinder.setValue(this, "pages", []);
                        }
                        AtomBinder.setValue(this, "value", v);
                    }

                    this.preparePages();
                },

                onCreationComplete: function () {
                    if (this._items) {
                        this.bindEvent(this._items, "CollectionChanged", "onCollectionChangedInternal");
                        this.onCollectionChangedInternal("refresh", -1, null);
                    }
                },


                set_currentPage: function (v) {
                    this._currentPage = v;
                    AtomBinder.refreshValue(this, "pageStart");
                },

                get_pageStart: function () {
                    return this._currentPage * this._pageSize;
                },

                set_pageSize: function (v) {
                    this._pageSize = v;
                    this.preparePages();
                },
                set_total: function (v) {
                    if (this._total == v)
                        return;
                    this._total = v;
                },
                initialize: function () {

                    $(this._element).addClass("atom-data-pager");

                    base.initialize.apply(this, arguments);
                }
            }

    }
);

})(window, "WebAtoms.AtomDataPager", WebAtoms.AtomControl.prototype);