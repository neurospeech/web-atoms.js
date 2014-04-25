/// <reference path="../WebAtoms.Core.js" />

var allControls = {
};

window.allControls = allControls;

(function (name, base) {
    return classCreator(name, base,
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

                var a = $('[atom-type]').first()[0];
                if (a.atomControl != undefined && a.atomControl != null)
                    return;
                var ct = $(a).attr("atom-type");
                $(a).removeAttr("atom-type");
                var ctrl = new (WebAtoms[ct])(a);
                ctrl.setup();

            }
        }
        );
})("WebAtoms.AtomDispatcher",null);

WebAtoms.dispatcher = new WebAtoms.AtomDispatcher();

