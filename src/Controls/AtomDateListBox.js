/// <reference path="AtomListBox.js"/>

(function (base) {
    return classCreatorEx({
        name: "WebAtoms.AtomDateListBox",
        base: base,
        start: function (element) {
            this._monthList = AtomDate.monthList;

            var today = new Date();
            this._month = today.getMonth() + 1;
            this._year = today.getFullYear();
            this._selectedItems = [];

            this._presenters = ['itemsPresenter'];

            this._startYear = -5;
            this._endYear = 10;

            this._currentYear = (new Date()).getFullYear();
            this._value = null;
        },
        properties: {
            month: 0,
            year: 0,
            selectedItems: [],
            startYear: -5,
            endYear: 0,
            currentYear: 0,
            monthList: null,
            items: undefined,
            month: null,
            visibleDate: undefined
        },
        methods: {
            set_month: function (v) {
                this._month = v;
                this.updateList();
            },

            set_year: function (v) {
                this._year = v;
                this.updateList();
            },

            set_visibleDate: function (v) {
                if (!v)
                    return;
                this._visibleDate = v;
                this._year = v.getFullYear();
                this._month = v.getMonth() + 1;
                this.updateList();
                AtomBinder.refreshValue(this, "year");
                AtomBinder.refreshValue(this, "month");
            },

            init: function () {
                base.init.apply(this);
                var _this = this;
                this.toggleDateCommand = function (scope, sender) {
                    _this.toggleDate.apply(_this, arguments);
                };
            },

            onLoaded: function () {
                var t = this.getTemplate("itemTemplate");

                var s = this.get_scope();

                var its = this._itemsPresenter;

                var et = this.getTemplate("itemTemplate");
                if (et) {
                    et = $(et).attr("atom-type");
                    if (!et) {
                        et = WebAtoms.AtomControl;
                    }
                }


                this.updateList();
                if (!t)
                    return;
                var list = this._items;
                for (var i = 0; i < 42; i++) {
                    var e = AtomUI.cloneNode(t);
                    e._templateParent = this;
                    var sc = new AtomScope(this, s, atomApplication);
                    sc.itemIndex = i;
                    $(its).append(e);
                    var ac = AtomUI.createControl(e, et, list[i], sc);
                }
            },

            toggleDate: function (scope, sender) {
                var item = sender.get_data();
                var s = $.inArray(item.value, $.map(this._selectedItems, function (a) { return a.value; }));
                if (s > -1) {

                    AtomBinder.removeAtIndex(this._selectedItems, s);
                } else {
                    AtomBinder.addItem(this._selectedItems, item);
                }
                AtomBinder.refreshValue(this, "value");
                AtomBinder.refreshValue(this, "selectedItems");
                this.invokeAction(this._next);
            },

            getItemClass: function (item, sv) {
                var s = $.inArray(item.value, $.map(this._selectedItems, function (a) { return a.value; })) > -1;
                var d = item.date.getDay();
                // weekend..
                var w = d == 0 || d == 6;

                var cls = "atom-date-list-box-day-list-item ";
                cls += w ? "atom-date-list-box-weekend " : "";
                cls += s ? "atom-date-list-box-selected " : "atom-date-list-box-item ";
                cls += (this._month == item.date.getMonth() + 1) ? "" : "atom-date-list-box-day-list-item-other";

                return cls;
            },

            set_value: function (v) {
                if (v === undefined) {
                    return;
                }
                this._selectedItems.length = 0;
                if (v !== null) {
                    var items = v.split(',');
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i];
                        if (!item) {
                            continue;
                        }
                        var dts = item.split('/');
                        var d = new Date(parseInt(dts[2], 10), parseInt(dts[0], 10) - 1, parseInt(dts[1], 10));
                        this._selectedItems.push({ date: d, dateLabel: AtomDate.toShortDateString(d), value: item, label: d.getDate() });
                    }
                }
                if (this._created) {
                    AtomBinder.refreshItems(this._selectedItems);
                    AtomBinder.refreshValue(this, "value");
                    AtomBinder.refreshValue(this, "selectedItems");
                }
            },
            get_value: function (v) {
                return $.map(this._selectedItems, function (a) { return a.value; }).join(",");
            },

            updateList: function () {
                if (!this._month || !this._year)
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

                this._items = items;
                AtomBinder.refreshValue(this, "items");
                AtomBinder.refreshValue(this, "selectedItems");
                if (this._created) {
                    AtomBinder.refreshValue(this, "value");
                }
            }
        }
    });
})(WebAtoms.AtomControl.prototype);
