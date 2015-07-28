/// <reference path="AtomItemsControl.js" />

(function (baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomListBox",
        base: baseType,
        start: function (e) {
            this._labelPath = "label";
            this._valuePath = "value";

            this._autoScrollToSelection = false;

        },
        properties: {
            autoSelectOnClick: true
        },
        methods: {

            setClass: function () {
                var $e = $(this._element);
                $e.addClass("atom-list-box");
            },

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
                var $item = $(item);
                $item.removeClass("selected-item list-item first-item last-item");
                //$(item).removeClass("list-item");
                //$(item).removeClass("first-item");
                //$(item).removeClass("last-item");
                if (!dataItem)
                    return;
                $item.addClass("list-item");
                if (first) {
                    $item.addClass("first-item");
                }
                if (last) {
                    $item.addClass("last-item");
                }
                if (this.isSelected(dataItem)) {
                    $item.addClass("selected-item");
                }
            },

            onCreated: function () {
                this.bindEvent(this._itemsPresenter, "click", "onClick");
                baseType.onCreated.call(this);
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


            updateChildSelections: function () {
                var e = this._element;
                if (/select/i.test(e.tagName)) {
                    var i = this.get_selectedIndex();
                    if (e.selectedIndex != i) {
                        WebAtoms.dispatcher.callLater(function () {
                            e.selectedIndex = i;
                        });
                    }
                } else {
                    baseType.updateChildSelections.apply(this, arguments);
                }
            },

            init: function () {

                this.setClass();

                baseType.init.call(this);
                var self = this;

                var e = this._element;
                if (/select/i.test(e.tagName)) {
                    this.set_allowSelectFirst(true);
                    this.bindEvent(e, 'change', function () {
                        AtomBinder.setValue(self, 'selectedIndex', e.selectedIndex);
                    });
                }



                this.selectCommand = function () {
                    self.onSelectItem.apply(self, arguments);
                };
                this.selectAllCommand = function () {
                    self.set_selectAll(true);
                };
                this.clearSelectionCommand = function () {
                    self.set_selectedIndex(-1);
                };
            }
        }
    });
})(WebAtoms.AtomItemsControl.prototype);

