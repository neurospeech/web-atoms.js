/// <reference path="AtomListBox.js" />

(function (window, baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomToggleButtonBar",
        base: baseType,
        start: function (e) {
            this._allowSelectFirst = true;
            this._allowMultipleSelection = false;
            this._showTabs = false;
            this._autoScrollToSelection = false;

            $(e).removeClass("atom-list-box");
        },
        properties: {
            showTabs: false
        },
        methods: {
            initialize: function () {

                baseType.initialize.call(this);

                this.setValue("class", "[$owner.showTabs ? 'atom-tab-button-bar' : 'atom-toggle-button-bar']", true, this._element);
            }
        }
    });
})(window, WebAtoms.AtomListBox.prototype);