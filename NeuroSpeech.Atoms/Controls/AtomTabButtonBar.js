/// <reference path="atomlinkbar.js" />

(function (baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomTabButtonBar",
        base: baseType,
        start: function () {
            this._allowMultipleSelection = false;
            this._showTabs = true;
        },
        methods: {

        }
    });
})(WebAtoms.AtomLinkBar.prototype);
