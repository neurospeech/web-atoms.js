var $x = {};

window.$x = $x;

$x.stop = function stop(test, msg) {
    return function () {
        if (test)
            throw new Error(msg);
    }
}

$x.stopIf = window.stop;

$x.timeout = function (i, actions) {
    return function () {
        var self = this;
        setTimeout(function () {
            self.invokeAction(actions);
        }, i);
    }
}

$x.invoke = function(i,d,v){
    return function(){
        var a = {};
        if(v !== undefined){
            var x = {};
            x[d] = v;
            a[i] = x;        
        }else{
            a[i] = d;
        }
        this.invokeAction(a);
    }
}

$x.data = function (d, v) {
    return $x.invoke("data", d, v);
}

$x.scope = function (d, v) {
    return $x.invoke("scope", d, v);
}

$x.localScope = function (d, v) {
    return $x.invoke("localScope", d, v);
}

$x.appScope = function (d, v) {
    return $x.invoke("appScope", d, v);
}

$x.owner = function (d, v) {
    return $x.invoke("owner", d, v);
}

$x.if = function (c, r) {
    if (c) return r;
    return null;
}

$x.isValid = function (target, action) {
    return function () {
        if (action === undefined) {
            target = o;
            target = this;
        }
        target.validate();

        var e = this.get_errors();
        if (e && e.length) {
            Atom.alert(Atom.mapJoin(e, "label", "\n"));
            return;
        }
        this.invokeAction(action);
    };
}

$x.alert = function (msg) {
    return function () {
        Atom.alert(msg);
    };
};

$x.focus = function (e) {
    return function () {
        var el = e._element || e;
        el.focus();
    }
};

$x.clearErrors = function (e) {
    return function () {
        window.errors.clear(e._element || e, true);
    }
};

$x.confirm = function (msg, actions) {
    return function () {
        var self = this;
        return Atom.confirm(msg, function () {
            self.invokeAction(actions);
        });
    }
}

$x.window = function (path, props, data, next) {
    var a = path;
    var self = this;
    if (arguments.length > 1) {
        a = {
            path: path,
            prop: props,
            next: next
        };
        if (data) {
            var p = a.prop || {};
            p.data = data;
            a.prop = p;
        }
    } else {
        a = {
            prop: a,
            path: a.path,
            next: a.next,
            scope: a.scope
        };

    }


    a.prop = a.prop || {};
    for (var k in a) {
        if (!a.hasOwnProperty(k))
            continue;
        if (/path|prop|next|scope/.test(k))
            continue;
        a.prop[k] = a[k];
    }

    return function () {
        WebAtoms.AtomWindow.openNewWindow({
            url: a,
            scope: this.get_scope(),
            opener: this
        });
    }
};


$x.localWindow = function (path, props, scope, next) {
    var a = path;
    if (arguments.length > 1) {
        a = {
            path: path,
            prop: props,
            next: next,
            scope: scope
        };

    }

    a.prop = a.prop || {};
    for (var k in a) {
        if (!a.hasOwnProperty(k))
            continue;
        if (/path|prop|next|scope/.test(k))
            continue;
        a.prop[k] = a[k];
    }


    return function () {
        WebAtoms.AtomWindow.openNewWindow({
            url: a,
            scope: this.get_scope(),
            localScope: true,
            opener: this
        });
    }
};