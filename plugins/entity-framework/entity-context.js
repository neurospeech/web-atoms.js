// entity map must be loaded before...

Atom.resolve = function (obj, ap) {

    var start = !ap;

    if (!obj)
        return obj;

    if (start) {

        ap = new AtomPromise();
        ap.list = [];
        ap.done = function (v) {
            Atom.remove(ap.list, v);
            if (ap.list.length == 0) {
                ap.pushValue(obj);
            }
        };
    }


    var type = typeof (obj);

    if (type == 'object') {
        if (typeof (obj.length) != 'undefined') {
            //this is an array
            for (var i = 0; i < obj.length; i++) {
                var v = obj[i];
                if (!v)
                    continue;
                var item = obj;
                var key = i;
                if (v instanceof AtomPromise || v.constructor == AtomPromise) {
                    ap.list.push(v);
                    v.failed(function (a) {
                        ap.done(a);
                    });
                    v.then(function (a) {
                        item[key] = a.value();
                        ap.done(a);
                    });
                    continue;
                }
                Atom.resolve(v, ap);
            }
        } else {
            for (var i in obj) {
                var v = obj[i];
                if (!v)
                    continue;
                if (v instanceof AtomPromise || v.constructor == AtomPromise) {
                    ap.list.push(v);
                    v.failed(function (a) {
                        ap.done(a);
                    });
                    var item = obj;
                    var key = i;
                    v.then(function (a) {
                        item[key] = a.value();
                        ap.done(a);
                    });
                    continue;
                }
                Atom.resolve(v, ap);
            }
        }
    }

    if (ap.list.length) {
        if (start) {
            ap.onInvoke(function () {
                var ae = new AtomEnumerator(ap.list);
                while (ae.next()) {
                    ae.current().invoke(ap._invoker);
                }
            });
        }
        return ap;
    }
    return obj;

};

var dbContext = function (p, map) {
    p = p || "/crm";
    this.prefix = p;
    this.map = map;
    this.changes = {};
    this.hasChanges = false;

    this.ignoreChanges = false;

    this.identityMap = {};

    var _this = this;
    this.clearCommand = function () {
        _this.undoChanges();
    };
    this.saveCommand = function () {
        return _this.onSaveChanges();
    };

    this.syncResults = function () {
        _this.onSyncResults.apply(_this, arguments);
    };
};

