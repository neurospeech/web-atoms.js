/// <reference path="AtomAutoCompleteBox.js" />

(function (baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomTimePicker",
        base: baseType,
        start: function (e) {
            log("AtomTimePicker is Depricated !!!, use AtomTimeEditor");
        },
        properties: {
            displayLabel: "9:00 AM"
        },
        methods: {
            init: function () {
                this._autoOpen = true;
                var items = [];
                for (var i = 0; i <= 23; i++) {
                    var a = "AM";
                    var n = i;
                    if (i > 11) {
                        a = "PM";
                        if (i > 12) {
                            n = i - 12;
                        }
                    }
                    var item = n + ":00 " + a;
                    items.push({ label: item, value: item });
                    item = n + ":30 " + a;
                    items.push({ label: item, value: item });
                }
                this._items = items;
                baseType.init.call(this);
            }
        }
    });
})(WebAtoms.AtomAutoCompleteBox.prototype);

var AtomicUpdator = function (self) {
    this._self = self;
    this._updating = false;
    this.update = function (f) {
        if (this._updating)
            return;
        try{
            this._updating = true;
            f.apply(this._self);
        } finally {
            this._updating = false;
        }
    };
};

(function (baseType) {

    var timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9] [ap][m]$/i;

    return classCreatorEx({
        name: "WebAtoms.AtomTimeEditor",
        base: baseType,
        start: function (e) {
            $(e).addClass("atom-time-editor");
            this._updater = new AtomicUpdator(this);
        },
        properties: {
            time: "10:00",
            ap: "AM",
            value: "10:00 AM"
        },
        methods: {
            get_hours24: function () {
                var t = this._time.split(':');
                var h = parseInt(t[0] || '0');
                if (this._ap == 'PM') {
                    if (h != 12) {
                        h += 12;
                    }
                }
                return h;
            },
            set_hours24: function (v) {
                this.setTime(v, this.get_minutes(), true);
            },
            get_hours: function () {
                var t = this._time.split(':');
                var h = parseInt(t[0] || '0');
                return h;
            },
            get_minutes: function () {
                var t = this._time.split(':');
                return parseInt(t[1] || '0');
            },
            setTime: function (h, m, is24) {
                var ap = this.get_ap();
                if (is24) {
                    if (h > 12) {
                        h -= 12;
                        ap = "PM";
                    } else {
                        ap = "AM";
                    }
                }
                h = "" + h;
                if (h.length == 1) {
                    h = "0" + h;
                }
                m = m + "";
                if (m.length == 1) {
                    m = "0" + m;
                }
                AtomBinder.setValue(this, "value", h + ":" + m + " " + ap);
            },
            set_hours: function (v) {
                this.setTime(v, this.get_minutes());
            },
            set_minutes: function (v) {
                this.setTime(this.get_hours(), v);
            },
            set_value: function (v) {
                this._updater.update(function () {
                    if (this._value == v)
                        return;
                    if (!timeRegex.test(v)) {
                        throw new Error("Unknown time format, expecting ##:## AM");
                    }
                    this._value = v;
                    v = v.split(' ');
                    this._time = v[0];
                    this._ap = (v[1]).toUpperCase();
                    this.refreshProperties();
                });
            },
            refreshProperties: function () {
                Atom.refresh(this, "value");
                Atom.refresh(this, "time");
                Atom.refresh(this, "ap");
                Atom.refresh(this, "hours");
                Atom.refresh(this, "hours24");
                Atom.refresh(this, "minutes");
            },
            set_time: function (v) {
                this.set_value(v + " " + this._ap);
            },
            set_ap: function (v) {
                this.set_value(this._time + " " + v);
            },
            get_value: function () {
                return this._time + " " + this._ap;
            }
        }
    });
})(WebAtoms.AtomControl.prototype);
