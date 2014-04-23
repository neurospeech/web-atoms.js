/// <reference path="atomcontrol.js" />
/// <reference path="atomlistbox.js" />

(function (window, base) {
    return classCreatorEx(
    {
        name: "WebAtoms.AtomAutoCompleteBox",
        base: base,
        start:
            function (e) {
                $(e).addClass("atom-auto-complete-box");
                this._presenters = ["itemsPresenter", "inputBox", "selectionBox"];
                this._mouseCapture = 0;
            },
        properties: {
            isPopupOpen: false,
            autoOpen: false,
            selectedText:'',
            placeholder: undefined,
            keyPressed: undefined,
            displayLabel: undefined
        },
        methods: {
            get_offsetLeft: function () {
                //return $(this._element).offset().left - parseInt( $(atomApplication._element).css("left") , 10);
                return $(this._element).offset().left;
            },
            get_offsetTop: function () {
                return $(this._element).offset().top;
            },

            get_offsetWidth: function () {
                return $(this._inputBox).offset().width;
            },

            set_itemsUrl: function (v) {
                var url = "[ !$owner.keyPressed ? undefined : AtomPromise.json('" + v + "').showProgress(false) ]";
                this.setValue("items", url, true, this._element);
            },

            set_isPopupOpen: function (v) {
                this._isPopupOpen = v;
                if (v) {
                    AtomBinder.refreshValue(this, "offsetTop");
                    AtomBinder.refreshValue(this, "offsetLeft");
                    AtomBinder.refreshValue(this, "offsetWidth");
                    //this.bindEvent(window, "click", "onWindowClick");
                    var _this = this;
                    this.trySelect();
                    this.bindEvent(window, "click", function () {
                        _this.onWindowClick.apply(_this, arguments);
                    });
                } else {
                    //this.unbindEvent(window, "click", "onWindowClick");
                    this.unbindEvent(window, "click");
                }
            },

            onSelectedItemsChanged: function () {
                if (this._onUIChanged) {
                    if (this._selectedItems.length > 0) {
                        this.refreshLabel();
                    }
                }
                base.onSelectedItemsChanged.apply(this, arguments);
            },

            onClick: function (e) {
                base.onClick.apply(this, arguments);
                this._backupValue = this.get_value();
                this.refreshLabel();
                this._backupLabel = this.get_displayLabel();
                AtomBinder.setValue(this, "keyPressed", false);
                AtomBinder.setValue(this, "isPopupOpen", false);
            },

            restoreSelection: function () {
                AtomBinder.setValue(this, "isPopupOpen", false);
                if (this._backupValue) {
                    AtomBinder.setValue(this, "value", this._backupValue);
                    AtomBinder.setValue(this, "displayLabel", this._backupLabel);
                    this._backupValue = null;
                } else {
                    AtomBinder.setValue(this, "selectedIndex", -1);
                }
            },

            onKeyUp: function (e) {

                AtomBinder.setValue(this, "isPopupOpen", true);

                switch (e.keyCode) {
                    case 27:
                        AtomBinder.setValue(this, "keyPressed", false);
                        this.restoreSelection();
                        return;
                    case 13:
                        AtomBinder.setValue(this, "keyPressed", false);
                        AtomBinder.setValue(this, "isPopupOpen", false);
                        this._backupValue = this.get_value();
                        this.refreshLabel();
                        this._backupLabel = this.get_displayLabel();
                        return AtomUI.cancelEvent(e);
                    case 37:
                        // Left
                        break;
                    case 38:
                        // up
                        AtomBinder.setValue(this, "keyPressed", false);
                        this.moveSelection(true);
                        return;
                    case 39:
                        // right
                        break;
                    case 40:
                        AtomBinder.setValue(this, "keyPressed", false);
                        this.moveSelection(false);
                        return;
                    default:
                        // try selecting complete word...
                        var caller = this;
                        this.dispatcher.callLater(function () {
                            caller.trySelect();
                        });
                        break;
                }

                if (this.oldTimeout) {
                    clearTimeout(this.oldTimeout);
                }
                var _this = this;
                this.oldTimeout = setTimeout(function () {
                    AtomBinder.setValue(_this, "keyPressed", true);
                }, 500);

            },

            trySelect: function () {

                if (!this._items || this._items.length == 0)
                    return;

                //if (this.get_selectedIndex() != -1)
                //    return;

                var ae = new AtomEnumerator(this._items);
                var lp = this._labelPath;

                var cl = this._displayLabel;

                if (cl)
                    cl = cl.toLowerCase();

                while (ae.next()) {
                    var item = ae.current();
                    var l = item;
                    if (lp)
                        l = l[lp];
                    if (l.toLowerCase().indexOf(cl)==0) {
                        AtomBinder.setValue(this, "selectedItem", item);
                        AtomBinder.setValue(this, "selectedText", l);
                        this.bringSelectionIntoView();
                        return;
                    }
                }
            },

            moveSelection: function (up) {
                if (!this._items || !this._items.length)
                    return;
                var i = this.get_selectedIndex();

                if (i == -1) {
                    this.backupLabel = this.get_displayLabel();
                }

                i = up ? (i - 1) : (i + 1);
                if (up && i == -2) {
                    i = this._items.length - 1;
                }
                if (!up && i == this._items.length) {
                    i = -1;
                }

                AtomBinder.setValue(this, "selectedIndex", i);
                if (i == -1) {
                    AtomBinder.setValue(this, "displayLabel", this.backupLabel || "");
                } else {
                    this.refreshLabel();
                }
            },

            refreshLabel: function () {
                var item = this.get_selectedItem();
                var l = item;
                if (l && this._labelPath) {
                    l = l[this._labelPath];
                }
                AtomBinder.setValue(this, "displayLabel", l || "");
            },

            onWindowClick: function (e) {
                var se = this._element;
                var p = this._itemsPresenter;
                var childElement = e.target;
                while (childElement.parentNode != null && childElement != se && childElement != p)
                    childElement = childElement.parentNode;
                if (childElement == se || childElement == p)
                    return;
                // close popup....
                this.restoreSelection();

            },

            onInputFocus: function () {
                if (!this._autoOpen)
                    return;
                this._backupValue = this.get_value();
                this._backupLabel = this.get_displayLabel();
                AtomBinder.setValue(this, "isPopupOpen", true);
                $(this._inputBox).select();
            },

            onInputBlur: function () {
                if (this._mouseCapture)
                    return;
                var caller = this;

                setTimeout(function () {
                    if (caller._isPopupOpen) {
                        AtomBinder.setValue(caller, "isPopupOpen", false);
                        caller.restoreSelection();
                    }
                }, 10);
            },

            onCreationComplete: function () {

                this._itemsPresenter._logicalParent = this._element;

                $(this._itemsPresenter).remove();

                document.body.appendChild(this._itemsPresenter);

                $(this._itemsPresenter).addClass("atom-auto-complete-popup");

                base.onCreationComplete.apply(this, arguments);
                this.bindEvent(this._itemsPresenter, "mouseover", "onMouseOver");
                this.bindEvent(this._itemsPresenter, "mouseout", "onMouseOut");
            },

            onMouseOver: function () {
                this._mouseCapture++;

            },

            onMouseOut: function () {
                var _this = this;
                setTimeout(function () {
                    _this._mouseCapture--;

                }, 1000);
            },

            initialize: function () {

                base.initialize.apply(this, arguments);
                this.bindEvent(this._inputBox, "focus", "onInputFocus");
                this.bindEvent(this._inputBox, "blur", "onInputBlur");
                this.bindEvent(this._inputBox, "keyup", "onKeyUp");
            },
            dispose: function () {
                if(this._itemsPresenter){
                    this.disposeChildren(this._itemsPresenter);
                    $(this._itemsPresenter).remove();
                    this._itemsPresenter = null;
                }
                base.dispose.call(this);
            }
        }
    });
})(window, WebAtoms.AtomListBox.prototype);

