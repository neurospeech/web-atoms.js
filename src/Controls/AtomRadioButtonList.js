/// <reference path="AtomItemsControl.js" />

(function (baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomRadioButtonList",
        base: baseType,
        start: function () {
            this._allowMultipleSelection = false;
        },
        properties: {
            groupName:""
        },
        methods: {
            init: function () {
                this._groupName = "__g" + AtomUI.getNewIndex();
                baseType.init.call(this);
            }
        }
    });
})(WebAtoms.AtomItemsControl.prototype);

