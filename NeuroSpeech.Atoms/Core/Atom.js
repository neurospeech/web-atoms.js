/// <reference path="../JSON.js" />
/// <reference path="../linq-vsdoc.js" />
/// <reference path="../FlashPlayer.js" />
/// <reference path="../jquery-1.5.1-vsdoc.js" />
/// <reference path="AtomBrowser.js" />


// TypeScript Copied...
//var __extends = this.__extends || function (d, b) {
//    function __() { this.constructor = d; }
//    __.prototype = b.prototype;
//    d.prototype = new __();
//};




//if (!Function.prototype.registerClass) {

//    Function.__typeName = 'Function';
//    Function.__class = true;
//    Function.createDelegate = function Function$createDelegate(instance, method) {
//        return function () {
//            return method.apply(instance, arguments);
//        };
//    };

//    //window.Sys = {};

//    //Sys.EventArgs = {};
//    //Sys.EventArgs.Empty = {};

//    window.zEvalProp = function (t, p) {
//        var i = p.indexOf('.');
//        if (i == -1)
//            return t[p];
//        var n = p.substr(0, i);
//        p = p.substr(i + 1);
//        return window.zEvalProp(t[n], p);
//    };

//    // This class registers a prototype along with base Type
//    // This must be called in inheirtence order only
//    Function.prototype.registerClass = function (name, baseType) {
//        var pname = window.zEvalProp(window,name);
//        if (pname !== this)
//            throw new Error("Type " + name + " does not exist");
//        this.__typeName = name;
//        if (baseType) {
//            this.__baseType = baseType;
//            this.baseType = baseType.prototype;
//            //this.prototype = baseType;
//            this.prototype.constructor = this;
//            for (var m in baseType.prototype) {
//                if (this.prototype[m])
//                    continue;
//                this.prototype[m] =  baseType.prototype[m];
//            }
//        }
//    };

//    // Should be used in constructor to call base class constructor
//    Function.prototype.initializeBase = function (instance, baseArguements) {
//        if (baseArguements) {
//            this.__baseType.apply(instance, baseArguements);
//        }else {
//            this.__baseType.apply(instance);
//        }
//    };

//    Function.prototype.callBaseMethod = function (instance, name, baseArguements) {
//        var baseType = this.__baseType;
//        var method = baseType.prototype[name];
//        if (method) {
//            if (baseArguements) {
//                return method.apply(instance, baseArguements);
//            }else {
//                return method.apply(instance);
//            }
//        }else {
//            return baseType.callBaseMethod(instance, name, baseArguements);
//        }
//    };

//    Function.prototype.isNamespace = function (name) {
//        return window[name];
//    };

//    Function.prototype.registerNamespace = function (name) {
//        var ns = name.split('.');
//        var root = window;
//        for (var i = 0; i < ns.length; i++) {
//            var n = ns[i];
//            var type = root[n];
//            if (!type) {
//                type = {};
//                root[n] = type;
//            }
//            root = type;
//        }
//    };

//    window.Type = Function;
//}



var AtomEnumerator = (function (name, base) {
    return classCreator(name, base,
    function (array) {
        this._array = array;
        this.i = -1;
    },
    {
        next: function () {
            this.i = this.i + 1;
            return this.i < this._array.length;
        },
        current: function () {
            return this._array[this.i];
        },
        currentIndex: function () {
            return this.i;
        },
        isFirst: function () {
            return this.i == 0;
        },
        isLast: function () {
            return this.i == this._array.length - 1;
        },
        reset: function () {
            this.i = -1;
        }
    });
})("AtomEnumerator",null);
    

