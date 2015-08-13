/// <reference path="../controls/AtomControl.js" />

(function (baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomFormField",
        base: baseType,
        start: function () {
            this._presenters = ["contentPresenter"];
        },
        properties: {
            label: undefined,
            fieldId:undefined,
            fieldClass: undefined,
            required: false,
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
            onCreated: function () {
                this.setup();
            },
            setup: function () {
                if (!this._created)
                    return;

                if (this._contentPresenter) {
                    this._contentPresenter.appendChild(this._element.contentElement);
                }

                AtomBinder.refreshValue(this, "fieldClass");
            }
        }
    });
})(WebAtoms.AtomControl.prototype);
