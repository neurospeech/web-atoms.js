/// <reference path="AtomPostButton.js" />

(function (window, base) {
    return classCreatorEx({
        name: "WebAtoms.AtomDeleteButton",
        base: base,
        start: function () {
            this._confirm = true;
            this._confirmMessage = "Are you sure you want to delete this item?";
        },
        methods: {

        },
        properties: {

        }
    });
})(window, WebAtoms.AtomPostButton.prototype);