var Atom = {

    refreshWindowCommand: function () {
        location.href = location.pathname + "?_v=" + (new Date()).getTime() + location.hash;
    },

    time: function () {
        return (new Date()).getTime();
    },

    get: function (obj, path) {
        var index = path.indexOf('.');
        if (index != -1) {
            var f = path.substr(0, index);
            obj = AtomBinder.getValue(obj, f);
            path = path.substr(index + 1);
            return Atom.get(obj, path);
        }
        return AtomBinder.getValue(obj, path);
    },

    set: function (obj, path, val) {
        var index = path.indexOf('.');
        if (index != -1) {
            var f = path.substr(0, index);
            obj = AtomBinder.getValue(obj, f);
            path = path.substr(index + 1);
            return Atom.set(obj, path,val);
        }
        AtomBinder.setValue(obj, path, val);
    },

    csv: function (a, path, s) {
        if (!s) {
            s = ", ";
        }
        var l = [];
        var ae = new AtomEnumerator(a);
        while (ae.next()) {
            var item = ae.current();
            l.push(Atom.get(item,path));
        }
        return l.join(s);
    },

    range: function (start, end, step) {
        var a = [];
        step = step || 1;
        for (var i = start; i <= end; i+=step) {
            a.push({ label: i, value: i });
        }
        return a;
    },

    merge: function (x, y, update, clone) {
        //var c = AtomBinder.getClone(y);
        if (!x)
            return;
        var c = clone ? AtomBinder.getClone(y) : y;
        if (update) {
            for (var k in c) {
                //x[k] = c[k];
                AtomBinder.setValue(x, k, AtomBinder.getValue(c, k));
            }
        } else {
            for (var k in c) {
                x[k] = c[k];
            }
        }
        return x;
    },

    url: function (url, q, lq) {
        var finalUrl = url;
        var plist = [];
        if (q) {
            for (var i in q) {
                if (q.hasOwnProperty(i)) {
                    var val = q[i];
                    if (val === undefined)
                        continue;
                    if (val === null)
                        continue;
                    if (val && (val.constructor != String) && (typeof val) == 'object') {
                        val = JSON.stringify(val);
                    }
                    plist.push(i + '=' + encodeURIComponent(val));
                }
            }

            if (plist.length) {
                var index = finalUrl.indexOf('?');
                if (index == -1) {
                    finalUrl += "?";
                } else {
                    finalUrl += '&';
                }
            }

            finalUrl += plist.join('&');
        }

        if (lq) {
            plist = [];
            for (var i in lq) {
                if (lq.hasOwnProperty(i)) {
                    var val = lq[i];
                    if (val === undefined || val === null)
                        continue;
                    plist.push(i + '=' + encodeURIComponent(val));
                }
            }
            if (plist.length) {
                finalUrl += '#' + plist.join("&");
            }
        }

        return finalUrl;
    },

    encodeParameters: function (q) {
        var plist = [];
        for (var i in q) {
            if (i.indexOf('_') == 0)
                continue;
            var val = q[i];
            if (val === undefined)
                continue;
            if (val === null)
                continue;
            var t = typeof(val);
            if (t != 'string' && t != 'number' && t != 'boolean') {
                continue;
            }
            plist.push(i + '=' + encodeURIComponent(val));
        }
        return plist.join('&');
    },

    tableLayout: function (columns, cellWidth, cellHeight) {
        return new WebAtoms.AtomTableLayout(columns, cellWidth, cellHeight);
    },

    toDash: function(text){
        return text.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
    },

    secureUrl: function () {
        var u = "";
        for (var i = 0; i < arguments.length; i++) {
            var ui = arguments[i];
            if (ui === null || ui === undefined) {
                return undefined;
            }
            u += ui;
        }
        if (/^\/\//.test(u)) {
            return document.location.protocol + u;
        }
        if ('https:' == document.location.protocol) {
            u = u.replace(/http\:\/\//, "https://");
        }
        return u;
    }
};

window.Atom = Atom;

(function () {
    var e,
        a = /\+/g,  
        r = /([^&=]+)=?([^&]*)/g,
        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
        q = window.location.search.substring(1);

    var urlParams = {};
    while (e = r.exec(q))
        urlParams[d(e[1])] = d(e[2]);
    Atom.pageQuery = urlParams;
})();

var AtomDate = {

    zoneOffset: (new Date()).getTimezoneOffset() * 60 * 1000,

    toLocalTime: function (d) {
        return d.toJSON();
    },

    m_names: new Array("Jan", "Feb", "Mar", 
"Apr", "May", "Jun", "Jul", "Aug", "Sep", 
"Oct", "Nov", "Dec"),

    setTime: function (dt, time) {
        if (!dt || !time)
            return dt;
        var tokens = time.split(':');
        var h = parseInt(tokens[0]);
        tokens = tokens[1].split(' ');
        var m = parseInt(tokens[0]);
        if (tokens[1] == "PM") {
            if (h != 12) {
                h += 12;
            }
        }
        var d = new Date(dt.getFullYear(),dt.getMonth(),dt.getDate());
        d.setHours(h);
        d.setMinutes(m);
        return d;
    },

    toMMDDYY: function (dt) {
        var m = dt.getMonth() + 1;
        var y = dt.getFullYear();
        var d = dt.getDate();

        var str = "";
        str +=  ((m > 9) ? m : ("0" + m));
        str += "/" + ((d > 9) ? d : ("0" + d));
        str += "/" + y;
        return str;
    },

    toShortDateString: function (val) {
        if (!val)
            return "";
        if (val.constructor == String) {
            if (/^\/date\(/gi.test(val)) {
                val = val.substr(6);
                val = new Date(parseInt(val,10));
            } else {
                throw new Error("Invalid date format " + val);
            }
        }
        //var dt = new Date();
        
        return this.m_names[val.getMonth()] + " " + val.getDate() + ", " + val.getFullYear();
    },
    toDateTimeString: function (val) {
        if (!val)
            return "";
        if (val.constructor == String) {
            val = val.substr(6);
            val = new Date(parseInt(val,10));
        }
        var dt = AtomDate.toShortDateString(val);
        return dt + " - " + AtomDate.toTimeString(val);
    },

    toTimeString: function (d) {
        d = AtomDate.parse(d);
        if (!d)
            return "";
        var h = d.getHours();
        var s = "AM";
        if (h > 12) {
            h = h - 12;
            s = "PM";
        }
        var m = d.getMinutes();
        if (m < 10) {
            m = "0" + m;
        } else {
            m = m + "";
            if (m.length == 1) {
                m = m + "0";
            }
        }
        return h + ":" + m + " " + s;
    },

    smartDate: function (v) {
        if (!v)
            return null;
        var d = AtomDate.parse(v);
        var now = new Date();

        if (now.getFullYear() == d.getFullYear()
            && now.getMonth() == d.getMonth()) {
            var diff = now.getDate() - d.getDate();
            switch(diff){
                case -1:
                    return "Tomorrow (" + AtomDate.toTimeString(d) + ")";
                case 0:
                    return "Today (" + AtomDate.toTimeString(d) + ")";
                case 1:
                    return "Yesterday (" + AtomDate.toTimeString(d) + ")";
            }
        }
        return AtomDate.toDateTimeString(d);
    },

    smartDateUTC: function (v) {
        return AtomDate.smartDate(v);
    },

    parse: function (v) {
        if (!v)
            return null;
        if (!(v.constructor == String))
            return v;
        if (/^\/date\([\-0-9]+\)\//gi.test(v)) {
            v = new Date(parseInt(v.substr(6),10));
        } else {
            if (/^\/dateiso/gi.test(v)) {
                v = v.substr(9);
                v = v.substr(0, v.length - 1);
                var tokens = v.split('T');
                var date = tokens[0];
                var time = tokens[1];
                date = date.split('-');
                time = time.split(':');
                var d = new Date(date[0], parseInt(date[1]) - 1, date[2], time[0], time[1], parseFloat(time[2]));
                d = new Date(d.getTime() + AtomDate.zoneOffset);
                return d;
            } else {
                v = Date.parse(v);
            }
        }
        return v;
        //var i = v.getTime();
        //var z = v.getTimezoneOffset() * 60 * 1000;
        //i = i - z;
        //return new Date(i);
    }
};

window.AtomDate = AtomDate;

AtomDate.monthList = [
    { label: "January", value: 1 },
    { label: "February", value: 2 },
    { label: "March", value: 3 },
    { label: "April", value: 4 },
    { label: "May", value: 5 },
    { label: "June", value: 6 },
    { label: "July", value: 7 },
    { label: "August", value: 8 },
    { label: "September", value: 9 },
    { label: "October", value: 10 },
    { label: "November", value: 11 },
    { label: "December", value: 12 }
];


var AtomFileSize = {
    toFileSize: function (val) {
        if (!val)
            return "";
        if (val.constructor == String)
            val = parseInt(val, 10);
        if (val > 1073741824) {
            return Math.round(val / 1073741824) + " GB";
        }
        if (val > 1048576) {
            return Math.round(val / 1048576) + " MB";
        }
        if (val > 1024) {
            return Math.round(val / 1024) + " KB";
        }
        return val + " B";
    }
};

window.AtomFileSize = AtomFileSize;

var AtomPhone = {
    toSmallPhoneString: function (val) {
        if (!val)
            return "";
        var tokens = val.split(":", 6);
        var cc = tokens[2];
        cc = "(" + (/^\+/.test(cc) ? '' : '+') + tokens[2] + ") ";
        var phone = tokens[3];
        var ext = tokens[4];
        var msg = tokens[5];
        if (!phone)
            return "";
        return cc + phone;
    },
    toPhoneString: function (val) {
        if (!val)
            return "";
        var tokens = val.split(":", 6);
        var cc = "(+" + tokens[2] + ") ";
        var phone = tokens[3];
        var ext = tokens[4];
        var msg = tokens[5];
        if (!phone)
            return "";
        var txt = cc + phone;
        if (ext)
            txt += " (ext: " + ext + ")";
        if (msg)
            txt += " (" + msg + ")";
        return txt;
    }
};

window.AtomPhone = AtomPhone;