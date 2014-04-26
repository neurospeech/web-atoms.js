/// <reference path="../JSON.js" />
/// <reference path="../linq-vsdoc.js" />
/// <reference path="../FlashPlayer.js" />
/// <reference path="../jquery-1.5.1-vsdoc.js" />
/// <reference path="../atomprototype.js" />
/// <reference path="Atom.js" />
/// <reference path="atombrowser.js" />
/// <reference path="atomevaluator.js" />
/// <reference path="childenumerator.js" />
/// <reference path="AtomQuery.js" />
/// <reference path="AtomUI.js" />

Array.prototype.enumerator = function () {
    return new AtomEnumerator(this);
};

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (item) {
        var i = 0;
        for (i = 0; i < this.length; i++) {
            if (item == this[i])
                return i;
        }
        return -1;
    };
}

var AtomArray = {

    split: function (text, sep) {
        if (sep && sep.constructor == String) {
            sep = $.trim(sep);
        }
        var ar = text.split(sep);
        var r = [];
        var ae = new AtomEnumerator(ar);
        var item;
        while (ae.next()) {
            item = ae.current();
            if (item && item.constructor == String) {
                item = $.trim(item);
            }
            r.push(item);
        }
        return r;
    },

    getValues: function (array, path) {
        var item;
        var result = array;
        if (path) {
            result = [];
            var ae = new AtomEnumerator(array);
            while (ae.next()) {
                item = ae.current();
                result.push(item[path]);
            }
        }
        return result;
    },

    intersect: function (array, path, value) {
        var result = [];
        var ae = new AtomEnumerator(value);
        var item;
        var match;
        while (ae.next()) {
            item = ae.current();
            match = this.getMatch(array, path, item);
            if (match != undefined)
                result.push(match);
        }
        return result;
    },

    getMatch: function (array, path, value) {
        var ae = new AtomEnumerator(array);
        var dataItem;
        var item;
        while (ae.next()) {
            dataItem = ae.current();
            item = dataItem;
            if (path)
                item = dataItem[path];
            if (item == value)
                return dataItem;
        }
    },

    remove: function (array, item) {
        var ae = new AtomEnumerator(array);
        while (ae.next()) {
            var arrayItem = ae.current();
            if (arrayItem == item) {
                array.splice(ae.currentIndex(), 1);
                return;
            }
        }
    }
};

window.AtomArray = AtomArray;

//Creating AtomScope Class
var AtomScope = (function (window,name, base) {
    return classCreator(name, base,
        function (owner,parent,app) {
            this.owner = owner;
            this.parent = parent;
            if (app) {
                this.__application = app;
            }
            if (this.__application == this.owner) {
                //this._$_watcher = this.__application;
                this._v = 0;
                this.refreshCommand = function () {
                    appScope._v = appScope._v + 1;
                    AtomBinder.refreshValue(appScope, "_v");
                };
            }
            this._refreshValue = function (name) {
                AtomBinder.refreshValue(this, name);
                if (this.__application === this.owner) {
                    this.__application._onRefreshValue(this, name);
                }
            };

        },
        {
            setValue: function (name, value, forceRefresh) {
                if (AtomBinder.getValue(this, name) == value) {
                    if (forceRefresh) {
                        this._refreshValue(name);
                    }
                    return;
                }
                var f = this["set_" + name];
                if (f) {
                    f.apply(this, [value]);
                } else {
                    this[name] = value;
                }
                this._refreshValue(name);
            }
        });
})(window,"WebAtoms.AtomScope", null);