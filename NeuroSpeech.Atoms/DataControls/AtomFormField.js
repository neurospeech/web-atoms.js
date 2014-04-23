/// <reference path="../controls/AtomControl.js" />

(function (window, baseType) {
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
            isValid: undefined,
            regex: null,
            fieldValue: undefined,
            field: null,
            requiredMessage: "Required",
            invalidMessage: "Invalid",
            fieldVisible: true,
            validate: false,
            isValidSet: false
        },
        methods: {
            set_dataType: function (v) {
                this._dataType = v;
                this.setup();
            },

            set_fieldValue: function (v) {
                this._fieldValue = v;
                if (!this._validate)
                    return;
                this.validate();
            },
            set_isValid: function (v) {
                this._isValid = v;
                this._isValidSet = true;
                if (!this._validate)
                    return;
                this.validate();
            },
            set_regex: function (v) {
                this._regex = v;
                this.setup();
            },
            set_required: function (v) {
                this._required = v;
                this.setup();
            },
            validateChildren: function (e) {
                var ae = new ChildEnumerator(e);
                while (ae.next()) {
                    var child = ae.current();

                    if (child.atomControl) {
                        this.validateValue(AtomBinder.getValue(child.atomControl, "value"));
                    } else {
                        if (/input|select|textarea/gi.test(child.nodeName)) {
                            this.validateValue($(child).val());
                        } else {
                            this.validateChildren(child);
                        }
                    }
                }
            },
            validateValue: function (v) {
                if (this._required) {
                    if (!v) {
                        AtomBinder.setValue(this, "error", this._requiredMessage);
                        this._isValid = false;
                        return;
                    }
                } else {
                    // if value is not required
                    // and if value is empty
                    // it is a valid value
                    if (!v) {
                        this._isValid = true;
                        return;
                    }
                }

                var re = null;

                if (/email/gi.test(this._dataType)) {
                    re = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                } else {
                    if (this._regex) {
                        re = eval("(" + this._regex + ")");
                    }
                }

                if (re) {
                    if (!re.test(v)) {
                        AtomBinder.setValue(this, "error", this._invalidMessage);
                        this._isValid = false;
                        return;
                    }
                }
            },
            validate: function () {
                this._validate = true;
                if (!(this._required || this._regex || this._dataType))
                    return this._isValid === undefined ? true : this._isValid;



                if (this._isValid) {
                    AtomBinder.setValue(this, "error", "");
                    if (this._isValidSet) {
                        return true;
                    }
                }

                this._isValid = true;

                if (this._fieldValue !== undefined) {
                    this.validateValue(this._fieldValue);
                } else {
                    // check validity..
                    this.validateChildren(this._element);
                }
                if (this._isValid) {
                    AtomBinder.setValue(this, "error", "");
                }
                return this._isValid;
            },
            onCreationComplete: function () {
                this.setup();
            },
            onFocusOut: function () {
                this._validate = true;
                this.validate();
            },
            setup: function () {
                if (!this._created)
                    return;

                // find two way bindings...
                var e = this._element;

                if (this._contentPresenter) {
                    this._contentPresenter.appendChild(this._element.contentElement);
                }

                var ae = new AtomEnumerator($(e).find("input,select,textarea"));
                while (ae.next()) {
                    var item = ae.current();
                    this.bindEvent(item, "blur", "onFocusOut");
                    this.bindEvent(item, "change", "onFocusOut");
                }

                AtomBinder.refreshValue(this, "fieldClass");
            }
        }
    });
})(window, WebAtoms.AtomControl.prototype);
