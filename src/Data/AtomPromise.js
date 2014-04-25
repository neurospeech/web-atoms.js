/// <reference path="AtomBindingHelper.js" />


var AtomPromise = function () {

    this._success = [];
    this._failed = [];
    this._cached = false;

    this._process = null;

    this._calls = 0;

    this._showProgress = true;
    this._showError = true;
    var _this = this;
    this.success = function () {
        _this.onSuccess.apply(_this, arguments);
    };

    this.error = function () {
        _this.onError.apply(_this, arguments);
    };
}

window.AtomPromise = AtomPromise;

AtomPromise.prototype = {

    onSuccess: function (c) {
        this._value = c;
        if (this._process) {
            this._value = this._process(this._value);
        }
        var r = this._success;
        for (var i = 0; i < r.length ; i++) {
            r[i](this);
        }
    },

    onError: function () {
        this.errors = arguments;
        var r = this._failed;
        for (var i = 0; i < r.length; i++) {
            r[i](this);
        }
    },

    then: function (t) {
        this._success.push(t);
        return this;
    },

    process: function (f) {
        this._process = f;
        return this;
    },

    failed: function (f) {
        this._failed.push(f);
        return this;
    },

    value: function (v) {

        if (v !== undefined) {
            this._value = v;
            return;
        }
        return this._value;
    },

    onInvoke: function (r) {
        this._invoke = r;
        return this;
    },

    invoke: function () {
        if (!this._persist) {
            this.invokePromise();
            return this;
        }
        var _this = this;
        this.promiseTimeout = setTimeout(function () {
            _this.invokePromise();
        }, 100);
        return this;
    },

    invokePromise: function () {
        this.promiseTimeout = null;
        if (this._showProgress) {
            atomApplication.setBusy(true);
            if (this._calls == 0) {
                var f = function () {
                    atomApplication.setBusy(false);
                };
                this.then(f);
                this.failed(f);
            }
        }
        this._calls++;
        this._invoke(this);
        return this;
    },

    pushValue: function (v) {
        var _this = this;
        this._cached = true;
        setTimeout(function () {
            _this.onSuccess.apply(_this, [v]);
        }, 1);
    },


    showProgress: function (b) {
        this._showProgress = b;
        return this;
    },

    showError: function (b) {
        this._showError = b;
        return this;
    },

    persist: function (v) {
        if (v === undefined)
            this._persist = true;
        else
            this._persist = v;
        return this;
    },

    abort: function () {
        if (this.promiseTimeout) {
            clearTimeout(this.promiseTimeout);
            this.promiseTimeout = null;
            return;
        }
        this._failed.length = 0;
        this._success.length = 0;
        if (this._showProgress) {
            atomApplication.setBusy(false);
        }
        if (this.handle) {
            this.handle.abort();
        }
    }

};

AtomPromise.getUrl = function (url) {
    var pageUrl = location.href;
    var index = pageUrl.indexOf('#');
    if (index != -1)
        pageUrl = pageUrl.substr(0, index);
    if (url) {
        index = pageUrl.lastIndexOf('/');
        if (index != -1) {
            pageUrl = pageUrl.substr(0, index + 1);
        }


        //if (AtomUI.startsWith(url, "http://") || AtomUI.startsWith(url, "https://")) {
        //    return url;
        //}
        if (/^(http|https)\:\/\//gi.test(url)) {
            return url;
        }
        if (/^\//gi.test(url)) {
            return url;
        }
        if (/^\./gi.test(url)) {
            url = url.substr(1);
            //if (AtomUI.endsWith(pageUrl, "/") && AtomUI.startsWith(url, "/")) {
            //    url = url.substr(1);
            //}
            if (/\/$/gi.test(pageUrl) && /^\//gi.test(url)) {
                url = url.substr(1);
            }
            return pageUrl + url;
        }
        return pageUrl + url;
    } else {
        return pageUrl;
    }
};

