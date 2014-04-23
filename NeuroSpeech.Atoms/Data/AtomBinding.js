/// <reference path="AtomPromise.js" />
/// <reference path="../Core/AtomComponent.js" />

(function (window, baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomBinding",
        base: baseType,
        start: function (control, element, key, path, twoWays, jq, vf, events) {
            this.element = element;
            this.control = control;
            this.vf = vf;
            this.key = key;
            this.events = events;

            if (path && path.constructor != String) {
                this.pathList = [];
                this.path = null;

                var ae = new AtomEnumerator(path);
                while (ae.next()) {
                    var pe = new AtomEnumerator(ae.current());
                    var p = [];
                    while (pe.next()) {
                        p.push({ path: pe.current(), value: null });
                    }
                    this.pathList.push(p);
                }

            } else {
                var ae = new AtomEnumerator(path.split("."));
                this.path = [];
                while (ae.next()) {
                    this.path.push({ path: ae.current(), value: null });
                }
            }
            this.twoWays = twoWays;
            this.jq = jq;
            this._isUpdating = false;
        },
        methods: {
            onPropChanged: function (sender, key) {
                // update target....
                // most like end of path...
                if (this.path == null || this.path.length == 0)
                    return;
                var ae = new AtomEnumerator(this.path);
                var obj = this.control;
                var objKey = null;
                while (ae.next()) {
                    objKey = ae.current();
                    objKey.value = obj;
                    if (!obj)
                        return;
                    if (!ae.isLast())
                        obj = AtomBinder.getValue(obj, objKey.path);
                }
                var value = null;
                if (this.jq) {
                    switch (this.key) {
                        case "valueAsDate":
                            value = this.element.valueAsDate;
                            break;
                        case "checked":
                            value = this.element.checked ? true : false;
                            break;
                        default:
                            value = $(this.element).val();
                    }
                } else {
                    value = AtomBinder.getValue(this.control, this.key);
                }
                AtomBinder.setValue(obj, objKey.path, value);
            },
            onDataChanged: function (sender, key) {
                if (this._isUpdating)
                    return;

                // called by jquery while posting an ajax request...
                if (arguments === undefined || arguments.length == 0)
                    return;

                var ae;
                var target = this.control;
                if (this.pathList) {
                    var newTarget = [];
                    ae = new AtomEnumerator(this.pathList);
                    while (ae.next()) {
                        newTarget.push(this.evaluate(target, ae.current()));
                    }
                    ae = new AtomEnumerator(newTarget);
                    while (ae.next()) {
                        if (ae.current() === undefined)
                            return;
                    }
                    this.setValue(newTarget);
                } else {
                    var path = this.path;
                    var newTarget = this.evaluate(target, path);
                    if (newTarget !== undefined)
                        this.setValue(newTarget);
                }
            },

            evaluate: function (target, path) {
                var newTarget = null;
                var property = null;
                var ae = new AtomEnumerator(path);

                // first remove old handlers...
                var remove = false;
                while (target && ae.next()) {
                    property = ae.current();
                    newTarget = AtomBinder.getValue(target, property.path);

                    if (!(/scope|appScope|atomParent|templateParent|localScope/gi.test(property.path))) {
                        var _this = this;
                        if (!property.value) {
                            this.bindEvent(target, "WatchHandler", "onDataChanged", property.path);
                            //this.bindEvent(target, "WatchHandler", function () {
                            //    _this.onDataChanged.apply(_this, arguments);
                            //}, property.path);
                        } else if (property.value != target) {
                            this.unbindEvent(property.value, "WatchHandler", null, property.path);
                            this.bindEvent(target, "WatchHandler", "onDataChanged", property.path);
                            //this.bindEvent(target, "WatchHandler", function () {
                            //    _this.onDataChanged.apply(_this, arguments);
                            //}, property.path);
                        }
                    }

                    property.value = target;
                    target = newTarget;
                }
                if (newTarget === undefined && AtomConfig.debug) {
                    log('Undefined:' + this.control._element.id + ' -> ' + ($.map(path, function (a) { return a.path; })).join('.'));
                }
                return newTarget;
            },

            onValChanged: function () {
                this.onPropChanged(null, null);
            },
            setup: function () {
                if (this.twoWays) {
                    if (this.jq) {
                        this.bindEvent(this.element, "change", "onValChanged");
                        if (this.events) {
                            var list = new AtomEnumerator(this.events.split(","));
                            while (list.next()) {
                                this.bindEvent(this.element, list.current(), "onValChanged");
                            }
                        }
                    } else {
                        this.bindEvent(this.control, "WatchHandler", "onPropChanged", this.key);
                    }
                }

                this.onDataChanged(this, null);

            },

            setValue: function (value) {

                if (!this.pathList && this.vf) {
                    value = [value];
                }

                if (this.vf) {
                    value.push(Atom);
                    value.push(AtomPromise);
                    value = this.vf.apply(this, value);
                }

                if (value instanceof AtomPromise) {
                    value._persist = true;
                }

                this._lastValue = value;
                this._isUpdating = true;
                this.control.setLocalValue(this.key, value, this.element, true);
                this._isUpdating = false;
            }


        }
    });
})(window, WebAtoms.AtomComponent.prototype);
