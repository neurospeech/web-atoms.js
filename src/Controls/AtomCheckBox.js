///// <reference path="AtomControl.js" />

//WebAtoms.AtomCheckBox = function (element) {
//    WebAtoms.AtomCheckBox.initializeBase(this, [element]);
//    log("AtomCheckBox is depricated, use atom-checked instead on checkbox item");
//};

//WebAtoms.AtomCheckBox.prototype = {

//    get_value: function () {
//        return this.get_isChecked();
//    },
//    set_value: function (v) {
//        this.set_isChecked(v);
//    },

//    get_isChecked: function () {
//        var element = this._element;
//        var attr = element.checked || $(element).attr("checked");
       
//        if (attr)
//            return true;
//        return false;
//    },
//    set_isChecked: function (v) {
//        var element = this._element;
//        if (v && v !== "false") {
//            $(element).attr("checked", "checked");
//        } else {
//            $(element).removeAttr("checked");
//        }
//    },

//    onChange: function () {
//        AtomBinder.refreshValue(this, "isChecked");
//    },

//    initialize: function () {
//        var _this = this;
//        this.bindEvent(this._element, "change", function () {
//            _this.onChange.apply(_this, arguments);
//        });
//        WebAtoms.AtomCheckBox.baseType.initialize.apply(this, arguments);
//    }
//};

//WebAtoms.AtomCheckBox.registerClass("WebAtoms.AtomCheckBox", WebAtoms.AtomControl);