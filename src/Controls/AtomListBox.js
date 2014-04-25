/// <reference path="AtomItemsControl.js" />

(function (window, baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomListBox",
        base: baseType,
        start: function (e) {
            this._labelPath = "label";
            this._valuePath = "value";

            this._autoScrollToSelection = false;

            $(e).addClass("atom-list-box");
        },
        properties: {
            autoSelectOnClick: true
        },
        methods: {
            onClick: function (event) {

                if (!this._autoSelectOnClick)
                    return;

                this.onSelectItem(null, null, event);
                //return AtomUI.cancelEvent(event);
            },

            get_itemWidth: function () {
                if (!this._items || !this._items.length)
                    return 0;
                var w = $(this._element).innerWidth();
                return w / this._items.length;
            },

            applyItemStyle: function (item, dataItem, first, last) {
                $(item).removeClass("selected-item list-item first-item last-item");
                //$(item).removeClass("list-item");
                //$(item).removeClass("first-item");
                //$(item).removeClass("last-item");
                if (!dataItem)
                    return;
                $(item).addClass("list-item");
                if (first) {
                    $(item).addClass("first-item");
                }
                if (last) {
                    $(item).addClass("last-item");
                }
                if (this.isSelected(dataItem)) {
                    $(item).addClass("selected-item");
                }
            },

            onCreationComplete: function () {
                this.bindEvent(this._itemsPresenter, "click", "onClick");
                baseType.onCreationComplete.call(this);
            },

            invokePost: function () {
                if (this.get_selectedIndex() != -1) {
                    baseType.invokePost.apply(this, arguments);
                }
            },

            onSelectItem: function (scope, sender, event) {
                var target = event ? event.target : null;
                var element = this._itemsPresenter;
                var childElement = target || sender._element;
                while (childElement.parentNode != null && childElement.parentNode != element)
                    childElement = childElement.parentNode;
                if (childElement == document) {
                    //console.log("listbox clicked outside");
                    return;
                }
                var dataItem = childElement;
                if (this.hasItems()) {
                    dataItem = childElement.atomControl.get_data();
                }

                this.toggleSelection(dataItem);

            },

            initialize: function () {


                baseType.initialize.call(this);
                var _this = this;

                this.selectCommand = function () {
                    _this.onSelectItem.apply(_this, arguments);
                };
                this.selectAllCommand = function () {
                    _this.set_selectAll(true);
                };
                this.clearSelectionCommand = function () {
                    _this.set_selectedIndex(-1);
                };
            }
        }
    });
})(window, WebAtoms.AtomItemsControl.prototype);

