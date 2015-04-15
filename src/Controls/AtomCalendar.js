/// <reference path="AtomListBox.js" />

(function (baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomCalendar",
        base: baseType,
        start: function (e) {
            $(e).addClass("atom-calendar");

            var today = new Date();
            this._month = today.getMonth() + 1;
            this._year = today.getFullYear();

            this._startYear = -5;
            this._endYear = 10;

            this._currentYear = (new Date()).getFullYear();
            this._value = null;


        },
        properties: {
            month: 0,
            year:0,
            startYear: -5,
            endYear: 0,
            currentYear: 0,
            visibleDate: undefined
        },
        methods: {
            set_month: function (v) {
                this._month = v;
                this.updateCalendar();
            },

            set_year: function (v) {
                this._year = v;
                this.updateCalendar();
            },

            set_visibleDate: function (v) {
                if (!v)
                    return;
                if (v == this._visibleDate)
                    return;
                this._visibleDate = v;
                this._year = v.getFullYear();
                this._month = v.getMonth() + 1;
                this.updateCalendar();
                AtomBinder.refreshValue(this, "year");
                AtomBinder.refreshValue(this, "month");
            },

            onCreated: function () {
                baseType.onCreated.call(this);
                var self = this;
                WebAtoms.dispatcher.callLater(function () {
                    self.updateCalendar();
                });
            },

            applyItemStyle: function (item, data, first, last) {
            },

            updateCalendar: function(){
                if (!this._created)
                    return;
                var now = new Date();

                var d = new Date(this._year, this._month - 1, 1);
                var first = new Date(this._year, this._month - 1, 1);

                if (first.getDay()) {
                    // go to first day of the month...
                    var start = first.getDay() - 1;
                    start = -start;

                    first.setDate(start);
                }

                var m = first.getMonth();
                var y = first.getFullYear();

                var items = [];

                var i = 0;

                var cm = this._month - 1;

                for (i = 0; i < 42; i++) {
                    var cd = i + first.getDate();
                    var id = new Date(y, m, cd);
                    var w = id.getDay();
                    w = w == 0 || w == 6;
                    items.push({
                        label: id.getDate(),
                        isWeekEnd: w,
                        isToday:
                            now.getDate() == id.getDate()
                            && now.getMonth() == id.getMonth()
                            && now.getFullYear() == id.getFullYear(),
                        isOtherMonth: id.getMonth() != cm,
                        dateLabel: AtomDate.toShortDateString(id),
                        value: AtomDate.toMMDDYY(id),
                        date: id
                    });
                }


                AtomBinder.setValue(this, "items", items);
            },
            changeMonth: function (n) {
                var m = this._month;
                m += n;
                if (m > 12) {
                    m = 1;
                    Atom.set(this, "year", this._year + 1);
                }
                if (m == 0) {
                    Atom.set(this, "year", this._year - 1);
                    m = 12;
                }
                AtomBinder.setValue(this, "month",m);
            },
            init: function () {
                baseType.init.call(this);
                var _this = this;
                this.nextMonthCommand = function () {
                    _this.changeMonth(1);
                };
                this.prevMonthCommand = function () {
                    _this.changeMonth(-1);
                }
            }
        }
    });
})(WebAtoms.AtomListBox.prototype);
