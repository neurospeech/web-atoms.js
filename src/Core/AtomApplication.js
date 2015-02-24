/// <reference path="../Controls/AtomDockPanel.js" />

this.appScope = null;

this.atomApplication = null;

(function (base) {

    return classCreator("WebAtoms.AtomApplication", base,
        function (element) {
            $(element).removeClass("atom-dock-panel");
            $(element).addClass("atom-application");

            this._scope = new AtomScope(this, null, this);
            window.appScope = this._scope;

            if (window.model) {
                window.appScope.model = window.model;
                this._data = window.model;
            }

            window.atomApplication = this;
            this.busyCount = 0;

            var url = location.hash;
            url = url ? url.substr(1) : url;
            if (url) {
                var s = AtomUI.parseUrl(url);
                this._hash = location.hash;
                var ts = this._scope;
                for (var i in s) {
                    ts[i] = s[i];
                }
            } else {
                this._hash = location.hash;
            }

        },
        {
            get_title: function () {
                return document.title;
            },
            set_title: function (v) {
                document.title = v;
            },

            get_isBusy: function () {
                return this.busyCount;
            },

            setBusy: function (b, msg) {
                if (b) {
                    this.busyCount++;
                } else {
                    this.busyCount--;
                }
                if (msg !== undefined) {
                    if (!msg)
                        msg = "";
                    AtomBinder.setValue(this, "busyMessage", msg);
                } else {
                    AtomBinder.setValue(this, "busyMessage", "Loading...");
                }
                AtomBinder.refreshValue(this, "isBusy");
            },

            updateUI: function () {
                //if (!this._renderAsPage) {
                //    var element = this.get_element();
                //    var ep = element.parentNode;
                //    var pw = $(ep).outerWidth();
                //    var left = (pw - $(element).width()) / 2;
                //    element.style.left = left + "px";
                //    element.style.position = "absolute";
                //}
                base.updateUI.call(this);

                AtomBinder.refreshValue(this, "appWidth");
                AtomBinder.refreshValue(this, "appHeight");
                AtomBinder.refreshValue(this, "bodyWidth");
                AtomBinder.refreshValue(this, "bodyHeight");
            },

            onUpdateUI: function () {
                if (!this._renderAsPage) {
                    base.onUpdateUI.call(this);
                }
            },

            get_appWidth: function () {
                return $(this._element).width();
            },
            get_appHeight: function () {
                return $(this._element).height();
            },

            get_bodyWidth: function () {
                return $(document.body).width();
            },
            get_bodyHeight: function () {
                return $(document.body).height();
            },


            onHashChanged: function () {

                if (this._noHashRefresh)
                    return;
                var scope = this._scope;

                var url = location.hash ? location.hash : this._defaultScope;
                if (!url) {
                    return;
                }

                //log("#changed:" + url);

                this._noHashRefresh = true;
                url = url.substr(1);

                var s = AtomUI.parseUrl(url);

                if (this._created) {
                    for (var key in s) {
                        var val = s[key];
                        if (scope[key] != val) {
                            AtomBinder.setValue(scope, key, val);
                        }
                    }
                } else {
                    Atom.merge(scope, s);
                }

                this._noHashRefresh = false;

            },

            invokeUpdateUI: function () {
                var container = this;
                var _this = this;
                window.setTimeout(function () {
                    return _this.updateUI();
                }, 5);
            },

            onRefreshValue: function (target, key) {
                if (this._noHashRefresh)
                    return;

                var dest = this._defaultScope;
                if (!dest)
                    return;

                var i = key;
                if (i.indexOf('_') == 0)
                    return;
                var val = this._scope[i];
                if (val === undefined)
                    return;
                if (val === null)
                    return;
                var t = typeof (val);
                if (t != 'string' && t != 'number' && t != 'boolean') {
                    return;
                }


                var diff = [];
                var src = this._scope;

                for (var k in src) {
                    var v = src[k];
                    if (dest.hasOwnProperty(k)) {
                        if (v == dest[k])
                            continue;
                        diff.push({ key: k, value: v });
                    } else {
                        if (k.indexOf('_') == 0) continue;
                        if (v === undefined || v === null) continue;
                        if (!/string|number|boolean/i.test(typeof (v))) continue;
                        diff.push({ key:k, value: v });
                    }
                }

                var p = "#" + diff.map(function (a) { return a.key + "=" + encodeURIComponent(a.value); }).join("&");

                if (p == location.hash)
                    return;

                this._noHashRefresh = true;
                if (history && history.pushState) {
                    history.pushState({}, document.title, (location.href.split('#')[0]) + p);
                } else {
                    location.href = p;
                }
                this._noHashRefresh = false;
            },

            onInitialized: function () {

                var d = {};
                var src = this._scope;
                for (var k in src) {
                    if (k.indexOf('_') == 0)
                        continue;
                    var val = src[k];
                    if (val === undefined)
                        continue;
                    if (val === null)
                        continue;
                    var t = typeof (val);
                    if (t != 'string' && t != 'number' && t != 'boolean') {
                        continue;
                    }
                    d[k] = val;
                }
                this._defaultScope = d;
                base.onInitialized.call(this);
                if (!this._renderAsPage) {
                    $(this._element).addClass("atom-dock-application");
                }

            },

            createChildren: function () {
                base.createChildren.call(this);

                this.getTemplate("busyTemplate");
                if (this._busyTemplate) {
                    this._element.appendChild(this._busyTemplate);

                    this.onCreateChildren(this._busyTemplate);
                }
            },

            onCreated: function () {
                base.onCreated.call(this);


                if (AtomBrowser.isIE && AtomBrowser.majorVersion < 8) {
                    // setup timer...
                    var _this = this;
                    setInterval(function () {
                        _this.onCheckHash();
                    }, 1000);
                    this._lastHash = location.hash;
                } else {
                    var eventName = window.onhashchange ? "onhashchange" : "hashchange";
                    this.bindEvent(window, eventName, "onHashChanged");
                }

                if (this._next) {
                    WebAtoms.dispatcher.callLater(function () {
                        window.atomApplication.invokeAction(window.atomApplication._next);
                    });
                }
            },

            onCheckHash: function () {
                if (this._lastHash != location.hash) {
                    this.onHashChanged();
                    this._lastHash = location.hash;
                }
            },

            onCloseCommand: function () {
                if (!parent)
                    return;
                //var iframe = parent.document.getElementById(frameElement.id);
                var win = frameElement.atomWindow;
                win._value = this._value;
                win.onCloseCommand();
            },

            setup: function () {
                this.createChildren();
                this.init();
            },

            init: function () {

                this.bindEvent(window, "resize", "invokeUpdateUI");

                var _this = this;
                this._onRefreshValue = function () {
                    _this.onRefreshValue.apply(_this, arguments);
                };

                this._scope._$_watcher = this;

                base.init.call(this);


                this.closeCommand = function () {
                    _this.onCloseCommand.apply(_this, arguments);
                };

            }
        },
        {
            renderAsPage: false,
            busyMessage: "",
            progress: 0

        });
})(WebAtoms.AtomDockPanel.prototype);