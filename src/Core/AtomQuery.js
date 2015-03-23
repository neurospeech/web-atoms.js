/// <reference path="Atom.js" />
/// <reference path="atom-filter.js" />

// rewire get...
AtomFilter.get = Atom.get;

var selectCompiler = {

    compileSelect: function(s){
        if (!s) {
            return function (item) {
                return item;
            };
        }

        if (s.constructor == String) {
            return function (item) {
                return Atom.get(item,s);
            };
        }

        var js = JSON.stringify(s);
        var jsq = QueryCompiler.selectCompiled[js];
        if (jsq)
            return jsq;

        var list = [];
        for (var i in s) {
            var item = s[i];
            i = JSON.stringify(i);
            if (!item) {
                list.push( i + ": Atom.get(item," + i + ")" );
            } else {
                item = JSON.stringify(item);
                list.push(i + ":Atom.get(item," + item + ")");
            }
        }

        var rs = "return {" + list.join(",") + "};";
        jsq = new Function("item", rs);
        QueryCompiler.selectCompiled[js] = jsq;
        return jsq;
    }
};

var AtomQuery = {

    firstOrDefault:function (q) {
        var f = AtomFilter.filter(q);
        while (this.next()) {
            var item = this.current();
            if (f(item)) {
                return item;
            }
        }
        return null;
    },

    first: function (q) {
        var f = AtomFilter.filter(q);
        while (this.next()) {
            var item = this.current();
            if (f(item)) {
                return item;
            }
        }
        throw new Error("Item not found in collection");
    },

    where: function (q) {
        var f = AtomFilter.filter(q);
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

        var f = QueryCompiler.compileSelect(q);
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
                item = AtomBinder.getValue(item,s);
            }
            n += +(item || 0);
        }
        return n;
    },

    groupBy: function (s) {
        var fs = QueryCompiler.compileSelect(s);
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

window.QueryCompiler = QueryCompiler;


for (var i in AtomQuery) {
    AtomEnumerator.prototype[i] = AtomQuery[i];
}


Atom.query = function (a) {
    if (a.length !== undefined) {
        return new AtomEnumerator(a);
    }
    return a;
};

