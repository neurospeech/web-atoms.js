/// <reference path="AtomDateListBox.js" />
/// <reference path="AtomPopup.js" />

(function (window, base) {
    return classCreatorEx({
        name: "WebAtoms.AtomDateField",
        base: base,
        start: function (e) {
            this._presenters = ["calendarPresenter", "itemsPresenter"];
            $(e).addClass("atom-date-field");
        },
        properties: {
            isOpen: false
        },
        methods: {
            onPopupRemoved: function (e) {
                AtomBinder.setValue(this, "isOpen", false);
            },

            set_isOpen: function (v) {
                this._isOpen = v;
                if (v) {
                    this.getTemplate("popupTemplate");

                    this.popup = AtomUI.cloneNode(this._popupTemplate);
                    //this.popup._logicalParent = this._element;
                    this.popup._templateParent = this;
                    //this.popup.style.visibility = "hidden";
                    //document.body.appendChild(this.popup);
                    this._element.appendChild(this.popup);
                    this.onCreateChildren(this.popup);
                    this.setProperties(this.popup);
                    this.initChildren(this.popup);
                    //var _this = this;
                    //WebAtoms.dispatcher.callLater(function () {
                    //    AtomPopup.show(_this._element, _this.popup, 0, function () {
                    //        _this.onPopupRemoved(_this.popup);
                    //    });
                    //});
                } else {
                    //AtomPopup.hide(this.popup);
                    this.disposeChildren(this.popup);
                    $(this.popup).remove();
                }
            },
            get_isOpen: function () {
                return this._isOpen;
            },

            get_selectedItem: function () {
                if (this._selectedItems.length)
                    return this._selectedItems[0];
                return null;
            },

            set_value: function (v) {
                v = AtomDate.parse(v);
                this._value = v;
                this._selectedItems.length = 0;
                if (v) {

                    this._selectedItems.push({ date: v, dateLabel: AtomDate.toShortDateString(v), value: AtomDate.toMMDDYY(v), label: v.getDate() });
                    this.set_visibleDate(v);
                }
                if (this._created) {
                    AtomBinder.refreshItems(this._selectedItems);
                    AtomBinder.refreshValue(this, "value");
                    AtomBinder.refreshValue(this, "selectedItem");
                    AtomBinder.refreshValue(this, "selectedItems");
                }
            },
            get_value: function (v) {
                if (this._selectedItems.length)
                    return this._selectedItems[0].date;
                return this._value;
            },

            toggleDate: function (scope, sender) {
                var item = sender.get_data();
                this._selectedItems.length = 0;
                AtomBinder.addItem(this._selectedItems, item);
                AtomBinder.refreshValue(this, "value");
                AtomBinder.refreshValue(this, "selectedItem");
                AtomBinder.refreshValue(this, "selectedItems");
                AtomBinder.setValue(this, "isOpen", false);
            }


        }
    });
})(window, WebAtoms.AtomDateListBox.prototype);
