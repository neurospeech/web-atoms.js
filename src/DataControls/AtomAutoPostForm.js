/// <reference path="AtomForm.js" />

(function (window, baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomAutoPostForm",
        base: baseType,
        start: function () {
        },
        properties: {
            isBusy: false,
            postError: null
        },
        methods: {
            pushPost: function (n) {
                if (this._isBusy)
                    return;
                if (this._pushPostTimeout) {
                    clearTimeout(this._pushPostTimeout);
                }
                if (!n)
                    n = 1000;
                var _this = this;
                this._pushPostTimeout = setTimeout(function () {
                    WebAtoms.dispatcher.callLater(function () {
                        _this.onSubmit();
                    });
                }, n);
            },

            onSubmit: function () {

                this._pushPostTimeout = 0;

                // already submitted?
                if (this._isBusy)
                    return;

                // for all nested children...
                if (!this.isValid()) {
                    //alert("Invalid Form");
                    return;
                }

                var data = this.preparePostData();
                if (!data)
                    return;

                var str = JSON.stringify(AtomBinder.getClone(data));
                if (this._cachedData) {
                    if (str == this._cachedData)
                        return;
                }
                this._cachedData = str;

                var self = this;

                var url = AtomPromise.getUrl(this._postUrl);

                //data = AtomBinder.getClone(data);

                //this.invokeAjax(url, { type: "POST", data: data, success: self._success });
                var ap = AtomPromise.json(url, null, { type: "POST", data: data }).then(self._success);
                ap.failed(function () {
                    self._isBusy = false;
                    self._postError = ap.error.msg;
                    AtomBinder.refreshValue(self, "isBusy");
                    AtomBinder.refreshValue(self, "postError");
                });
                ap.showProgress(false);
                ap.showError(false);
                ap.invoke();
            },

            onCreationComplete: function () {
                baseType.onCreationComplete.apply(this, arguments);
                var data = this.preparePostData();
                if (!data)
                    return;
                this._cachedData = JSON.stringify(AtomBinder.getClone(data));
            },

            onSuccess: function (p) {

                baseType.onSuccess.apply(this, arguments);

                this._isBusy = false;
                AtomBinder.refreshValue(this, "isBusy");
            },

            onKeyUp: function (e) {

                this.pushPost();

                if (e.target && e.target.nodeName && /textarea/gi.test(e.target.nodeName))
                    return;
                if (e.keyCode == 13) {
                    this.onSubmit();
                }
            },

            initialize: function () {
                baseType.initialize.call(this);

                var _this = this;
                this.pushPostHandler = function () {
                    _this.pushPost(1000);
                };
                this.bindEvent(this._element, 'click', this.pushPostHandler);

                $(this._element).find('input,select,textarea').bind('change', null, this.pushPostHandler)
            }
        }
    });
})(window, WebAtoms.AtomForm.prototype);


