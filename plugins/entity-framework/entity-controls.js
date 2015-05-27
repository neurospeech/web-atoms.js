/// <reference path="jquery-1.9.1.js" />
/// <reference path="dummy-web-atoms.js" />

(function (window) {

    var WebAtoms = window.WebAtoms;
    var AtomEnumerator = window.AtomEnumerator;
    var Atom = window.Atom;
    var AtomUI = window.AtomUI;
    var AtomBinder = window.AtomBinder;
    var entityContext = window.entityContext;
    if (!entityContext) {
        throw new Error("window.entityContext does not exist, please create it before inserting this script");
    }

    Templates.jsonML["WebAtoms.AtomParentBox.template"] = [
        ["div", {
            "atom-type": "AtomWindow",
            "atom-title": "[ $owner.opener.windowTitle ]",
            "atom-name": "modifyWindow",
            "atom-url": "[$owner.opener.objectLink]",
            "atom-next": "[$owner.opener.windowClosed]",
            "atom-window-width": "{$appScope.owner.appWidth - 100}",
            "atom-window-height": "{$appScope.owner.appHeight - 100}"
        }],
        ["a",
            {
                "class": "link",
                "atom-text": "[$owner.displayName]",
                "atom-event-click": "{ [{ owner: { mode: 'view' } }, $localScope.modifyWindow] }",
                "style-display": "[$owner.displayName ? '' : 'none']"
            }],
        ["div",
            {
                "class": "add",
                "atom-event-click": "{ [{ owner: { mode: 'add' },scope: { popup: false}  }, $localScope.modifyWindow] }",
                "style-display": "[!$owner.displayName ? 'block':'none']"
            }],
        ["div",
            {
                "class": "change",
                "atom-event-click": "{ [{ owner: { mode: 'change' } }, $localScope.modifyWindow] }",
                "style-display": "[$owner.displayName ? 'block':'none']"
            }],
        ["div",
            {
                "class": "delete",
                "atom-event-click": "[$owner.deleteCommand]",
                "style-display": "[$owner.displayName ? 'block':'none']"
            }],
        ["input",
            {
                "type": "search",
                "class": "search",
                "placeholder": "Search",
                "atom-value": "$[owner.searchText](keyup,keypress,keydown,click,blur)",
                "atom-event-focus": "{ { scope: { popup: true } } }",
                "atom-event-blur": "{ { timeOut: [500, { scope: { popup: false} }] } }",
                "style-display": "[!$owner.displayName ? '' : 'none']"
            }],
        ["div",
            {
                "class": "popup",
                "atom-class": "[($owner.templateParent.searchText || $scope.popup) ? 'popup-open' : 'popup-closed']",
                "atom-type": "AtomListBox",
                "atom-items": "[($owner.templateParent.searchText || $scope.popup) ? ($owner.templateParent).getQuery($owner.templateParent.searchText) : undefined ]",
                "atom-next": "[ [$owner.templateParent.selectCommand, { timeOut: [500, { scope: { popup: false } }] }] ]",
                "atom-item-template": "{$owner.templateParent.itemTemplate}"
            }
        ]
    ];


    (function (baseType) {
        return classCreatorEx({
            name: "WebAtoms.AtomChildListBox",
            base: baseType,
            start: function (e) {

                var _this = this;

                this.addCommand = function () {
                    _this.onAddCommand.apply(_this, arguments);
                };
                this.removeCommand = function () {
                    _this.onRemoveCommand.apply(_this, arguments);
                };
                this.copyCommand = function () {
                    _this.onCopyCommand.apply(_this, arguments);
                };

                $(e).addClass("atom-child-list-box");

                this._includeList = "";

                this._propertyName = "";

                this._defaultItem = {};
            },
            properties: {
                defaultItem: null,
                includeList: null,
                propertyName: undefined
            },
            methods: {
                set_includeList: function (v) {
                    if (v) {
                        var ae = new AtomEnumerator(v.split(','));
                        while (ae.next()) {
                            this.addInclude(ae.current());
                        }
                    }
                },

                set_propertyName: function (n) {
                    this._propertyName = n;
                    this.setValue('items', "[!$data || entityContext.loadChildren($data,'" + n + "', null,  $owner.includeList )]", true, this._element);
                },

                onCopyCommand: function (scope, sender) {
                    var d = sender.get_data();
                    var c = AtomBinder.getClone(d);
                    var items = this.get_items();
                    AtomBinder.addItem(items, c);
                },

                onAddCommand: function () {
                    var data = this.get_data();
                    var p = this.get_propertyName();
                    var m = entityContext.getMetaDataEntity(data._$_entityName);
                    p = m.children[p];
                    var d = entityContext.addEntity(p.type, AtomBinder.getClone(this._defaultItem));
                    var items = this.get_items();
                    AtomBinder.addItem(items, d);
                },

                onRemoveCommand: function (scope, sender) {

                    var d = sender.get_data();
                    var items = this.get_items();
                    AtomBinder.removeItem(items, d);
                },

                init: function () {

                    var it = this.getTemplate("itemTemplate");

                    this.findParentBox(it);

                    baseType.init.apply(this, arguments);
                },

                addInclude: function (n) {
                    if (!n)
                        return;
                    var list = this._includeList.split(',');
                    var ae = new AtomEnumerator(list);
                    while (ae.next()) {
                        var item = ae.current();
                        if (item == n)
                            return;
                    }
                    list.push(n);
                    this._includeList = list.join(',');
                },

                findParentBox: function (e) {
                    var at = AtomUI.attributeMap(e, /atom\-|(type|property\-name)/gi);
                    var type = at["atom-type"];
                    if (type && type.value == "AtomParentBox") {
                        var n = at["atom-property-name"].value;
                        this.addInclude(n);
                        return;
                    }
                    if (type && type.value == "AtomChildListBox")
                        return;
                    var ce = new ChildEnumerator(e);
                    while (ce.next()) {
                        this.findParentBox(ce.current());
                    }
                }
            }
        });
    })(WebAtoms.AtomListBox.prototype);


    (function (baseType) {
        return classCreatorEx({
            name: "WebAtoms.AtomParentBox",
            base: baseType,
            start: function (e) {
                $(e).addClass("atom-parent-box");
                e.setAttribute("atom-local-scope", "true");
                var _this = this;
                this.selectCommand = function () {
                    _this.onSelectCommand.apply(_this, arguments);
                };
                this.deleteCommand = function () {
                    _this.onDeleteCommand.apply(_this, arguments);
                };
                this.windowClosed = function () {
                    return _this.onWindowClosed.apply(_this, arguments);
                }
            },
            properties: {
                displayName: "",
                searchText: "",
                labelPath: "",
                sortPath: "",
                propertyName: "",
                query: null,
                include: null,
                fields: null,
                mode: "view",
                itemTemplate: undefined
            },
            methods: {
                onSelectCommand: function (scope, sender) {
                    var item = Atom.get(sender, "selectedItem");
                    var d = this.get_data();
                    //Atom.set(this, "data", item);
                    Atom.set(this, "searchText", "");
                    var ce = Atom.get(this, "atomParent.data");
                    Atom.set(ce, this._propertyName, item);
                    this.invokeAction(this._next);
                },

                onDeleteCommand: function (scope, sender) {
                    var c = Atom.get(this, "data");
                    var d = { _$_entityName: c._$_entityName, _$_temp: true };
                    if (this._labelPath)
                        d[this._labelPath] = "";
                    var ce = Atom.get(this, "atomParent.data");
                    Atom.set(ce, this._propertyName, d);
                    Atom.set(this, "scope._v", Atom.get(this, "scope._v") + 1);
                },


                set_propertyName: function (n) {
                    this.get_scope()._v = 1;
                    this._propertyName = n;

                    this.setValue('data', "[$owner.atomParent.data." + n + "]", true, this._element);

                },
                set_labelPath: function (n) {
                    this._sortPath = n;
                    this._labelPath = n;
                    this._searchPath = n;
                    this.setValue('displayName', "[$data." + n + "]", true, this._element);
                    if (!this._itemTemplate) {
                        this._itemTemplate = Templates.compileJsonML([["div", {
                            "atom-text": "[$data." + n + "]"
                        }]]);
                    }
                },
                get_objectLink: function () {
                    var type = this.getEntityType();
                    switch (this._mode) {
                        case "add":
                            return Atom.url(entityContext.prefix + '/entity/' + type + '/search?window=1&insert=true&modify=true');
                        case "change":
                            return Atom.url(entityContext.prefix + '/entity/' + type + '/search?window=1');
                    }
                    var d = this.get_data();
                    if (!d)
                        return "";
                    var q = {};
                    q[d._$_key] = d._$_id;
                    q['id'] = d._$_id;
                    return Atom.url(entityContext.prefix + '/entity/' + d._$_entityName + '/search?window=1&edit=true', null, q);
                },

                get_windowTitle: function () {
                    var type = this.getEntityType();
                    switch (this._mode) {
                        case 'add':
                            return "Add " + type;
                        case 'change':
                            return "Search " + type;
                    }
                    return "Modify " + this.get_displayName();
                },


                getEntityType: function () {
                    var d = Atom.get(this, "atomParent.data");
                    var pt = entityContext.getMetaDataEntity(d._$_entityName);
                    var ct = pt.parent[this._propertyName];
                    return ct.type;
                },

                getQuery: function (t) {
                    var d = Atom.get(this, "atomParent.data");
                    var pt = entityContext.getMetaDataEntity(d._$_entityName);
                    var ct = pt.parent[this._propertyName];
                    var q = {};
                    if (t) {
                        if (/^\*/.test(t) && t.length > 1) {
                            t = t.substr(1);
                            q[this._searchPath + ":Contains"] = t;
                        } else {
                            q[this._searchPath + ":StartsWith"] = t;
                        }
                    }
                    if (this._query) {
                        q = this._query;
                    }
                    return entityContext.search(ct.type, { include: this._include, fields: this._fields, orderBy: this._sortPath, query: q }).showError(false).showProgress(false);
                },

                onWindowClosed: function (scope, sender) {
                    var d = sender.get_value();
                    if (!d)
                        return;
                    var e = entityContext.attach(Atom.clone(d), this.getEntityType());
                    var ce = Atom.get(this, "atomParent.data");
                    Atom.set(ce, this._propertyName, d);
                }
            }
        });
    })(WebAtoms.AtomControl.prototype);


    (function (baseType) {
        return classCreatorEx({
            name: "WebAtoms.AtomEntityForm",
            base: baseType,
            start: function () { },
            properties: {
                includeList: ""
            },
            methods: {
                addInclude: function (n) {
                    var list = this._includeList.split(',');
                    var ae = new AtomEnumerator(list);
                    while (ae.next()) {
                        var item = ae.current();
                        if (item == n)
                            return;
                    }
                    list.push(n);
                    this._includeList = list.join(',');
                },

                findParentBox: function (e) {
                    var at = AtomUI.attributeMap(e, /atom\-|(type|property\-name)/gi);
                    var type = at["atom-type"];
                    if (type && type.value == "AtomParentBox") {
                        var n = at["atom-property-name"].value;
                        this.addInclude(n);
                        return;
                    }
                    if (type && (type.value == "AtomChildListBox" || type.value == "AtomWindow"))
                        return;
                    var ce = new ChildEnumerator(e);
                    while (ce.next()) {
                        this.findParentBox(ce.current());
                    }
                },
                createChildren: function () {

                    this.findParentBox(this._element);

                    baseType.createChildren.apply(this, arguments);
                }
            }
        });
    })(WebAtoms.AtomForm.prototype);

    (function (baseType) {
        return classCreatorEx({
            name: "WebAtoms.AtomEntitySaveButton",
            base: baseType,
            start: function () { },
            properties: {
            },
            methods: {
                onClickHandler: function () {
                    var _this = this;
                    entityContext.saveCommand().then(function () {
                        _this.invokeAction(_this._next);
                    }).invoke();
                }
            }
        });
    })(WebAtoms.AtomButton.prototype);

})(window);