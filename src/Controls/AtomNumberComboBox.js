/// <reference path="AtomComboBox.js" />

(function (window, base) {

    var AtomUI = window.AtomUI;

    return classCreatorEx({
        name: "WebAtoms.AtomNumberComboBox",
        base: base,
        start: function () { },
        properties: {
            showPrompt: false,
            startNumber: undefined,
            endNumber: undefined,
            step:1
        },
        methods: {
            set_startNumber: function (v) {
                this._startNumber = v;
                this.resetNumbers();
            },

            set_endNumber: function (v) {
                this._endNumber = v;
                this.resetNumbers();
            },

            set_step: function (v) {
                if (!v)
                    return;
                this._step = v;
                this.resetNumbers();
            },

            onLoaded: function () {
                this.resetNumbers();
            },

            resetNumbers: function () {
                if (!this._created)
                    return;
                if ((this._startNumber === undefined) || (this._endNumber === undefined))
                    return;
                var sn = AtomUI.toNumber(this._startNumber);
                var en = AtomUI.toNumber(this._endNumber);
                var step = AtomUI.toNumber(this._step);
                var numbers = [];
                if (this._showPrompt) {
                    numbers.push({ label: "Select", value: 0 });
                }
                for (; sn <= en; sn += step) {
                    numbers.push({ label: sn, value: sn });
                }

                this.set_items(numbers);
            }
        }
    });
})(window, WebAtoms.AtomComboBox.prototype);

