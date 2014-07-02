/// <reference path="atomcomponent.js" />

(function (window, name, base) {
    return classCreator(name, base,
        function () {
        },
        {
            get_owner: function () {
                return this;
            },

            get_appScope: function () {
                return appScope;
            },

            get_scope: function () {
                if (this._scope === undefined) {
                    var ap = this.get_atomParent(this._element._logicalParent || this._element.parentNode);
                    if (ap) {
                        return ap._localScope || ap.get_scope();
                    }
                    else {
                        return appScope;
                    }
                }
                return this._scope;
            },

            get_localScope: function () {
                if (this._localScope === undefined) {
                    var ap = this.get_atomParent(this._element._logicalParent || this._element.parentNode);
                    if (ap) {
                        return ap.get_localScope();
                    } else {
                        throw new Error("Local Scope does not exist");
                    }
                }
                return this._localScope;
            },
            set_scope: function (v) {
                var scope = this.get_scope();
                for (var k in v) {
                    if (/^(application|owner|app|parent)$/gi.test(k))
                        throw new Error("Invalid name for the scope property");
                    // if value is already set...
                    if (scope[k])
                        continue;
                    scope[k] = v[k];
                }
            },

            get_name: function () {
                return this._name;
            },
            getTemplate: function (k) {

                var t = this["_" + k];
                if (t !== undefined && t !== null)
                    return t;

                // resolve...
                t = Templates.get(this.constructor, k);
                if (!t) {
                    return null;
                }
                this["_" + k] = t;
                return t;
            }
        },
        {
            next: null,
            value: undefined
        });
})(window, "WebAtoms.AtomUIComponent", WebAtoms.AtomComponent.prototype);


Templates.compiled = {
};

var document = window.document;

Templates.compileElement = function (e) {
    var ae = new AtomEnumerator(e);
    ae.next();
    var a = ae.current();
    var e1 = document.createElement(a);
    if (!ae.next())
        return e1;
    a = ae.current();
    if (a) {
        for (var k in a) {
            e1.setAttribute(k, a[k]);
        }
    }
    
    while (ae.next()) {
        a = ae.current();
        if (!a)
            break;
        if (a.constructor == String) {
            e1.appendChild(document.createTextNode(a));
        } else {
            e1.appendChild(Templates.compileElement(a));
        }
    }
    return e1;
};

Templates.compileJsonML = function (j) {

    if (j.length == 1)
        return Templates.compileElement(j[0]);

    var r = [];
    var ae = new AtomEnumerator(j);
    while (ae.next()) {
        r.push(Templates.compileElement(ae.current()));
    }
    return r;
};

Templates.compile = function (type, name, t) {

    var div = document.createElement("div");
    div.innerHTML = t;

    if ($(div).children().length == 1) {
        t = AtomUI.cloneNode((div.firstElementChild || div.children[0]));
    }

    return t;
};

Templates.get = function (type, k) {
    //var x = this.compileType(type);
    //return x[k];

    var name = type.__typeName + "." + k;
    var x = this.compiled[name];
    if (x)
        return x;
    x = Templates.jsonML[name];
    if (!x) {
        if (type.__baseType) {
            x = Templates.get(type.__baseType, k);
        }
    } else {
        x = Templates.compileJsonML(x);
    }
    if (!x)
        return null;
    this.compiled[name] = x;
    return x;

};

Templates.compileType = function (type) {

    var name = type.__typeName;
    var shortName = name.split(".");
    shortName = shortName[shortName.length - 1];

    var x = this.compiled[name];
    if (x)
        return x;

    x = {
    };

    var tl = this[name] || this[shortName];
    if (tl) {
        for (var t in tl) {
            x[t] = this.compile(type, t, tl[t]);
        }
    }

    if (type.__baseType) {
        var y = this.compileType(type.__baseType);
        for (var yt in y) {
            if (!x[yt]) {
                x[yt] = y[yt];
            }
        }
    }

    this.compiled[name] = x;

    var t = this;
    delete t[name];
    delete t[shortName];

    return x;
};
