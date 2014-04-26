/// <reference path="AtomControl.js" />

// Date Month Year

(function (window, base) {
    return classCreatorEx({
        name: "WebAtoms.AtomDateControl",
        base: base,
        start: function () {
        },
        properties: {
            startYear: -1,
            endYear: +10
        },
        methods: {
            resetYears: function () {
                var years = this._year;
                var dt = new Date();
                var start = dt.getFullYear();
                start += this._startYear;
                var end = dt.getFullYear() + this._endYear;
                var val = this._value;
                if (!val)
                    val = dt;
                years.options.length = 0;
                var j = 1;
                years.options[0] = new Option("Select", "", false, false);
                var dt = (this._value || new Date()).getFullYear();
                for (var i = start; i <= end; i++) {
                    years.options[j] = new Option(i, i, false, dt == i);
                    j++;
                }
            },
            set_value: function (v) {
                if (v && v.constructor == String) {
                    // date format??
                    v = new Date(parseInt(v.substr(6)));
                }
                this._value = v;
                this.setDate();
            },
            setDate: function () {
                if (!this._value)
                    return;
                var dt = this._value;
                var m = dt.getMonth() + 1;
                var d = dt.getDate();
                var y = dt.getFullYear();

                this.setComboValue(this._month, m);
                this.setComboValue(this._year, y);
                this.setComboValue(this._date, d);

            },

            setComboValue: function (cb, v) {
                var ae = new AtomEnumerator(cb.options);
                while (ae.next()) {
                    if (ae.current().value == v) {
                        cb.selectedIndex = ae.currentIndex();
                        break;
                    }
                }
            },

            set_startYear: function (v) {
                this._startYear = v;
                this.resetYears();
            },
            set_endYear: function (v) {
                this._endYear = v;
                this.resetYears();
            },
            onDataChange: function () {
                var year = $(this._year).val();
                var month = $(this._month).val();
                var date = $(this._date).val();
                try {
                    if (year && month && date) {
                        var dt = new Date(year, month - 1, date, 9, 0, 0);
                        this._value = dt;
                    } else {
                        this._value = null;
                    }
                } catch (error) {
                    Atom.alert(error);
                }
                AtomBinder.refreshValue(this, "value");
            },

            setMonths: function () {

                var r = AtomDate.monthList;

                var options = this._month.options;
                options.length = 0;
                var ae = new AtomEnumerator(r);
                options[0] = new Option("Select", "", false, false);
                while (ae.next()) {
                    var item = ae.current();
                    options[ae.currentIndex() + 1] = new Option(item.label, item.value, false, false);
                }
                this.setDate();
                AtomBinder.refreshValue(this, "value");
            },
            initialize: function () {

                var element = this._element;

                this._date = document.createElement("SELECT");
                this._month = document.createElement("SELECT");
                this._year = document.createElement("SELECT");

                element.style.height = "25px";

                element.appendChild(this._date);
                element.appendChild(this._month);
                element.appendChild(this._year);

                // add days...
                var options = this._date.options;
                var i;
                options[0] = new Option("Select", "", false, false);
                for (i = 1; i < 32; i++) {
                    options[i] = new Option(i, i, false, false);
                }



                this.resetYears();

                this.bindEvent(this._date, "change", "onDataChange");
                this.bindEvent(this._month, "change", "onDataChange");
                this.bindEvent(this._year, "change", "onDataChange");

                this.setMonths();


                base.initialize.apply(this, arguments);


            }
        }
    });
})(window, WebAtoms.AtomControl.prototype);

