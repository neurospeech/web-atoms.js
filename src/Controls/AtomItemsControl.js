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
            this._presenters = ["itemsPresenter","virtualContainer"];
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



                //var errors = this.get_errors();
                //if (errors.length) {

                //    alert(errors.join("\n"));

                //    return false;
                //}

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

                if (this._uiVirtualize) {
                    var index = this.get_selectedIndex();
                    if (!this._ready) {
                        var self = this;
                        setTimeout(function () {
                            self.bringSelectionIntoView();
                        }, 1000);
                        return;
                    }
                    var avgHeight = this._avgHeight;
                    var vc = $(this._virtualContainer);

                    var vcHeight = vc.innerHeight();

                    var block = Math.ceil(vcHeight / avgHeight);
                    var itemsInBlock = block * this._columns;

                    var scrollTop = Math.floor(index / itemsInBlock);
                    vc.scrollTop(scrollTop * vcHeight);
                    


                    return;
                }

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

            validateScroller: function () {

                if (this._scrollerSetup)
                    return;

                var ip = this._itemsPresenter;
                var e = this._element;


                var vc = this._virtualContainer;
                if (!vc) {
                    if (ip == e || /table/i.test(e.nodeName)) {
                        throw new Error("virtualContainer presenter not found, you must put itemsPresenter inside a virtualContainer in order for Virtualization to work");
                    } else {
                        vc = this._virtualContainer = this._element;
                    }
                }

                var $vc = $(vc);
                $vc.css({
                    overflow: "auto"
                });

                this.bindEvent(vc, "scroll","onScroll");

                var $ip = $(ip);
                $ip.css({
                    overflow: "hidden"
                });

                //this.validateScroller = null;

                var isTable = /tbody/i.test(ip.nodeName);

                var fc, lc;

                if (isTable) {
                    fc = document.createElement("TR");
                    lc = document.createElement("TR");
                } else {
                    fc = document.createElement("DIV");
                    lc = document.createElement("DIV");
                }

                $(fc).addClass("sticky first-child").css({ posiiton:"relative", height: 0, width: "100%", clear: "both" });
                $(lc).addClass("sticky last-child").css({ posiiton:"relative", height: 0, width: "100%", clear: "both" });

                this._firstChild = fc;
                this._lastChild = lc;

                ip.appendChild(fc);
                ip.appendChild(lc);

                // let us train ourselves to find average height/width
                this._training = true;
                this._scrollerSetup = true;

            },

            postVirtualCollectionChanged: function () {
                var self = this;
                WebAtoms.dispatcher.callLater(function () {
                    self.onVirtualCollectionChanged();
                });
            },

            resetVirtulContainer: function () {
                this.disposeChildren(this._itemsPresenter);
                this._firstChild = null;
                this._lastChild = null;
                this._scrollerSetup = false;
                this._scopes = null;
                this.unbindEvent(this._virtualContainer, "scroll");
            },

            onVirtualCollectionChanged: function () {



                var ip = this._itemsPresenter;

                var items = this.get_dataItems();
                if (!items.length) {
                    this.resetVirtulContainer();
                    return;
                }



                this.validateScroller();

                var $ip = $(ip);

                var fc = this._firstChild;
                var lc = this._lastChild;

                var $fc = $(fc);
                var $lc = $(lc);

                var vc = this._virtualContainer;
                var $vc = $(vc);

                var vcHeight = $vc.innerHeight();
                var vcScrollHeight = vc.scrollHeight;

                if ( isNaN(vcHeight) || vcHeight <= 0 || vcScrollHeight <= 0) {
                    // leave it..
                    var self = this;
                    setTimeout(function () {
                        self.onVirtualCollectionChanged();
                    }, 1000);
                    return;
                }

                var vcWidth = $vc.innerWidth();

                var avgHeight = this._avgHeight;
                var avgWidth = this._avgWidth;

                var itemsHeight = vc.scrollHeight - $fc.outerHeight() - $lc.outerHeight();
                var itemsWidth = $ip.innerWidth();

                var parentScope = this.get_scope();

                var element = this._element;

                var ae = new AtomEnumerator(items);


                if (this._training) {
                    if (vcHeight >= itemsHeight/3) {
                        // lets add item...
                        var ce = lc.previousElementSibling;
                        var index = 0;
                        if (ce != fc) {
                            var data = ce.atomControl.get_data();
                            while (ae.next()) {
                                if (ae.current() == data) break;
                            };
                        }

                        if (ae.next()) {
                            var data = ae.current();
                            var elementChild = this.createChildElement(parentScope, null, data, ae);
                            //WebAtoms.dispatcher.callLater(function () { 
                            ip.insertBefore(elementChild,lc);
                            //});
                            this.applyItemStyle(elementChild, data, ae.isFirst(), ae.isLast());
                            this.postVirtualCollectionChanged();
                        }
                    } else {

                        // calculate avg height
                        var totalVisibleItems = 0;
                        var ce = fc.nextElementSibling;
                        var allHeight = 0;
                        var allWidth = 0;
                        while (ce != lc) {
                            totalVisibleItems++;
                            allHeight += $(ce).outerHeight(true);
                            allWidth += $(ce).outerWidth(true);
                            ce = ce.nextElementSibling;
                        }
                        totalVisibleItems--;
                        avgHeight = allHeight / totalVisibleItems;
                        avgWidth = allWidth / totalVisibleItems;
                        this._avgHeight = avgHeight;
                        this._avgWidth = avgWidth;

                        var columns = Math.floor(vcWidth / avgWidth);
                        var allRows = Math.ceil(items.length / columns);
                        var visibleRows = Math.ceil(totalVisibleItems / columns);

                        //this._visibleBlock = visibleRows * avgHeight;
                        //this._itemsInBlock = totalVisibleItems;
                        this._allRows = allRows;
                        this._columns = columns;

                        //this._allRows = allRows;
                        //this._visibleRows = visibleRows;

                        // set height of last child... to increase padding
                        $lc.css({
                            height: ((allRows-visibleRows) * avgHeight) + "px"
                        });
                        this._training = false;
                        this._ready = true;
                        this.postVirtualCollectionChanged();
                    }
                    return;

                }

                var self = this;

                if (this._isChanging) {
                    setTimeout(function () {
                        self.onVirtualCollectionChanged();
                    }, 100);
                    return;
                }
                this._isChanging = true;

                var block = Math.ceil(vcHeight / avgHeight);
                var itemsInBlock = block * this._columns;

                // lets simply recreate the view... if we are out of the scroll bounds... 
                var index = Math.max(0, Math.floor(vc.scrollTop / vcHeight) - 1);
                var itemIndex = index * itemsInBlock;
                console.log("First block index is " + index + " item index is " + index * itemsInBlock);

                if (itemIndex >= items.length) {
                    this._isChanging = false;
                    return;
                }

                var ce = fc.nextElementSibling;

                if (ce != lc) {
                    var scopeIndex = ce.atomControl.get_scope().itemIndex;
                    if (scopeIndex == itemIndex) {
                        console.log("No need to create any item");
                        this._isChanging = false;
                        return;
                    }
                }

                var remove = [];
                var cache = {};

                while (ce != lc) {
                    var c = ce;
                    ce = ce.nextElementSibling;
                    var s = c.atomControl.get_scope().itemIndex;
                    cache[s] = c;
                    //c.atomControl.dispose();
                    c.remove();
                }

                WebAtoms.dispatcher.pause();

                $fc.css({
                    height: index*vcHeight
                });

                var ae = new AtomEnumerator(items);
                for (var i = 0; i < itemIndex; i++) {
                    ae.next();
                }


                var after = fc;

                var last = null;

                for (var i = 0; i < itemsInBlock * 3; i++) {
                    if (!ae.next())
                        break;
                    var index2 = ae.currentIndex();
                    var data = ae.current();
                    var elementChild = cache[index2];
                    if (elementChild && element.atomControl.get_data() == data) {
                        cache[index2] = null;
                    } else {
                        elementChild = this.createChildElement(parentScope, null, data, ae);
                    }
                    elementChild.before = after.nextSibling;
                    WebAtoms.dispatcher.callLater(function () { 
                        ip.insertBefore(elementChild, elementChild.before);
                    });
                    after = elementChild;
                    this.applyItemStyle(elementChild, data, ae.isFirst(), ae.isLast());
                    last = index2;
                }


                for (var i in cache) {
                    if (!cache.hasOwnProperty(i))
                        continue;
                    var e = cache[i];
                    if (!e) continue;
                    WebAtoms.dispatcher.callLater(function () {
                        e.atomControl.dispose();
                        e.remove();
                    });
                    cache[i] = null;
                }

                var h = (this._allRows - block * 3) * avgHeight -  index * vcHeight;
                console.log("last child height = " + h);

                $lc.css({
                    height:  h
                });

                WebAtoms.dispatcher.callLater(function () {
                    self._isChanging = false;
                });
                WebAtoms.dispatcher.start();

                AtomBinder.refreshValue(this, "childAtomControls");
            },

            onCollectionChanged: function (mode, index, item) {

                if (/reset|refresh/i.test(mode)) {
                    this.resetVirtulContainer();
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

                if (this._uiVirtualize) {
                    this.onVirtualCollectionChanged();
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

                if (parentElement) {
                    WebAtoms.dispatcher.callLater(function () {
                        if (before) {
                            parentElement.insertBefore(elementChild, before);
                        } else {
                            parentElement.appendChild(elementChild);
                        }
                    });
                }

                var scopes = this._scopes || {
                };
                this._scopes = scopes;

                var index = ae ? ae.currentIndex() : -1;
                var scope = scopes[index] || new AtomScope(this, parentScope, parentScope.__application);
                scopes[index] = scope;
                if (ae) {
                    scope.itemIsFirst = ae.isFirst();
                    scope.itemIsLast = ae.isLast();
                    scope.itemIndex = index;
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
                this.resetVirtulContainer();
                base.dispose.call(this);
                this._selectedItems = null;
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