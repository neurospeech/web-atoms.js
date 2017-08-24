/// <reference path="AtomBinding.js" />

var AtomValidator = (function (window) {
    return createClass({
        name: "AtomValidator",
        start: function (e) {
            this.value = e;
            this.list = {};
            this.errors = [];
        },
        methods: {
            dispose: function () {
                this.value = null;
                this.errors = null;
                this.list = null;
            },
            set: function (k,v) {
                this.list[k] = v;
                //this.errors = null;
            },
            reset: function () {
                this.errors = null;
                this.invoke(true);
                this.refresh();
            },
            clear: function () {
                this.errors = [];
            },
            invoke: function (force) {

                if (this.refreshing)
                    return this.errors;

                if (!force && this.errors)
                    return this.errors;

                var e = [];

                var v ;

                var ve = this.list.invalid;
                if (ve !== undefined) {
                    if (!ve) {
                        this.errors = e;
                        return e;
                    }
                    v = ve();
                    if (v) {
                        if ($.isArray(v)) {
                            e = e.concat(v);
                        } else {
                            e.push(v);
                        }
                    }
                    this.errors = e;
                    return e;
                }
                else {
                    for (var i in this.list) {
                        v = this.list[i];
                        if (!v) continue;
                        v = v();
                        if (v) {
                            if ($.isArray(v)) {
                                e = e.concat(v);
                            } else {
                                e.push(v);
                            }
                        }
                    }
                }
                if (e.length) {
                    this.errors = e;
                    return e;
                }
                return null;
            },
            refresh: function (e) {
                if (this.refreshing)
                    return;
                this.refreshing = true;
                try {
                    e = e || this.value;
                    var ac = e.atomControl;
                    if (ac) {
                        AtomBinder.refreshValue(ac, "errors");
                    }
                } finally {
                    this.refreshing = false;
                }
                var p = e._logicalParent || e.parentNode;
                if (p) {
                    this.refresh(p);
                }
            }
        }
    });
})(window);



// setup window errors array
window.errors = {
    set: function (e, key, error) {
        var item = e.atomValidator;
        if (!item) {
            item = new AtomValidator(e);
            e.atomValidator = item;
        }
        item.set(key, error);
    },
    clear: function (e, r) {
        var item = e.atomValidator;
        if (item) {
            item.clear();
        }
        this.refresh(e);
        if (r) {
            var ce = new ChildEnumerator(e);
            while (ce.next()) {
                this.clear(ce.current(), r);
            }
        }
    },
    get: function (e, r) {
        var list = [];
        var item = e.atomValidator;
        if (item) {
            var rv = item.invoke();
            if (rv && rv.length) {
                list = list.concat(
                    rv.filter(function (a) {
                        return a;
                    }).map(function (a) {
                        return { label: a, value: e }
                    })
                );
            }
            if (list && list.length)
                return list;
        }

        //if (e.checkValidity !== undefined) {
            
        //}

        if (r) {
            var ce = new ChildEnumerator(e);
            while (ce.next()) {
                var c = this.get(ce.current(), r);
                if (c && c.length) {
                    list = list.concat(c);
                }
            }
        }
        return list;
    },
    refresh: function (e) {
        var item = e.atomValidator;
        if (item) {
            item.refresh();
        }
    },
    reset: function (e) {
        var item = e.atomValidator;
        if (item) {
            item.reset();
        }
    },
    validate: function (e) {
        var item = e.atomValidator;
        if (item) {
            item.reset();
            return;
        }
        var ce = new ChildEnumerator(e);
        while (ce.next()) {
            var child = ce.current();
            this.validate(child);
        }
    }
};

var errors = window.errors;




//window.getInputErrors = function getInputErrors(e, skipFormField) {

//    // is this valid...
//    var v = null;
//    var errors = [];
//    if (/input|select|textarea/i.test(e.nodeName)) {
//        v = $(e).val();
//        var a = AtomUI.attributeMap(e, /atom\-(required|data\-error|regex)/);
//        var error = getInputError(e, a, v);
//        if (error) {
//            errors.push({ label: error, value: e });
//        }
//    } else {
//        var ac = e.atomControl;
//        if (ac) {
//            if (!skipFormField && ac.constructor == WebAtoms.AtomFormField) {
//                return ac.getInputErrors();
//            }
//            v = AtomBinder.getValue(ac, "value");

//            var a = AtomUI.attributeMap(e, /atom\-(required|data\-error|regex)/);
//            var error = getInputError(e, a, v);
//            if (error) {
//                errors.push({ label: error, value: e });
//            }
//        }
//        var ce = new ChildEnumerator(e);
//        while (ce.next()) {
//            var child = ce.current();
//            var error = getInputErrors(child);
//            if (error) {
//                errors = errors.concat(error);
//            }
//        }
//    }

//    if (!errors.length)
//        return null;
//    return errors;
//};

//window.clearInputErrors = function clearInputErrors(e) {

//    var $e = $(e);

//    $e.removeClass("atom-error-invalid");
//    $e.removeClass("atom-error-required");
//    $e.removeClass("atom-error-email");

//    var ac = e.atomControl;
//    if (ac) {

//        if (ac.constructor == WebAtoms.AtomFormField) {
//            ac.clearInputErrors();
//            return;
//        }

//    }

//    var ce = new ChildEnumerator(e);
//    while (ce.next()) {
//        var child = ce.current();
//        clearInputError(child);
//    }

//};