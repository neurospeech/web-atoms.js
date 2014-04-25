/// <reference path="AtomControl.js" />
/// <reference path="AtomItemsControl.js" />


(function (window, base) {
    return classCreatorEx(
    {
        name: "WebAtoms.AtomComboBox",
        base: base,
        start: function () {
            this._labelPath = "label";
            this._valuePath = "value";
            this._allowSelectFirst = true;
        },
        methods: {
            invokePost: function () {
                if (this.get_selectedIndex() > 0) {
                    base.invokePost.apply(this, arguments);
                }
            },

            invokeNext: function () {
                base.invokeNext.apply(this, arguments);
                if (this._postUrl) {
                    AtomBinder.setValue(this, "selectedIndex", 0);
                    this.updateChildSelections();
                }
            },

            onSelectionChanged: function () {
                this._onUIChanged = true;
                var element = this.get_element();
                this.set_selectedIndex(element.selectedIndex);
                this._onUIChanged = false;

                //this.invokeAction(this._next);
            },

            updateChildSelections: function () {
                var element = this._element;
                element.selectedIndex = this.get_selectedIndex();
            },

            onCollectionChanged: function (mode, index, item) {
                var element = this.get_element();
                var dataItems = this.get_dataItems();
                element.options.length = dataItems.length;
                var ae = new AtomEnumerator(dataItems);

                var lp = this._labelPath;
                var vp = this._valuePath;
                var label = null;
                var value = null;
                var selectedValue = this.get_value();
                while (ae.next()) {
                    var data = ae.current();
                    label = data;
                    value = data;
                    if (lp)
                        label = label[lp];
                    if (vp)
                        value = value[vp];

                    element.options[ae.currentIndex()] = new Option(label, value, false, value == selectedValue);
                }
            },

            verifyTemplates: function () {
            },

            initialize: function () {

                var element = this.get_element();
                this.bindEvent(element, "change", "onSelectionChanged");
                base.initialize.apply(this, arguments);
            }
        }
    });
})(window, WebAtoms.AtomItemsControl.prototype);



