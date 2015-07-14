/// <reference path="../Core/WebAtoms.Core.js" />
/// <reference path="../Data/AtomBinding.js" />
/// <reference path="../Core/AtomDispatcher.js" />
/// <reference path="../Core/AtomUIComponent.js" />


// Binding Handlers
var AtomBinders = {
    "{": function (ctrl, key, value, element) {
        value = value.substr(1, value.length - 2);
        var be = AtomEvaluator.parse(value);
        if (be.path) {
            var ae = new AtomEnumerator(be.path);
            value = [];
            while (ae.next()) {
                var pe = new AtomEnumerator(ae.current());
                var v = ctrl;
                while (pe.next()) {
                    v = AtomBinder.getValue(v, pe.current());
                }
                value.push(v);
            }
        } else {
            value = [value];
        }
        value.push(Atom);
        value.push(AtomPromise);
        value = be.method.apply(null, value);

        ctrl.setLocalValue(key, value, element);
    },
    "[": function (ctrl, key, value, element) {
        value = value.substr(1, value.length - 2);
        var be = AtomEvaluator.parse(value);
        if (be.length == 0) {
            value = eval(value);
            AtomBinder.setValue(ctrl, key, value);
        } else {
            if (be.length == 1 && be.path[0] == be.original) {
                ctrl.bind(element, key, value, false);
            }
            else {
                ctrl.bind(element, key, be.path, false, be.method);
            }
        }
    },
    "$[": function (ctrl, key, value, element) {
        var l = value.lastIndexOf("]");
        var events = null;
        if (l < value.length - 1) {
            events = value.substr(l + 2);
            events = events.substr(0, events.length - 1);
        }
        value = value.substr(0, l);
        value = value.substr(2);
        if (/^(@|\$)/g.test(value)) {
            value = value.substr(1);
        }
        ctrl.bind(element, key, value, true, null, events);
    },
    "^[": function (ctrl, key, value, element) {
        value = value.substr(2, value.length - 3);
        if (/^(@|\$)/g.test(value)) {
            value = value.substr(1);
        }
        ctrl.bind(element, key, value, true, null, "keyup,keydown,keypress,blur,click");
    }
};

// Property Handlers
var AtomProperties = {
    any: function (e, v, k) {
        AtomUI.attr(e, k, v);
    },
    isEnabled: function(element,value){
        if (value) {
            AtomUI.removeAttr(element,"disabled");
        } else {
            AtomUI.attr(element,"disabled", "disabled");
        }
    },
    checked: function (element, value) {
        if (element.checked != value) {
            element.checked = value ? true : false;
        }
    },
    value: function (element, value) {
        if (/date|datetime/gi.test(element.type)) {
            element.valueAsDate = AtomDate.parse(value);
        } else {
            $(element).val(value);
        }
    },
    valueAsDate: function (element, value) {
        element.valueAsDate = AtomDate.parse(value);
    },
    text: function (element, value) {
        //clears everything..
        element.innerHTML = "";
        var a = document.createTextNode(value);
        element.appendChild(a);
    },
    mask: function (element, value) {
        if (value) {
            if (value.constructor === String) {
                $(element).mask(value);
            } else {
                $(element).mask(value.mask, value.settings);
            }
        } else {
            $(element).unmask();
        }
    },
    html: function (element, value) {
        element.innerHTML = value;
    },
    absPos: function (element, value) {
        AtomProperties.setPosition(true, element, value);
    },
    relPos: function (element, value) {
        AtomProperties.setPosition(false, element, value);
    },
    "class": function (element,value) {
        if (element.atomClass) {
            $(element).removeClass(element.atomClass);
        }
        if (value) {
            value = AtomUI.createCss(value);
            if (value) {
                $(element).addClass(value);
            }
            element.atomClass = value;
        }
    },
    setPosition: function (a, e, val) {
        var l = val;

        if (l.constructor == String) {
            l = eval("[" + l + "]");
        }

        e.style.position = a ? 'absolute' : 'relative';

        var left = l[0];
        var top = l[1];

        if (left !== null) {
            e.style.left = left + "px";
        }
        if (top !== null) {
            e.style.top = top + "px";
        }
        if (l.length > 2) {
            var width = l[2];
            var height = l[3];
            if (width !== undefined && width !== null) {
                e.style.width = width + "px";
            }
            if (height !== undefined && height !== null) {
                e.style.height = height + "px";
            }
        }
    }
};

