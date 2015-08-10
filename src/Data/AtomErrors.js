/// <reference path="AtomBinding.js" />

var AtomError = function (e) {
    this.value = e;

    this.list = {};

    this.errors = [];

    this.set = function (k, v) {
        this.list[k] = v;
        this.errors = null;
    };

    this.reset = function () {
        this.errors = null;
        this.invoke(true);
    };

    this.clear = function () {
        this.errors = [];
    };

    this.invoke = function (force) {

        if (!force && this.errors)
            return this.errors;

        var e = [];
        for (var i in this.list) {
            var v = this.list[i];
            if (!v) continue;
            v = v();
            if (v) {
                e.push(v);
            }
        }
        if (e.length) {
            this.errors = e;
            this.refresh();
            return e;
        }
        this.refresh();
        return null;
    };

    this.refresh = function (e) {
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
        var p = e.parent;
        if (p) {
            this.refresh(p);
        }
    };


};



// setup window errors array
window.errors = {
    list: [],
    set: function (e, key, error) {
        var item = Atom.query(this.list).firstOrDefault({value: e});
        if (!item) {
            item = new AtomError(e);
            this.list.push(item);
        }
        item.set(key, error);
    },
    clear: function (e, r) {
        var item = Atom.query(this.list).firstOrDefault({ value: e });
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
        var item = Atom.query(this.list).firstOrDefault({ value: e });
        if (item) {
            var rv = item.invoke();
            if (rv && rv.length) {
                list = list.filter(function (a) { return a; }).concat(rv.map(function (a) { return { label:a, value: e  } }) );
            }
            if (list && list.length)
                return list;
        }
        if (r) {
            var ce = new ChildEnumerator(e);
            while (ce.next()) {
                var c = this.get(ce.current(), r);
                if (c && c.length) {
                    list = list.concat(c);
                }
            }
        }
        if (list && list.length)
            return list;
        return undefined;
    },
    refresh: function (e) {
        var item = Atom.query(this.list).firstOrDefault({ value: e });
        if (item) {
            item.refresh();
        }
    },
    reset: function (e) {
        var item = Atom.query(this.list).firstOrDefault({ value: e });
        if (item) {
            item.reset();
        }
        var p = e.parent;
        if (p) {
            this.reset(p);
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