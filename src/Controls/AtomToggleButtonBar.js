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

            //$(e).removeClass("atom-list-box");

            //if (! /ul/i.test(e.tagName)) {
            //    //throw new Error("Button bar can only support UL style");
            //    log("Button bar can only support UL style");
            //}

        },
        properties: {
            showTabs: false
        },
        methods: {

            setClass: function () {
                var $e = $(this._element);
                $e.removeClass("atom-tab-bar atom-toggle-button-bar");
                $e.addClass(this._showTabs ? 'atom-tab-bar' : 'atom-toggle-button-bar');
            },

            set_showTabs: function (v) {
                this._showTabs = v;
                this.setClass();
            }
        }
    });
})(WebAtoms.AtomListBox.prototype);