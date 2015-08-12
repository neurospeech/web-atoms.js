/// <reference path="../controls/AtomControl.js" />

(function (baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomFormField",
        base: baseType,
        start: function () {
            this._presenters = ["contentPresenter"];
        },
        properties: {
            error: undefined,
            dataType: null,
            label: undefined,
            fieldClass: undefined,
            required: false,
            field: null,
            fieldVisible: true
        },
        methods: {
            set_fieldVisible: function (v) {
                this._fieldVisible = v;
                $(this._element).css("display", v ? '' : 'none');
            },
            set_fieldClass: function (v) {
                this._fieldClass = v;
                this.setLocalValue('class', v, this._element);
            },
            set_required: function (v) {
                this._required = v;
            },

            onCreated: function () {
                this.setup();
            },
            setup: function () {
                if (!this._created)
                    return;

                var e = this._element;

                if (this._contentPresenter) {
                    this._contentPresenter.appendChild(this._element.contentElement);
                }

                AtomBinder.refreshValue(this, "fieldClass");
            }
        }
    });
})(WebAtoms.AtomControl.prototype);
