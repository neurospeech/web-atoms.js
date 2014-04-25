/// <reference path="AtomCheckBoxList.js" />

(function (window, baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomRadioButtonList",
        base: baseType,
        start: function () {
            this._allowMultipleSelection = false;
        },
        properties: {

        },
        methods: {
            updateChildSelections: function () {
                var dataItems = this.get_dataItems();
                var ae = new AtomEnumerator(dataItems);
                var children = this._dataElements;
                while (ae.next()) {
                    var dataItem = ae.current();
                    var item = children[ae.currentIndex()];
                    if (this.isSelected(dataItem)) {
                        $(item).attr("checked", "true");
                    } else {
                        $(item).removeAttr("checked");
                    }
                }
            },


            onDataChange: function (event) {
                this._onUIChanged = true;

                var item = event.target;
                var dataItem = item;
                if (this.hasItems())
                    dataItem = $(item).data("atom-data-item");
                var checked = $(item).attr("checked");

                AtomBinder.clear(this._selectedItems);

                if (this.isSelected(dataItem)) {
                    if (!checked) {
                        AtomBinder.removeItem(this._selectedItems, dataItem);
                    }
                }
                else {
                    if (checked) {
                        AtomBinder.addItem(this._selectedItems, dataItem);
                    }
                }

                this._onUIChanged = false;

            },

            createChildElement: function (parentScope, parentElement, data) {
                var span = document.createElement("SPAN");
                var cb = document.createElement("INPUT");
                $(cb).attr("type", "radio");
                $(cb).attr("name", this._groupName);
                var lp = this.get_labelPath();
                var vp = this.get_valuePath();
                l = data;
                v = data;
                if (lp)
                    l = data[lp];
                if (vp)
                    v = data[vp];
                $(cb).data("atom-data", v);
                $(cb).data("atom-data-item", data);
                $(cb).val(l);
                span.appendChild(cb);
                var txt = document.createTextNode(l);
                span.appendChild(txt);
                parentElement.appendChild(span);
                this.bindEvent(cb, "change", "onDataChange");
                return cb;
            },

            initialize: function () {
                this._groupName = "__g" + AtomUI.getNewIndex();
                baseType.initialize.call(this);
            }
        }
    });
})(window, WebAtoms.AtomCheckBoxList.prototype);