dbContext.prototype = {
    destroy: function () {

    },

    onSaveChanges: function () {

        var keyMap = {

        };

        var obj = {
            entities: [],
            associations: []
        };

        var i = 0;

        var list = [];

        for (var entry in this.changes) {
            var item = this.changes[entry];
            var key = item.entity._$_uri;
            var cs = { id: (item.entity._$_id || null), type: item.entity._$_entityName, changes: item.changes };
            obj.entities.push(cs);
            keyMap[key] = i;
            i++;
            list.push(item);
        }

        var ae = new AtomEnumerator(list);
        while (ae.next()) {
            var item = ae.current();
            var e = { id: keyMap[item.entity._$_uri], added: [], removed: [] };
            var change = false;

            var ce = new AtomEnumerator(item.relAdded || []);
            while (ce.next()) {
                var cei = ce.current();
                e.added.push({ id: keyMap[cei.entity._$_uri], name: cei.name });
                change = true;
            }

            var ce = new AtomEnumerator(item.relRemoved || []);
            while (ce.next()) {
                var cei = ce.current();
                e.removed.push({ id: keyMap[cei.entity._$_uri], name: cei.name });
                change = true;
            }
            if (change) {
                obj.associations.push(e);
            }
        }

        //log(JSON.stringify(obj));

        var _this = this;
        return AtomPromise.json(this.prefix + '/entity/all/savechanges', null, { type: 'POST', data: obj }).then(function (p) {
            _this.acceptChanges(p.value(), list);
        }).failed(function (p) {
            if (console) {
                console.error("Failed on save changes");
                console.error(obj);
            }
        });

    },

    attach: function (entity, type) {
        if (!type)
            throw new Error("Argument type is required");
        this.prepareEntity(entity, type, true);
    },

    acceptChanges: function (v, list) {
        this.ignoreChanges = true;
        try {
            for (var i = 0; i < v.length; i++) {
                var updated = v[i];

                var type = updated.type;
                var entity = updated.entity;

                if (list.length > i) {
                    var current = list[i];
                    var ce = current.entity;
                    for (var k in entity) {
                        AtomBinder.setValue(ce, k, entity[k]);
                    }
                    if (!ce._$_id) {
                        var key = this.getMetaDataEntity(ce._$_entityName).key;
                        ce._$_id = ce[key];
                        ce._$_key = key;
                    }
                } else {

                    this.attach(entity, type);
                }

                //var current = list[i];
                //var ce = current.entity;
                //for (var k in updated) {
                //    AtomBinder.setValue(ce, k, updated[k]);
                //}
                //if (!ce._$_id) {
                //    var key = this.getMetaDataEntity(ce._$_entityName).key;
                //    ce._$_id = ce[key];
                //    ce._$_key = key;
                //}

            }

            this.changes = {};

        } finally {
            this.ignoreChanges = false;
        }
        Atom.set(this, "hasChanges", false);
    },


    undoChanges: function () {
        this.ignoreChanges = true;
        try {
            for (var i in this.changes) {
                var item = this.changes[i];
                var e = item.entity;
                var c = item.changes;
                var o = e._$_original;
                if (!o) {
                    continue;
                }
                for (var k in o) {
                    AtomBinder.setValue(e, k, o[k]);
                }
                var ae = new AtomEnumerator(item.relAdded);
                while (ae.next()) {
                    var citem = ae.current();
                    var src = e[citem.name];
                    if (src.length) {
                        AtomBinder.removeItem(src, citem.entity);
                    } else {
                    }
                }
                ae = new AtomEnumerator(item.relRemoved);
                while (ae.next()) {
                    var citem = ae.current();
                    var src = e[citem.name];
                    AtomBinder.addItem(src, citem.entity);
                }
            }
        } finally {
            this.ignoreChanges = false;
        }
        this.changes = {};
        Atom.set(this, "hasChanges", false);
    },

    getMetaDataEntity: function (key) {
        var k = key.toLowerCase();
        for (var i in this.map) {
            if (i.toLowerCase() == k)
                return this.map[i];
        }
    },

    createAssociations: function (v) {
        var r = [];
        var items = v.items;
        var aslist = new AtomEnumerator(v.associations);
        while (aslist.next()) {
            var a = aslist.current();
            var entity = a.entity;
            var type = a.type;
            entity = this.prepareEntity(entity, type);

            var map = new AtomEnumerator(a.map);
            while (map.next()) {
                var me = map.current();
                var e = items[me.id];
                var name = me.name;
                e[name] = entity;
            }
        }
        return items;
    },

    onSyncResults: function (entityType, ap) {
        this.ignoreChanges = true;
        try {
            var v = ap.value();

            if (v.items && !v.merge) {
                v = this.createAssociations(v);
            }

            var items = [];
            items.total = v.total;
            var ae = new AtomEnumerator(v);
            while (ae.next()) {
                var item = this.prepareEntity(ae.current(), entityType);
                items.push(item);
            }
            ap.value(items);
        } finally {
            this.ignoreChanges = false;
        }
    },

    search: function (entityType, options) {
        var _this = this;
        return AtomPromise.json(this.prefix + '/entity/' + entityType + '/query', options)
            .then(function (ap) {
                _this.onSyncResults(entityType, ap);
            });
    },

    load: function (entity, entityType, includeList) {
        if (!entity)
            return;
        if (entity._$_added) {
            var ap = new AtomPromise();
            ap.onInvoke(function () {
                ap.pushValue(entity);
            });
            return ap;
        }
        var _this = this;
        var t = this.getMetaDataEntity(entityType);
        var orderBy = t.key;
        var ap = this.search(entityType, { include: includeList, query: { $id: entity._$_id }, orderBy: orderBy });
        ap.then(function (p) {
            var a = p.value();
            if (a.length) {
                p.value(a[0]);
            } else {
                p.value(null);
            }
        });
        return ap;
    },

    copy: function (e) {
        var n = {};
        for (var i in e) {
            if (/^\_\$\_/gi.test(i))
                continue;
            n[i] = e[i];
        }
        return n;
    },
    parseDates: function (e) {
        for (var i in e) {
            var v = e[i];
            if (!v)
                continue;
            if (v.constructor == String) {
                if (/^\/date\(/gi.test(v)) {
                    v = v.substr(6);
                    v = new Date(parseInt(v, 10));
                    e[i] = v;
                }
            }
        }
    },
    prepareEntity: function (e, en, merge) {
        if (!e)
            return e;
        this.parseDates(e);
        var mt = this.getMetaDataEntity(en);
        if (!merge) {
            if (mt.parent) {
                for (var k in mt.parent) {
                    if (e[k])
                        continue;
                    e[k] = null;
                }
            }
        }
        var copy = this.copy(e);

        e._$_entityName = en;
        var key = mt.key;
        e._$_id = e[key];
        e._$_key = key;
        e._$_uri = en + ":" + e._$_id;
        e._$_original = copy;
        var ex = this.identityMap[e._$_uri];
        if (ex) {
            for (var k in copy) {
                ex[k] = copy[k];
                Atom.refresh(ex, k);
            }
            e = ex;
            e._$_original = copy;
        } else {
            this.identityMap[e._$_uri] = e;
        }
        e._$_watcher = this;
        return e;
    },
    v: 1,
    addEntity: function (type, copy) {
        var em = this.getMetaDataEntity(type);
        var ek = em.key;
        var item = copy || Atom.clone(em.fields);
        this.v = this.v + 1;
        item._$_uri = type + ":T:" + this.v;
        item._$_entityName = type;
        item._$_key = em.key;
        item._$_original = {};
        item._$_added = true;
        item._$_watcher = this;
        var ce = this.getChangeEntry(item);
        if (copy) {
            ce.changes = Atom.clone(copy);
        }
        Atom.set(this, "hasChanges", true);
        return item;
    },
    getChangeEntry: function (e) {
        if (!e._$_uri) {
            if (console) {
                console.warn('Invalid entity');
                console.warn(e);
            }
            return;
        }
        var c = this.changes[e._$_uri];
        if (!c) {
            c = { entity: e, changes: {}, relAdded: [], relRemoved: [] };
            this.changes[e._$_uri] = c;
        }
        return c;
    },
    setParent: function (child, name, parent) {
        var mt = this.getMetaDataEntity(child._$_entityName);
        var prop = mt.parent[name];
        var parentKey = parent[parent._$_key];
        var parentEntity = prop.type;
        parent = this.prepareEntity(parent, parentEntity, true);
        var ceChild = this.getChangeEntry(child);
        var ceParent = this.getChangeEntry(parent);
        Atom.set(child, name, parent);
        ceChild.relAdded.push({ name: name, entity: parent });
        var col = prop.col;
        child[col] = parentKey;
        Atom.refresh(child, col);
        Atom.set(this, "hasChanges", true);
    },
    _onRefreshValue: function (t, k) {
        if (this.ignoreChanges)
            return;
        if (t._$_array)
            return;
        var v = t[k];
        // if we have set reference of something
        if (v && v._$_entityName) {
            // this is a relation...
            if (!v._$_temp) {
                this.setParent(t, k, v);
            }
            return;
        }
        var o = t._$_original[k];
        if (!o && !v)
            return;
        if (o == v)
            return;
        if (o && v && o.toGMTString && v.toGMTString) {
            if (o.toGMTString() == v.toGMTString())
                return;
        }
        var c = this.getChangeEntry(t);
        c.changes[k] = v;
        Atom.set(this, "hasChanges", true);
    },
    _onRefreshItems: function (a, m, i, item) {
        if (this.ignoreChanges || /refresh/gi.test(m))
            return;
        var e = a._$_owner;
        var type = a.itemType;
        var key = a.itemKey;
        var name = a.name;
        var c = this.getChangeEntry(e);
        if (!item._$_uri) {
            item._$_uri = type + ":T:" + (new Date()).getTime();
            item._$_added = true;
            item._$_entityName = type;
            item._$_key = key;
            item._$_original = {};
            item._$_watcher = this;
        }
        var ce = this.getChangeEntry(item);
        if (/add/gi.test(m)) {
            c.relAdded.push({ name: name, entity: item });
        }
        if (/remove/gi.test(m)) {
            c.relRemoved.push({ name: name, entity: item });
        }
        Atom.set(this, "hasChanges", true);
    },
    isReady: function (e) {
        if (!e)
            return false;
        if (!e._$_entityName)
            return false;
        if (!e._$_id)
            return false;
        return true;
    },
    loadItems: function (e, a, name) {
        a._$_owner = e;
        a.name = name;
        a._$_array = true;
        var t = this.getMetaDataEntity(e._$_entityName).children[name].type;
        a.itemType = t;
        t = this.getMetaDataEntity(t).key;
        a.itemKey = t;
        a._$_watcher = this;
    },
    loadChildren: function (e, name, query, includeList) {

        var children = e[name];
        if (!children || !children._$_array) {
            children = [];
            e[name] = children;
            this.loadItems(e, children, name);
        }

        if (e._$_added || children._$_loaded) {
            return children;
        }

        var _this = this;

        // getting type ...
        var p = this.getMetaDataEntity(e._$_entityName);
        var c = p.children[name];
        var q = query || {};
        q[c.parent + "." + p.key] = e._$_id;
        ct = this.getMetaDataEntity(c.type);
        var orderBy = ct.key;
        children._$_loaded = true;
        var ap = this.search(c.type, { include: includeList, query: q, orderBy: orderBy, size: -1 });
        ap.then(function (p) {
            var a = p.value();
            var ae = new AtomEnumerator(a);
            _this.ignoreChanges = true;
            while (ae.next()) {
                children.push(ae.current());
            }
            setTimeout(function () {
                Atom.refreshArray(children);
            }, 100);
            _this.ignoreChanges = false;
            p.value(children);
        });
        return ap;
    }
};

