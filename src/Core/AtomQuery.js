/// <reference path="Atom.js" />
/// <reference path="atom-filter.js" />

// rewire get...
$f.get = Atom.get;

$f.compileSelect = function (s) {
    if (!s) {
        return function (item) {
            return item;
        };
    }

    if (s.constructor == String) {
        return function (item) {
            return Atom.get(item, s);
        };
    }

    return function (item) {

        var r = {};
        for (var i in s) {
            var v = s[i];
            i = JSON.stringify(i);
            if (!v) {
                r[i] = Atom.get(item, i);
            } else {
                r[i] = Atom.get(item, v);
            }
        }
        return r;
    };
};


var AtomQuery = {

    firstOrDefault:function (q) {
        var f = $f(q);
        while (this.next()) {
            var item = this.current();
            if (f(item)) {
                return item;
            }
        }
        return null;
    },

    first: function (q) {
        var f = $f(q);
        while (this.next()) {
            var item = this.current();
            if (f(item)) {
                return item;
            }
        }
        throw new Error("Item not found in collection");
    },

    where: function (q) {
        var f = $f(q);
        var r = [];
        while (this.next()) {
            var item = this.current();
            if (f(item)) {
                r.push(item);
            }
        }
        return new AtomEnumerator(r);
    },

    toArray: function(){
        var r = [];
        while (this.next()) {
            r.push(this.current());
        }
        return r;
    },

    any: function(q){
        if (this.firstOrDefault(q))
            return true;
        return false;
    },

    select: function (q) {

        var f = $f.compileSelect(q);
        var r = [];
        while (this.next()) {
            var item = this.current();
            r.push(f(item));
        }
        return new AtomEnumerator(r);
    },

    join: function (s) {
        var r = [];
        while (this.next()) {
            r.push(this.current());
        }
        return r.join(s);
    },

    count: function(s){
        if (s) {
            return this.where(s).count();
        }
        var n = 0;
        while (this.next()) n++;
        return n;
    },

    sum: function (s) {
        var n = 0;
        var ae = this;
        while (ae.next()) {
            var item = ae.current();
            if (s) {
                item = Atom.get(item,s);
            }
            n += +(item || 0);
        }
        return n;
    },

    groupBy: function (s) {
        var fs = $f.compileSelect(s);
        var ae = this;
        var g = {};
        var r = [];
        while (ae.next()) {
            var item = ae.current();
            var si = fs(item);
            var rl = g[si];
            if (!rl) {
                rl = [];
                g[si] = rl;
                r.push({ key: si, items: rl });
            }
            rl.push(item);
        }
        return Atom.query(r);
    }

};

window.AtomQuery = AtomQuery;


for (var i in AtomQuery) {
    AtomEnumerator.prototype[i] = AtomQuery[i];
}


Atom.query = function (a) {
    if (a.length !== undefined) {
        return new AtomEnumerator(a);
    }
    return a;
};

