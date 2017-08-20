/// <reference path="AtomControl.js" />

(function (base) {
    return classCreatorEx(
    {
        name: "WebAtoms.AtomButton",
        base: base,
        start: function (e) {
            this._sendData = false;
            $(e).addClass("atom-button");
        },
        properties: {
            sendData: false,
            validationRoot: null,
            command: null,
            commandParameter: null,
            invalid: null
        },
        methods: {

            onClickHandler: function (e) {

                AtomUI.cancelEvent(e);


                var vr = this._validationRoot;
                if (vr) {
                    vr.validate();
                    var errors = vr.get_errors();
                    if (errors.length) {
                        Atom.alert(Atom.mapJoin(errors, 'label'));
                        return false;
                    }
                }

                var errors = this.get_errors();
                if (errors.length) {

                    Atom.alert(Atom.mapJoin(errors, 'label'));

                    return false;
                }


                if (this._next) {

                    var inv = this._invalid;
                    if (inv) {
                        if ($.isArray(inv)) {
                            inv = inv.join();
                        }
                        if (inv) {
                            alert(inv);
                            return;
                        }
                    }

                    if (this._sendData && this._next) {
                        AtomBinder.setValue(this._next, "data", this.get_data());
                    }
                    this.invokeAction(this._next);
                }
                return false;
            },

            init: function () {

                var element = this._element;
                this.bindEvent(element, "click", "onClickHandler");
                this.bind(element, "isEnabled", [["command"],["command", "enabled"]], 0, function (v1,v2) {
                    return v1 ? v2 : true; 
                });
                base.init.apply(this);
            }
        }

    });
})(WebAtoms.AtomControl.prototype);