/// <reference path="Stop.js" />



function runAction(action,evt) {

    if (!action)
        return;
    if (action.constructor == String) {
        location.href = action;
    }
    else {

        var f = action;

        if (f.isMVVMAtomCommand) {
            f.execute(this);
        }

        // is it atomControl?
        if (f.atomControl) {
            f = f.atomControl;
            if (f.refresh) {
                f.refresh(this.get_scope(), this);
            } else {
                Atom.alert("no default action defined");
            }
        } else {
            if (f._element) {
                f.refresh(this.get_scope(), this);
            } else {

                //is it function

                if ((typeof f) == 'function') {

                    // invoke method...
                    f.call(this, this.get_scope(), this, evt);
                } else {

                    // it is an array...
                    if (f.length) {

                        ae = new AtomEnumerator(f);
                        while (ae.next()) {
                            this.invokeAction(ae.current(), evt);
                        }
                        return;
                    }

                    // identify scope and actions...
                    var action = (f.timeOut || f.timeout);
                    if (action) {
                        var _this = this;
                        var tm = 100;
                        if (action.hasOwnProperty("length")) {
                            if (action.length > 1) {
                                tm = action[0];
                                action = action[1];
                            }
                        }
                        setTimeout(function () {
                            _this.invokeAction(action);
                        }, tm);
                        return;
                    }
                    this.set_merge(f);
                    action = f.confirm;
                    if (action) {
                        var msg = "Are you sure?";
                        if (action.hasOwnProperty("length")) {
                            if (action.length > 1) {
                                msg = action[0];
                                action = action[1];
                            } else {
                                action = action[0];
                            }
                        }
                        var _this = this;
                        var _action = action;
                        var _evt = evt;
                        Atom.confirm(msg, function () {
                            _this.invokeAction(_action, _evt);
                        });
                    }
                    action = f.alert;
                    if (action) {
                        Atom.alert(action);
                    }
                    action = f.next;
                    if (action) {
                        this.invokeAction(action, evt);
                        return;
                    }
                    action = f.control;
                    if (action) {
                        allControls[action].refresh();
                    }
                    action = f.window;
                    if (action) {
                        WebAtoms.AtomWindow.openNewWindow({
                            url: action,
                            localScope: false,
                            opener: this,
                            scope: this.get_scope()
                        });
                    }
                    action = f.localWindow;
                    if (action) {
                        WebAtoms.AtomWindow.openNewWindow({
                            url: action,
                            localScope: true,
                            opener: this,
                            scope: this.get_scope()
                        });
                    }

                }
            }
        }
    }
}