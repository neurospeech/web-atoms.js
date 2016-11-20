/// <reference path="AtomButton.js" />

(function (base) {
    return classCreatorEx({
        name: "WebAtoms.AtomPostButton",
        base: base,
        start:function(){
        },
        properties: {
            postData: null,
            postResult: null,
            postError: null,
            postUrl: null,
            next: null,
            errorNext: null,
            confirm: false,
            confirmMessage: null,
            mergeData: null
        },
        methods: {
            get_postData: function () {
                return this._postData || this.get_data();
            },

            onClickHandler: function (e) {
                if (this._confirm) {
                    var _this = this;
                    Atom.confirm(this._confirmMessage, function () {
                        _this.onConfirmed(e);
                    });
                    return;
                }
                this.onConfirmed(e);
            },

            onConfirmed: function (e) {


                if (!this._postUrl) {
                    base.onClickHandler.apply(this, arguments);
                    return;
                }

                var vr = this._validationRoot;
                if (vr) {
                    vr.validate();
                    var errors = vr.get_errors();
                    if (errors.length) {
                        alert(Atom.mapJoin(errors,'label'));
                        return false;
                    }
                }


                var errors = this.get_errors();
                if (errors.length) {

                    alert(Atom.mapJoin(errors, 'label'));

                    return false;
                }


                var data = this.get_postData();

                if (data === null || data === undefined)
                    return;

                var m = this._mergeData;
                if (m) {
                    for (var i in m) {
                        data[i] = m[i];
                    }
                }

                //data = AtomBinder.getClone(data);

                var caller = this;
                var invokeNext = function (p) {
                    AtomBinder.setValue(caller, "postResult", p.value());
                    caller.invokeAction(caller._next);
                };

                //this.invokeAjax(this._postUrl, { type: "POST", data: data, success: invokeNext });


                var p = AtomPromise.json(this._postUrl, null, { type: "POST", data: data });
                p.then(invokeNext);

                var errorNext = this._errorNext;
                if (errorNext) {
                    p.failed(function (pr) {
                        AtomBinder.setValue(caller, "postError", pr);
                        caller.invokeAction(caller, errorNext);
                    });
                }

                p.invoke();

            }
        }
    });
})(WebAtoms.AtomButton.prototype);