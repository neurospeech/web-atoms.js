/// <reference path="WebAtoms.Core.js" />
/// <reference path="../Data/AtomBindingHelper.js" />
/// <reference path="AtomPopup.js" />

(function(window,name,base){
    return classCreator(name,base,
        function () {
            this._eventHandlers = [];
        },
        {
            bindEvent: function (element, name, methodName, key, method) {
                if (element == null)
                    return;
                if (typeof methodName == 'function') {
                    method = methodName;
                }
                method = method || AtomUI.createDelegate(this, methodName);
                var be = {
                    element: element,
                    name: name,
                    methodName: methodName,
                    handler: method
                };
                if (key) {
                    be.key = key;
                }
                if (AtomUI.isNode(element)) {
                    $(element).bind(name, null, method);
                } else {
                    if (element.addEventListener) {
                        element.addEventListener(name, method, false);
                    } else {
                        var f = element["add_" + name];
                        if (f == null) {
                            // try atom binder...
                            f = AtomBinder["add_" + name];
                            if (key) {
                                f.apply(AtomBinder, [element, key, method]);
                            }
                            else {
                                f.apply(AtomBinder, [element, method]);
                            }
                        } else {
                            f.apply(element, [method]);
                        }
                    }
                }
                this._eventHandlers.push(be);
            },

            unbindEvent: function (element, name, methodName, key) {
                var ae = new AtomEnumerator(this._eventHandlers);
                var removed = [];
                while (ae.next()) {
                    var be = ae.current();
                    if (element && element !== be.element)
                        continue;
                    if (name && name !== be.name)
                        continue;
                    if (methodName && methodName !== be.methodName)
                        continue;
                    if (key && key !== be.key)
                        continue;
                    if (AtomUI.isNode(be.element)) {
                        $(be.element).unbind(be.name, be.handler);
                    } else {
                        if (be.element.removeEventListener) {
                            // dont do any thing..
                            be.element.removeEventListener(name, be.handler, false);
                        } else {
                            var f = be.element["remove_" + be.name];
                            if (f == null) {
                                f = AtomBinder["remove_" + be.name];
                                if (be.key) {
                                    f.apply(AtomBinder, [be.element, be.key, be.handler]);
                                }
                                else {
                                    f.apply(AtomBinder, [be.element, be.handler]);
                                }
                            } else {
                                f.apply(be.element, [be.handler]);
                            }
                        }
                    }
                    removed.push(be);
                }

                if (removed.length == this._eventHandlers.length) {
                    this._eventHandlers.length = 0;
                } else {
                    ae = new AtomEnumerator(removed);
                    while (ae.next()) {
                        var be = ae.current();
                        AtomArray.remove(this._eventHandlers, be);
                    }
                }
            },


            initialize: function () {
            },
            dispose: function () {
                // remove all event handlers...
                this.unbindEvent(null, null, null);

                // also remove __delegates..
                if (this.__delegates)
                    this.__delegates = null;
            }
        });
})(this,"WebAtoms.AtomComponent",null);
