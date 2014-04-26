/// <reference path="AtomNavigatorList.js" />

(function (window, baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomCalendar",
        start: function () {
        },
        properties: {
            currentMonth: (new Date()).getMonth()+1,
            currentYear: (new Date()).getFullYear(),
            startDate: null,
            endDate: null
        },
        methods: {
            set_currentMonth: function (v) {
                this._currentMonth = v;
                this.updateCalendar();
            },
            set_currentYear: function (v) {
                this._currentYear = v;
                this.updateCalendar();
            },
            onCreationComplete: function () {
                baseType.onCreationComplete.call(this);
                this.updateCalendar();
            },

            applyItemStyle: function (item, data, first, last) {
                $(item).removeClass("other weekend today");
                $(item).addClass("calendar-item");
                if (data.IsOtherMonth) {
                    $(item).addClass("other");
                }
                if (data.IsWeekEnd) {
                    $(item).addClass("weekend");
                }
                if (data.IsToday) {
                    $(item).addClass("today");
                }
            },

            updateCalendar: function(){
                if (!this._created)
                    return;
                var year = this._currentYear;
                var month = this._currentMonth-1;

                var start = new Date(year, month, 1);
                while (start.getDay() > 0) {
                    var nd = new Date(start.getTime());
                    nd.setDate(start.getDate() - 1);
                    start = nd;
                }
                var dates = [];
                var end = new Date(start.getTime());
                end.setDate(end.getDate() + 42);
                for (var i = start; i.getTime() < end.getTime() ;) {

                    var nd = new Date(i.getTime());
                    nd.setDate(i.getDate() + 1);

                    dates.push({
                        value: i,
                        label: i.getDate(),
                        next: nd,
                        IsOtherMonth: i.getMonth() != month,
                        IsWeekEnd: i.getDay() == 0 || i.getDay() == 6,
                        IsToday: i.getDate() == now.getDate() && i.getMonth() == now.getMonth()
                    });
                    i = nd;
                }

                AtomBinder.setValue(this, "items", dates);
                AtomBinder.setValue(this, "startDate", start);
                AtomBinder.setValue(this, "endDate", end);
            },
            changeMonth: function (n) {
                var m = this._currentMonth;
                m += n;
                if (m > 12) {
                    m = 1;
                    this._currentYear += 1;
                }
                if (m == 0) {
                    this._currentYear -= 1;
                    m = 12;
                }
                AtomBinder.setValue(this, "currentMonth",m);
            },
            initialize: function () {
                baseType.initialize.call(this);
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
})(window,WebAtoms.AtomNavigatorList.prototype);
