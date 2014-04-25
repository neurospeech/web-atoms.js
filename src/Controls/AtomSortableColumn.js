/// <reference path="AtomControl.js" />

(function (window, baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomSortableColumn",
        base: baseType,
        start: function () {
        },
        properties: {
            direction: "",
            defaultDirection: "",
            label: "",
            sortField: null
        },
        methods: {
            set_direction: function (v) {
                this._direction = v;
                $(this._element).removeClass("atom-sort-asc");
                $(this._element).removeClass("atom-sort-desc");
                if (v) {
                    $(this._element).addClass("atom-sort-" + v.toLowerCase());
                }
            },

            set_value: function (v) {
                this._value = v;
                this.refreshUI();
            },

            refreshUI: function () {
                if (!this._value)
                    return;
                if (this._value.indexOf(this._sortField) == -1) {
                    AtomBinder.setValue(this, "direction", "");
                    return;
                }

                if (this._value.lastIndexOf("desc") != this._value.length - 4) {
                    AtomBinder.setValue(this, "direction", "asc");
                } else {
                    AtomBinder.setValue(this, "direction", "desc");
                }
            },

            onClick: function (e) {
                if (!this._direction) {
                    AtomBinder.setValue(this, "direction", this._defaultDirection);
                } else {
                    if (this._direction == "asc") {
                        AtomBinder.setValue(this, "direction", "desc");
                    } else {
                        AtomBinder.setValue(this, "direction", "asc");
                    }
                }
                AtomBinder.setValue(this, "value", this._sortField + " " + this._direction);
            },

            initialize: function () {
                baseType.initialize.call(this);

                this.bindEvent(this._element, "click", "onClick");
                $(this._element).addClass("atom-column");

            },

            onUpdateUI: function () {
                this.refreshUI();
            }
        }
    });
})(window, WebAtoms.AtomControl.prototype);
