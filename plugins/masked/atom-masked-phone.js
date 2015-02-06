/// <reference path="../../jquery-1.8.2.min.js" />
/// <reference path="../../atoms-debug.js" />
/// <reference path="jquery.maskedinput.js" />



(function (base) {

    var document = window.document;
    var $ = window.$;

    var phoneConfig = [
        {
            label: "(US +1)",
            code: 1,
            country: "US",
            format: "999-999-9999"
        },
        {
            label: "(CA +1)",
            code: 1,
            country: "CA",
            format: "999-999-9999"
        },
        {
            label: "(IN +91)",
            code: 91,
            country: "IN",
            format: "99-99-999999"
        },
        {
            label: "(UK +44)",
            code: 44,
            country: "UK",
            format: "999-999-9999"
        },
    ];

    return classCreatorEx({
        name: "WebAtoms.AtomMaskedPhone",
        base: base,
        start: function () {
            this._value = "";
        },
        properties: {
            countries: phoneConfig
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

            set_countries: function (r) {
                this._countries = r;
                this.onFormat();
            },


            onCountryChange: function () {
                this.onDataChange();
                this.onFormat();
            },

            onFormat: function () {
                if (this._isFormatting) return;
                this._isFormatting = true;

                var r = this._countries;
                var options = this.cs.options;
                options.length = 0;
                var ae = new AtomEnumerator(r);
                while (ae.next()) {
                    var ci = ae.current();
                    if (!ci.valueIndex) {
                        ci.label = ci.label;
                        ci.valueIndex = ae.currentIndex();
                    }
                    options[ae.currentIndex()] = new Option(ci.label, ci.valueIndex, false, false);
                }

                this.setupValues();

                var cs = this.cs;
                if (cs.selectedIndex == -1)
                    return;
                var ci = this._countries[cs.selectedIndex];

                if (ci.format) {
                    $(this.num).mask(ci.format);
                } else {
                    $(this.num).unmask();
                }
                this._isFormatting = false;
            },


            init: function () {
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
                    caller.onDataChange(evt);
                };

                this.bindEvent(this.cs, "change", "onCountryChange");
                this.bindEvent(this.num, "change", "onDataChange");
                this.bindEvent(this.num, "keyup", "onKeyUpLater");
                this.bindEvent(this.num, "keypress", "onKeyUpLater");
                this.bindEvent(this.ext, "change", "onDataChange");
                this.bindEvent(this.msg, "change", "onDataChange");

                $(this._element).addClass("atom-masked-phone");
                $(this.num).addClass("atom-pc-num");
                $(this.msg).addClass("atom-pc-msg");
                $(this.cs).addClass("atom-pc-cs");
                $(this.ext).addClass("atom-pc-ext");


                base.init.call(this);
                var phone = this;

                WebAtoms.dispatcher.callLater(function () {
                    phone.onFormat();
                });

            }
        }
    });
})(WebAtoms.AtomControl.prototype);
