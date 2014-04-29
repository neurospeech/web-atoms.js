/// <reference path="../../../jquery-1.8.2.min.js" />
/// <reference path="../../../atoms-debug.js" />

(function (window, base) {
    return classCreatorEx({
        name: "AtomClock",
        base: base,
        start: function (e) {
            // e: associated element
        },
        properties: {
            /* Time Property */
            time: (new Date())
        }

    });
})(window, WebAtoms.AtomControl);