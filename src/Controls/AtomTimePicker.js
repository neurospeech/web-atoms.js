/// <reference path="AtomAutoCompleteBox.js" />

(function (window, baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomTimePicker",
        base: baseType,
        properties: {
            displayLabel: "9:00 AM"
        },
        methods: {
            initialize: function () {
                this._autoOpen = true;
                var items = [];
                for (var i = 0; i <= 23; i++) {
                    var a = "AM";
                    var n = i;
                    if (i > 11) {
                        a = "PM";
                        if (i > 12) {
                            n = i - 12;
                        }
                    }
                    var item = n + ":00 " + a;
                    items.push({ label: item, value: item });
                    item = n + ":30 " + a;
                    items.push({ label: item, value: item });
                }
                this._items = items;
                baseType.initialize.call(this);
            }
        }
    });
})(window, WebAtoms.AtomAutoCompleteBox.prototype);