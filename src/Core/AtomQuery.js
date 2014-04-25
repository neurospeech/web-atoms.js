/// <reference path="Atom.js" />

var QueryCompiler = {

    helpers: {
        any: function (lv, v) {
            if (!lv)
                return false;
            return Atom.query(lv).any(v);
        },
        "between": function (lv, v) {
            if (!lv)
                if (!v)
                    return true;
            if (!v)
                return false;
            var s = v[0];
            var e = v[1];
            return s <= lv && lv <= e;
        },
        "in" : function (lv, v) {
            var ae = new AtomEnumerator(v);
            while (ae.next()) {
                if (lv == ae.current())
                    return true;
            }
            return false;
        },
        equals: function (lv, v) {
            if (!lv) {
                if (!v)
                    return true;
                return false;
            }
            return lv.toLowerCase() == v.toLowerCase();
        },
        contains: function (lv, v) {
            if (!lv)
                return false;
            if (!v)
                return false;
            return lv.toLowerCase().indexOf(v.toLowerCase()) != -1;
        },
        startswith: function (lv, v) {
            if (!lv)
                return false;
            if (!v)
                return false;
            return lv.toLowerCase().indexOf(v.toLowerCase()) == 0;
        },
        endswith: function (lv, v) {
            if (!lv)
                return false;
            if (!v)
                return false;
            return lv.toLowerCase().lastIndexOf(v.toLowerCase()) == (lv.length - v.length);
        },
        containscs: function (lv, v) {
            if (!lv)
                return false;
            return lv.indexOf(v) != -1;
        },
        startswithcs: function (lv, v) {
            if (!lv)
                return false;
            return lv.indexOf(v) == 0;
        },
        endswithcs: function (lv, v) {
            if (!lv)
                return false;
            return lv.lastIndexOf(v) == (lv.length - v.length);
        }
    },


    compileList: function (qseg, q, sep) {
        if (!sep)
            sep = " && ";
        var list = [];
        for (var i in qseg) {
            var v = qseg[i];
            // skip condition 
            // if value is undefined
            if (v === undefined)
                continue;
            v = JSON.stringify(v);

            switch (v) {
                case "$and":
                    list.push(QueryCompiler.compileList(v, q, " && "));
                    break;
                case "$or":
                    list.push( QueryCompiler.compileList(v, q, " || " ));
                    break;
                case "$not":
                    list.push("!(" + QueryCompiler.compileList(v, q, sep ) + ")");
                    break;
                default:
            }


            var opi = i.indexOf(':');
            if (opi == -1)
                opi = i.lastIndexOf(' ');
            var p = i;
            var op = "==";
            if (opi != -1) {
                p = i.substr(0, opi);
                op = i.substr(opi + 1).toLowerCase();
            }
            var n1 = "";
            if (/^\!/gi.test(op)) {
                n1 = "!";
                op = op.substr(1);
            }
            p = JSON.stringify(p);
            var subq = null;
            var opq = QueryCompiler.helpers[op];
            if (op === "any") {

                if (v == "{}")
                    continue;
                subq = n1 + " QueryCompiler.helpers.any(Atom.get(item, " + p + " ), " + v + ")";
            }else{
                if (opq) {
                    subq = n1 + "QueryCompiler.helpers['" + op +"'](Atom.get(item," + p + "), " + v + ")";
                } else {
                    subq = "Atom.get(item," + p + ") " + n1 + op + " " + v + "";
                }
            }
            list.push(subq);
        }
        if (list.length > 0) {
            return list;
        }
        return [ "true" ];
    },

    compiled: {

    },

    compile: function(q){
        if(!q){
            return function(item) { 
                return true;
            };
        }

        var qs = JSON.stringify(q);
        var qsc = QueryCompiler.compiled[qs];
        if (qsc)
            return qsc;

        var el = QueryCompiler.compileList(q, "item", "q");

        var ej = el.join(" && ");
        log(ej);
        var f = new Function(["item", "q"], " return " + ej + ";");
        qsc = function (item) {
            return f(item, q);
        };

        QueryCompiler.compiled[qs] = qsc;
        return qsc;
    },

    selectCompiled: {

    },

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
        var f = QueryCompiler.compile(q);
        while (this.next()) {
            var item = this.current();
            if (f(item)) {
                return item;
            }
        }
        return null;
    },

    first: function (q) {
        var f = QueryCompiler.compile(q);
        while (this.next()) {
            var item = this.current();
            if (f(item)) {
                return item;
            }
        }
        throw new Error("Item not found in collection");
    },

    where: function (q) {
        var f = QueryCompiler.compile(q);
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

