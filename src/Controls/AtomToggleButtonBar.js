/// <reference path="AtomListBox.js" />

(function (baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomToggleButtonBar",
        base: baseType,
        start: function (e) {
            this._allowSelectFirst = true;
            this._allowMultipleSelection = false;
            this._showTabs = false;
            this._autoScrollToSelection = false;

            $(e).removeClass("atom-list-box");

            if (! /ul/i.test(e.tagName)) {
                throw new Error("Button bar can only support UL style");
            }

        },
        properties: {
            showTabs: false
        },
        methods: {
            init: function () {

                baseType.init.call(this);

                this.setValue("class", "[$owner.showTabs ? 'atom-tab-button-bar' : 'atom-toggle-button-bar']", true, this._element);
            }
        }
    });
})(WebAtoms.AtomListBox.prototype);