/// <reference path="../WebAtoms.Core.js" />

var allControls = {
};

window.allControls = allControls;

(function (base) {
    return classCreator("WebAtoms.AtomDispatcher", base,
        function () {
            this._paused = false;
            this.queue = [];
            this.onTimeout = function () {
                if (this._paused)
                    return;
                if (this.queue.length == 0) {
                    var app = atomApplication._element;
                    if (app.style.visibility == "hidden" || $(app).css("visibility") == "hidden") {
                        app.style.visibility = "visible";

                        app.atomControl.updateUI();
                    }
                    return;
                }
                var item = this.queue.shift();
                //try{
                item();
                //} catch (ex) {

                //    if (window.console) {
                //        window.console.log(item.toString());
                //        window.console.log(JSON.stringify(ex));
                //    }
                //}
                window.setTimeout(this._onTimeout, 1);
            };
            //this._onTimeout = Function.createDelegate(this, this.onTimeout);
            var _this = this;
            this._onTimeout = function () {
                _this.onTimeout();
            };
        },
        {
            pause: function () {
                this._paused = true;
            },
            start: function () {
                this._paused = false;
                window.setTimeout(this._onTimeout, 1);
            },
            callLater: function (fn) {
                this.queue.push(fn);
                if (!this._paused)
                    this.start();
            },
            setupControls: function () {

                //if (window.console) {
                //    window.console.log("Starting Web Atoms");
                //}

                var a = $('[data-atom-type],[atom-type]').first()[0];
                if (a.atomControl != undefined && a.atomControl != null)
                    return;
                var ct = AtomUI.getAtomType(a);
                $(a).removeAttr("atom-type");
                $(a).removeAttr("data-atom-type");
                var ctrl = new (WebAtoms[ct])(a);
                ctrl.setup();

            }
        }
        );
})();

WebAtoms.dispatcher = new WebAtoms.AtomDispatcher();

function aggregateHandler(f,i) {

    function ah(fx) {
        this._handler = fx;

        var self = this;
        this.handler = function () {
            self.onEvent.apply(this, arguments);
        }
        this.invoke = function () {
            self._handler.apply(self, [self.args]);
        }
        this.onEvent = function (e) {
            self.args = e;
            if (self.timeout) {
                clearTimeout(self.timeout);
            }
            self.timeout = setTimeout(self.invoke, i || 500);
        }
    }

    return new ah(f);
}

