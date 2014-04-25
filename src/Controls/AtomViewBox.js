/// <reference path="AtomControl.js" />

(function (WebAtoms, baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomViewBox",
        base: baseType,
        start: function () {
            this._layout = WebAtoms.AtomViewBoxLayout.defaultInstance;
        },
        methods: {

        }
    });
})(WebAtoms, WebAtoms.AtomControl.prototype);

