/// <reference path="AtomControl.js" />

(function (base) {
    return classCreatorEx({
        name: "WebAtoms.AtomItemsControl",
        base: base,
        start: function () {
            this._selectedItems = [];
            this._selectedElements = [];
            this._selectedIndexSet = false;
            this._onUIChanged = false;
            this._itemsPresenter = null;
            this._itemsPanel = null;
            this._presenters = ["itemsPresenter"];
            this._childItemType = WebAtoms.AtomControl;
        },
        properties: {
            allowSelectFirst: false,
            allowMultipleSelection: false,
            uiVirtualize: false,
            defaultValue: null,
            autoScrollToSelection: false,
            /* this forces SelectAll Checkbox to ignore value of get_selectAll and forces its own value on click */
            selectAll: undefined,
            labelPath: "label",
            valuePath: "value",
            sortPath: null,
            valueSeparator: null,
            postData: null,
            errorNext: null,
            postUrl: null,
            confirm: false,
            confirmMessage: null,
            filter: null,
            items: null,
            itemTemplate: null
        },
        methods: {
            get_postData: function () {
                return this._postData || this.get_selectedItem();
            },
            get_allValues: function () {
                if (!this._valueSeparator)
                    return;
                if (!this._valuePath)
                    return;
                var list = [];
                var vp = this._valuePath;
                var vfp = function (item) {
                    return item[vp];
                };
                var ae = Atom.query(this.get_dataItems());
                while (ae.next()) {
                    list.push(vfp(ae.current()));
                }
                return list.join(this._valueSeparator);
            },
            get_value: function () {

                if (this._allowMultipleSelection) {
                    var items = this._selectedItems;
                    if (items.length == 0) {
                        if (this._value !== undefined)
                            return this._value;
                        return null;
                    }
                    items = AtomArray.getValues(items, this._valuePath);
                    if (this._valueSeparator)
                        items = items.join(this._valueSeparator);
                    return items;
                }

                var s = this.get_selectedItem();
                if (!s) {
                    if (this._value !== undefined)
                        return this._value;
                    return null;
                }
                if (this._valuePath) {
                    s = s[this._valuePath];
                }
                return s;
            },
            set_value: function (v) {
                this._value = v;
                if (v === undefined || v === null) {
                    // reset...
                    AtomBinder.clear(this._selectedItems);
                    return;
                }
                var dataItems = this.get_dataItems();
                if (this._allowMultipleSelection && this._valueSeparator) {
                    if (v.constructor != String) {
                        v = "" + v;
                    }
                    v = AtomArray.split(v, this._valueSeparator);
                } else {
                    v = [v];
                }
                var items = AtomArray.intersect(dataItems, this._valuePath, v);
                this._selectedItems.length = 0;
                var ae = new AtomEnumerator(items);
                while (ae.next()) {
                    this._selectedItems.push(ae.current());
                }
                AtomBinder.refreshItems(this._selectedItems);
            },
            set_sortPath: function (v) {
                this._sortPath = v;
                if (v) {
                    this.onCollectionChangedInternal("refresh", -1, null);
                }
            },
            set_selectAll: function (v) {
                if (v === undefined || v === null)
                    return;
                this._selectedItems.length = 0;
                var items = this.get_dataItems();
                if (v && items) {
                    var ae = new AtomEnumerator(items);
                    while (ae.next()) {
                        this._selectedItems.push(ae.current());
                    }
                }
                this._selectAll = true;
                AtomBinder.refreshItems(this._selectedItems);
            },
            refresh: function () {
                if (this._promises && this._promises.items) {
                    this._promises.items.invoke();
                }

            },

            set_defaultValue: function (v) {
                if (this.get_value())
                    return;
                AtomBinder.setValue(this, "value", v);
            },
            invokePost: function () {
                if (!this._onUIChanged)
                    return;



                var errors = this.get_errors();
                if (errors.length) {

                    alert(errors.join("\n"));

                    return false;
                }

                if (this._confirm) {
                    if (!confirm(this._confirmMessage))
                        return;
                }

                if (!this._postUrl) {
                    this.invokeAction(this._next);
                    return;
                }

                var data = this.get_postData();

                if (data === null || data === undefined)
                    return;

                data = AtomBinder.getClone(data);

                var caller = this;
                var p = AtomPromise.json(this._postUrl, null, { type: "POST", data: data });
                p.then(function () {
                    caller.invokeNext();
                });
                var errorNext = this._errorNext;
                if (errorNext) {
                    p.failed(function (pr) {
                        caller.invokeAction(errorNext);
                    });
                }
                p.invoke();
            },

            invokeNext: function () {
                this.invokeAction(this._next);
            },

            set_filter: function (f) {
                if (f == this._filter)
                    return;
                this._filter = f;
                this._filteredItems = null;
                if (this.hasItems()) {
                    this.onCollectionChangedInternal("refresh", -1, null);
                }
            },

            isSelected: function (item) {
                var se = new AtomEnumerator(this._selectedItems);
                var sitem = null;
                while (se.next()) {
                    sitem = se.current();
                    if (sitem == item) {
                        return true;
                    }
                }
                return false;
            },

            get_dataItems: function () {
                var r = this._items;
                if (this.hasItems()) {
                    var f = this._filter;
                    if (f) {
                        //if (this._filteredItems)
                        //    return this._filteredItems;
                        var a = [];
                        if (typeof f == 'object') {
                            a = Atom.query(r).where(f).toArray();
                        } else {
                            var ae = new AtomEnumerator(r);
                            while (ae.next()) {
                                var item = ae.current();
                                if (f(item, ae.currentIndex())) {
                                    a.push(item);
                                }
                            }
                        }
                        this._filteredItems = a;
                        r = a;
                    }

                    var sp = this._sortPath;
                    if (sp) {
                        var spf = window.AtomFilter.sort(sp);
                        r = r.sort(spf);
                    }
                    return r;
                }
                return $(this._itemsPresenter).children();
            },

            getIndexOfDataItem: function (item) {
                if (item == null)
                    return -1;
                var array = this.get_dataItems();
                var ae = new AtomEnumerator(array);
                while (ae.next()) {
                    if (ae.current() == item)
                        return ae.currentIndex();
                }
                return -1;
            },
            getDataItemAtIndex: function (index) {
                if (index == -1)
                    return null;
                return this.get_dataItems()[index];
            },

            get_childAtomControls: function () {
                var p = this._itemsPresenter || this._element;
                var r = [];
                var ce = new ChildEnumerator(p);
                while (ce.next()) {
                    var a = ce.current();
                    a = !a || a.atomControl;
                    if (!a)
                        continue;
                    r.push(a);
                }
                return r;
            },

            get_selectedChild: function () {
                var item = this.get_selectedItem();
                if (!this.hasItems())
                    return item;
                var ce = new ChildEnumerator(this._itemsPresenter);
                while (ce.next()) {
                    var child = ce.current();
                    if (child.atomControl.get_data() == item)
                        return child;
                }
                return null;
            },

            set_allowSelectFirst: function (b) {
                b = b ? b != "false" : b;
                this._allowSelectFirst = b;
            },

            get_selectedItem: function () {
                if (this._selectedItems.length > 0)
                    return this._selectedItems[0];
                return null;
            },
            set_selectedItem: function (value) {
                if (value) {
                    this._selectedItems.length = 1;
                    this._selectedItems[0] = value;
                } else {
                    this._selectedItems.length = 0;
                }
                AtomBinder.refreshItems(this._selectedItems);
            },

            get_selectedItems: function () {
                return this._selectedItems;
            },
            set_selectedItems: function () {
                // watching !!!
                // updating !!!
                throw new Error("Not yet implemented");
            },

            get_selectedIndex: function () {
                var item = this.get_selectedItem();
                return this.getIndexOfDataItem(item);
            },
            set_selectedIndex: function (value) {
                AtomBinder.setValue(this, "selectedItem", this.getDataItemAtIndex(value));
            },

            updateChildSelections: function (type, index, item) {

            },

            bringSelectionIntoView: function () {

                // do not scroll for first auto select 
                if (this._allowSelectFirst && this.get_selectedIndex() == 0)
                    return;

                //var children = $(this._itemsPresenter).children();
                var ae = new ChildEnumerator(this._itemsPresenter);
                while (ae.next()) {
                    var item = ae.current();
                    var dataItem = item.atomControl ? item.atomControl.get_data() : item;
                    if (this.isSelected(dataItem)) {
                        item.scrollIntoView();
                        return;
                    }
                }
            },

            updateSelectionBindings: function () {
                AtomBinder.refreshValue(this, "value");
                AtomBinder.refreshValue(this, "selectedItem");
                AtomBinder.refreshValue(this, "selectedItems");
                AtomBinder.refreshValue(this, "selectedIndex");
                if (!this._selectedItems.length) {
                    if (this._selectAll === true) {
                        this._selectAll = false;
                        AtomBinder.refreshValue(this, "selectAll");
                    }
                }
            },

            onSelectedItemsChanged: function (type, index, item) {
                if (!this._onUIChanged) {
                    this.updateChildSelections(type, index, item);
                    if (this._autoScrollToSelection) {
                        this.bringSelectionIntoView();
                    }
                }
                this.updateSelectionBindings();
                this.updateUI();

                this.invokePost();
            },


            hasItems: function () {
                return this._items != undefined && this._items != null;
            },

            get_items: function () {
                return this._items;
            },
            set_items: function (v) {
                var _this = this;
                if (this._items) {
                    this.unbindEvent(this._items, "CollectionChanged", null);
                }
                this._items = v;
                this._filteredItems = null;
                // try starting observing....
                if (v != null) {
                    this.bindEvent(this._items, "CollectionChanged", function () {
                        _this.onCollectionChangedInternal.apply(_this, arguments);
                    });
                    this.onCollectionChangedInternal("refresh", -1, null);
                }
            },
            set_itemTemplate: function (v) {
                this._itemTemplate = v;
                this.onCollectionChangedInternal("refresh", -1, null);
            },

            onCollectionChangedInternal: function (mode, index, item) {
                if (!this._created)
                    return;

                Atom.refresh(this, "allValues");

                var value = this.get_value();

                if (this.hasItems()) {
                    this.onCollectionChanged(mode, index, item);
                    //this._selectedItems.length = 0;
                    if (!(value || this._allowSelectFirst)) {
                        AtomBinder.clear(this._selectedItems);
                    }
                }


                if (value != null) {
                    this.set_value(value);
                    if (this.get_selectedIndex() != -1) {
                        return;
                    } else {
                        this._value = undefined;
                    }
                }

                this.selectDefault();

            },

            selectDefault: function () {


                if (this._allowSelectFirst) {
                    if (this.get_dataItems().length > 0) {
                        this.set_selectedIndex(0);
                        return;
                    }
                }

                this.updateSelectionBindings();
            },

            onScroll: function () {
                if (this.scrollTimeout) {
                    clearTimeout(this.scrollTimeout);
                }
                var _this = this;
                this.scrollTimeout = setTimeout(function () {
                    _this.scrollTimeout = 0;
                    _this.onVirtualCollectionChanged();
                }, 10);
            },

            onVirtualCollectionChanged: function () {
                var element = this._itemsPresenter;
                var items = this.get_dataItems(true);

                var parentScope = this.get_scope();

                var et = this.getTemplate("itemTemplate");
                if (et) {
                    et = AtomUI.getAtomType(et);
                    if (et) {
                        this._childItemType = et;
                    }
                }

                var ae = new AtomEnumerator(items);
                WebAtoms.dispatcher.pause();

                if (this._itemsPresenter == this._element) {
                    var d = document.createElement("DIV");
                    var $d = $(d);
                    $d.addClass("atom-virtual-container");
                    //$d.css("width", $(this._itemsPresenter).innerWidth());
                    $d.css({posiiton:"absolute",width: "100%", height:"100%"});
                    this._element.innerHTML = "";
                    this._element.appendChild(d);
                    this._itemsPresenter = d;
                    element = this._itemsPresenter;
                }

                var cache = this._cachedItems;
                if (!cache) {
                    cache = {};
                    this.disposeChildren(element);
                }
                this._cachedItems = cache;

                //this.disposeChildren(element);

                if (!items.length) {
                    WebAtoms.dispatcher.start();

                    AtomBinder.refreshValue(this, "childAtomControls");
                    return;
                }

                var scroller = this._itemsPresenter.parentElement;
                var $scroller = $(scroller);
                $scroller.css("overflow", "auto");

                $(element).css("position", "relative");

                var scrollerWidth = $scroller.width();
                var scrollerHeight = $scroller.height();



                this.unbindEvent(scroller, "scroll");

                var n = items.length;
                var presenterWidth = $(this._itemsPresenter).innerWidth();



                var t = this.getTemplate("itemTemplate");
                var $t = $(t);
                var h = $t.outerHeight(true);
                var w = $t.outerWidth(true);

                if (!(h || w)) {
                    throw new Error("Either width or height must be explicitly specified for virtualization");
                }

                var cols = 1;
                var rows = 1;

                if (h > 0) {
                    if (w > 0) {
                        // wrap...
                        if (presenterWidth <= 0) {
                            if (console) {
                                console.warn("presenterWidth is 0, you may need to stretch width", this);
                            }
                        }
                        cols = Math.ceil(presenterWidth / w) || 1;
                        rows = Math.ceil(n / cols) || 1;
                        $scroller.css("overflow-x", "hidden");
                    } else {
                        if (!scrollerHeight)
                            throw new Error("Height must be explicitly specified for wrapping container");
                        rows = n;
                        $scroller.css("overflow-y", "auto");
                        $scroller.css("overflow-x", "hidden");

                    }
                } else {

                }

                if (h > 0) {
                    $(this._itemsPresenter).height(rows * h);
                } else {
                    $(this._itemsPresenter).width(cols * w);
                }

                var visibleX = Math.floor(scroller.scrollLeft / (w || 1));
                var visibleY = Math.floor(scroller.scrollTop / (h || 1));
                var widthX = (( Math.floor( scroller.offsetWidth / (w || 1))) -1) || 1;
                var heightX = scroller.offsetHeight / (h || 1);


                var removed = [];

                while (ae.next()) {

                    var index = ae.currentIndex();
                    var yindex = Math.floor(index / cols);
                    var xindex = index % cols;

                    var elementChild = cache[index];

                    if (xindex < visibleX || xindex > visibleX + widthX) {
                        if (elementChild) {
                            cache[index] = null;
                            removed.push(elementChild);
                        }
                        continue;
                    }
                    if (yindex < visibleY || yindex > visibleY + heightX) {
                        if (elementChild) {
                            cache[index] = null;
                            removed.push(elementChild);
                        }
                        continue;
                    }

                    if (elementChild) {
                        continue;
                    }

                    var data = ae.current();
                    elementChild = this.createChildElement(parentScope, element, data, ae);
                    cache[index] = elementChild;
                    var $ec = $(elementChild);
                    $ec.css("position", "absolute");
                    if (w > 0) {
                        $ec.css("width", w + "px");
                        $ec.css("left", (xindex * w) + "px");
                    }
                    if (h > 0) {
                        $ec.css("top", (yindex * h) + "px");
                    }

                    this.applyItemStyle(elementChild, data, ae.isFirst(), ae.isLast());

                }

                var _this = this;
                this.bindEvent(scroller, "scroll", function () {
                    _this.onScroll();
                });

                WebAtoms.dispatcher.start();

                ae = new AtomEnumerator(removed);
                while (ae.next()) {
                    var item = ae.current();
                    item.atomControl.dispose();
                    $(item).remove();
                }

                AtomBinder.refreshValue(this, "childAtomControls");
            },

            onCollectionChanged: function (mode, index, item) {

                if (/reset|refresh/i.test(mode)) {
                    this._scopes = {};
                    this._cachedItems = null;
                }

                if (this._uiVirtualize) {
                    this.onVirtualCollectionChanged();
                    return;
                }

                // just reset for now...
                if (/remove/gi.test(mode)) {
                    // simply delete and remove...
                    var ce = new ChildEnumerator(this._itemsPresenter);
                    while (ce.next()) {
                        var c = ce.current();
                        if (c.atomControl && c.atomControl.get_data() == item) {
                            c.atomControl.dispose();
                            $(c).remove();
                            break;
                        }
                    }
                    this.updateUI();
                    return;
                }

                var parentScope = this.get_scope();

                var et = this.getTemplate("itemTemplate");
                if (et) {
                    et = AtomUI.getAtomType(et);
                    if (et) {
                        this._childItemType = et;
                    }
                }

                if (/add/gi.test(mode)) {
                    WebAtoms.dispatcher.pause();

                    var ae = new AtomEnumerator(this._items);
                    var ce = new ChildEnumerator(this._itemsPresenter);
                    while (ae.next()) {
                        ce.next();
                        var c = ce.current();
                        if (ae.currentIndex() == index) {
                            var ctrl = this.createChildElement(parentScope, this._itemsPresenter, item, ae, c);
                            this.applyItemStyle(ctrl, item, ae.isFirst(), ae.isLast());
                            break;
                        }
                        if (ae.isLast()) {
                            var ctrl = this.createChildElement(parentScope, this._itemsPresenter, item, ae);
                            this.applyItemStyle(ctrl, item, ae.isFirst(), ae.isLast());
                            break;
                        }
                    }

                    WebAtoms.dispatcher.start();
                    this.updateUI();
                    return;
                }

                var element = this._itemsPresenter;

                var dataItems = this.get_dataItems();


                //AtomUI.removeAllChildren(element);
                this.disposeChildren(element);
                //this._dataElements.length = 0;
                // rebuild from template...

                WebAtoms.dispatcher.pause();

                // implement stock...


                var items = this.get_dataItems(true);

                var added = [];

                var ae = new AtomEnumerator(items);


                    this.getTemplate("itemTemplate");

                    while (ae.next()) {
                        var data = ae.current();
                        var elementChild = this.createChildElement(parentScope, element, data, ae);
                        added.push(elementChild);
                        this.applyItemStyle(elementChild, data, ae.isFirst(), ae.isLast());
                    }


                    //var ae = new AtomEnumerator(items);
                    //while (ae.next()) {
                    //    var data = ae.current();
                    //    var elementChild = this.createChildElement(parentScope, element, data, ae);
                    //    this.applyItemStyle(elementChild, data, ae.isFirst(), ae.isLast());
                    //}
                    var self = this;
                    WebAtoms.dispatcher.callLater(function () {
                        var dirty = [];
                        var ce = new ChildEnumerator(element);
                        while (ce.next()) {
                            var item = ce.current();
                            var f = added.filter(function (fx) { return item == fx; });
                            if (f.pop() != item) {
                                dirty.push(item);
                            }
                        }
                        ce = new AtomEnumerator(dirty);
                        while (ce.next()) {
                            var item = ce.current();
                            //self.dispose(item);
                            if (item.atomControl) {
                                item.atomControl.dispose();
                            }
                            $(item).remove();
                        }

                    });

                

                WebAtoms.dispatcher.start();

                AtomBinder.refreshValue(this, "childAtomControls");


            },

            set_innerTemplate: function (v) {
                this._itemsPresenter = this._element;
                base.set_innerTemplate.apply(this, arguments);
                this.onCollectionChangedInternal("mode", -1, null);
            },

            applyItemStyle: function (item, dataItem, first, last) {
            },

            createChildElement: function (parentScope, parentElement, data, ae, before) {

                var elementChild = AtomUI.cloneNode(this._itemTemplate);
                elementChild._logicalParent = parentElement;
                elementChild._templateParent = this;
                elementChild._isDirty = true;

                WebAtoms.dispatcher.callLater(function () {
                    if (before) {
                        parentElement.insertBefore(elementChild, before);
                    } else {
                        parentElement.appendChild(elementChild);
                    }
                });

                var scopes = this._scopes || {};
                this._scopes = scopes;

                var scope = scopes[ae.currentIndex()] || new AtomScope(this, parentScope, parentScope.__application);
                scopes[ae.currentIndex()] = scope;
                if (ae) {
                    scope.itemIsFirst = ae.isFirst();
                    scope.itemIsLast = ae.isLast();
                    scope.itemIndex = ae.currentIndex();
                    scope.itemExpanded = false;
                    scope.data = data;
                    scope.get_itemSelected = function () {
                        return scope.owner.isSelected(data);
                    };
                    scope.set_itemSelected = function (v) {
                        scope.owner.toggleSelection(data, true);
                    };
                }

                var ac = AtomUI.createControl(elementChild, this._childItemType, data, scope);
                return elementChild;
            },

            toggleSelection: function (data) {
                this._onUIChanged = true;
                this._value = undefined;
                if (this._allowMultipleSelection) {
                    if (AtomUI.contains(this._selectedItems, data)) {
                        AtomBinder.removeItem(this._selectedItems, data);
                    } else {
                        AtomBinder.addItem(this._selectedItems, data);
                    }
                } else {
                    this._selectedItems.length = 1;
                    this._selectedItems[0] = data;
                    AtomBinder.refreshItems(this._selectedItems);
                }
                this._onUIChanged = false;
            },

            onUpdateUI: function () {
                base.onUpdateUI.call(this);

                if (this._uiVirtualize) {
                    this.onVirtualCollectionChanged();
                }

                var ae = new ChildEnumerator(this._itemsPresenter);
                while (ae.next()) {
                    var item = ae.current();
                    if (!item.atomControl)
                        continue;
                    var dataItem = item.atomControl.get_data();
                    AtomBinder.refreshValue(item.atomControl.get_scope(), "itemSelected");
                    this.applyItemStyle(item, dataItem, ae.isFirst(), ae.isLast());
                }
            },

            onCreated: function () {


                if (this._items) {
                    this.onCollectionChangedInternal("refresh", -1, null);
                }

                var caller = this;

                this.dispatcher.callLater(function () {
                    if (caller._autoScrollToSelection) {
                        caller.bringSelectionIntoView();
                    }
                });

            },

            dispose: function () {
                base.dispose.call(this);
                this._selectedItems = null;
                this._scopes = null;
                this._cachedItems = null;
            },


            init: function () {

                var element = this.get_element();


                // set self as Items Presenter..
                if (!this._itemsPresenter) {
                    this._itemsPresenter = this._element;
                }
                else {
                    //this._layout = WebAtoms.AtomViewBoxLayout.defaultInstnace;
                }

                var _this = this;
                this.bindEvent(this._selectedItems, "CollectionChanged", function () {
                    _this.onSelectedItemsChanged.apply(_this, arguments);
                });
                base.init.apply(this, arguments);


                var caller = this;

                this.removeItemCommand = function (scope, sender) {
                    if (!sender)
                        return;
                    var d = sender.get_data();
                    AtomBinder.removeItem(caller._items, d);
                };

                this.removeSelectedCommand = function (scope, sender) {
                    var s = caller.get_selectedItems().slice(0);
                    var ae = new AtomEnumerator(s);
                    while (ae.next()) {
                        AtomBinder.removeItem(caller.get_items(), ae.current());
                    }
                };

                this.removeAllCommand = function (scope, sender) {
                    AtomBinder.clear(caller.get_items());
                };
            }
        }
    });
})(WebAtoms.AtomControl.prototype);