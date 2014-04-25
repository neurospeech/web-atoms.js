/// <reference path="AtomControl.js" />

(function (window, base) {
    return classCreatorEx({
        name: "WebAtoms.AtomMultiButtonList",
        base: base,
        start: function () {
            this._dataElements = [];
        },
        properties: {
            labelPath: "label",
            valuePath: "value",
            options: null,
            isRadio: false,
            items:null
        },
        methods: {
            set_options: function (v) {
                this._options = v;
                if (v) {
                    this.onCollectionChangedInternal("refresh", -1, null);
                }
            },
            set_value: function (v) {
                this._value = v;
                this.updateSelections();
            },
            set_items: function (v) {
                if (this._items) {
                    this.unbindEvent(this._items, "CollectionChanged", "onCollectionChangedInternal");
                }
                this._items = v;

                // try starting observing....
                if (v != null) {
                    this.bindEvent(this._items, "CollectionChanged", "onCollectionChangedInternal");
                    this.onCollectionChangedInternal("refresh", -1, null);
                }
            },

            onCollectionChangedInternal: function (mode, index, item) {
                var value = this.get_value();

                this.onCollectionChanged(mode, index, item);

                // update selections !!!
                this.set_value(value);
            },
            onCollectionChanged: function (mode, index, item) {
                if (!this._items || !this._options)
                    return;
                this._dataElements = [];
                this.unbindEvent(null, "change", "onDataChange");
                var ae = new AtomEnumerator(this._items);
                var parentScope = this.get_scope();
                while (ae.next()) {
                    var data = ae.current();
                    this.createChildElement(parentScope, this._element, data);
                }

                this.updateUI();
            },

            updateSelections: function () {

                if (!this._dataElements || this._dataElements.length == 0)
                    return;

                ace = new AtomEnumerator(this._dataElements);
                while (ace.next()) {
                    $(ace.current()).attr("checked", false);
                }

                if (!this._value)
                    return;

                var ae;
                var ace;
                var item;
                var selections = this._value.split(",");

                ace.reset();

                var cb;
                while (ace.next()) {
                    cb = ace.current();
                    ae = new AtomEnumerator(selections);
                    while (ae.next()) {
                        item = ae.current();
                        item = $.trim(item);
                        if ($(cb).val() == item) {
                            $(cb).attr("checked", "true");
                        }
                    }
                }
            },

            onDataChange: function () {
                var ae = new AtomEnumerator(this._dataElements);
                var add = [];
                while (ae.next()) {
                    var item = ae.current();
                    var dataItem = $(item).val();
                    var checked = $(item).attr("checked");
                    if (checked) {
                        add.push(dataItem);
                    }
                }
                this._value = add.join(", ");
                AtomBinder.refreshValue(this, "value");
            },

            createChildElement: function (parentScope, parentElement, data) {
                var span = document.createElement("SPAN");
                parentElement.appendChild(span);

                parentElement = span;
                span = document.createElement("SPAN");
                var lp = this.get_labelPath();
                var vp = this.get_valuePath();
                l = data;
                v = data;
                if (lp)
                    l = data[lp];
                if (vp)
                    v = data[vp];


                var gpName = null;
                if (this._isRadio) {
                    gpName = "_g" + AtomUI.getNewIndex();
                }

                parentElement.appendChild(span);

                var options = new AtomEnumerator(this._options);
                while (options.next()) {
                    var op = options.current();
                    if (vp) {
                        op = op[vp];
                    }

                    var val = v + "." + op;

                    var cb = document.createElement("INPUT");
                    if (this._isRadio) {
                        $(cb).attr("type", "radio");
                        $(cb).attr("name", gpName);
                    } else {
                        $(cb).attr("type", "checkbox");
                    }
                    $(cb).val(val);
                    span.appendChild(cb);
                    this.bindEvent(cb, "change", "onDataChange");
                    this._dataElements.push(cb);
                }

                span = document.createElement("SPAN");
                parentElement.appendChild(span);
                // Create Label First..
                var txt = document.createTextNode(l);
                span.appendChild(txt);
                //span.style.float = "left";

            }
        }
    });
})(window, WebAtoms.AtomControl.prototype);