AtomPromise.parseDates = function (obj) {
    if (!obj)
        return obj;
    var type = typeof (obj);
    if (type == 'object') {
        if (typeof (obj.length) != 'undefined') {
            for (var i = 0; i < obj.length; i++) {
                obj[i] = AtomPromise.parseDates(obj[i]);
            }
            return obj;
        }

        for (var k in obj) {
            var v = obj[k];
            if (!v)
                continue;
            obj[k] = AtomPromise.parseDates(v);
        }

    }
    if (typeof (obj) == 'string' || obj.constructor == String) {
        if (/^\/date\(/gi.test(obj) && /\)\/$/gi.test(obj)) {
            return AtomDate.parse(obj);
        }
    }
    return obj;
};

AtomPromise.ajax = function (url, query, options, type) {
    var p = new AtomPromise();

    if (!options) {
        options = {
            type: "GET",
            dataType: "text",
            data: null
        };
    }

    if (AtomConfig.ajax.versionUrl)
    {
        if (options.versionUrl !== undefined && options.versionUrl) {
            query = query || {};
            query[AtomConfig.ajax.versionKey] = AtomConfig.ajax.version;
        }
    }


    options.success = p.success;
    options.error = p.error;

    // caching is disabled by default...
    if (options.cache === undefined) {
        options.cache = false;

    }


    var u = url;

    var dh = AtomConfig.ajax.headers;
    if (dh) {
        if (!options.headers) {
            options.headers = {};
        }
        for (var k in dh) {
            var v = dh[k];
            options.headers[k] = v;
            if (AtomConfig.debug) {
                log("Header set: " + k + "=" + v);
            }
        }
    }


    var sc = AtomConfig.ajax.statusCode;
    if (sc) {
        var osc = options.statusCode || {};
        for (var k in sc) {
            var v = sc[k];
            if (!osc[k]) {
                osc[k] = v;
            }
        }
        options.statusCode = osc;
    }

    var o = options;

    var data = o.data;

    if (data) {
        data = AtomBinder.getClone(data);
        var e = AtomConfig.ajax.jsonPostEncode;
        if (e) {
            data = e(data);
        } else {
            data = { formModel: JSON.stringify(data) };
        }
        o.data = data;
    }

    var attachments = o.attachments;
    if (attachments && attachments.length) {
        var fd = new FormData();
        var ae = new AtomEnumerator(attachments);
        while (ae.next()) {
            fd.append("file" + ae.currentIndex(), ae.current());
        }
        if (data) {
            for (var k in data) {
                fd.append(k, data[k]);
            }
        }
        o.type = "POST";
        o.xhr = function () {
            var myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) {
                myXhr.upload.addEventListener('progress', function (e) {
                    if (e.lengthComputable) {
                        var percentComplete = Math.round(e.loaded * 100 / e.total);
                        AtomBinder.setValue(atomApplication, 'progress', percentComplete);
                    }
                }, false);
            }
            return myXhr;
        };
        o.cache = false;
        o.contentType = false;
        o.processData = false;
    }

    if (query) {
        var q = {};
        if (!o.sendRawQueryString) {
            for (var k in query) {
                var v = query[k];
                if (v && ((typeof v) == "object")) {
                    v = JSON.stringify(AtomBinder.getClone(v));
                    if (v === undefined)
                        continue;
                    if (v === null)
                        continue;
                }
                q[k] = v;
            }
        }
        u = Atom.url(url, q);
    }

    if (url) {
        p.onInvoke(function () {
            p.handle = $.ajax(u, o);
        });
    }

    p.failed(function () {

        var res = p.errors[0].responseText;
        if (!res || p.errors[2] != 'Internal Server Error') {
            res = p.errors[2];
        }

        p.error = {
            msg : res
        };

        if (p._showError) {
            if (p.error.msg) Atom.alert(p.error.msg);
        }
    });

    p.then(function (p) {
        var v = p.value();
        v = AtomPromise.parseDates(v);
        if (v && v.items && v.merge) {
            v.items.total = v.total;
            v = v.items;
            p.value(v);
        }
    });

    p.showError(true);
    p.showProgress(true);

    return p;
};

AtomPromise.get = function (url, query, options) {
    options = options || {};
    options.type = options.type || "get";
    options.dataType = options.dataType || "text";
    return AtomPromise.ajax(url, query, options, "get");
};

AtomPromise.json = function (url, query, options) {
    options = options || {};
    options.type = options.type || "get";
    options.dataType = options.dataType || "json";
    return AtomPromise.ajax(url, query, options, "json");
};

