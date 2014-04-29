/// <reference path="AtomToggleButtonBar.js" />

(function (baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomYesNoControl",
        base: baseType,
        start: function () {
            this._allowSelectFirst = false;
            this._items = [
                { label: "Yes", value: true },
                { label: "No", value: false }
            ];
        },
        methods: {
            init: function () {
                this._element.style.height = "26px";
                baseType.init.call(this);
            }
        }
    });
})(WebAtoms.AtomToggleButtonBar.prototype);