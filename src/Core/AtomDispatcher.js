/// <reference path="../WebAtoms.Core.js" />

var allControls = {
};

window.allControls = allControls;

(function (base) {
    return classCreator("WebAtoms.AtomDispatcher", base,
        function () {
            this._paused = false;
            //this.queue = [];
            this.head = null;
            this.tail = null;
            this.onTimeout = function () {
                if (this._paused)
                    return;
                if (!this.head) {
                    return;
                }
                var item = this.head;
                this.head = item.next;
                if (!this.head) {
                    // we have reached end...
                    this.tail = null;
                }
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
                //this.queue.push(fn);
                if (this.tail) {
                    this.tail.next = fn;
                    this.tail = fn;
                }
                else {
                    // queue is empty..
                    this.head = fn;
                    this.tail = fn;
                }
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

                var self = this;
                this.callLater(function () {
                    self.callLater(function () {
                        var app = atomApplication._element;
                        if (app.style.visibility == "hidden" || $(app).css("visibility") == "hidden") {
                            app.style.visibility = "visible";

                            app.atomControl.updateUI();
                        }
                    });
                });

            }
        }
        );
})();

WebAtoms.dispatcher = new WebAtoms.AtomDispatcher();

function aggregateHandler(f,i) {

    function ah(fx) {
        this._handler = fx;

        var self = this;

        this.invoke = function () {
            try {
                self._handler.apply(self, self.args);
            }
            catch (e) {
                if (console) {
                    console.log(e);
                }
            }
            finally {
                self.timeout = 0;
                self.pending = false;
            }
        }

        this.handler = function () {
            if (self.pending)
                return;
            self.pending = true;
            self.args = arguments;
            if (self.timeout) {
                clearTimeout(self.timeout);
            }
            self.timeout = setTimeout(self.invoke, i || 500);
        }
    }

    var n = new ah(f);
    return n.handler;
}

