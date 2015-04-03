/// <reference path="AtomControl.js" />

(function (baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomYesNoCustom",
        base: baseType,
        start: function () {
            this._presenters = ["yesNo", "input"];
            this._hasValue = false;
        },
        properties:{
            hasValue: false,
            placeholder: null
        },
        methods: {
            set_hasValue: function (v) {
                this._hasValue = v;
                if (!v) {
                    AtomBinder.setValue(this, "value", "");
                }
            },

            set_value: function (v) {
                this._value = v;
                AtomBinder.setValue(this, "hasValue", v ? true : false);
                if (!this._onUIChanged) {
                    $(this._input).val(v);
                }
            },
            onValueChange: function () {
                this._onUIChanged = true;
                var val = $(this._input).val();
                AtomBinder.setValue(this, "value", val);
                this._onUIChanged = false;
            },

            onUpdateUI: function () {
                $(this._input).addClass("atom-yes-no-custom-input");
                if (this._placeholder) {
                    AtomUI.attr(this._input, "placeholder", this._placeholder);
                    var pf = window.placeHolderFixer;
                    if(pf) pf.refresh();
                }
            },

            init: function () {

                baseType.init.call(this);

                this._yesNo = this._yesNo.atomControl;

                var input = this._input;
                this.bindEvent(input, "change", "onValueChange");
                //this.bindEvent(this._yesNo, "selectionChanged", "onSelectionChanged");
            }
        }
    });
})(WebAtoms.AtomControl.prototype);
