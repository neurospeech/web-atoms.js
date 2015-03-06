/// <reference path="..\\Controls\\AtomControl.js" />

(function (baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomForm",
        base: baseType,
        start: function () {
            this._success = null;
            this._submit = null;
            this._error = null;
            this._attachments = null;
        },
        properties: {
            result: null,
            mergeData: null,
            mergeResult: true,
            postUrl: null,
            postData: null,
            successMessage: null,
            clearData:false
        },
        methods: {
            createFormLayout: function () {
            },


            preparePostData: function () {


                var element = this.get_element();
                var data = this._postData || this.get_data();

                var m = this._mergeData;
                if (m) {
                    for (var i in m) {
                        data[i] = m[i];
                    }
                }

                return data;
            },

            onSubmit: function () {

                if (!this.isValid()) {
                    return;
                }

                var data = this.preparePostData();
                var url = AtomPromise.getUrl(this._postUrl);
                AtomPromise.json(url, { _tv: Atom.time() }, { type: "POST", data: data }).then(this._success).invoke();
            },

            onSuccess: function (p) {

                var result = p.value();

                AtomBinder.setValue(this, "result", result);

                if (this._mergeResult) {
                    // merge...
                    // AtomBinder.setValue(this, "data", result);
                    var data = this.get_data();
                    for (var index in result) {
                        AtomBinder.setValue(data, index, result[index]);
                    }
                }

                if (this._clearData) {
                    var data = this.get_data();
                    for (var index in this._clearData) {
                        AtomBinder.setValue(data, index, result[index]);
                    }
                }

                if (this._successMessage) {
                    Atom.alert(this._successMessage);
                }

                this.invokeAction(this._next);

            },

            onKeyUp: function (e) {
                if (e.target && e.target.nodeName && /textarea/gi.test(e.target.nodeName))
                    return;
                if (e.keyCode == 13) {
                    var _this = this;
                    // fix for IE 11, IE 11 does not fire Change event on enter
                    if (/input/gi.test(e.target.nodeName)) {
                        $(e.target).change();
                    }
                    WebAtoms.dispatcher.callLater(function () {
                        _this.onSubmit();
                    });
                }
            },

            isValid: function () {
                var element = this.get_element();
                var ae = new ChildEnumerator(element);
                var formValid = true;
                while (ae.next()) {
                    var field = ae.current();
                    if (!this.validate(field))
                        formValid = false;
                }
                return formValid;
            },


            validateField: function (e) {
                var target = e.target;
                this.validate(target);
            },

            validate: function (e, ef) {

                if (!ef)
                    ef = $(e).data("field-error");

                var ctrl = e.atomControl;
                var val = null;
                var skip = false;
                if (!ctrl) {
                    if ((/input|select|textarea/i).test(e.nodeName)) {
                        val = $(e).val();
                    } else {
                        skip = true;
                    }
                } else {
                    if (ctrl.constructor == WebAtoms.AtomFormField) {
                        return ctrl.validate();
                    }
                    val = AtomBinder.getValue(ctrl, "value");
                }

                if (!skip) {

                    var req = $(e).attr("atom-required");
                    if (req && !val) {
                        // error...
                        $(ef).text("Required");
                        $(e).addClass("atom-data-error");
                        return false;
                    }


                    var re = $(e).attr("atom-regex");
                    if (!re) {
                        var dt = $(e).attr("atom-data-type");
                        if (dt) {
                            switch (dt) {
                                case "email":
                                    re = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                    break;
                            }
                        }
                    } else {
                        re = eval("(" + re + ")");
                    }

                    if (re) {
                        if (!re.test(val)) {
                            $(ef).text("Invalid");
                            $(e).addClass("atom-data-error");
                            return false;
                        }
                    }

                    $(ef).text("");
                    $(e).removeClass("atom-data-error");
                }

                // return for every children??
                var ae = new ChildEnumerator(e);
                var isValid = true;
                while (ae.next()) {
                    if (!this.validate(ae.current(), ef)) {
                        isValid = false;
                    }
                }

                return isValid;
            },

            init: function () {
                baseType.init.call(this);

                var _this = this;
                this._success = function () {
                    _this.onSuccess.apply(_this, arguments);
                };

                this._submit = function () {
                    WebAtoms.dispatcher.callLater(function () {
                        _this.onSubmit.apply(_this, arguments);
                    });
                };

                var element = this.get_element();

                this.submitCommand = this._submit;

                this.bindEvent(element, "keyup", "onKeyUp");

                $(element).find("input[type=submit]").bind("click", null, this._submit);
                $(element).find("button[type=submit]").bind("click", null, this._submit);


                var _this = this;
                this._vh = function () {
                    _this.validateField.apply(_this, arguments);
                };

                $(element).find("input,select,textarea").bind("blur", null, this._vh);



            }

        }
    });
})(WebAtoms.AtomControl.prototype);