window.AtomProperties = AtomProperties;

(function (base) {

    return classCreatorEx({
        name: "WebAtoms.AtomControl",
        base: base,
        start: function (element) {
            element.atomControl = this;
            this._element = element;

            this.dispatcher = WebAtoms.dispatcher;
            this.bindings = [];
            this._isVisible = true;

            var eid = element.id;
            if (eid && appScope) {
                if (!/^\_\_waID/.test(eid)) {
                    appScope[eid] = this;
                }
            }
            AtomUI.assignID(element);

            allControls[eid] = this;
        },
        properties: {
            layout: null,
            loadNext: null,
            next: null,
            merge: undefined,
            value: undefined
        },
        methods: {
            set_merge: function (v) {
                this._mergeData2 = null;
                if (!v)
                    return;
                var d = v.data;
                if (d) {
                    Atom.merge(this.get_data(), d, true);
                    this._mergeData2 = d;
                }
                d = v.scope;
                if (d) {
                    Atom.merge(this.get_scope(), d, true);
                }
                d = v.appScope;
                if (d) {
                    Atom.merge(this.get_appScope(), d, true);
                }
                d = v.localScope;
                if (d) {
                    Atom.merge(this.get_localScope(), d, true);
                }
                d = v.owner;
                if (d) {
                    Atom.merge(this,d,true);
                }
                var action = (v.timeOut || v.timeout);
                if (action) {
                    var _this = this;
                    var tm = 100;
                    if (action.hasOwnProperty("length")) {
                        if (action.length > 1) {
                            tm = action[0];
                            action = action[1];
                        }
                    }
                    setTimeout(function () {
                        _this.set_merge(action);
                    }, tm);
                    return;
                }

            },
            invokeAction: function (action, evt) {
                if (!action)
                    return;
                if (action.constructor == String) {
                    location.href = action;
                }
                else {

                    var f = action;

                    // is it atomControl?
                    if (f.atomControl) {
                        f = f.atomControl;
                        if (f.refresh) {
                            f.refresh(this.get_scope(), this);
                        } else {
                            Atom.alert("no default action defined");
                        }
                    } else {
                        if (f._element) {
                            f.refresh(this.get_scope(), this);
                        } else {

                            //is it function

                            if ((typeof f) == 'function') {

                                // invoke method...
                                f(this.get_scope(), this, evt);
                            } else {

                                // it is an array...
                                if (f.length) {
                                    var ae = new AtomEnumerator(f);
                                    while (ae.next()) {
                                        this.invokeAction(ae.current(), evt);
                                    }
                                    return;
                                }

                                // identify scope and actions...
                                var action = (f.timeOut || f.timeout);
                                if (action) {
                                    var _this = this;
                                    var tm = 100;
                                    if (action.hasOwnProperty("length")) {
                                        if (action.length > 1) {
                                            tm = action[0];
                                            action = action[1];
                                        }
                                    }
                                    setTimeout(function () {
                                        _this.invokeAction(action);
                                    }, tm);
                                    return;
                                }
                                this.set_merge(f);
                                action = f.confirm;
                                if (action) {
                                    var msg = "Are you sure?";
                                    if (action.hasOwnProperty("length")) {
                                        if (action.length > 1) {
                                            msg = action[0];
                                            action = action[1];
                                        } else {
                                            action = action[0];
                                        }
                                    }
                                    var _this = this;
                                    var _action = action;
                                    var _evt = evt;
                                    Atom.confirm(msg, function () {
                                        _this.invokeAction(_action, _evt);
                                    });
                                }
                                action = f.alert;
                                if (action) {
                                    Atom.alert(action);
                                }
                                action = f.next;
                                if (action) {
                                    this.invokeAction(action, evt);
                                    return;
                                }
                                action = f.control;
                                if (action) {
                                    allControls[action].refresh();
                                }
                                action = f.window;
                                if (action) {
                                    WebAtoms.AtomWindow.openNewWindow({
                                        url: action,
                                        localScope: false,
                                        opener: this,
                                        scope: this.get_scope()
                                    });
                                }
                                action = f.localWindow;
                                if (action) {
                                    WebAtoms.AtomWindow.openNewWindow({
                                        url: action,
                                        localScope: true,
                                        opener: this,
                                        scope: this.get_scope()
                                    });
                                }

                            }
                        }
                    }
                }
            },

            refresh: function () {
                // invoke some default action...!!!
            },

            get_element: function () {
                return this._element;
            },

            clearBinding: function (element, key) {
                var ae = new AtomEnumerator(this.bindings);
                var item;
                var removed = [];
                while (ae.next()) {
                    item = ae.current();
                    if (element && item.element != element)
                        continue;
                    if (key && item.key != key)
                        continue;
                    //this.bindings.splice(ae.currentIndex(), 1);
                    item.dispose();
                    removed.push(item);
                }
                ae = new AtomEnumerator(removed);
                while (ae.next()) {
                    AtomArray.remove(this.bindings, ae.current());
                }
            },
            addBinding: function (target, element, key, path, twoWays, jq, valueFunction, events) {
                this.clearBinding(element, key);
                var ab = new WebAtoms.AtomBinding(target, element, key, path, twoWays, jq, valueFunction, events);
                this.bindings.push(ab);
                ab.setup();
            },

            get_atomParent: function (element) {
                if (element == null) {
                    if (this._element._logicalParent || this._element.parentNode)
                        element = this._element._logicalParent || this._element.parentNode;
                    else
                        return null;
                }
                if (element.atomControl) {
                    return element.atomControl;
                }
                if (element === document || element === window || !element.parentNode)
                    return null;
                return this.get_atomParent(element._logicalParent || element.parentNode);
            },

            get_templateParent: function (element) {
                if (!element) {
                    element = this._element;
                }
                if (element._templateParent) {
                    return element._templateParent;
                }
                var p = element._logicalParent || element.parentNode;
                if (!p)
                    throw new Error("Could not find templateParent");
                return this.get_templateParent(element._logicalParent || element.parentNode);
            },

            get_data: function () {
                if (this._data === undefined) {
                    // get parent...
                    var ap = this.get_atomParent(this._element._logicalParent || this._element.parentNode);
                    if (ap)
                        return ap.get_data();
                }
                return this._data;
            },
            set_data: function (d) {
                this._data = d;
                this.mergeData();
                // update child references...
                this.updateChildBindings(this._element);
            },

            mergeData: function () {
                if (!this._mergeData2)
                    return;
                Atom.merge(this.get_data(), this._mergeData2, true);
            },

            updateChildBindings: function (element) {
                var ae = new ChildEnumerator(element);
                while (ae.next()) {
                    var child = ae.current();
                    if (child.atomControl && child.atomControl._created) {
                        var ctrl = child.atomControl;
                        if (ctrl._data !== undefined)
                            continue;
                        AtomBinder.refreshValue(ctrl, "data");
                        ctrl.mergeData();
                    }
                    this.updateChildBindings(child);
                }
            },

            initProperties: function () {

                if (this._disposed)
                    return;

                //// init properties...
                var element = this.get_element();

                this.setProperties(element);
                this._created = true;
                this.onCreated();
                this.onLoaded();
            },


            createChildren: function () {

                this.onCreateChildren(this._element);

                var t = this.getTemplate("template");

                if (t) {
                    var ce = new ChildEnumerator(this._element);
                    // check if there is any children or not..
                    if (!ce.next()) {
                        if (t.constructor == String) {
                            this._element.innerHTML = t;
                            var caller = this;
                            $(this._element).children().each(function () {
                                this._templateParent = caller;
                            });
                        } else {
                            //this._element.innerHTML = this._template;
                            if (AtomUI.isNode(t)) {
                                t = AtomUI.cloneNode(t);
                                t._templateParent = this;
                                this._element.appendChild(t);
                            } else {
                                // should be an array...
                                var ae = new AtomEnumerator(t);
                                while (ae.next()) {
                                    var tc = ae.current();
                                    tc = AtomUI.cloneNode(tc);
                                    tc._templateParent = this;
                                    this._element.appendChild(tc);
                                }
                            }
                        }
                        this.onCreateChildren(this._element);
                    }
                }
            },


            onCreateChildren: function (element) {

                var ae = new ChildEnumerator(element);
                var child;
                while (ae.next()) {
                    child = ae.current();

                    var amap = AtomUI.attributeMap(child, /^atom\-(template|presenter|type|template\-name)$/gi);

                    var t = amap["atom-template"];
                    if (t) {
                        child.removeAttributeNode(t.node);
                        element.templateOwner = true;
                        this["_" + t.value] = child;
                        element.removeChild(child);
                        continue;
                    }

                    var tn = amap["atom-template-name"];
                    if (tn) {
                        child.removeAttributeNode(tn.node);
                        this._scopeTemplates = this._scopeTemplates || {};
                        this._scopeTemplates[tn.value] = child;
                        element.removeChild(child);
                        continue;
                    }

                    var p = amap["atom-presenter"];
                    if (p) {
                        // search upwords for expected presenter...
                        var owner = AtomUI.getPresenterOwner(this, p.value);
                        owner["_" + p.value] = child;
                    }

                    var childType = amap["atom-type"];

                    if (childType) {
                        AtomUI.createControl(child, childType.value);
                        //element.removeAttributeNode(childType.node);
                    } else {
                        this.onCreateChildren(child);
                    }
                }
            },

            onLoaded: function () {
            },

            onUpdateUI: function () {
                if (this._layout) {
                    this._layout.doLayout(this._element);
                } else {
                    this.updateChildUI(this.get_element());
                }
            },

            updateUI: function () {
                var ctrl = this;
                this.dispatcher.callLater(function () {
                    ctrl.onUpdateUI();
                });
            },

            updateChildUI: function (parent) {
                if (!parent)
                    parent = this._element;
                var ae = new ChildEnumerator(parent);
                while (ae.next()) {
                    var child = ae.current();
                    if (child.atomControl) {
                        child.atomControl.updateUI();
                        continue;
                    }
                    this.updateChildUI(child);
                }
            },

            onCreated: function () {
                this.updateUI();
            },

            setProperties: function (element) {


                var obj;
                var key;
                var value;
                var fn;
                var at;

                var attr = element.attributes;
                var ae = new AtomEnumerator(attr);

                var remove = [];

                var nodeValue = "value";
                if (AtomBrowser.isIE && AtomBrowser.majorVersion < 9) {
                    nodeValue = "nodeValue";
                }

                var bindList = {};

                var compiledFunc = null;

                while (ae.next()) {
                    at = ae.current();
                    key = at.nodeName;
                    value = at[nodeValue];

                    if (key === "data-atom-init") {
                        compiledFunc = value;
                        remove.push(at);
                        continue;
                    }
                    if (/^data\-atom/.test(key)) {
                        key = key.substr(5);
                    }

                    if (/^atomControl$/g.test(key)) {
                        continue;
                    }
                    if (/^atom\-type$/.test(key)) {
                        remove.push(at);
                        continue;
                    }
                    if (!(/^(atom|bind|style|event)\-/g.test(key)))
                        continue;
                    if (!(/^(style|event)\-/g.test(key)))
                        key = key.substr(5);

                    if (!value)
                        continue;

                    if (!/(^style$|dock)/.test(key)) {
                        remove.push(at);
                    }

                    // rename key...
                    key = $.camelCase(key);

                    bindList[key] = value;

                }

                if (compiledFunc) {
                    var f = WebAtoms.PageSetup[compiledFunc];
                    f.call(this, element);
                }

                // Since setValue may add up new attributes
                // We set value after we have collected attribute list
                for (key in bindList) {
                    this.setValue(key, bindList[key], true, element);
                }

                ae = new AtomEnumerator(remove);
                while (ae.next()) {
                    //$(element).removeAttr(ae.current().nodeName);
                    element.removeAttributeNode(ae.current());
                }

                var child = new ChildEnumerator(element);
                while (child.next()) {
                    var childItem = child.current();
                    if (childItem.atomControl)
                        continue;
                    this.setProperties(childItem);
                }

            },

            setValue: function (key, value, bind, element) {
                if (value && value.constructor == String) {

                    var s = value[0];

                    var f = AtomBinders[s];
                    if (f) {
                        f(this, key, value, element);
                        return;
                    }

                    s += value[1];
                    f = AtomBinders[s];
                    if (f) {
                        f(this, key, value, element);
                        return;
                    }

                }

                this.setLocalValue(key, value, element);
            },

            setLocalValue: function (key, value, element, refresh) {

                // undefined can never be set
                if (value === undefined)
                    return;

                if (value && value instanceof AtomPromise) {

                    element._promisesQueue = element._promisesQueue || {};

                    var op = element._promisesQueue[key];
                    if (op) {
                        op.abort();
                    }
                    element._promisesQueue[key] = value;

                    if (value._persist) {

                        // is it a promise?
                        this._promises = this._promises || {};

                        // cache promise...
                        this._promises[key] = value;


                    }

                    var caller = this;

                    value.then(function (p) {

                        if (element._promisesQueue[key] == p) {
                            element._promisesQueue[key] = null;
                        }

                        element._promisesQueue[key] = null;

                        caller.setLocalValue(key, p.value(), element, true);

                        if (caller._loadNext) {
                            caller.invokeAction(caller._loadNext);
                        }
                    });

                    value.failed(function (p) {
                        if (element._promisesQueue[key] == p) {
                            element._promisesQueue[key] = null;
                        }
                    });

                    value.invoke();
                    return;

                }

                if (this._element == element) {
                    var fn = this["set_" + key];
                    if (fn != null) {
                        if (refresh) {
                            // checking old value is necessary
                            // as two way binding may cause recursive
                            // updates
                            var oldValue = AtomBinder.getValue(this, key);
                            if (oldValue == value)
                                return;
                        }
                        fn.apply(this, [value]);
                        if (refresh) {
                            AtomBinder.refreshValue(this, key);
                        }
                        return;
                    }
                }

                if (/^style/g.test(key) && key.length > 5) {
                    var k = key.substr(5);
                    k = String.fromCharCode(k.charCodeAt(0)).toLowerCase() + k.substr(1);
                    element.style[k] = value;
                    return;
                }

                if (/^event/g.test(key) && key.length > 5) {
                    var k = key.substr(5);
                    k = String.fromCharCode(k.charCodeAt(0)).toLowerCase() + k.substr(1);
                    var _this = this;
                    // unbind previous event...
                    this.unbindEvent(element, k);
                    this.bindEvent(element, k, null, null, function (evt) {
                        _this.invokeAction(value, evt);
                    });
                    return;
                }

                var f = AtomProperties[key] || AtomProperties.any;
                if (f) {
                    f(element || this._element, value, key);
                }

            },

            bind: function (element, key, value, twoWays, vf, events) {

                if (value == null) {
                    // remove existing binding...
                    this.clearBinding(element, key);
                    return;
                }

                var target = this;
                if (value && value.constructor == String && /^window\./g.test(value)) {
                    target = window;
                }

                var thisElement = this.get_element();

                var jq = thisElement != element;

                if (!jq) {
                    var f = this["get_" + key];
                    if (f == undefined || f == null) {
                        jq = true;
                    }
                }

                switch (key) {
                    case "value":
                        if (/input/gi.test(element.nodeName)) { jq = true; }
                        this.addBinding(target, element, "value", value, twoWays, jq, vf, events);
                        break;
                    case "text":
                        this.addBinding(target, element, "text", value, false, true, vf, events);
                        break;
                    default:
                        this.addBinding(target, element, key, value, twoWays, jq, vf, events);
                        break;
                }

            },

            onInitialized: function () {
            },

            init: function () {

                // first remove all templates ...
                base.init.apply(this, arguments);

                // init properties...
                var element = this.get_element();

                var amap = AtomUI.attributeMap(element, /^atom\-(name|local\-scope)$/gi);

                var aname = amap["atom-name"];
                if (!aname) {
                    var eid = element.id;
                    if (!/^\_\_waID/.test(eid)) {
                        aname = element.id;
                    }
                } else {
                    element.removeAttributeNode(aname.node);
                    aname = aname.value;
                }
                if (aname) {
                    if (/^(app|window|owner|scope|localScope|parent)$/gi.test(aname))
                        throw new Error("Invalid Control Name '" + aname + "'");
                    var s = this.get_scope();
                    AtomBinder.setValue(s, aname, this);
                    this._name = aname;
                }


                ls = amap["atom-local-scope"];
                if (ls) {
                    this._localScope = new AtomScope(this, this.get_scope(), atomApplication);
                    this._scope = this._localScope;
                    if (this._name) {
                        this._localScope[this._name] = this;
                    }
                    element.removeAttributeNode(ls.node);
                }

                // scope is now ready, set scopeTemplates...
                var st = this._scopeTemplates;
                if (st) {
                    var s = this.get_scope();
                    for (var i in st) {
                        var t = st[i];
                        AtomBinder.setValue(s, i, t);
                    }
                    //try {
                    //    delete this._scopeTemplates;
                    //} catch (exx) {

                    //}
                }

                //var fn = Function.createDelegate(this, this.initProperties);
                var _this = this;
                WebAtoms.dispatcher.callLater(function () {
                    _this.initProperties();
                });

                // init every children..
                this.initChildren(this._element);

                //fn = Function.createDelegate(this, this.onInitialized);
                WebAtoms.dispatcher.callLater(function () {
                    _this.onInitialized();
                });
            },


            dispose: function (e) {

                // disposing only one element
                if (e) {
                    var eac = e.atomControl;
                    if (eac) {
                        eac.dispose();
                    } else {
                        this.clearBinding(e);
                        this.disposeChildren(e);
                    }
                    $(e).remove();
                    return;
                }

                this._disposed = true;
                this.disposeChildren(this._element);
                this.clearBinding();
                this.bindings.length = 0;
                base.dispose.apply(this, arguments);
            },


            disposeChildren: function (e) {
                var oldIE = AtomBrowser.isIE && AtomBrowser.majorVersion < 9;
                var ae = new ChildEnumerator(e);
                while (ae.next()) {
                    var ce = ae.current();
                    if (ce.atomControl) {
                        ce.atomControl.dispose();
                        if (oldIE) {
                            ce.atomControl = undefined;
                        } else {
                            delete ce.atomControl;
                        }
                    } else {
                        this.clearBinding(ce);
                        this.unbindEvent(ce);
                        this.disposeChildren(ce);
                    }
                    //$(ce).remove();
                }
                // this will and should remove every children..
                try {
                    e.innerHTML = "";
                } catch (ex) {
                    $(e).html('');
                }
            },

            get_innerTemplate: function () {
                return this._template;
            },

            set_innerTemplate: function (v) {
                if (this._template === v) {
                    if (this._created)
                        return;
                }
                if (!this._created) {
                    var _this = this;
                    // this is because, sometimes template change occurs while creation
                    // which creates endless loop
                    WebAtoms.dispatcher.callLater(function () {
                        _this.set_innerTemplate(v);
                    });
                    return;
                }
                this._template = v;
                // disposing all children...
                this.disposeChildren(this._element);

                this.createChildren();
                this.setProperties(this._element);
                this.initChildren(this._element);
                this.updateUI();
            },

            initChildren: function (e) {
                var ae = new ChildEnumerator(e);
                var item;
                var ctrl;

                var remove = [];

                while (ae.next()) {
                    item = ae.current();

                    if (item.nodeName == "SCRIPT") {

                        var s = $.trim(item.innerHTML);
                        if (/^\(\{/.test(s) && /\}\)$/.test(s)) {
                            try {
                                s = (new Function("return " + s + ";"))()
                                this.set_scope(s);
                            } catch (ex) {
                                log(JSON.stringify(ex));
                                alert(JSON.stringify(ex));
                            }

                        }
                        remove.push(item);
                        continue;

                    }

                    ctrl = item.atomControl;
                    if (ctrl) {
                        ctrl.init();
                    } else {
                        this.initChildren(item);
                    }
                }

                ae = new AtomEnumerator(remove);
                while (ae.next()) {
                    e.removeChild(ae.current());
                }
            }
        }
    });
})(WebAtoms.AtomUIComponent.prototype);
