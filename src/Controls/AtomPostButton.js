/// <reference path="AtomButton.js" />

(function (window, base) {
    return classCreatorEx({
        name: "WebAtoms.AtomPostButton",
        base: base,
        start:function(){
        },
        properties: {
            postData: null,
            postResult: null,
            postUrl: null,
            next: null,
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
                AtomPromise.json(this._postUrl, null, { type: "POST", data: data }).then(invokeNext).invoke();

            }
        }
    });
})(window, WebAtoms.AtomButton.prototype);