AtomPromise.cache = {
};

AtomPromise.cacheInProgress = {
};

AtomPromise.cachedPromise = function (key, p) {
    var c = AtomPromise.cache[key];

    if (!c && window.sessionStorage) {
        c = window.sessionStorage["__AP" + key];
        if (c) {
            c = JSON.parse(c);
            AtomPromise.cache[key] = c;
        }
    }

    if (c) {
        p.onInvoke(function () {
            p.pushValue(c);
        });
        return p;
    }

    p.then(function (p1) {
        AtomPromise.cache[key] = p1.value();
        if (window.sessionStorage) {
            window.sessionStorage["__AP" + key] = JSON.stringify( p1.value() );
        }
    });

    return p;
};

AtomPromise.cachedJson = function (url, query, options) {

    var vd = new Date();

    var v = AtomConfig.ajax.version;
    var vk = AtomConfig.ajax.versionKey + '=' + v;

    if (url.indexOf('?') == -1) {
        vk = '?' + vk;
    } else {
        if (!/\&$/.test(url)) {
            vk = '&' + vk;
        }
    }
    url += vk;

    options = options || {};
    // caching must be true everywhere
    options.cache = true;
    options.ifModified = true;
    options.versionUrl = false;

    var ap = AtomPromise.ajax(url, query, options, "json");
    return AtomPromise.cachedPromise(url, ap);
};

AtomPromise.configCache = {};

AtomPromise.configLabel = function (url, value, options) {

    if (value === null || value === undefined)
        return "";

    options = options || {};

    var valuePath = options.valuePath || "value";
    var labelPath = options.labelPath || "label";
    var isNumber = options.isNumber || false;

    if (isNumber) {
        if (typeof value !== "number") {
            value = parseFloat(value);
        }
    }

    var p = new AtomPromise();
    p.onInvoke(function () {

        var cf = AtomPromise.configCache[url];
        if (cf) {
            cf = cf[value];
            cf = cf ? cf[labelPath] : "";
            p.pushValue(cf);
            return;
        }

        var ap = AtomPromise.cachedJson(url);


        ap.then(function (a) {
            var v = "";

            var nv = {};

            var ae = new AtomEnumerator(a.value());
            while (ae.next()) {
                var item = ae.current();
                v = item[valuePath];
                if (isNumber) {
                    if (typeof v !== "number") {
                        v = parseFloat(v);
                    }
                }
                nv[v] = item;
            }
            AtomPromise.configCache[url] = nv;
            nv = nv[value];
            nv = nv ? nv[labelPath] : "";
            p.pushValue(nv);
        });

        ap.invoke();
    });

    return p;
};

AtomPromise.prototype.insertItem = function (index, item, arrayPath) {
    return this.then(function (p) {
        var v = p.value();
        if (v._$_itemInserted)
            return;
        if (arrayPath) {
            v = v[arrayPath];
        }
        if (index == -1) {
            v.push(item);
        } else {
            v.splice(index || 0, 0, item);
        }
        v._$_itemInserted = true;        
    });
};
//$setValue = AtomBinder.setValue;
//$getValue = AtomBinder.getValue;


//Object.prototype.setValue = function (key, value) {
//    
//    AtomBinder.setValue(this, key, value);
//};

//Object.prototype.getValue = function (key) {
//    return AtomBinder.getValue(this, key);
//};

//Object.prototype.add_WatchHandler = function(key,handler){
//    AtomBinder.add_WatchHandler(this,key,handler);
//};

//Object.prototype.remove_WatchHandler = function(key,handler){
//    AtomBinder.remove_WatchHandler(this,key,handler);
//};

//Array.prototype.add = function (item) {
//    AtomBinder.addItem(this, item);
//};

//Array.prototype.remove = function (item) {
//    AtomBinder.removeItem(this, item);
//};

//Array.prototype.add_CollectionHandler= function(handler){
//    AtomBinder.add_CollectionHandler(this,handler);
//};

//Array.prototype.remove_CollectionHandler= function(handler){
//    AtomBinder.remove_CollectionHandler(this,handler);
//};

