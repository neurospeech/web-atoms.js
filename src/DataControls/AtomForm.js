﻿/// <reference path="..\\Controls\\AtomControl.js" />

(function (baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomForm",
        base: baseType,
        start: function () {
            this._success = null;
            this._submit = null;
            this._errors = null;
            this._attachments = null;
        },
        properties: {
            result: null,
            mergeData: null,
            mergeResult: true,
            postUrl: null,
            postData: null,
            successMessage: null,
            clearData: false,
            errorTemplate: null
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

                //if (!this.isValid()) {
                //    return;
                //}

                this.validate();

                var errors = this.get_errors();
                if (errors.length) {
                    this.invokeAction({
                        localWindow: {
                            path: this.getTemplate("errorTemplate"),
                            prop: {
                                data: errors,
                                title: "Form Errors"
                            }
                        }
                    });
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

            validate: function () {
                errors.validate(this._element);
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



            }

        }
    });
})(WebAtoms.AtomControl.prototype);

