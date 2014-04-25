/// <reference path="AtomControl.js" />

(function (window, base) {

    var document = window.document;
    var $ = window.$;

    return classCreatorEx({
        name: "WebAtoms.AtomPhoneControl",
        base: base,
        start: function () {
            this._value = "";
        },
        properties: {

        },
        methods: {
            set_value: function (v) {
                this._value = v;
                if (this._countries) {
                    this.setupValues();
                }
            },

            setupValues: function () {
                if (!this._value) {
                    $(this.num).val("");
                    $(this.ext).val("");
                    $(this.msg).val("");
                    return;
                }
                var tokens = this._value.split(":", 6);

                var cc = tokens[1];

                var ae = new AtomEnumerator(this._countries);
                while (ae.next()) {
                    var ci = ae.current();
                    if (ci.country == cc) {
                        this.cs.selectedIndex = ae.currentIndex();
                        break;
                    }
                }

                var num = (tokens[3] || "").split(".").join("-");
                if (num == "--")
                    num = "";
                $(this.num).val(num);
                $(this.ext).val(tokens[4]);
                $(this.msg).val(tokens[5]);
                this.onFormat();
            },

            onDataChange: function () {
                var value = "v2:";
                var si = this.cs.selectedIndex;
                var ci = this._countries[si];
                value += ci.country + ":" + ci.code;
                var num = (($(this.num).val()).split("-").join("."));
                value += ":" + num;
                value += ":" + $(this.ext).val();
                value += ":" + $(this.msg).val();

                if (num) {
                    this._value = value;
                } else {
                    this._value = "";
                }

                AtomBinder.refreshValue(this, "value");
            },

            setCountries: function (r) {
                this._countries = r;
                var options = this.cs.options;
                options.length = 0;
                var ae = new AtomEnumerator(r);
                while (ae.next()) {
                    var ci = ae.current();
                    if (!ci.valueIndex) {
                        ci.label = ci.label;
                        ci.valueIndex = ae.currentIndex();
                        var obj = eval("(" + ci.value + ")");
                        ci.country = obj.country;
                        ci.code = obj.code;
                        ci.format = obj.format;
                    }
                    options[ae.currentIndex()] = new Option(ci.label, ci.valueIndex, false, false);
                }

                this.setupValues();
                this.onFormat();
            },


            onCountryChange: function () {
                this.onDataChange();
                this.onFormat();
            },

            onFormat: function () {
                var cs = this.cs;
                if (cs.selectedIndex == -1)
                    return;
                var ci = this._countries[cs.selectedIndex];

                if (ci.format && ci.format.length && ci.format.length > 0) {
                    this._currentFormat = [];
                    var last = 0;
                    var ae = new AtomEnumerator(ci.format);
                    while (ae.next()) {
                        last += ae.current();
                        this._currentFormat.push(last);
                    }
                }
            },

            onKeyUp: function (eventObject) {
                if (!this._currentFormat)
                    return;
                var s = this.num.value;
                s = s.replace(/\D/g, '');
                var ns = "";
                for (var i = 0; i < s.length; i++) {
                    ns += s[i];
                    if (i < s.length - 1 && ($.inArray(i + 1, this._currentFormat) != -1)) {
                        ns += "-";
                    }
                }
                this.num.value = ns;
            },

            initialize: function () {
                this.cs = document.createElement("SELECT");
                //this.cs.style['float'] = "left";
                this.num = document.createElement("INPUT");
                this.num.type = "text";
                //this.num.style.width = "150px";
                //this.num.style['float'] = "left";
                //this.num.style.marginLeft = "2px";
                this.ext = document.createElement("INPUT");
                //this.num = [this.num1, this.num2, this.num3, this.ext];
                this.ext.type = "text";
                //this.ext.style.width = "30px";
                //this.ext.style['float'] = "left";
                //this.ext.style.marginLeft = "2px";
                $(this.ext).attr("placeholder", "Ext.");
                this.msg = document.createElement("INPUT");
                this.msg.type = "text";
                //this.msg.style.width = "100px";
                //this.msg.style['float'] = "left";
                //this.msg.style.marginLeft = "2px";
                $(this.msg).attr("placeholder", "Message");

                var element = this.get_element();
                //element.style.width = "450px";
                element.appendChild(this.cs);
                element.appendChild(this.num);
                element.appendChild(this.ext);
                element.appendChild(this.msg);

                var caller = this;

                this.onKeyUpLater = function (e) {
                    var evt = e;
                    caller.onKeyUp(evt);
                    caller.onDataChange(evt);
                };

                this.bindEvent(this.cs, "change", "onCountryChange");
                this.bindEvent(this.num, "change", "onDataChange");
                this.bindEvent(this.num, "keyup", "onKeyUpLater");
                this.bindEvent(this.num, "keypress", "onKeyUpLater");
                this.bindEvent(this.ext, "change", "onDataChange");
                this.bindEvent(this.msg, "change", "onDataChange");

                $(this._element).addClass("atom-phone-control");
                $(this.num).addClass("atom-pc-num");
                $(this.msg).addClass("atom-pc-msg");
                $(this.cs).addClass("atom-pc-cs");
                $(this.ext).addClass("atom-pc-ext");


                var phone = this;

                AtomPromise.cachedJson("/config/phonecountries").then(function (r) {
                    phone.setCountries(r.value());
                }).invoke();


                base.initialize.call(this);
            }
        }
    });
})(window, WebAtoms.AtomControl.prototype);
