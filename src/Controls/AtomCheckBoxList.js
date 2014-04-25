/// <reference path="AtomItemsControl.js" />

(function (window, base) {
    return classCreatorEx(
    {
        name: "WebAtoms.AtomCheckBoxList",
        base: base,
        start: function () {
            this._allowMultipleSelection = true;
            this._valueSeparator = ", ";
            this._dataElements = [];
        },
        methods: {
            initialize: function () {
                base.initialize.call(this);
                $(this._element).addClass("atom-check-box-list");
            }
        }
    });
})(window, WebAtoms.AtomItemsControl.prototype);

