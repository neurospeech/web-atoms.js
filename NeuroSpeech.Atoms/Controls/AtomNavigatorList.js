/// <reference path="AtomListBox.js" />

(function (window, base) {
    return classCreatorEx({
        name: "WebAtoms.AtomNavigatorList",
        base: base,
        start: function () {
            // 0 = items, 1 = selection, 2 = new item..
            this._displayMode = 0;

            this._presenters =
                [
                    "gridPanel",
                    "gridPresenter",
                    "itemsPresenter",
                    "detailHeaderPresenter",
                    "newHeaderPresenter",
                    "detailPresenter",
                    "newPresenter",
                    "newView",
                    "detailView",
                    "newHeaderToolbar",
                    "detailHeaderToolbar"];

            this._layout = new WebAtoms.AtomViewBoxLayout();

            this._newItem = {};

        },
        properties: {
            autoShowDetail: true,
            currentPage: null,
            pageSize: undefined,
            newItem: null,
            newUrl: null,
            detailUrl: null,
            displayMode: null
        },
        methods: {
            get_newItemCopy: function () {
                return this._newItemCopy;
            },


            onBackCommand: function () {
                AtomBinder.setValue(this, "displayMode", 0);
                this.updateDisplayMode();
                AtomBinder.setValue(this, "selectedIndex", -1);
            },

            onCancelAddNewCommand: function () {
                this.onBackCommand();
                AtomBinder.refreshValue(this, "newItemCopy");
                this.refresh();
            },

            onAddCommand: function () {
                AtomBinder.setValue(this, "selectedIndex", -1);
                AtomBinder.setValue(this, "displayMode", 2);
                var item = this._newItem || {};
                this._newItemCopy = AtomBinder.getClone(item);
                AtomBinder.refreshValue(this, "newItemCopy");
                this.updateDisplayMode();
            },

            onSelectedItemsChanged: function () {
                base.onSelectedItemsChanged.apply(this, arguments);

                if (this._autoShowDetail) {
                    this.showDetailCommand();
                }
            },

            addTemplate: function (p, e, inite) {
                if (inite) {
                    p.appendChild(e);
                    e._templateParent = this;
                    this.onCreateChildren(p);
                    //this.setProperties(e);
                    this.initializeChildren(p);
                } else {
                    p.appendChild(e);
                    e._templateParent = this;
                    this.onCreateChildren(p);
                }
            },

            updateDisplayMode: function () {
                var v = this._displayMode;
                if (v == 0) {

                    if (this._detailPresenter) {
                        this._detailView.atomControl.dispose(this._detailPresenter);
                        this._detailPresenter = null;
                    }
                    if (this._newPresenter) {
                        this._newView.atomControl.dispose(this._newPresenter);
                        this._newPresenter = null;
                    }
                    if (this._detailHeaderPresenter) {
                        this._detailView.atomControl.dispose(this._detailHeaderPresenter);
                        this._detailHeaderPresenter = null;
                    }
                    if (this._newHeaderPresenter) {
                        this._newView.atomControl.dispose(this._newHeaderPresenter);
                        this._newHeaderPresenter = null;
                    }

                    return;
                }

                var c = null;
                var ct = this.getTemplate("detailTemplate");;
                var ch = null;
                var cht;
                var key = "";

                if (v == 1) {
                    c = this._detailView;
                    ch = this._detailHeaderToolbar;
                    cht = this.getTemplate("detailHeaderTemplate");
                    key = "_detail";
                } else {
                    c = this._newView;
                    ch = this._newHeaderToolbar;
                    cht = this.getTemplate("newHeaderTemplate");
                    key = "_new";
                }

                if (ch && cht) {
                    cht = AtomUI.cloneNode(cht);
                    this.addTemplate(ch, cht, true);
                    this[key + "HeaderPresenter"] = cht;
                }

                if (c && ct) {
                    ct = AtomUI.cloneNode(ct);
                    this.addTemplate(c, ct, true);
                    this[key + "Presenter"] = ct;
                }
            },

            createChildren: function () {
                base.createChildren.call(this);

                this.getTemplate("gridTemplate");
                this.getTemplate("detailTemplate");
                this.getTemplate("searchTemplate");
                this.getTemplate("detailHeaderTemplate");
                this.getTemplate("newHeaderTemplate");
                this.getTemplate("headerTemplate");
                this.getTemplate("footerTemplate");

                var p = this.get_scope();

                this._newView.atomControl._scope = new AtomScope(this, p);
                this._detailView.atomControl._scope = new AtomScope(this, p);

                var g = AtomUI.cloneNode(this._gridTemplate);
                this.addTemplate(this._gridPresenter, g);

                if (!($(this._detailTemplate).attr("atom-dock"))) {
                    $(this._detailTemplate).attr("atom-dock", "Fill");
                }

                if (this._headerTemplate) {
                    var hd = AtomUI.cloneNode(this._headerTemplate);
                    hd.setAttribute("atom-dock", "Top");
                    $(hd).addClass("atom-navigator-list-header");
                    hd._templateParent = this;
                    this.addTemplate(this._gridPanel, hd);
                }

                if (this._footerTemplate) {
                    var fd = AtomUI.cloneNode(this._footerTemplate);
                    fd.setAttribute("atom-dock", "Bottom");
                    $(hd).addClass("atom-navigator-list-footer");
                    this.addTemplate(this._gridPanel, fd);
                }
            },

            initialize: function () {
                base.initialize.call(this);

                var _this = this;

                this.backCommand = function () {
                    _this.onBackCommand.apply(_this, arguments);
                };

                this.addCommand = function () {
                    _this.onAddCommand.apply(_this, arguments);
                };

                this.cancelAddCommand = function () {
                    _this.onCancelAddNewCommand.apply(_this, arguments);
                };

                this.showDetailCommand = function () {
                    var s = _this.get_selectedItem();
                    if (s) {
                        AtomBinder.setValue(_this, "displayMode", 1);
                        _this.updateDisplayMode();
                    }
                };
            }
        }
    });
})(window, WebAtoms.AtomListBox.prototype);

