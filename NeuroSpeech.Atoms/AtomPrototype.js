function mapLibrary(n, p, v) {
    var index = n.indexOf('.');
    if (index == -1) {
        var r = p[n];
        if (!r) {
            r = v;
            p[n] = r;
        }
        return r;
    }
    var r = mapLibrary(n.substr(0, index), p, {});
    return mapLibrary(n.substr(index + 1), r, v);
};

function createProperty(name, g) {
    if (g) {
        return function () {
            return this[name];
        };
    }
    return function (v) {
        this[name] = v;
    };
}

function classCreator(name, basePrototype, classConstructor, classPrototype, classProperties, thisPrototype, thisProperties) {
    var baseClass = basePrototype ? basePrototype.constructor : null;
    var old = classConstructor || (function () { });
    var f = null;
    if (baseClass) {
        if (classProperties) {
            f = function () {
                baseClass.apply(this, arguments);
                this.__typeName = name;
                var cp = Atom.clone(classProperties);
                for (var k in cp) {
                    this["_" + k] = cp[k];
                }
                old.apply(this, arguments);
            };
        } else {
            f = function () {
                baseClass.apply(this, arguments);
                this.__typeName = name;
                old.apply(this, arguments);
            };
        }

        var bpt = baseClass.prototype;

        // extend
        for (var k in bpt) {
            if (classPrototype[k])
                continue;
            if (bpt.hasOwnProperty(k)) {
                classPrototype[k] = bpt[k];
            }
        }

    } else {
        if (classProperties) {
            f = function () {
                this.__typeName = name;
                var cp = Atom.clone(classProperties);
                for (var k in cp) {
                    this["_" + k] = cp[k];
                }
                old.apply(this, arguments);
            };
        } else {
            f = function () {
                this.__typeName = name;
                old.apply(this, arguments);
            };
        }
    }

    if (classProperties) {
        for (var k in classProperties) {
            if (!classPrototype["get_" + k]) {
                classPrototype["get_" + k] = createProperty("_"+ k,true);
            }
            if (!classPrototype["set_" + k]) {
                classPrototype["set_" + k] = createProperty("_" + k);
            }
        }
    }

    f.__typeName = name;

    if (baseClass) {
        f.__baseType = baseClass;
    }

    f.prototype = classPrototype;
    f.prototype.constructor = f;
    if (!classPrototype.hasOwnProperty("toString")) {
        f.prototype.toString = function () {
            return name;
        };
    }

    mapLibrary(name, window, f);

    return f;
};

function classCreatorEx(objDef) {
    return classCreator(objDef.name, objDef.base, objDef.start, objDef.methods, objDef.properties);
}