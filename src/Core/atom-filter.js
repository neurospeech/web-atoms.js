(function (window) {

    var AtomEnumerator = function (a) {
        this.a = a;
        this.i = -1;
    };
    AtomEnumerator.prototype = {
        next: function () {
            this.i++;
            return this.i < this.a.length;
        },
        current: function () {
            return this.a[this.i];
        }
    };


    var AtomFilter = {
        truef: function () {
            return true;
        },
        falsef: function () {
            return false;
        },

        get: function (item, n) {
            if (!item)
                return;
            var i = n.indexOf('.');
            if (i === -1) {
                return item[n];
            }
            var l = n.substr(0, i);
            n = n.substr(i + 1);
            return AtomFilter.get(item[l], n);
        },

        escapeRegex: function (b, value, a, f) {
            if (!value)
                return {
                    test: AtomFilter.falsef
                };
            var r = value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
            if (b) r = b + r;
            if (a) r = r + a;
            return new RegExp(r, f);
        },

        compare: function (cmp, r) {
            switch (cmp) {
                case "==":
                case "=":
                    return function (l) {
                        return l == r;
                    };
                case "<=":
                    return function (l) {
                        return l <= r;
                    };
                case ">=":
                    return function (l) {
                        return l >= r;
                    };
                case "<":
                    return function (l) {
                        return l < r;
                    };
                case ">":
                    return function (l) {
                        return l > r;
                    };
                case "between":
                    return function (l) {
                        return l >= r[0] && l <= r[1];
                    };
                case "equals":
                    r = AtomFilter.escapeRegex("^", r, "$", "i");
                    return function (l) {
                        if (!l)
                            return !r;
                        return r.test(l);
                    };

                case "contains":
                    r = AtomFilter.escapeRegex("", r, "", "i");
                    return function (l) {
                        if (!l) return false;
                        return r.test(l);
                    };
                case "startswith":
                    r = AtomFilter.escapeRegex("^", r, "", "i");
                    return function (l) {
                        if (!l)
                            return !r;
                        return r.test(l);
                    };
                case "endswith":
                    r = AtomFilter.escapeRegex("", r, "$", "i");
                    return function (l) {
                        if (!l)
                            return !r;
                        return r.test(l);
                    };

                case "equals":
                    r = AtomFilter.escapeRegex("^", r, "$");
                    return function (l) {
                        if (!l)
                            return !r;
                        return r.test(l);
                    };

                case "containscs":
                    r = AtomFilter.escapeRegex("", r, "");
                    return function (l) {
                        if (!l) return false;
                        return r.test(l);
                    };
                case "startswithcs":
                    r = AtomFilter.escapeRegex("^", r, "");
                    return function (l) {
                        if (!l)
                            return !r;
                        return r.test(l);
                    };
                case "endswithcs":
                    r = AtomFilter.escapeRegex("", r, "$");
                    return function (l) {
                        if (!l)
                            return !r;
                        return r.test(l);
                    };
                case "~":
                    return function (l) {
                        return r.test(l);
                    };

                case "in":
                    return function (l) {
                        if (!l) return false;
                        var ae = new AtomEnumerator(r);
                        while (ae.next()) {
                            var item = ae.current();
                            if (item == l)
                                return true;
                        }
                        return false;
                    };
                    // has a value in an array
                case "has":
                    return function (l) {
                        if (!l) return false;
                        var ae = new AtomEnumerator(l);
                        while (ae.next()) {
                            var item = ae.current();
                            if (item == r)
                                return true;
                        }
                        return false;
                    }
                case "any":
                    var rf = AtomFilter.filter(r);
                    return function (l) {
                        if (!l) return false;
                        var ae = new AtomEnumerator(l);
                        while (ae.next()) {
                            var item = ae.current();
                            if (rf(item))
                                return true;
                        }
                        return false;
                    }
                case "all":
                    var rf = AtomFilter.filter(r);
                    return function (l) {
                        if (!l) return false;
                        var ae = new AtomEnumerator(l);
                        while (ae.next()) {
                            if (!rf(item))
                                return false;
                        }
                        return true;
                    }
                default:
                    return function (l) {
                        return false;
                    };
            }
        },

        isString: function (a) {
            return typeof a == 'string' || a instanceof String;
        },

        sort: function (orderBy) {

            if (!AtomFilter.isString(orderBy)) {
                return orderBy;
            }

            var fields = orderBy.split(',');
            fields = fields.map(function (item) {
                var tokens = item.split(' ');
                var desc = tokens[1] || 'asc';
                return {
                    field: tokens[0],
                    desc: /desc/i.test(desc),
                    cs: /^cs/i.test(desc)
                }
            });

            return function (a, b) {

                if (a == null || a == undefined) {
                    return b == null || b == undefined ? 0 : 1;
                }
                if (b == null || b == undefined) {
                    return 1;
                }

                for (var i = 0; i < fields.length; i++) {
                    var f = fields[i];
                    var field = f.field;
                    var af = a[field];
                    var bf = b[field];
                    if (f.desc) {
                        var t = af;
                        af = bf;
                        bf = t;
                    }
                    if (af == bf)
                        continue;
                    if (!af) {
                        return !bf ? 0 : -1;
                    }
                    if (!bf) {
                        return !af ? 0 : 1;
                    }
                    if (AtomFilter.isString(af)) {
                        if (f.cs) {
                            return af.localeCompare(bf);
                        } else {
                            af = af.toLowerCase();
                            bf = bf.toLowerCase();
                            if (af == bf)
                                continue;
                            return af.localeCompare(bf);
                        }
                    }

                }
                return 0;
            }
        },

        build: function (ae, i, v, q, cor) {
            if (i === '$or') {
                var orf = AtomFilter.filter(v, true);
                ae.push(function (item) {
                    return orf(item);
                });
                return;
            }
            if (i === '$and') {
                var orf = AtomFilter.filter(v, false);
                ae.push(function (item) {
                    return orf(item);
                });
                return;
            }
            if (i === '$not') {
                var fn = AtomFilter.filter(v, cor);
                ae.push(function (item) {
                    return !fn(item);
                });
                return;
            }
            var args = i.split(' ');
            if (args.length === 1) {
                args = i.split(':');
            }

            var n = args[0];
            var cond = "==";
            if (args.length === 2) {
                cond = args[1];
            }

            var left = function (item) {
                return AtomFilter.get(item, n);
            };
            if (cond.indexOf('!') !== 0) {
                var compF = AtomFilter.compare(cond, v);
                var fx = function (item) {
                    var l = left(item);
                    return compF(l);
                };
                ae.push(fx);

            } else {
                cond = cond.substr(1);
                var compF = AtomFilter.compare(cond, v);
                var fx = function (item) {
                    var l = left(item);
                    return !compF(l);
                };
                ae.push(fx);
            }
        },

        filter: function (q, cor) {
            // compiles json object into function
            // that accepts object and returns true/false

            if (q === false)
                return AtomFilter.falsef;
            if (!q)
                return AtomFilter.truef;

            var ae = [];

            for (var i in q) {
                if (!q.hasOwnProperty(i))
                    continue;
                var v = q[i];
                AtomFilter.build(ae, i, v, q, cor);
            }

            return function (item) {

                var e = new AtomEnumerator(ae);
                var a = [];
                while (e.next()) {
                    var ec = e.current();
                    var r = ec(item);
                    a.push(r);
                    if (r) {
                        if (cor) {
                            return true;
                        }
                    } else {
                        if (!cor)
                            return false;
                    }
                }

                e = new AtomEnumerator(a);
                while (e.next()) {
                    if (!e.current())
                        return false;
                }

                return true;
            };

        }

    };

    window.$f = AtomFilter.filter;

    if (!Array.prototype.filter) {
        Array.prototype.filter = function (f) {
            var r = [];
            for (var i = 0; i < this.length; i++) {
                var v = this[i];
                if (f(v, i)) r.push(v);
            }
            return r;
        };
    }

    var af = Array.prototype.filter;

    Array.prototype.filter = function (i) {
        if (i instanceof Function || typeof i == 'function') {
            return af.call(this, i);
        }
        return af.call(this, $f(i));
    };

    var aps = Array.prototype.sort;

    Array.prototype.sort = function (s) {
        var f = AtomFilter.sort(s);
        return aps.call(this, f);
    };

    window.AtomFilter = AtomFilter;

})(window);
