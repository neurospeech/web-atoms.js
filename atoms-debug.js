/*

The MIT License (MIT)

Copyright (c) 2014 Akash Kava

Permission is hereby granted, free of charge, to any person obtaining a copy of this 
software and associated documentation files (the "Software"), to deal in the Software 
without restriction, including without limitation the rights to use, copy, modify, merge, 
publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons 
to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies 
or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING 
BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/
function mapLibrary(n, p, v) {
    var index = n.indexOf('.');
    if (index == -1) {
        var r = p[n];
        if (!r) {
            r = v;
            p[n] = r;
        }
        return r;
    }
    var r = mapLibrary(n.substr(0, index), p, {});
    return mapLibrary(n.substr(index + 1), r, v);
};

function createProperty(name, g) {
    if (g) {
        return function () {
            return this[name];
        };
    }
    return function (v) {
        this[name] = v;
    };
}

function classCreator(name, basePrototype, classConstructor, classPrototype, classProperties, thisPrototype, thisProperties) {
    var baseClass = basePrototype ? basePrototype.constructor : null;
    var old = classConstructor || (function () { });
    var cp = classProperties;
    var f = null;
    if (baseClass) {
        if (classProperties) {
            f = function () {
                baseClass.apply(this, arguments);
                this.__typeName = name;
                //var cp = Atom.clone(classProperties);
                for (var k in cp) {
                    this["_" + k] = cp[k];
                }
                old.apply(this, arguments);
            };
        } else {
            f = function () {
                baseClass.apply(this, arguments);
                this.__typeName = name;
                old.apply(this, arguments);
            };
        }

        var bpt = baseClass.prototype;

        // extend
        for (var k in bpt) {
            if (classPrototype[k])
                continue;
            if (bpt.hasOwnProperty(k)) {
                classPrototype[k] = bpt[k];
            }
        }

    } else {
        if (classProperties) {
            f = function () {
                this.__typeName = name;
                //var cp = Atom.clone(classProperties);
                for (var k in cp) {
                    this["_" + k] = cp[k];
                }
                old.apply(this, arguments);
            };
        } else {
            f = function () {
                this.__typeName = name;
                old.apply(this, arguments);
            };
        }
    }

    if (classProperties) {
        for (var k in classProperties) {
            if (!classPrototype["get_" + k]) {
                classPrototype["get_" + k] = createProperty("_"+ k,true);
            }
            if (!classPrototype["set_" + k]) {
                classPrototype["set_" + k] = createProperty("_" + k);
            }
        }
    }

    f.__typeName = name;

    if (baseClass) {
        f.__baseType = baseClass;
    }

    f.prototype = classPrototype;
    f.prototype.constructor = f;
    if (!classPrototype.hasOwnProperty("toString")) {
        f.prototype.toString = function () {
            return name;
        };
    }

    mapLibrary( /\./.test(name) ? name : 'WebAtoms.' + name, window, f);

    return f;
};

function classCreatorEx(objDef) {
    return classCreator(objDef.name, objDef.base, objDef.start, objDef.methods, objDef.properties);
}

var createClass = classCreatorEx;

// Global...
var WebAtoms = {};

(function(w){

	var WebAtoms = w;

	var window = this;
	var $ = window.$;
	var document = window.document;
	var Templates = { jsonML: {} };

	window.Templates = Templates;

Templates.jsonML["WebAtoms.AtomAutoCompleteBox.template"] = 
[
["input",
{ "atom-presenter": "selectionBox", "disabled": "disabled", "type": "text", "style-display": "[$owner.isPopupOpen ? '' : 'none']", "atom-value": "[$owner.selectedText]" }
], ["input",
{ "atom-presenter": "inputBox", "atom-placeholder": "[$owner.placeholder]", "type": "text", "atom-value": "$[owner.displayLabel](keyup)" }
], ["div",
{ "atom-presenter": "itemsPresenter", "class": "atom-list-box", "style": "position: absolute; z-index: 100;", "style-left": "[($owner.offsetLeft + 2) + 'px']", "style-top": "[($owner.offsetTop + 24) + 'px']", "style-display": "[$owner.isPopupOpen ? 'block' : 'none']" }
,["div",
{ "atom-template": "itemTemplate", "style": "min-width:100px;", "atom-text": "{ $data[$owner.templateParent.labelPath] }" }
]]
]
;
Templates.jsonML["WebAtoms.AtomCalendar.template"] = 
[["div",
{  }
,["div",
{ "class": "title" }
,["button",
{ "class": "atom-prev-button", "atom-event-click": "{$owner.templateParent.prevMonthCommand}" }
,"Previous"], ["span",
{ "atom-text": "[ AtomDate.monthList[$owner.templateParent.currentMonth-1].label + ' ' + $owner.templateParent.currentYear]" }
], ["button",
{ "class": "atom-next-button", "atom-event-click": "{$owner.templateParent.nextMonthCommand}" }
,"Next"]], ["div",
{ "class": "day-headers" }
,["span",
{ "class": "weekend" }
,"Sunday"], ["span",
{  }
,"Monday"], ["span",
{  }
,"Tuesday"], ["span",
{  }
,"Wednesday"], ["span",
{  }
,"Thursday"], ["span",
{  }
,"Friday"], ["span",
{ "class": "weekend" }
,"Saturday"]], ["div",
{ "class": "days", "atom-presenter": "itemsPresenter" }
]]]
;
Templates.jsonML["WebAtoms.AtomCheckBoxList.itemTemplate"] = 
[["div",
{ "atom-template": "itemTemplate" }
,["input",
{ "type": "checkbox", "atom-checked": "$[scope.itemSelected]" }
], ["span",
{ "atom-text": "{$data[$owner.templateParent.labelPath]}" }
]]]
;
Templates.jsonML["WebAtoms.AtomDataPager.template"] = 
[
["button",
{ "class": "atom-pager-first-button", "atom-is-enabled": "[$owner.pages.length > 1 && $owner.currentPage]", "event-click": "{$owner.goFirstCommand}", "style": "float:left" }
,"\nFirst\n"], ["span",
{ "style": "text-align:left" }
,["button",
{ "class": "atom-pager-prev-button", "event-click": "{$owner.goPrevCommand}", "atom-is-enabled": "[$owner.currentPage]" }
,"\nPrev\n"], ["span",
{  }
,"Goto: Page"], ["select",
{ "atom-type": "AtomComboBox", "atom-items": "[$owner.atomParent.pages]", "atom-value": "$[owner.atomParent.currentPage]" }
], ["button",
{ "class": "atom-pager-next-button", "event-click": "{$owner.goNextCommand}", "atom-is-enabled": "[$owner.currentPage < $owner.pages.length -1 ]" }
,"\nNext\n"]], ["button",
{ "class": "atom-pager-last-button", "event-click": "{$owner.goLastCommand}", "atom-is-enabled": "[$owner.pages.length > 1 && $owner.currentPage < $owner.pages.length -1 ]", "style": "float:right" }
,"\nLast\n"]
]
;
Templates.jsonML["WebAtoms.AtomDateField.popupTemplate"] = 
[["div",
{ "class": "atom-date-field-popup", "style-left": "[($owner.offsetLeft ) + 'px']", "style-top": "[($owner.offsetTop + 25) + 'px']" }
,["div",
{ "class": "atom-date-list-box", "atom-class": "[$owner.isOpen ? 'popup-open' : 'popup-closed' ]" }
,["div",
{ "class": "calendar", "atom-presenter": "calendarPresenter" }
,["select",
{ "atom-type": "AtomComboBox", "class": "month", "atom-items": "{AtomDate.monthList}", "atom-value": "$[owner.templateParent.month]" }
], ["select",
{ "atom-type": "AtomNumberComboBox", "class": "year", "atom-start-number": "[ $owner.templateParent.currentYear + $owner.templateParent.startYear]", "atom-end-number": "[ $owner.templateParent.currentYear + $owner.templateParent.endYear]", "atom-value": "$[owner.templateParent.year]" }
], ["div",
{ "class": "days" }
,["span",
{ "class": "weekend-header" }
,"S"], ["span",
{  }
,"M"], ["span",
{  }
,"T"], ["span",
{  }
,"W"], ["span",
{  }
,"T"], ["span",
{  }
,"F"], ["span",
{ "class": "weekend-header" }
,"S"]], ["div",
{ "class": "day-list", "atom-type": "AtomItemsControl", "atom-items": "[$owner.templateParent.items]", "atom-presenter": "itemsPresenter" }
,["div",
{ "atom-event-click": "{ $owner.templateParent.templateParent.toggleDateCommand }", "atom-class": "[ { 'list-item':true, 'weekend': $data.isWeekEnd, other: $data.isOtherMonth, today: $data.isToday, 'selected': Atom.query($owner.templateParent.templateParent.selectedItems).any({ value: $data.value}) } ]", "atom-template": "itemTemplate" }
,["span",
{ "atom-text": "[$data.label]" }
]]]]]]]
;
Templates.jsonML["WebAtoms.AtomDateField.template"] = 
[["div",
{ "class": "date-label", "atom-class": "[$owner.isOpen ? 'date-label-open' : 'date-label-closed']", "atom-event-click": "[ { owner: { isOpen: ! $owner.isOpen } } ]", "atom-text": "[ $owner.selectedItem ? $owner.selectedItem.dateLabel : 'SELECT' ]" }
]]
;
Templates.jsonML["WebAtoms.AtomDateListBox.template"] = 
[["div",
{ "class": "atom-date-list-box" }
,["div",
{ "class": "calendar" }
,["select",
{ "atom-type": "AtomComboBox", "class": "month", "atom-items": "{AtomDate.monthList}", "atom-value": "$[owner.templateParent.month]" }
], ["select",
{ "atom-type": "AtomComboBox", "class": "year", "atom-items": "[ Atom.range( $owner.value + $owner.templateParent.startYear, $owner.value + $owner.templateParent.endYear) ]", "atom-value": "$[owner.templateParent.year]" }
], ["div",
{ "class": "days" }
,["span",
{ "class": "weekend-header" }
,"S"], ["span",
{  }
,"M"], ["span",
{  }
,"T"], ["span",
{  }
,"W"], ["span",
{  }
,"T"], ["span",
{  }
,"F"], ["span",
{ "class": "weekend-header" }
,"S"]], ["div",
{ "class": "day-list", "atom-presenter": "itemsPresenter" }
,["div",
{ "event-click": "{ $owner.templateParent.toggleDateCommand }", "atom-data": "[$owner.templateParent.items[$scope.itemIndex]]", "atom-class": "[ { 'list-item':true, 'weekend': $data.isWeekEnd, other: $data.isOtherMonth, today: $data.isToday, 'selected': Atom.query($owner.templateParent.selectedItems).any({ value: $data.value}) } ]", "atom-template": "itemTemplate" }
,["span",
{ "atom-text": "[$data.label]" }
]]]], ["div",
{ "class": "list", "atom-type": "AtomListBox", "atom-items": "[$owner.templateParent.selectedItems]", "atom-label-path": "dateLabel", "atom-value-path": "date", "atom-value": "$[$owner.templateParent.visibleDate]" }
,["div",
{ "atom-template": "itemTemplate", "atom-text": "{$data.dateLabel}" }
]]]]
;
Templates.jsonML["WebAtoms.AtomItemsControl.itemTemplate"] = 
[["span",
{ "atom-text": "[$data[$owner.atomParent.labelPath]]" }
,"Item"]]
;
Templates.jsonML["WebAtoms.AtomLinkBar.itemTemplate"] = 
[["a",
{ "atom-href": "{$data[$owner.atomParent.valuePath]}", "atom-target": "{$data[$owner.atomParent.targetPath]}", "atom-class": "{$data[$owner.templateParent.itemsPath] ? (($data[$owner.templateParent.itemsPath]).length ? 'atom-link-bar-down-image' : '' ) : '' }" }
,["span",
{ "atom-text": "{$data[$owner.atomParent.labelPath]}" }
]]]
;
Templates.jsonML["WebAtoms.AtomLinkBar.menuTemplate"] = 
[["div",
{ "class": "menu", "atom-type": "AtomLinkBar", "atom-items": "[$data[$owner.templateParent.itemsPath]]", "atom-menu-template": "{$owner.templateParent.menuTemplate}", "atom-menu-direction": "vertical" }
,["div",
{ "atom-presenter": "itemsPresenter" }
,["div",
{ "atom-template": "itemTemplate" }
,["a",
{ "atom-href": "{$data[$owner.templateParent.valuePath]}", "atom-text": "{$data[$owner.templateParent.labelPath]}", "atom-target": "{$data.target}", "atom-event-click": "{$data.action}" }
]]]]]
;
Templates.jsonML["WebAtoms.AtomNavigatorList.detailTemplate"] = 
[["iframe",
{ "class": "atom-navigator-list-iframe", "atom-template": "detailTemplate", "atom-src": "[$owner.templateParent.displayMode == 1 ?( $owner.templateParent.displayMode == 2 ? $owner.templateParent.newUrl : $owner.templateParent.detailUrl ): 'about:none']" }
]]
;
Templates.jsonML["WebAtoms.AtomNavigatorList.template"] = 
[["div",
{ "atom-type": "AtomViewStack", "atom-selected-index": "[$owner.atomParent.displayMode]" }
,["div",
{ "atom-type": "AtomDockPanel", "atom-presenter": "gridPanel" }
,["div",
{ "atom-dock": "Fill", "atom-presenter": "gridPresenter", "class": "atom-navigator-list-grid" }
]], ["div",
{ "atom-data": "[$owner.templateParent.selectedItem]", "atom-presenter": "detailView", "atom-type": "AtomDockPanel" }
,["div",
{ "atom-dock": "Top", "atom-presenter": "detailHeaderToolbar" }
,["input",
{ "type": "button", "event-click": "[$owner.templateParent.backCommand]", "value": "Back", "style": "float: left" }
]]], ["div",
{ "atom-data": "[$owner.templateParent.newItemCopy]", "atom-presenter": "newView", "atom-type": "AtomDockPanel" }
,["div",
{ "atom-dock": "Top", "atom-presenter": "newHeaderToolbar" }
,["input",
{ "type": "button", "event-click": "[$owner.templateParent.cancelAddCommand]", "value": "Back", "style": "float: left" }
]]]]]
;
Templates.jsonML["WebAtoms.AtomSortableColumn.template"] = 
[["span",
{ "atom-text": "[$owner.label]" }
]]
;
Templates.jsonML["WebAtoms.AtomTabControl.template"] = 
[["div",
{ "atom-type": "AtomDockPanel" }
,["span",
{ "atom-dock": "Top", "atom-type": "AtomToggleButtonBar", "atom-label-path": "[$owner.templateParent.labelPath]", "atom-items": "[$owner.templateParent.items]", "atom-selected-index": "$[owner.templateParent.selectedIndex]", "style": "height: 30px; text-align:center; display:inline-block" }
,["span",
{ "atom-template": "itemTemplate", "atom-text": "[$data]" }
]], ["div",
{ "atom-dock": "Fill", "atom-type": "AtomViewStack", "atom-selected-index": "[$owner.templateParent.selectedIndex]", "atom-presenter": "itemsPresenter" }
]]]
;
Templates.jsonML["WebAtoms.AtomToggleButtonBar.template"] = 
[["span",
{ "class": "items-presenter", "atom-presenter": "itemsPresenter" }
]]
;
Templates.jsonML["WebAtoms.AtomWizard.template"] = 
[
["div",
{ "atom-dock": "Fill", "atom-type": "AtomViewStack", "atom-selected-index": "$[owner.templateParent.currentStep]", "atom-presenter": "viewPresenter" }
], ["div",
{ "atom-dock": "Bottom", "class": "atom-wizard-command-bar" }
,["button",
{ "class": "atom-wizard-back-button", "atom-is-enabled": "[$owner.canMoveBack]", "atom-event-click": "{$owner.goPrevCommand}", "style-visibility": "[$owner.currentStep ? 'visible' : 'hidden']" }
,["span",
{ "atom-text": "[$owner.prevLabel]" }
]], ["button",
{ "class": "atom-wizard-next-button", "atom-class": "[$owner.nextClass || ($owner.isLastStep ? 'finish-button' : '')]", "atom-event-click": "{$owner.nextCommand}", "atom-is-enabled": "[$owner.nextCommand]" }
,["span",
{ "atom-text": "[$owner.isLastStep ? $owner.finishLabel : $owner.nextLabel]" }
]]]
]
;
Templates.jsonML["WebAtoms.AtomYesNoCustom.template"] = 
[
["span",
{ "atom-type": "AtomYesNoControl", "atom-presenter": "yesNo", "atom-value": "$[owner.templateParent.hasValue]" }
], ["input",
{ "style": "vertical-align:top", "type": "text", "atom-is-enabled": "[$owner.hasValue]", "atom-presenter": "input", "atom-placeholder": "[$owner.placeholder]" }
]
]
;
Templates.jsonML["WebAtoms.AtomApplication.busyTemplate"] = 
[["div",
{ "style": "position:absolute;left:0px;top:0px;z-index:10000; display:none", "style-width": "[$owner.appWidth + 'px']", "style-height": "[$owner.appHeight + 'px']", "style-display": "[$owner.isBusy ? 'block' : 'none']" }
,["div",
{ "class": "atom-busy-window", "style": "position:absolute", "style-left": "[(($owner.appWidth/2)-100) + 'px']", "style-top": "[(($owner.appHeight/2)-25) + 'px']" }
,["div",
{ "atom-abs-pos": "12,12,36,36", "class": "atom-busy-image" }
], ["div",
{ "atom-abs-pos": "56,24,145,null", "atom-text": "[$owner.busyMessage || 'Loading...']" }
], ["div",
{ "atom-abs-pos": "0,48", "style": "height:3px; background-color:green", "style-display": "[$owner.isBusy && $owner.progress ? 'block' : 'none']", "style-width": "[$owner.progress + '%']" }
]]]]
;
Templates.jsonML["WebAtoms.AtomFormGridLayout.fieldTemplate"] = 
[["table",
{ "class": "atom-form-grid-row", "atom-type": "AtomFormField", "atom-class": "[$owner.fieldClass]", "style-display": "[$owner.fieldVisible ? '' : 'none']" }
,["tbody",
{  }
,["tr",
{  }
,["td",
{ "class": "atom-form-grid-label", "atom-text": "[$owner.label]", "style-min-width": "[$owner.atomParent.minLabelWidth ? ($owner.atomParent.minLabelWidth + 'px') : undefined]" }
], ["td",
{ "class": "atom-form-grid-required", "atom-class": "[$owner.required ? 'atom-form-grid-required' : 'atom-form-grid-not-required']" }
,"*"], ["td",
{ "class": "atom-form-grid-content", "atom-class": "[$owner.error ? 'atom-data-error' : '']", "atom-presenter": "contentPresenter" }
], ["td",
{ "atom-class": "[$owner.error ? 'atom-data-error' : '']", "atom-text": "[$owner.error || '']", "style-display": "[$owner.error ? '' : 'none']" }
]]]]]
;
Templates.jsonML["WebAtoms.AtomFormLayout.fieldTemplate"] = 
[["tr",
{ "atom-type": "AtomFormField", "atom-class": "[$owner.fieldClass]", "style-display": "[$owner.fieldVisible ? '' : 'none']" }
,["td",
{ "class": "atom-form-label", "atom-text": "[$owner.label]", "style-min-width": "[$owner.atomParent.minLabelWidth || undefined]" }
], ["td",
{ "class": "atom-form-required", "atom-text": "[$owner.required ? '*' : '']" }
], ["td",
{ "class": "atom-form-content", "atom-class": "[$owner.error ? 'atom-data-error' : '']", "atom-presenter": "contentPresenter" }
,["span",
{ "class": "atom-form-error", "atom-text": "[$owner.error || '']" }
]]]]
;
Templates.jsonML["WebAtoms.AtomFormVerticalLayout.fieldTemplate"] = 
[["tr",
{ "atom-type": "AtomFormField" }
,["td",
{  }
,["div",
{  }
,["span",
{ "class": "atom-form-label", "atom-text": "[$owner.label]" }
], ["span",
{ "class": "atom-form-required", "atom-text": "[$owner.required ? '*' : '']" }
]], ["div",
{ "class": "atom-form-content", "atom-class": "[$owner.error ? 'atom-data-error' : '']", "atom-presenter": "contentPresenter" }
], ["div",
{ "class": "atom-form-error", "atom-text": "[$owner.error || '']" }
]]]]
;
Templates.jsonML["WebAtoms.AtomWindow.alertTemplate"] = 
[["div",
{ "class": "atom-alert", "atom-dock": "Fill" }
,["pre",
{ "atom-text": "{$data.Message}" }
], ["div",
{ "class": "buttons", "atom-class": "{ $data.Confirm ? 'confirm-buttons' : 'alert-buttons' }" }
,["button",
{ "class": "ok", "atom-event-click": "{$owner.templateParent.closeCommand}" }
,"Ok"], ["button",
{ "class": "yes", "atom-event-click": "{ [ { data: { ConfirmValue: true } } , $owner.templateParent.closeCommand ] }" }
,"Yes"], ["button",
{ "class": "no", "atom-event-click": "{$owner.templateParent.closeCommand}" }
,"No"]]]]
;
Templates.jsonML["WebAtoms.AtomWindow.frameTemplate"] = 
[["div",
{ "class": "atom-window-background", "style-width": "[$appScope.owner.bodyWidth + 'px']", "style-height": "[$appScope.owner.appHeight + 'px']", "style-display": "[$owner.isOpen ? 'block' : 'none']" }
,["div",
{ "class": "atom-window", "atom-presenter": "windowDiv", "style": "position:absolute", "style-width": "[$owner.atomParent.windowWidth + 'px']", "style-height": "[$owner.atomParent.windowHeight + 'px']", "style-left": "[(($appScope.owner.bodyWidth-$owner.atomParent.windowWidth)/2) + 'px']", "style-top": "[(($appScope.owner.bodyHeight-$owner.atomParent.windowHeight)/2) + 'px']", "atom-type": "AtomDockPanel" }
,["div",
{ "class": "atom-window-title", "atom-dock": "Top", "atom-presenter": "windowTitleDiv", "atom-text": "[$owner.atomParent.title]" }
], ["div",
{ "class": "atom-window-close-button", "atom-presenter": "windowCloseButton", "atom-event-click": "{$owner.atomParent.closeCommand}" }
]]]]
;
Templates.jsonML["WebAtoms.AtomWindow.windowTemplate"] = 
[["iframe",
{ "class": "atom-window-frame", "atom-presenter": "iframe", "atom-src": "{$owner.templateParent.url}" }
]]
;

		/*Line 0 - 'AtomBrowser.js' */var AtomConfig = {
/*Line 1 - 'AtomBrowser.js' */    debug: false,
/*Line 2 - 'AtomBrowser.js' */    baseUrl: "",
/*Line 3 - 'AtomBrowser.js' */    log: "",
/*Line 4 - 'AtomBrowser.js' */    ajax: {
/*Line 5 - 'AtomBrowser.js' */        versionUrl: true,
/*Line 6 - 'AtomBrowser.js' */        versionKey: "__wav",
/*Line 7 - 'AtomBrowser.js' */        version: ((new Date()).toDateString()),
/*Line 8 - 'AtomBrowser.js' */        headers: {
/*Line 9 - 'AtomBrowser.js' */        }
/*Line 10 - 'AtomBrowser.js' */    }
/*Line 11 - 'AtomBrowser.js' */};

/*Line 13 - 'AtomBrowser.js' */window.AtomConfig = AtomConfig;


/*Line 16 - 'AtomBrowser.js' */var log = function log(s) {

/*Line 18 - 'AtomBrowser.js' */    if (window.console) {
/*Line 19 - 'AtomBrowser.js' */        console.log(s);
/*Line 20 - 'AtomBrowser.js' */    }

/*Line 22 - 'AtomBrowser.js' */    AtomConfig.log += s + "\r\n";

/*Line 24 - 'AtomBrowser.js' */};

/*Line 26 - 'AtomBrowser.js' */window.log = log;

/*Line 28 - 'AtomBrowser.js' */var AtomBrowser = {
/*Line 29 - 'AtomBrowser.js' */    browserName: "",
/*Line 30 - 'AtomBrowser.js' */    version: "1.0",
/*Line 31 - 'AtomBrowser.js' */    majorVersion: 1,
/*Line 32 - 'AtomBrowser.js' */    isMobile: false,
/*Line 33 - 'AtomBrowser.js' */    userAgent:'',
/*Line 34 - 'AtomBrowser.js' */    detect: function () {
/*Line 35 - 'AtomBrowser.js' */        var nVer = navigator.appVersion;
/*Line 36 - 'AtomBrowser.js' */        var nAgt = navigator.userAgent;
/*Line 37 - 'AtomBrowser.js' */        this.userAgent = nAgt;
/*Line 38 - 'AtomBrowser.js' */        var browserName = navigator.appName;
/*Line 39 - 'AtomBrowser.js' */        var fullVersion = "" + parseFloat(navigator.appVersion);
/*Line 40 - 'AtomBrowser.js' */        var majorVersion = parseInt(navigator.appVersion, 10);
/*Line 41 - 'AtomBrowser.js' */        var nameOffset, verOffset, ix;

/*Line 43 - 'AtomBrowser.js' */        // In Opera, the true version is after "Opera" or after "Version"
/*Line 44 - 'AtomBrowser.js' */        if ((verOffset = nAgt.indexOf("Opera")) != -1) {
/*Line 45 - 'AtomBrowser.js' */            browserName = "Opera";
/*Line 46 - 'AtomBrowser.js' */            fullVersion = nAgt.substring(verOffset + 6);
/*Line 47 - 'AtomBrowser.js' */            if ((verOffset = nAgt.indexOf("Version")) != -1) {
/*Line 48 - 'AtomBrowser.js' */                fullVersion = nAgt.substring(verOffset + 8);
/*Line 49 - 'AtomBrowser.js' */            }
/*Line 50 - 'AtomBrowser.js' */        }
/*Line 51 - 'AtomBrowser.js' */            // In MSIE, the true version is after "MSIE" in userAgent
/*Line 52 - 'AtomBrowser.js' */        else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
/*Line 53 - 'AtomBrowser.js' */            browserName = "Microsoft Internet Explorer";
/*Line 54 - 'AtomBrowser.js' */            fullVersion = nAgt.substring(verOffset + 5);
/*Line 55 - 'AtomBrowser.js' */        }
/*Line 56 - 'AtomBrowser.js' */                // In Chrome, the true version is after "Chrome"
/*Line 57 - 'AtomBrowser.js' */        else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
/*Line 58 - 'AtomBrowser.js' */            browserName = "Chrome";
/*Line 59 - 'AtomBrowser.js' */            fullVersion = nAgt.substring(verOffset + 7);
/*Line 60 - 'AtomBrowser.js' */        }
/*Line 61 - 'AtomBrowser.js' */                // In Safari, the true version is after "Safari" or after "Version"
/*Line 62 - 'AtomBrowser.js' */        else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
/*Line 63 - 'AtomBrowser.js' */            browserName = "Safari";
/*Line 64 - 'AtomBrowser.js' */            this.isMobile = nAgt.indexOf("iPhone") != -1;
/*Line 65 - 'AtomBrowser.js' */            fullVersion = nAgt.substring(verOffset + 7);
/*Line 66 - 'AtomBrowser.js' */            if ((verOffset = nAgt.indexOf("Version")) != -1) {
/*Line 67 - 'AtomBrowser.js' */                fullVersion = nAgt.substring(verOffset + 8);
/*Line 68 - 'AtomBrowser.js' */            }
/*Line 69 - 'AtomBrowser.js' */        }
/*Line 70 - 'AtomBrowser.js' */                // In Firefox, the true version is after "Firefox"
/*Line 71 - 'AtomBrowser.js' */        else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
/*Line 72 - 'AtomBrowser.js' */            browserName = "Firefox";
/*Line 73 - 'AtomBrowser.js' */            fullVersion = nAgt.substring(verOffset + 8);
/*Line 74 - 'AtomBrowser.js' */        }
/*Line 75 - 'AtomBrowser.js' */                // In most other browsers, "name/version" is at the end of userAgent
/*Line 76 - 'AtomBrowser.js' */        else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) <
/*Line 77 - 'AtomBrowser.js' */              (verOffset = nAgt.lastIndexOf('/'))) {
/*Line 78 - 'AtomBrowser.js' */                  browserName = nAgt.substring(nameOffset, verOffset);
/*Line 79 - 'AtomBrowser.js' */                  fullVersion = nAgt.substring(verOffset + 1);
/*Line 80 - 'AtomBrowser.js' */                  if (browserName.toLowerCase() == browserName.toUpperCase()) {
/*Line 81 - 'AtomBrowser.js' */                      browserName = navigator.appName;
/*Line 82 - 'AtomBrowser.js' */                  }
/*Line 83 - 'AtomBrowser.js' */              }
/*Line 84 - 'AtomBrowser.js' */        // trim the fullVersion string at semicolon/space if present
/*Line 85 - 'AtomBrowser.js' */        if ((ix = fullVersion.indexOf(";")) != -1) {
/*Line 86 - 'AtomBrowser.js' */            fullVersion = fullVersion.substring(0, ix);
/*Line 87 - 'AtomBrowser.js' */        }
/*Line 88 - 'AtomBrowser.js' */        if ((ix = fullVersion.indexOf(" ")) != -1) {
/*Line 89 - 'AtomBrowser.js' */            fullVersion = fullVersion.substring(0, ix);
/*Line 90 - 'AtomBrowser.js' */        }

/*Line 92 - 'AtomBrowser.js' */        majorVersion = parseInt('' + fullVersion, 10);
/*Line 93 - 'AtomBrowser.js' */        if (isNaN(majorVersion)) {
/*Line 94 - 'AtomBrowser.js' */            fullVersion = '' + parseFloat(navigator.appVersion);
/*Line 95 - 'AtomBrowser.js' */            majorVersion = parseInt(navigator.appVersion, 10);
/*Line 96 - 'AtomBrowser.js' */        }

/*Line 98 - 'AtomBrowser.js' */        this.browserName = browserName;
/*Line 99 - 'AtomBrowser.js' */        this.majorVersion = majorVersion;
/*Line 100 - 'AtomBrowser.js' */        this.isMobile = /android|mobile|ios|iphone/gi.test(nAgt);
/*Line 101 - 'AtomBrowser.js' */    },

/*Line 103 - 'AtomBrowser.js' */    isFF: false,
/*Line 104 - 'AtomBrowser.js' */    isChrome: false,
/*Line 105 - 'AtomBrowser.js' */    isIE: false,
/*Line 106 - 'AtomBrowser.js' */    isSafari: false,
/*Line 107 - 'AtomBrowser.js' */    isMac : false,

/*Line 109 - 'AtomBrowser.js' */    init: function () {

/*Line 111 - 'AtomBrowser.js' */        this.isMac = /mac os x/gi.test(this.userAgent) && !(/iphone|ipad/gi.test(this.userAgent));

/*Line 113 - 'AtomBrowser.js' */        switch (this.browserName) {
/*Line 114 - 'AtomBrowser.js' */            case "Firefox":
/*Line 115 - 'AtomBrowser.js' */                this.supportsUpload = this.majorVersion >= 4;
/*Line 116 - 'AtomBrowser.js' */                this.isFF = true;
/*Line 117 - 'AtomBrowser.js' */                break;
/*Line 118 - 'AtomBrowser.js' */            case "Chrome":
/*Line 119 - 'AtomBrowser.js' */                this.supportsUpload = this.majorVersion >= 6;
/*Line 120 - 'AtomBrowser.js' */                this.isChrome = true;
/*Line 121 - 'AtomBrowser.js' */                break;
/*Line 122 - 'AtomBrowser.js' */            case "Microsoft Internet Explorer":
/*Line 123 - 'AtomBrowser.js' */                this.supportsUpload = this.majorVersion >= 10;
/*Line 124 - 'AtomBrowser.js' */                this.isIE = true;
/*Line 125 - 'AtomBrowser.js' */                break;
/*Line 126 - 'AtomBrowser.js' */            case "Safari":
/*Line 127 - 'AtomBrowser.js' */                this.isSafari = true;
/*Line 128 - 'AtomBrowser.js' */                if (!this.isMobile) {
/*Line 129 - 'AtomBrowser.js' */                    this.supportsUpload = this.majorVersion >= 5;
/*Line 130 - 'AtomBrowser.js' */                }
/*Line 131 - 'AtomBrowser.js' */                break;
/*Line 132 - 'AtomBrowser.js' */        }

/*Line 134 - 'AtomBrowser.js' */        // is it ios??
/*Line 135 - 'AtomBrowser.js' */        this.supportsFlash = !this.isMobile;
/*Line 136 - 'AtomBrowser.js' */    }

/*Line 138 - 'AtomBrowser.js' */};

/*Line 140 - 'AtomBrowser.js' */window.AtomBrowser = AtomBrowser;

/*Line 142 - 'AtomBrowser.js' */AtomBrowser.detect();
/*Line 143 - 'AtomBrowser.js' */AtomBrowser.init();
/*Line 0 - 'Atom.js' */
/*Line 1 - 'Atom.js' */
/*Line 2 - 'Atom.js' */
/*Line 3 - 'Atom.js' */
/*Line 4 - 'Atom.js' */

/*Line 6 - 'Atom.js' */var AtomEnumerator = (function (name, base) {
/*Line 7 - 'Atom.js' */    return classCreator(name, base,
/*Line 8 - 'Atom.js' */    function (array) {
/*Line 9 - 'Atom.js' */        this._array = array;
/*Line 10 - 'Atom.js' */        this.i = -1;
/*Line 11 - 'Atom.js' */    },
/*Line 12 - 'Atom.js' */    {
/*Line 13 - 'Atom.js' */        next: function () {
/*Line 14 - 'Atom.js' */            this.i = this.i + 1;
/*Line 15 - 'Atom.js' */            return this.i < this._array.length;
/*Line 16 - 'Atom.js' */        },
/*Line 17 - 'Atom.js' */        current: function () {
/*Line 18 - 'Atom.js' */            return this._array[this.i];
/*Line 19 - 'Atom.js' */        },
/*Line 20 - 'Atom.js' */        currentIndex: function () {
/*Line 21 - 'Atom.js' */            return this.i;
/*Line 22 - 'Atom.js' */        },
/*Line 23 - 'Atom.js' */        isFirst: function () {
/*Line 24 - 'Atom.js' */            return this.i == 0;
/*Line 25 - 'Atom.js' */        },
/*Line 26 - 'Atom.js' */        isLast: function () {
/*Line 27 - 'Atom.js' */            return this.i == this._array.length - 1;
/*Line 28 - 'Atom.js' */        },
/*Line 29 - 'Atom.js' */        reset: function () {
/*Line 30 - 'Atom.js' */            this.i = -1;
/*Line 31 - 'Atom.js' */        }
/*Line 32 - 'Atom.js' */    });
/*Line 33 - 'Atom.js' */})("AtomEnumerator", null);

/*Line 35 - 'Atom.js' */window.AtomEnumerator = AtomEnumerator;
    

/*Line 38 - 'Atom.js' */var Atom = {

/*Line 40 - 'Atom.js' */    refreshWindowCommand: function () {
/*Line 41 - 'Atom.js' */        location.href = location.pathname + "?_v=" + (new Date()).getTime() + location.hash;
/*Line 42 - 'Atom.js' */    },

/*Line 44 - 'Atom.js' */    time: function () {
/*Line 45 - 'Atom.js' */        return (new Date()).getTime();
/*Line 46 - 'Atom.js' */    },

/*Line 48 - 'Atom.js' */    get: function (obj, path) {
/*Line 49 - 'Atom.js' */        var index = path.indexOf('.');
/*Line 50 - 'Atom.js' */        if (index != -1) {
/*Line 51 - 'Atom.js' */            var f = path.substr(0, index);
/*Line 52 - 'Atom.js' */            obj = AtomBinder.getValue(obj, f);
/*Line 53 - 'Atom.js' */            path = path.substr(index + 1);
/*Line 54 - 'Atom.js' */            return Atom.get(obj, path);
/*Line 55 - 'Atom.js' */        }
/*Line 56 - 'Atom.js' */        return AtomBinder.getValue(obj, path);
/*Line 57 - 'Atom.js' */    },

/*Line 59 - 'Atom.js' */    set: function (obj, path, val) {
/*Line 60 - 'Atom.js' */        var index = path.indexOf('.');
/*Line 61 - 'Atom.js' */        if (index != -1) {
/*Line 62 - 'Atom.js' */            var f = path.substr(0, index);
/*Line 63 - 'Atom.js' */            obj = AtomBinder.getValue(obj, f);
/*Line 64 - 'Atom.js' */            path = path.substr(index + 1);
/*Line 65 - 'Atom.js' */            return Atom.set(obj, path,val);
/*Line 66 - 'Atom.js' */        }
/*Line 67 - 'Atom.js' */        AtomBinder.setValue(obj, path, val);
/*Line 68 - 'Atom.js' */    },

/*Line 70 - 'Atom.js' */    csv: function (a, path, s) {
/*Line 71 - 'Atom.js' */        if (!s) {
/*Line 72 - 'Atom.js' */            s = ", ";
/*Line 73 - 'Atom.js' */        }
/*Line 74 - 'Atom.js' */        var l = [];
/*Line 75 - 'Atom.js' */        var ae = new AtomEnumerator(a);
/*Line 76 - 'Atom.js' */        while (ae.next()) {
/*Line 77 - 'Atom.js' */            var item = ae.current();
/*Line 78 - 'Atom.js' */            l.push(Atom.get(item,path));
/*Line 79 - 'Atom.js' */        }
/*Line 80 - 'Atom.js' */        return l.join(s);
/*Line 81 - 'Atom.js' */    },

/*Line 83 - 'Atom.js' */    range: function (start, end, step) {
/*Line 84 - 'Atom.js' */        var a = [];
/*Line 85 - 'Atom.js' */        step = step || 1;
/*Line 86 - 'Atom.js' */        for (var i = start; i <= end; i+=step) {
/*Line 87 - 'Atom.js' */            a.push({ label: i, value: i });
/*Line 88 - 'Atom.js' */        }
/*Line 89 - 'Atom.js' */        return a;
/*Line 90 - 'Atom.js' */    },

/*Line 92 - 'Atom.js' */    merge: function (x, y, update, clone) {
/*Line 93 - 'Atom.js' */        //var c = AtomBinder.getClone(y);
/*Line 94 - 'Atom.js' */        if (!x)
/*Line 95 - 'Atom.js' */            return;
/*Line 96 - 'Atom.js' */        var c = clone ? AtomBinder.getClone(y) : y;
/*Line 97 - 'Atom.js' */        if (update) {
/*Line 98 - 'Atom.js' */            for (var k in c) {
/*Line 99 - 'Atom.js' */                //x[k] = c[k];
/*Line 100 - 'Atom.js' */                AtomBinder.setValue(x, k, AtomBinder.getValue(c, k));
/*Line 101 - 'Atom.js' */            }
/*Line 102 - 'Atom.js' */        } else {
/*Line 103 - 'Atom.js' */            for (var k in c) {
/*Line 104 - 'Atom.js' */                x[k] = c[k];
/*Line 105 - 'Atom.js' */            }
/*Line 106 - 'Atom.js' */        }
/*Line 107 - 'Atom.js' */        return x;
/*Line 108 - 'Atom.js' */    },

/*Line 110 - 'Atom.js' */    url: function (url, q, lq) {
/*Line 111 - 'Atom.js' */        var finalUrl = url;
/*Line 112 - 'Atom.js' */        var plist = [];
/*Line 113 - 'Atom.js' */        if (q) {
/*Line 114 - 'Atom.js' */            for (var i in q) {
/*Line 115 - 'Atom.js' */                if (q.hasOwnProperty(i)) {
/*Line 116 - 'Atom.js' */                    var val = q[i];
/*Line 117 - 'Atom.js' */                    if (val === undefined)
/*Line 118 - 'Atom.js' */                        continue;
/*Line 119 - 'Atom.js' */                    if (val === null)
/*Line 120 - 'Atom.js' */                        continue;
/*Line 121 - 'Atom.js' */                    if (val && (val.constructor != String) && (typeof val) == 'object') {
/*Line 122 - 'Atom.js' */                        val = JSON.stringify(val);
/*Line 123 - 'Atom.js' */                    }
/*Line 124 - 'Atom.js' */                    plist.push(i + '=' + encodeURIComponent(val));
/*Line 125 - 'Atom.js' */                }
/*Line 126 - 'Atom.js' */            }

/*Line 128 - 'Atom.js' */            if (plist.length) {
/*Line 129 - 'Atom.js' */                var index = finalUrl.indexOf('?');
/*Line 130 - 'Atom.js' */                if (index == -1) {
/*Line 131 - 'Atom.js' */                    finalUrl += "?";
/*Line 132 - 'Atom.js' */                } else {
/*Line 133 - 'Atom.js' */                    finalUrl += '&';
/*Line 134 - 'Atom.js' */                }
/*Line 135 - 'Atom.js' */            }

/*Line 137 - 'Atom.js' */            finalUrl += plist.join('&');
/*Line 138 - 'Atom.js' */        }

/*Line 140 - 'Atom.js' */        if (lq) {
/*Line 141 - 'Atom.js' */            plist = [];
/*Line 142 - 'Atom.js' */            for (var i in lq) {
/*Line 143 - 'Atom.js' */                if (lq.hasOwnProperty(i)) {
/*Line 144 - 'Atom.js' */                    var val = lq[i];
/*Line 145 - 'Atom.js' */                    if (val === undefined || val === null)
/*Line 146 - 'Atom.js' */                        continue;
/*Line 147 - 'Atom.js' */                    plist.push(i + '=' + encodeURIComponent(val));
/*Line 148 - 'Atom.js' */                }
/*Line 149 - 'Atom.js' */            }
/*Line 150 - 'Atom.js' */            if (plist.length) {
/*Line 151 - 'Atom.js' */                finalUrl += '#' + plist.join("&");
/*Line 152 - 'Atom.js' */            }
/*Line 153 - 'Atom.js' */        }

/*Line 155 - 'Atom.js' */        return finalUrl;
/*Line 156 - 'Atom.js' */    },

/*Line 158 - 'Atom.js' */    encodeParameters: function (q) {
/*Line 159 - 'Atom.js' */        var plist = [];
/*Line 160 - 'Atom.js' */        for (var i in q) {
/*Line 161 - 'Atom.js' */            if (i.indexOf('_') == 0)
/*Line 162 - 'Atom.js' */                continue;
/*Line 163 - 'Atom.js' */            var val = q[i];
/*Line 164 - 'Atom.js' */            if (val === undefined)
/*Line 165 - 'Atom.js' */                continue;
/*Line 166 - 'Atom.js' */            if (val === null)
/*Line 167 - 'Atom.js' */                continue;
/*Line 168 - 'Atom.js' */            var t = typeof(val);
/*Line 169 - 'Atom.js' */            if (t != 'string' && t != 'number' && t != 'boolean') {
/*Line 170 - 'Atom.js' */                continue;
/*Line 171 - 'Atom.js' */            }
/*Line 172 - 'Atom.js' */            plist.push(i + '=' + encodeURIComponent(val));
/*Line 173 - 'Atom.js' */        }
/*Line 174 - 'Atom.js' */        return plist.join('&');
/*Line 175 - 'Atom.js' */    },

/*Line 177 - 'Atom.js' */    tableLayout: function (columns, cellWidth, cellHeight) {
/*Line 178 - 'Atom.js' */        return new WebAtoms.AtomTableLayout(columns, cellWidth, cellHeight);
/*Line 179 - 'Atom.js' */    },

/*Line 181 - 'Atom.js' */    toDash: function(text){
/*Line 182 - 'Atom.js' */        return text.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
/*Line 183 - 'Atom.js' */    },

/*Line 185 - 'Atom.js' */    secureUrl: function () {
/*Line 186 - 'Atom.js' */        var u = "";
/*Line 187 - 'Atom.js' */        for (var i = 0; i < arguments.length; i++) {
/*Line 188 - 'Atom.js' */            var ui = arguments[i];
/*Line 189 - 'Atom.js' */            if (ui === null || ui === undefined) {
/*Line 190 - 'Atom.js' */                return undefined;
/*Line 191 - 'Atom.js' */            }
/*Line 192 - 'Atom.js' */            u += ui;
/*Line 193 - 'Atom.js' */        }
/*Line 194 - 'Atom.js' */        if (/^\/\//.test(u)) {
/*Line 195 - 'Atom.js' */            return document.location.protocol + u;
/*Line 196 - 'Atom.js' */        }
/*Line 197 - 'Atom.js' */        if ('https:' == document.location.protocol) {
/*Line 198 - 'Atom.js' */            u = u.replace(/http\:\/\//, "https://");
/*Line 199 - 'Atom.js' */        }
/*Line 200 - 'Atom.js' */        return u;
/*Line 201 - 'Atom.js' */    }
/*Line 202 - 'Atom.js' */};

/*Line 204 - 'Atom.js' */Atom.resolve = function (obj, ap) {

/*Line 206 - 'Atom.js' */    var start = !ap;

/*Line 208 - 'Atom.js' */    if (!obj)
/*Line 209 - 'Atom.js' */        return obj;

/*Line 211 - 'Atom.js' */    if (start) {

/*Line 213 - 'Atom.js' */        ap = new AtomPromise();
/*Line 214 - 'Atom.js' */        ap.list = [];
/*Line 215 - 'Atom.js' */        ap.done = function (v) {
/*Line 216 - 'Atom.js' */            Atom.remove(ap.list, v);
/*Line 217 - 'Atom.js' */            if (ap.list.length == 0) {
/*Line 218 - 'Atom.js' */                ap.pushValue(obj);
/*Line 219 - 'Atom.js' */            }
/*Line 220 - 'Atom.js' */        };
/*Line 221 - 'Atom.js' */    }


/*Line 224 - 'Atom.js' */    var type = typeof (obj);

/*Line 226 - 'Atom.js' */    if (type == 'object') {
/*Line 227 - 'Atom.js' */        if (typeof (obj.length) != 'undefined') {
/*Line 228 - 'Atom.js' */            //this is an array
/*Line 229 - 'Atom.js' */            for (var i = 0; i < obj.length; i++) {
/*Line 230 - 'Atom.js' */                var v = obj[i];
/*Line 231 - 'Atom.js' */                if (!v)
/*Line 232 - 'Atom.js' */                    continue;
/*Line 233 - 'Atom.js' */                var item = obj;
/*Line 234 - 'Atom.js' */                var key = i;
/*Line 235 - 'Atom.js' */                if (v instanceof AtomPromise || v.constructor == AtomPromise) {
/*Line 236 - 'Atom.js' */                    ap.list.push(v);
/*Line 237 - 'Atom.js' */                    v.failed(function (a) {
/*Line 238 - 'Atom.js' */                        ap.done(a);
/*Line 239 - 'Atom.js' */                    });
/*Line 240 - 'Atom.js' */                    v.then(function (a) {
/*Line 241 - 'Atom.js' */                        item[key] = a.value();
/*Line 242 - 'Atom.js' */                        ap.done(a);
/*Line 243 - 'Atom.js' */                    });
/*Line 244 - 'Atom.js' */                    continue;
/*Line 245 - 'Atom.js' */                }
/*Line 246 - 'Atom.js' */                Atom.resolve(v, ap);
/*Line 247 - 'Atom.js' */            }
/*Line 248 - 'Atom.js' */        } else {
/*Line 249 - 'Atom.js' */            for (var i in obj) {
/*Line 250 - 'Atom.js' */                var v = obj[i];
/*Line 251 - 'Atom.js' */                if (!v)
/*Line 252 - 'Atom.js' */                    continue;
/*Line 253 - 'Atom.js' */                if (v instanceof AtomPromise || v.constructor == AtomPromise) {
/*Line 254 - 'Atom.js' */                    ap.list.push(v);
/*Line 255 - 'Atom.js' */                    v.failed(function (a) {
/*Line 256 - 'Atom.js' */                        ap.done(a);
/*Line 257 - 'Atom.js' */                    });
/*Line 258 - 'Atom.js' */                    var item = obj;
/*Line 259 - 'Atom.js' */                    var key = i;
/*Line 260 - 'Atom.js' */                    v.then(function (a) {
/*Line 261 - 'Atom.js' */                        item[key] = a.value();
/*Line 262 - 'Atom.js' */                        ap.done(a);
/*Line 263 - 'Atom.js' */                    });
/*Line 264 - 'Atom.js' */                    continue;
/*Line 265 - 'Atom.js' */                }
/*Line 266 - 'Atom.js' */                Atom.resolve(v, ap);
/*Line 267 - 'Atom.js' */            }
/*Line 268 - 'Atom.js' */        }
/*Line 269 - 'Atom.js' */    }

/*Line 271 - 'Atom.js' */    if (ap.list.length) {
/*Line 272 - 'Atom.js' */        if (start) {
/*Line 273 - 'Atom.js' */            ap.onInvoke(function () {
/*Line 274 - 'Atom.js' */                var ae = new AtomEnumerator(ap.list);
/*Line 275 - 'Atom.js' */                while (ae.next()) {
/*Line 276 - 'Atom.js' */                    ae.current().invoke(ap._invoker);
/*Line 277 - 'Atom.js' */                }
/*Line 278 - 'Atom.js' */            });
/*Line 279 - 'Atom.js' */        }
/*Line 280 - 'Atom.js' */        return ap;
/*Line 281 - 'Atom.js' */    }
/*Line 282 - 'Atom.js' */    return obj;

/*Line 284 - 'Atom.js' */};

/*Line 286 - 'Atom.js' */window.Atom = Atom;

/*Line 288 - 'Atom.js' */(function () {
/*Line 289 - 'Atom.js' */    var e,
/*Line 290 - 'Atom.js' */        a = /\+/g,  
/*Line 291 - 'Atom.js' */        r = /([^&=]+)=?([^&]*)/g,
/*Line 292 - 'Atom.js' */        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
/*Line 293 - 'Atom.js' */        q = window.location.search.substring(1);

/*Line 295 - 'Atom.js' */    var urlParams = {};
/*Line 296 - 'Atom.js' */    while (e = r.exec(q))
/*Line 297 - 'Atom.js' */        urlParams[d(e[1])] = d(e[2]);
/*Line 298 - 'Atom.js' */    Atom.pageQuery = urlParams;
/*Line 299 - 'Atom.js' */})();

/*Line 301 - 'Atom.js' */var AtomDate = {

/*Line 303 - 'Atom.js' */    zoneOffset: (new Date()).getTimezoneOffset() * 60 * 1000,

/*Line 305 - 'Atom.js' */    toLocalTime: function (d) {
/*Line 306 - 'Atom.js' */        return d.toJSON();
/*Line 307 - 'Atom.js' */    },

/*Line 309 - 'Atom.js' */    m_names: ["Jan", "Feb", "Mar", 
/*Line 310 - 'Atom.js' */"Apr", "May", "Jun", "Jul", "Aug", "Sep", 
/*Line 311 - 'Atom.js' */"Oct", "Nov", "Dec"],

/*Line 313 - 'Atom.js' */    setTime: function (dt, time) {
/*Line 314 - 'Atom.js' */        if (!dt || !time)
/*Line 315 - 'Atom.js' */            return dt;
/*Line 316 - 'Atom.js' */        var tokens = time.split(':');
/*Line 317 - 'Atom.js' */        var h = parseInt(tokens[0]);
/*Line 318 - 'Atom.js' */        tokens = tokens[1].split(' ');
/*Line 319 - 'Atom.js' */        var m = parseInt(tokens[0]);
/*Line 320 - 'Atom.js' */        if (tokens[1] == "PM") {
/*Line 321 - 'Atom.js' */            if (h != 12) {
/*Line 322 - 'Atom.js' */                h += 12;
/*Line 323 - 'Atom.js' */            }
/*Line 324 - 'Atom.js' */        }
/*Line 325 - 'Atom.js' */        var d = new Date(dt.getFullYear(),dt.getMonth(),dt.getDate());
/*Line 326 - 'Atom.js' */        d.setHours(h);
/*Line 327 - 'Atom.js' */        d.setMinutes(m);
/*Line 328 - 'Atom.js' */        return d;
/*Line 329 - 'Atom.js' */    },

/*Line 331 - 'Atom.js' */    toMMDDYY: function (dt) {
/*Line 332 - 'Atom.js' */        var m = dt.getMonth() + 1;
/*Line 333 - 'Atom.js' */        var y = dt.getFullYear();
/*Line 334 - 'Atom.js' */        var d = dt.getDate();

/*Line 336 - 'Atom.js' */        var str = "";
/*Line 337 - 'Atom.js' */        str +=  ((m > 9) ? m : ("0" + m));
/*Line 338 - 'Atom.js' */        str += "/" + ((d > 9) ? d : ("0" + d));
/*Line 339 - 'Atom.js' */        str += "/" + y;
/*Line 340 - 'Atom.js' */        return str;
/*Line 341 - 'Atom.js' */    },

/*Line 343 - 'Atom.js' */    toShortDateString: function (val) {
/*Line 344 - 'Atom.js' */        if (!val)
/*Line 345 - 'Atom.js' */            return "";
/*Line 346 - 'Atom.js' */        if (val.constructor == String) {
/*Line 347 - 'Atom.js' */            if (/^\/date\(/gi.test(val)) {
/*Line 348 - 'Atom.js' */                val = val.substr(6);
/*Line 349 - 'Atom.js' */                val = new Date(parseInt(val,10));
/*Line 350 - 'Atom.js' */            } else {
/*Line 351 - 'Atom.js' */                throw new Error("Invalid date format " + val);
/*Line 352 - 'Atom.js' */            }
/*Line 353 - 'Atom.js' */        }
/*Line 354 - 'Atom.js' */        //var dt = new Date();
        
/*Line 356 - 'Atom.js' */        return this.m_names[val.getMonth()] + " " + val.getDate() + ", " + val.getFullYear();
/*Line 357 - 'Atom.js' */    },
/*Line 358 - 'Atom.js' */    toDateTimeString: function (val) {
/*Line 359 - 'Atom.js' */        if (!val)
/*Line 360 - 'Atom.js' */            return "";
/*Line 361 - 'Atom.js' */        if (val.constructor == String) {
/*Line 362 - 'Atom.js' */            val = val.substr(6);
/*Line 363 - 'Atom.js' */            val = new Date(parseInt(val,10));
/*Line 364 - 'Atom.js' */        }
/*Line 365 - 'Atom.js' */        var dt = AtomDate.toShortDateString(val);
/*Line 366 - 'Atom.js' */        return dt + " - " + AtomDate.toTimeString(val);
/*Line 367 - 'Atom.js' */    },

/*Line 369 - 'Atom.js' */    toTimeString: function (d) {
/*Line 370 - 'Atom.js' */        d = AtomDate.parse(d);
/*Line 371 - 'Atom.js' */        if (!d)
/*Line 372 - 'Atom.js' */            return "";
/*Line 373 - 'Atom.js' */        var h = d.getHours();
/*Line 374 - 'Atom.js' */        var s = "AM";
/*Line 375 - 'Atom.js' */        if (h == 12) {
/*Line 376 - 'Atom.js' */            s = "PM";
/*Line 377 - 'Atom.js' */        } else {
/*Line 378 - 'Atom.js' */            if (h > 12) {
/*Line 379 - 'Atom.js' */                h = h - 12;
/*Line 380 - 'Atom.js' */                s = "PM";
/*Line 381 - 'Atom.js' */            }
/*Line 382 - 'Atom.js' */        }
/*Line 383 - 'Atom.js' */        var m = d.getMinutes();
/*Line 384 - 'Atom.js' */        if (m < 10) {
/*Line 385 - 'Atom.js' */            m = "0" + m;
/*Line 386 - 'Atom.js' */        } else {
/*Line 387 - 'Atom.js' */            m = m + "";
/*Line 388 - 'Atom.js' */            if (m.length == 1) {
/*Line 389 - 'Atom.js' */                m = m + "0";
/*Line 390 - 'Atom.js' */            }
/*Line 391 - 'Atom.js' */        }
/*Line 392 - 'Atom.js' */        return h + ":" + m + " " + s;
/*Line 393 - 'Atom.js' */    },

/*Line 395 - 'Atom.js' */    smartDate: function (v) {
/*Line 396 - 'Atom.js' */        if (!v)
/*Line 397 - 'Atom.js' */            return null;
/*Line 398 - 'Atom.js' */        var d = AtomDate.parse(v);
/*Line 399 - 'Atom.js' */        var now = new Date();

/*Line 401 - 'Atom.js' */        if (now.getFullYear() === d.getFullYear()
/*Line 402 - 'Atom.js' */            && now.getMonth() === d.getMonth()) {
/*Line 403 - 'Atom.js' */            var diff = now.getDate() - d.getDate();
/*Line 404 - 'Atom.js' */            switch(diff){
/*Line 405 - 'Atom.js' */                case -1:
/*Line 406 - 'Atom.js' */                    return "Tomorrow (" + AtomDate.toTimeString(d) + ")";
/*Line 407 - 'Atom.js' */                case 0:
/*Line 408 - 'Atom.js' */                    return "Today (" + AtomDate.toTimeString(d) + ")";
/*Line 409 - 'Atom.js' */                case 1:
/*Line 410 - 'Atom.js' */                    return "Yesterday (" + AtomDate.toTimeString(d) + ")";
/*Line 411 - 'Atom.js' */            }
/*Line 412 - 'Atom.js' */        }
/*Line 413 - 'Atom.js' */        return AtomDate.toDateTimeString(d);
/*Line 414 - 'Atom.js' */    },

/*Line 416 - 'Atom.js' */    smartDateUTC: function (v) {
/*Line 417 - 'Atom.js' */        return AtomDate.smartDate(v);
/*Line 418 - 'Atom.js' */    },

/*Line 420 - 'Atom.js' */    parse: function (v) {
/*Line 421 - 'Atom.js' */        if (!v)
/*Line 422 - 'Atom.js' */            return null;
/*Line 423 - 'Atom.js' */        if (v.constructor !== String)
/*Line 424 - 'Atom.js' */            return v;
/*Line 425 - 'Atom.js' */        if (/^\/date\([\-0-9]+\)\//gi.test(v)) {
/*Line 426 - 'Atom.js' */            v = new Date(parseInt(v.substr(6),10));
/*Line 427 - 'Atom.js' */        } else {
/*Line 428 - 'Atom.js' */            if (/^\/dateiso/gi.test(v)) {
/*Line 429 - 'Atom.js' */                v = v.substr(9);
/*Line 430 - 'Atom.js' */                v = v.substr(0, v.length - 1);
/*Line 431 - 'Atom.js' */                var tokens = v.split('T');
/*Line 432 - 'Atom.js' */                var date = tokens[0];
/*Line 433 - 'Atom.js' */                var time = tokens[1];
/*Line 434 - 'Atom.js' */                date = date.split('-');
/*Line 435 - 'Atom.js' */                time = time.split(':');
/*Line 436 - 'Atom.js' */                var d = new Date(date[0], parseInt(date[1]) - 1, date[2], time[0], time[1], parseFloat(time[2]));
/*Line 437 - 'Atom.js' */                d = new Date(d.getTime() + AtomDate.zoneOffset);
/*Line 438 - 'Atom.js' */                return d;
/*Line 439 - 'Atom.js' */            } else {
/*Line 440 - 'Atom.js' */                v = Date.parse(v);
/*Line 441 - 'Atom.js' */            }
/*Line 442 - 'Atom.js' */        }
/*Line 443 - 'Atom.js' */        return v;
/*Line 444 - 'Atom.js' */        //var i = v.getTime();
/*Line 445 - 'Atom.js' */        //var z = v.getTimezoneOffset() * 60 * 1000;
/*Line 446 - 'Atom.js' */        //i = i - z;
/*Line 447 - 'Atom.js' */        //return new Date(i);
/*Line 448 - 'Atom.js' */    }
/*Line 449 - 'Atom.js' */};

/*Line 451 - 'Atom.js' */window.AtomDate = AtomDate;

/*Line 453 - 'Atom.js' */AtomDate.monthList = [
/*Line 454 - 'Atom.js' */    { label: "January", value: 1 },
/*Line 455 - 'Atom.js' */    { label: "February", value: 2 },
/*Line 456 - 'Atom.js' */    { label: "March", value: 3 },
/*Line 457 - 'Atom.js' */    { label: "April", value: 4 },
/*Line 458 - 'Atom.js' */    { label: "May", value: 5 },
/*Line 459 - 'Atom.js' */    { label: "June", value: 6 },
/*Line 460 - 'Atom.js' */    { label: "July", value: 7 },
/*Line 461 - 'Atom.js' */    { label: "August", value: 8 },
/*Line 462 - 'Atom.js' */    { label: "September", value: 9 },
/*Line 463 - 'Atom.js' */    { label: "October", value: 10 },
/*Line 464 - 'Atom.js' */    { label: "November", value: 11 },
/*Line 465 - 'Atom.js' */    { label: "December", value: 12 }
/*Line 466 - 'Atom.js' */];


/*Line 469 - 'Atom.js' */var AtomFileSize = {
/*Line 470 - 'Atom.js' */    toFileSize: function (val) {
/*Line 471 - 'Atom.js' */        if (!val)
/*Line 472 - 'Atom.js' */            return "";
/*Line 473 - 'Atom.js' */        if (val.constructor == String)
/*Line 474 - 'Atom.js' */            val = parseInt(val, 10);
/*Line 475 - 'Atom.js' */        if (val > 1073741824) {
/*Line 476 - 'Atom.js' */            return Math.round(val / 1073741824) + " GB";
/*Line 477 - 'Atom.js' */        }
/*Line 478 - 'Atom.js' */        if (val > 1048576) {
/*Line 479 - 'Atom.js' */            return Math.round(val / 1048576) + " MB";
/*Line 480 - 'Atom.js' */        }
/*Line 481 - 'Atom.js' */        if (val > 1024) {
/*Line 482 - 'Atom.js' */            return Math.round(val / 1024) + " KB";
/*Line 483 - 'Atom.js' */        }
/*Line 484 - 'Atom.js' */        return val + " B";
/*Line 485 - 'Atom.js' */    }
/*Line 486 - 'Atom.js' */};

/*Line 488 - 'Atom.js' */window.AtomFileSize = AtomFileSize;

/*Line 490 - 'Atom.js' */var AtomPhone = {
/*Line 491 - 'Atom.js' */    toSmallPhoneString: function (val) {
/*Line 492 - 'Atom.js' */        if (!val)
/*Line 493 - 'Atom.js' */            return "";
/*Line 494 - 'Atom.js' */        var tokens = val.split(":", 6);
/*Line 495 - 'Atom.js' */        var cc = tokens[2];
/*Line 496 - 'Atom.js' */        cc = "(" + (/^\+/.test(cc) ? '' : '+') + tokens[2] + ") ";
/*Line 497 - 'Atom.js' */        var phone = tokens[3];
/*Line 498 - 'Atom.js' */        var ext = tokens[4];
/*Line 499 - 'Atom.js' */        var msg = tokens[5];
/*Line 500 - 'Atom.js' */        if (!phone)
/*Line 501 - 'Atom.js' */            return "";
/*Line 502 - 'Atom.js' */        return cc + phone;
/*Line 503 - 'Atom.js' */    },
/*Line 504 - 'Atom.js' */    toPhoneString: function (val) {
/*Line 505 - 'Atom.js' */        if (!val)
/*Line 506 - 'Atom.js' */            return "";
/*Line 507 - 'Atom.js' */        var tokens = val.split(":", 6);
/*Line 508 - 'Atom.js' */        var cc = "(+" + tokens[2] + ") ";
/*Line 509 - 'Atom.js' */        var phone = tokens[3];
/*Line 510 - 'Atom.js' */        var ext = tokens[4];
/*Line 511 - 'Atom.js' */        var msg = tokens[5];
/*Line 512 - 'Atom.js' */        if (!phone)
/*Line 513 - 'Atom.js' */            return "";
/*Line 514 - 'Atom.js' */        var txt = cc + phone;
/*Line 515 - 'Atom.js' */        if (ext)
/*Line 516 - 'Atom.js' */            txt += " (ext: " + ext + ")";
/*Line 517 - 'Atom.js' */        if (msg)
/*Line 518 - 'Atom.js' */            txt += " (" + msg + ")";
/*Line 519 - 'Atom.js' */        return txt;
/*Line 520 - 'Atom.js' */    }
/*Line 521 - 'Atom.js' */};

/*Line 523 - 'Atom.js' */window.AtomPhone = AtomPhone;


/*Line 2 - 'AtomEvaluator.js' */var AtomEvaluator = {

/*Line 4 - 'AtomEvaluator.js' */    ecache: {},

/*Line 6 - 'AtomEvaluator.js' */    becache: {},

/*Line 8 - 'AtomEvaluator.js' */    parse: function (txt) {

/*Line 10 - 'AtomEvaluator.js' */        // http://jsfiddle.net/A3vg6/44/ (recommended)
/*Line 11 - 'AtomEvaluator.js' */        // http://jsfiddle.net/A3vg6/45/ (working)
/*Line 12 - 'AtomEvaluator.js' */        // http://jsfiddle.net/A3vg6/51/ (including $ sign)

/*Line 14 - 'AtomEvaluator.js' */        var be = this.becache[txt];
/*Line 15 - 'AtomEvaluator.js' */        if (be)
/*Line 16 - 'AtomEvaluator.js' */            return be;

/*Line 18 - 'AtomEvaluator.js' */        var regex = /(?:(\$)(window|appScope|scope|data|owner|localScope))(?:\.[a-zA-Z_][a-zA-Z_0-9]*)*/gi;

/*Line 20 - 'AtomEvaluator.js' */        var keywords = /(window|appScope|scope|data|owner|localScope)/gi;

/*Line 22 - 'AtomEvaluator.js' */        var path = [];
/*Line 23 - 'AtomEvaluator.js' */        var vars = [];

/*Line 25 - 'AtomEvaluator.js' */        var found = {};

/*Line 27 - 'AtomEvaluator.js' */        var ms = txt.replace(regex,
/*Line 28 - 'AtomEvaluator.js' */            function (match) {
/*Line 29 - 'AtomEvaluator.js' */                var nv = "v" + (path.length + 1);
/*Line 30 - 'AtomEvaluator.js' */                if (match.indexOf("$owner.") == 0) {
/*Line 31 - 'AtomEvaluator.js' */                    match = match.substr(7);
/*Line 32 - 'AtomEvaluator.js' */                } else
/*Line 33 - 'AtomEvaluator.js' */                {
/*Line 34 - 'AtomEvaluator.js' */                    if (match.indexOf("owner.") == 0) {
/*Line 35 - 'AtomEvaluator.js' */                        match = match.substr(6);
/*Line 36 - 'AtomEvaluator.js' */                    } else {
/*Line 37 - 'AtomEvaluator.js' */                        match = match.substr(1);
/*Line 38 - 'AtomEvaluator.js' */                    }
/*Line 39 - 'AtomEvaluator.js' */                }
/*Line 40 - 'AtomEvaluator.js' */                path.push(match.split('.'));
/*Line 41 - 'AtomEvaluator.js' */                vars.push(nv);
/*Line 42 - 'AtomEvaluator.js' */                return nv;
/*Line 43 - 'AtomEvaluator.js' */            }
/*Line 44 - 'AtomEvaluator.js' */            );


/*Line 47 - 'AtomEvaluator.js' */        var method = "return " + ms + ";";
/*Line 48 - 'AtomEvaluator.js' */        var methodString = method;
/*Line 49 - 'AtomEvaluator.js' */        try {
/*Line 50 - 'AtomEvaluator.js' */            method = AtomEvaluator.compile(vars, method);
/*Line 51 - 'AtomEvaluator.js' */        } catch (e) {
/*Line 52 - 'AtomEvaluator.js' */            Atom.alert("Error executing \n" + methodString + "\nOriginal: " + txt);
/*Line 53 - 'AtomEvaluator.js' */            throw e;
/*Line 54 - 'AtomEvaluator.js' */        }

/*Line 56 - 'AtomEvaluator.js' */        be = { length: vars.length, method: method, path: path, original: ms };
/*Line 57 - 'AtomEvaluator.js' */        this.becache[txt] = be;
/*Line 58 - 'AtomEvaluator.js' */        return be;
/*Line 59 - 'AtomEvaluator.js' */    },
/*Line 60 - 'AtomEvaluator.js' */    compile: function (vars, method) {
/*Line 61 - 'AtomEvaluator.js' */        var k = vars.join("-") + ":" + method;
/*Line 62 - 'AtomEvaluator.js' */        var e = this.ecache[k];
/*Line 63 - 'AtomEvaluator.js' */        if (e)
/*Line 64 - 'AtomEvaluator.js' */            return e;

/*Line 66 - 'AtomEvaluator.js' */        vars.push("Atom");
/*Line 67 - 'AtomEvaluator.js' */        vars.push("AtomPromise");

/*Line 69 - 'AtomEvaluator.js' */        e = new Function(vars,method);
/*Line 70 - 'AtomEvaluator.js' */        this.ecache[k] = e;
/*Line 71 - 'AtomEvaluator.js' */        return e;
/*Line 72 - 'AtomEvaluator.js' */    }
/*Line 73 - 'AtomEvaluator.js' */};

/*Line 75 - 'AtomEvaluator.js' */window.AtomEvaluator = AtomEvaluator;
/*Line 0 - 'ChildEnumerator.js' */

/*Line 2 - 'ChildEnumerator.js' */var ChildEnumerator = null;

/*Line 4 - 'ChildEnumerator.js' */if (AtomBrowser.isIE && AtomBrowser.majorVersion < 9) {
/*Line 5 - 'ChildEnumerator.js' */    ChildEnumerator = function (e) {
/*Line 6 - 'ChildEnumerator.js' */        this.index = -1;
/*Line 7 - 'ChildEnumerator.js' */        this.nextItem = e.firstChild;
/*Line 8 - 'ChildEnumerator.js' */        this.findNext();
/*Line 9 - 'ChildEnumerator.js' */        this.item = null;
/*Line 10 - 'ChildEnumerator.js' */    };

/*Line 12 - 'ChildEnumerator.js' */    ChildEnumerator.prototype ={

/*Line 14 - 'ChildEnumerator.js' */        findNext: function () {
/*Line 15 - 'ChildEnumerator.js' */            var ne = this.nextItem;
/*Line 16 - 'ChildEnumerator.js' */            while (ne && ne.nodeType !== 1) {
/*Line 17 - 'ChildEnumerator.js' */                ne = ne.nextSibling;
/*Line 18 - 'ChildEnumerator.js' */            }
/*Line 19 - 'ChildEnumerator.js' */            this.nextItem = ne;
/*Line 20 - 'ChildEnumerator.js' */            this.index++;
/*Line 21 - 'ChildEnumerator.js' */        },

/*Line 23 - 'ChildEnumerator.js' */        isFirst: function () {
/*Line 24 - 'ChildEnumerator.js' */            return this.index === 1;
/*Line 25 - 'ChildEnumerator.js' */        },

/*Line 27 - 'ChildEnumerator.js' */        isLast: function () {
/*Line 28 - 'ChildEnumerator.js' */            return this.item && !this.nextItem;
/*Line 29 - 'ChildEnumerator.js' */        },

/*Line 31 - 'ChildEnumerator.js' */        next: function () {
/*Line 32 - 'ChildEnumerator.js' */            this.item = this.nextItem;
/*Line 33 - 'ChildEnumerator.js' */            if (!this.item)
/*Line 34 - 'ChildEnumerator.js' */                return false;
/*Line 35 - 'ChildEnumerator.js' */            this.nextItem = this.item.nextSibling;
/*Line 36 - 'ChildEnumerator.js' */            this.findNext();
/*Line 37 - 'ChildEnumerator.js' */            return this.item ? true : false;
/*Line 38 - 'ChildEnumerator.js' */        },

/*Line 40 - 'ChildEnumerator.js' */        current: function () {
/*Line 41 - 'ChildEnumerator.js' */            return this.item;
/*Line 42 - 'ChildEnumerator.js' */        }

/*Line 44 - 'ChildEnumerator.js' */    };

/*Line 46 - 'ChildEnumerator.js' */    window.ChildEnumerator = ChildEnumerator;
/*Line 47 - 'ChildEnumerator.js' */}
/*Line 48 - 'ChildEnumerator.js' */else {
/*Line 49 - 'ChildEnumerator.js' */    ChildEnumerator = function (e) {
/*Line 50 - 'ChildEnumerator.js' */        this.nextItem = e.firstElementChild;
/*Line 51 - 'ChildEnumerator.js' */        this.item = null;
/*Line 52 - 'ChildEnumerator.js' */        this.first = true;
/*Line 53 - 'ChildEnumerator.js' */    };

/*Line 55 - 'ChildEnumerator.js' */    ChildEnumerator.prototype = {
/*Line 56 - 'ChildEnumerator.js' */        isFirst: function () {
/*Line 57 - 'ChildEnumerator.js' */            return !this.item.previousElementSibling;
/*Line 58 - 'ChildEnumerator.js' */        },
/*Line 59 - 'ChildEnumerator.js' */        isLast: function () {
/*Line 60 - 'ChildEnumerator.js' */            return this.item && !this.nextItem;
/*Line 61 - 'ChildEnumerator.js' */        },
/*Line 62 - 'ChildEnumerator.js' */        next: function () {
/*Line 63 - 'ChildEnumerator.js' */            this.item = this.nextItem;
/*Line 64 - 'ChildEnumerator.js' */            if (!this.item)
/*Line 65 - 'ChildEnumerator.js' */                return false;
/*Line 66 - 'ChildEnumerator.js' */            this.nextItem = this.item.nextElementSibling;
/*Line 67 - 'ChildEnumerator.js' */            return this.item ? true : false;
/*Line 68 - 'ChildEnumerator.js' */        },
/*Line 69 - 'ChildEnumerator.js' */        current: function () {
/*Line 70 - 'ChildEnumerator.js' */            return this.item;
/*Line 71 - 'ChildEnumerator.js' */        }

/*Line 73 - 'ChildEnumerator.js' */    };

/*Line 75 - 'ChildEnumerator.js' */    window.ChildEnumerator = ChildEnumerator;
/*Line 76 - 'ChildEnumerator.js' */}



/*Line 0 - 'AtomPopup.js' */

/*Line 2 - 'AtomPopup.js' */var AtomPopup = {

/*Line 4 - 'AtomPopup.js' */    stack: [],

/*Line 6 - 'AtomPopup.js' */    startOrder: 2000,


    
/*Line 10 - 'AtomPopup.js' */    show: function (parent, element, pos, removeHandler) {

/*Line 12 - 'AtomPopup.js' */        // post =  { 0: bottom left, 1: bottom right, 2: top left, 3: top right }

/*Line 14 - 'AtomPopup.js' */        // set logical parent
/*Line 15 - 'AtomPopup.js' */        element.style.zOrder = this.startOrder++;

/*Line 17 - 'AtomPopup.js' */        if (pos == 0) {

/*Line 19 - 'AtomPopup.js' */            var p = $(parent).offset();
/*Line 20 - 'AtomPopup.js' */            element.style.position = "absolute";
/*Line 21 - 'AtomPopup.js' */            element.style.left =   p.left + "px";
/*Line 22 - 'AtomPopup.js' */            element.style.top = (p.top + $(parent).outerHeight(true)) + "px";
/*Line 23 - 'AtomPopup.js' */        }

/*Line 25 - 'AtomPopup.js' */        element.style.visibility = "visible";

/*Line 27 - 'AtomPopup.js' */        this.stack.push({ parent: parent, element: element, removeHandler: removeHandler });

/*Line 29 - 'AtomPopup.js' */    },

/*Line 31 - 'AtomPopup.js' */    peek: function () {
/*Line 32 - 'AtomPopup.js' */        var l = null;
/*Line 33 - 'AtomPopup.js' */        if (this.stack.length > 0)
/*Line 34 - 'AtomPopup.js' */            l = this.stack[this.stack.length - 1];
/*Line 35 - 'AtomPopup.js' */        return l;
/*Line 36 - 'AtomPopup.js' */    },

/*Line 38 - 'AtomPopup.js' */    hide: function (element) {

/*Line 40 - 'AtomPopup.js' */        // only hide top most element
/*Line 41 - 'AtomPopup.js' */        // otherwise it may have been removed
/*Line 42 - 'AtomPopup.js' */        // by clicked function
/*Line 43 - 'AtomPopup.js' */        var pk = this.peek();
/*Line 44 - 'AtomPopup.js' */        if (!pk)
/*Line 45 - 'AtomPopup.js' */            return;
/*Line 46 - 'AtomPopup.js' */        if (pk.element !== element)
/*Line 47 - 'AtomPopup.js' */            return;

/*Line 49 - 'AtomPopup.js' */        element.style.visibility = "hidden";
/*Line 50 - 'AtomPopup.js' */        var item = this.stack.pop();
/*Line 51 - 'AtomPopup.js' */        if (item.removeHandler) {
/*Line 52 - 'AtomPopup.js' */            item.removeHandler(item.element);
/*Line 53 - 'AtomPopup.js' */        }
/*Line 54 - 'AtomPopup.js' */    },

/*Line 56 - 'AtomPopup.js' */    clicked: function (e) {

/*Line 58 - 'AtomPopup.js' */        var target = e.target;

/*Line 60 - 'AtomPopup.js' */        // lets see if target is outside the topmost popup...
/*Line 61 - 'AtomPopup.js' */        var pk = AtomPopup.peek();
/*Line 62 - 'AtomPopup.js' */        if (!pk)
/*Line 63 - 'AtomPopup.js' */            return;
/*Line 64 - 'AtomPopup.js' */        while (target && target != pk.element && target != pk.parent) {
/*Line 65 - 'AtomPopup.js' */            target = target.parentNode;
/*Line 66 - 'AtomPopup.js' */        }
/*Line 67 - 'AtomPopup.js' */        if (target == pk.element || target == pk.parent) {
/*Line 68 - 'AtomPopup.js' */            return;
/*Line 69 - 'AtomPopup.js' */        }

/*Line 71 - 'AtomPopup.js' */        //AtomPopup.hide(pk);
/*Line 72 - 'AtomPopup.js' */        pk.element.style.visibility = "hidden";
/*Line 73 - 'AtomPopup.js' */        this.stack.pop();
/*Line 74 - 'AtomPopup.js' */        if (pk.removeHandler) {
/*Line 75 - 'AtomPopup.js' */            pk.removeHandler(pk.element);
/*Line 76 - 'AtomPopup.js' */        }
/*Line 77 - 'AtomPopup.js' */    }


/*Line 80 - 'AtomPopup.js' */};

/*Line 82 - 'AtomPopup.js' */window.AtomPopup = AtomPopup;

/*Line 84 - 'AtomPopup.js' */$(window).click(function (e) {
/*Line 85 - 'AtomPopup.js' */    AtomPopup.clicked(e);
/*Line 86 - 'AtomPopup.js' */});
/*Line 0 - 'AtomQuery.js' */

/*Line 2 - 'AtomQuery.js' */var QueryCompiler = {

/*Line 4 - 'AtomQuery.js' */    helpers: {
/*Line 5 - 'AtomQuery.js' */        any: function (lv, v) {
/*Line 6 - 'AtomQuery.js' */            if (!lv)
/*Line 7 - 'AtomQuery.js' */                return false;
/*Line 8 - 'AtomQuery.js' */            return Atom.query(lv).any(v);
/*Line 9 - 'AtomQuery.js' */        },
/*Line 10 - 'AtomQuery.js' */        "between": function (lv, v) {
/*Line 11 - 'AtomQuery.js' */            if (!lv)
/*Line 12 - 'AtomQuery.js' */                if (!v)
/*Line 13 - 'AtomQuery.js' */                    return true;
/*Line 14 - 'AtomQuery.js' */            if (!v)
/*Line 15 - 'AtomQuery.js' */                return false;
/*Line 16 - 'AtomQuery.js' */            var s = v[0];
/*Line 17 - 'AtomQuery.js' */            var e = v[1];
/*Line 18 - 'AtomQuery.js' */            return s <= lv && lv <= e;
/*Line 19 - 'AtomQuery.js' */        },
/*Line 20 - 'AtomQuery.js' */        "in" : function (lv, v) {
/*Line 21 - 'AtomQuery.js' */            var ae = new AtomEnumerator(v);
/*Line 22 - 'AtomQuery.js' */            while (ae.next()) {
/*Line 23 - 'AtomQuery.js' */                if (lv == ae.current())
/*Line 24 - 'AtomQuery.js' */                    return true;
/*Line 25 - 'AtomQuery.js' */            }
/*Line 26 - 'AtomQuery.js' */            return false;
/*Line 27 - 'AtomQuery.js' */        },
/*Line 28 - 'AtomQuery.js' */        equals: function (lv, v) {
/*Line 29 - 'AtomQuery.js' */            if (!lv) {
/*Line 30 - 'AtomQuery.js' */                if (!v)
/*Line 31 - 'AtomQuery.js' */                    return true;
/*Line 32 - 'AtomQuery.js' */                return false;
/*Line 33 - 'AtomQuery.js' */            }
/*Line 34 - 'AtomQuery.js' */            return lv.toLowerCase() == v.toLowerCase();
/*Line 35 - 'AtomQuery.js' */        },
/*Line 36 - 'AtomQuery.js' */        contains: function (lv, v) {
/*Line 37 - 'AtomQuery.js' */            if (!lv)
/*Line 38 - 'AtomQuery.js' */                return false;
/*Line 39 - 'AtomQuery.js' */            if (!v)
/*Line 40 - 'AtomQuery.js' */                return false;
/*Line 41 - 'AtomQuery.js' */            return lv.toLowerCase().indexOf(v.toLowerCase()) != -1;
/*Line 42 - 'AtomQuery.js' */        },
/*Line 43 - 'AtomQuery.js' */        startswith: function (lv, v) {
/*Line 44 - 'AtomQuery.js' */            if (!lv)
/*Line 45 - 'AtomQuery.js' */                return false;
/*Line 46 - 'AtomQuery.js' */            if (!v)
/*Line 47 - 'AtomQuery.js' */                return false;
/*Line 48 - 'AtomQuery.js' */            return lv.toLowerCase().indexOf(v.toLowerCase()) == 0;
/*Line 49 - 'AtomQuery.js' */        },
/*Line 50 - 'AtomQuery.js' */        endswith: function (lv, v) {
/*Line 51 - 'AtomQuery.js' */            if (!lv)
/*Line 52 - 'AtomQuery.js' */                return false;
/*Line 53 - 'AtomQuery.js' */            if (!v)
/*Line 54 - 'AtomQuery.js' */                return false;
/*Line 55 - 'AtomQuery.js' */            return lv.toLowerCase().lastIndexOf(v.toLowerCase()) == (lv.length - v.length);
/*Line 56 - 'AtomQuery.js' */        },
/*Line 57 - 'AtomQuery.js' */        containscs: function (lv, v) {
/*Line 58 - 'AtomQuery.js' */            if (!lv)
/*Line 59 - 'AtomQuery.js' */                return false;
/*Line 60 - 'AtomQuery.js' */            return lv.indexOf(v) != -1;
/*Line 61 - 'AtomQuery.js' */        },
/*Line 62 - 'AtomQuery.js' */        startswithcs: function (lv, v) {
/*Line 63 - 'AtomQuery.js' */            if (!lv)
/*Line 64 - 'AtomQuery.js' */                return false;
/*Line 65 - 'AtomQuery.js' */            return lv.indexOf(v) == 0;
/*Line 66 - 'AtomQuery.js' */        },
/*Line 67 - 'AtomQuery.js' */        endswithcs: function (lv, v) {
/*Line 68 - 'AtomQuery.js' */            if (!lv)
/*Line 69 - 'AtomQuery.js' */                return false;
/*Line 70 - 'AtomQuery.js' */            return lv.lastIndexOf(v) == (lv.length - v.length);
/*Line 71 - 'AtomQuery.js' */        }
/*Line 72 - 'AtomQuery.js' */    },


/*Line 75 - 'AtomQuery.js' */    compileList: function (qseg, q, sep) {
/*Line 76 - 'AtomQuery.js' */        if (!sep)
/*Line 77 - 'AtomQuery.js' */            sep = " && ";
/*Line 78 - 'AtomQuery.js' */        var list = [];
/*Line 79 - 'AtomQuery.js' */        for (var i in qseg) {
/*Line 80 - 'AtomQuery.js' */            var v = qseg[i];
/*Line 81 - 'AtomQuery.js' */            // skip condition 
/*Line 82 - 'AtomQuery.js' */            // if value is undefined
/*Line 83 - 'AtomQuery.js' */            if (v === undefined)
/*Line 84 - 'AtomQuery.js' */                continue;
/*Line 85 - 'AtomQuery.js' */            v = JSON.stringify(v);

/*Line 87 - 'AtomQuery.js' */            switch (v) {
/*Line 88 - 'AtomQuery.js' */                case "$and":
/*Line 89 - 'AtomQuery.js' */                    list.push(QueryCompiler.compileList(v, q, " && "));
/*Line 90 - 'AtomQuery.js' */                    break;
/*Line 91 - 'AtomQuery.js' */                case "$or":
/*Line 92 - 'AtomQuery.js' */                    list.push( QueryCompiler.compileList(v, q, " || " ));
/*Line 93 - 'AtomQuery.js' */                    break;
/*Line 94 - 'AtomQuery.js' */                case "$not":
/*Line 95 - 'AtomQuery.js' */                    list.push("!(" + QueryCompiler.compileList(v, q, sep ) + ")");
/*Line 96 - 'AtomQuery.js' */                    break;
/*Line 97 - 'AtomQuery.js' */                default:
/*Line 98 - 'AtomQuery.js' */            }


/*Line 101 - 'AtomQuery.js' */            var opi = i.indexOf(':');
/*Line 102 - 'AtomQuery.js' */            if (opi == -1)
/*Line 103 - 'AtomQuery.js' */                opi = i.lastIndexOf(' ');
/*Line 104 - 'AtomQuery.js' */            var p = i;
/*Line 105 - 'AtomQuery.js' */            var op = "==";
/*Line 106 - 'AtomQuery.js' */            if (opi != -1) {
/*Line 107 - 'AtomQuery.js' */                p = i.substr(0, opi);
/*Line 108 - 'AtomQuery.js' */                op = i.substr(opi + 1).toLowerCase();
/*Line 109 - 'AtomQuery.js' */            }
/*Line 110 - 'AtomQuery.js' */            var n1 = "";
/*Line 111 - 'AtomQuery.js' */            if (/^\!/gi.test(op)) {
/*Line 112 - 'AtomQuery.js' */                n1 = "!";
/*Line 113 - 'AtomQuery.js' */                op = op.substr(1);
/*Line 114 - 'AtomQuery.js' */            }
/*Line 115 - 'AtomQuery.js' */            p = JSON.stringify(p);
/*Line 116 - 'AtomQuery.js' */            var subq = null;
/*Line 117 - 'AtomQuery.js' */            var opq = QueryCompiler.helpers[op];
/*Line 118 - 'AtomQuery.js' */            if (op === "any") {

/*Line 120 - 'AtomQuery.js' */                if (v == "{}")
/*Line 121 - 'AtomQuery.js' */                    continue;
/*Line 122 - 'AtomQuery.js' */                subq = n1 + " QueryCompiler.helpers.any(Atom.get(item, " + p + " ), " + v + ")";
/*Line 123 - 'AtomQuery.js' */            }else{
/*Line 124 - 'AtomQuery.js' */                if (opq) {
/*Line 125 - 'AtomQuery.js' */                    subq = n1 + "QueryCompiler.helpers['" + op +"'](Atom.get(item," + p + "), " + v + ")";
/*Line 126 - 'AtomQuery.js' */                } else {
/*Line 127 - 'AtomQuery.js' */                    subq = "Atom.get(item," + p + ") " + n1 + op + " " + v + "";
/*Line 128 - 'AtomQuery.js' */                }
/*Line 129 - 'AtomQuery.js' */            }
/*Line 130 - 'AtomQuery.js' */            list.push(subq);
/*Line 131 - 'AtomQuery.js' */        }
/*Line 132 - 'AtomQuery.js' */        if (list.length > 0) {
/*Line 133 - 'AtomQuery.js' */            return list;
/*Line 134 - 'AtomQuery.js' */        }
/*Line 135 - 'AtomQuery.js' */        return [ "true" ];
/*Line 136 - 'AtomQuery.js' */    },

/*Line 138 - 'AtomQuery.js' */    compiled: {

/*Line 140 - 'AtomQuery.js' */    },

/*Line 142 - 'AtomQuery.js' */    compile: function(q){
/*Line 143 - 'AtomQuery.js' */        if(!q){
/*Line 144 - 'AtomQuery.js' */            return function(item) { 
/*Line 145 - 'AtomQuery.js' */                return true;
/*Line 146 - 'AtomQuery.js' */            };
/*Line 147 - 'AtomQuery.js' */        }

/*Line 149 - 'AtomQuery.js' */        var qs = JSON.stringify(q);
/*Line 150 - 'AtomQuery.js' */        var qsc = QueryCompiler.compiled[qs];
/*Line 151 - 'AtomQuery.js' */        if (qsc)
/*Line 152 - 'AtomQuery.js' */            return qsc;

/*Line 154 - 'AtomQuery.js' */        var el = QueryCompiler.compileList(q, "item", "q");

/*Line 156 - 'AtomQuery.js' */        var ej = el.join(" && ");
/*Line 157 - 'AtomQuery.js' */        log(ej);
/*Line 158 - 'AtomQuery.js' */        var f = new Function(["item", "q"], " return " + ej + ";");
/*Line 159 - 'AtomQuery.js' */        qsc = function (item) {
/*Line 160 - 'AtomQuery.js' */            return f(item, q);
/*Line 161 - 'AtomQuery.js' */        };

/*Line 163 - 'AtomQuery.js' */        QueryCompiler.compiled[qs] = qsc;
/*Line 164 - 'AtomQuery.js' */        return qsc;
/*Line 165 - 'AtomQuery.js' */    },

/*Line 167 - 'AtomQuery.js' */    selectCompiled: {

/*Line 169 - 'AtomQuery.js' */    },

/*Line 171 - 'AtomQuery.js' */    compileSelect: function(s){
/*Line 172 - 'AtomQuery.js' */        if (!s) {
/*Line 173 - 'AtomQuery.js' */            return function (item) {
/*Line 174 - 'AtomQuery.js' */                return item;
/*Line 175 - 'AtomQuery.js' */            };
/*Line 176 - 'AtomQuery.js' */        }

/*Line 178 - 'AtomQuery.js' */        if (s.constructor == String) {
/*Line 179 - 'AtomQuery.js' */            return function (item) {
/*Line 180 - 'AtomQuery.js' */                return Atom.get(item,s);
/*Line 181 - 'AtomQuery.js' */            };
/*Line 182 - 'AtomQuery.js' */        }

/*Line 184 - 'AtomQuery.js' */        var js = JSON.stringify(s);
/*Line 185 - 'AtomQuery.js' */        var jsq = QueryCompiler.selectCompiled[js];
/*Line 186 - 'AtomQuery.js' */        if (jsq)
/*Line 187 - 'AtomQuery.js' */            return jsq;

/*Line 189 - 'AtomQuery.js' */        var list = [];
/*Line 190 - 'AtomQuery.js' */        for (var i in s) {
/*Line 191 - 'AtomQuery.js' */            var item = s[i];
/*Line 192 - 'AtomQuery.js' */            i = JSON.stringify(i);
/*Line 193 - 'AtomQuery.js' */            if (!item) {
/*Line 194 - 'AtomQuery.js' */                list.push( i + ": Atom.get(item," + i + ")" );
/*Line 195 - 'AtomQuery.js' */            } else {
/*Line 196 - 'AtomQuery.js' */                item = JSON.stringify(item);
/*Line 197 - 'AtomQuery.js' */                list.push(i + ":Atom.get(item," + item + ")");
/*Line 198 - 'AtomQuery.js' */            }
/*Line 199 - 'AtomQuery.js' */        }

/*Line 201 - 'AtomQuery.js' */        var rs = "return {" + list.join(",") + "};";
/*Line 202 - 'AtomQuery.js' */        jsq = new Function("item", rs);
/*Line 203 - 'AtomQuery.js' */        QueryCompiler.selectCompiled[js] = jsq;
/*Line 204 - 'AtomQuery.js' */        return jsq;
/*Line 205 - 'AtomQuery.js' */    }
/*Line 206 - 'AtomQuery.js' */};

/*Line 208 - 'AtomQuery.js' */var AtomQuery = {

/*Line 210 - 'AtomQuery.js' */    firstOrDefault:function (q) {
/*Line 211 - 'AtomQuery.js' */        var f = QueryCompiler.compile(q);
/*Line 212 - 'AtomQuery.js' */        while (this.next()) {
/*Line 213 - 'AtomQuery.js' */            var item = this.current();
/*Line 214 - 'AtomQuery.js' */            if (f(item)) {
/*Line 215 - 'AtomQuery.js' */                return item;
/*Line 216 - 'AtomQuery.js' */            }
/*Line 217 - 'AtomQuery.js' */        }
/*Line 218 - 'AtomQuery.js' */        return null;
/*Line 219 - 'AtomQuery.js' */    },

/*Line 221 - 'AtomQuery.js' */    first: function (q) {
/*Line 222 - 'AtomQuery.js' */        var f = QueryCompiler.compile(q);
/*Line 223 - 'AtomQuery.js' */        while (this.next()) {
/*Line 224 - 'AtomQuery.js' */            var item = this.current();
/*Line 225 - 'AtomQuery.js' */            if (f(item)) {
/*Line 226 - 'AtomQuery.js' */                return item;
/*Line 227 - 'AtomQuery.js' */            }
/*Line 228 - 'AtomQuery.js' */        }
/*Line 229 - 'AtomQuery.js' */        throw new Error("Item not found in collection");
/*Line 230 - 'AtomQuery.js' */    },

/*Line 232 - 'AtomQuery.js' */    where: function (q) {
/*Line 233 - 'AtomQuery.js' */        var f = QueryCompiler.compile(q);
/*Line 234 - 'AtomQuery.js' */        var r = [];
/*Line 235 - 'AtomQuery.js' */        while (this.next()) {
/*Line 236 - 'AtomQuery.js' */            var item = this.current();
/*Line 237 - 'AtomQuery.js' */            if (f(item)) {
/*Line 238 - 'AtomQuery.js' */                r.push(item);
/*Line 239 - 'AtomQuery.js' */            }
/*Line 240 - 'AtomQuery.js' */        }
/*Line 241 - 'AtomQuery.js' */        return new AtomEnumerator(r);
/*Line 242 - 'AtomQuery.js' */    },

/*Line 244 - 'AtomQuery.js' */    toArray: function(){
/*Line 245 - 'AtomQuery.js' */        var r = [];
/*Line 246 - 'AtomQuery.js' */        while (this.next()) {
/*Line 247 - 'AtomQuery.js' */            r.push(this.current());
/*Line 248 - 'AtomQuery.js' */        }
/*Line 249 - 'AtomQuery.js' */        return r;
/*Line 250 - 'AtomQuery.js' */    },

/*Line 252 - 'AtomQuery.js' */    any: function(q){
/*Line 253 - 'AtomQuery.js' */        if (this.firstOrDefault(q))
/*Line 254 - 'AtomQuery.js' */            return true;
/*Line 255 - 'AtomQuery.js' */        return false;
/*Line 256 - 'AtomQuery.js' */    },

/*Line 258 - 'AtomQuery.js' */    select: function (q) {

/*Line 260 - 'AtomQuery.js' */        var f = QueryCompiler.compileSelect(q);
/*Line 261 - 'AtomQuery.js' */        var r = [];
/*Line 262 - 'AtomQuery.js' */        while (this.next()) {
/*Line 263 - 'AtomQuery.js' */            var item = this.current();
/*Line 264 - 'AtomQuery.js' */            r.push(f(item));
/*Line 265 - 'AtomQuery.js' */        }
/*Line 266 - 'AtomQuery.js' */        return new AtomEnumerator(r);
/*Line 267 - 'AtomQuery.js' */    },

/*Line 269 - 'AtomQuery.js' */    join: function (s) {
/*Line 270 - 'AtomQuery.js' */        var r = [];
/*Line 271 - 'AtomQuery.js' */        while (this.next()) {
/*Line 272 - 'AtomQuery.js' */            r.push(this.current());
/*Line 273 - 'AtomQuery.js' */        }
/*Line 274 - 'AtomQuery.js' */        return r.join(s);
/*Line 275 - 'AtomQuery.js' */    },

/*Line 277 - 'AtomQuery.js' */    count: function(s){
/*Line 278 - 'AtomQuery.js' */        if (s) {
/*Line 279 - 'AtomQuery.js' */            return this.where(s).count();
/*Line 280 - 'AtomQuery.js' */        }
/*Line 281 - 'AtomQuery.js' */        var n = 0;
/*Line 282 - 'AtomQuery.js' */        while (this.next()) n++;
/*Line 283 - 'AtomQuery.js' */        return n;
/*Line 284 - 'AtomQuery.js' */    },

/*Line 286 - 'AtomQuery.js' */    sum: function (s) {
/*Line 287 - 'AtomQuery.js' */        var n = 0;
/*Line 288 - 'AtomQuery.js' */        var ae = this;
/*Line 289 - 'AtomQuery.js' */        while (ae.next()) {
/*Line 290 - 'AtomQuery.js' */            var item = ae.current();
/*Line 291 - 'AtomQuery.js' */            if (s) {
/*Line 292 - 'AtomQuery.js' */                item = AtomBinder.getValue(item,s);
/*Line 293 - 'AtomQuery.js' */            }
/*Line 294 - 'AtomQuery.js' */            n += +(item || 0);
/*Line 295 - 'AtomQuery.js' */        }
/*Line 296 - 'AtomQuery.js' */        return n;
/*Line 297 - 'AtomQuery.js' */    },

/*Line 299 - 'AtomQuery.js' */    groupBy: function (s) {
/*Line 300 - 'AtomQuery.js' */        var fs = QueryCompiler.compileSelect(s);
/*Line 301 - 'AtomQuery.js' */        var ae = this;
/*Line 302 - 'AtomQuery.js' */        var g = {};
/*Line 303 - 'AtomQuery.js' */        var r = [];
/*Line 304 - 'AtomQuery.js' */        while (ae.next()) {
/*Line 305 - 'AtomQuery.js' */            var item = ae.current();
/*Line 306 - 'AtomQuery.js' */            var si = fs(item);
/*Line 307 - 'AtomQuery.js' */            var rl = g[si];
/*Line 308 - 'AtomQuery.js' */            if (!rl) {
/*Line 309 - 'AtomQuery.js' */                rl = [];
/*Line 310 - 'AtomQuery.js' */                g[si] = rl;
/*Line 311 - 'AtomQuery.js' */                r.push({ key: si, items: rl });
/*Line 312 - 'AtomQuery.js' */            }
/*Line 313 - 'AtomQuery.js' */            rl.push(item);
/*Line 314 - 'AtomQuery.js' */        }
/*Line 315 - 'AtomQuery.js' */        return Atom.query(r);
/*Line 316 - 'AtomQuery.js' */    }

/*Line 318 - 'AtomQuery.js' */};

/*Line 320 - 'AtomQuery.js' */window.AtomQuery = AtomQuery;

/*Line 322 - 'AtomQuery.js' */window.QueryCompiler = QueryCompiler;


/*Line 325 - 'AtomQuery.js' */for (var i in AtomQuery) {
/*Line 326 - 'AtomQuery.js' */    AtomEnumerator.prototype[i] = AtomQuery[i];
/*Line 327 - 'AtomQuery.js' */}


/*Line 330 - 'AtomQuery.js' */Atom.query = function (a) {
/*Line 331 - 'AtomQuery.js' */    if (a.length !== undefined) {
/*Line 332 - 'AtomQuery.js' */        return new AtomEnumerator(a);
/*Line 333 - 'AtomQuery.js' */    }
/*Line 334 - 'AtomQuery.js' */    return a;
/*Line 335 - 'AtomQuery.js' */};

/*Line 0 - 'AtomUI.js' */
/*Line 1 - 'AtomUI.js' */
/*Line 2 - 'AtomUI.js' */
/*Line 3 - 'AtomUI.js' */

/*Line 5 - 'AtomUI.js' */var AtomUI =
/*Line 6 - 'AtomUI.js' */{
/*Line 7 - 'AtomUI.js' */    nodeValue: (AtomBrowser.isIE && AtomBrowser.majorVersion < 9) ? "nodeValue" : "value",

/*Line 9 - 'AtomUI.js' */    attributeMap: function (e, r) {
/*Line 10 - 'AtomUI.js' */        var item;
/*Line 11 - 'AtomUI.js' */        var map = {};
/*Line 12 - 'AtomUI.js' */        var ae = new AtomEnumerator(e.attributes);
/*Line 13 - 'AtomUI.js' */        if (r) {
/*Line 14 - 'AtomUI.js' */            while (ae.next()) {
/*Line 15 - 'AtomUI.js' */                item = ae.current();
/*Line 16 - 'AtomUI.js' */                if (r.test(item.nodeName)) {
/*Line 17 - 'AtomUI.js' */                    r.lastIndex = 0;
/*Line 18 - 'AtomUI.js' */                    map[item.nodeName] = { value: item[AtomUI.nodeValue], node: item };
/*Line 19 - 'AtomUI.js' */                }
/*Line 20 - 'AtomUI.js' */            }
/*Line 21 - 'AtomUI.js' */            return map;
/*Line 22 - 'AtomUI.js' */        }

/*Line 24 - 'AtomUI.js' */        while (ae.next()) {
/*Line 25 - 'AtomUI.js' */            item = ae.current();
/*Line 26 - 'AtomUI.js' */            map[item.nodeName] = { value: item[AtomUI.nodeValue], node: item };
/*Line 27 - 'AtomUI.js' */        }
/*Line 28 - 'AtomUI.js' */        return map;
/*Line 29 - 'AtomUI.js' */    },

/*Line 31 - 'AtomUI.js' */    cloneNode: ((AtomBrowser.isIE && AtomBrowser.majorVersion < 8) ? (function (e) {

/*Line 33 - 'AtomUI.js' */        var document = window.document;

/*Line 35 - 'AtomUI.js' */        var r = document.createElement(e.nodeName);
/*Line 36 - 'AtomUI.js' */        var ae = new AtomEnumerator(e.attributes);
/*Line 37 - 'AtomUI.js' */        while (ae.next()) {
/*Line 38 - 'AtomUI.js' */            var a = ae.current();
/*Line 39 - 'AtomUI.js' */            try{
/*Line 40 - 'AtomUI.js' */                var name = a.nodeName;
/*Line 41 - 'AtomUI.js' */                var v = a[AtomUI.nodeValue];
/*Line 42 - 'AtomUI.js' */                if (!v)
/*Line 43 - 'AtomUI.js' */                    continue;
/*Line 44 - 'AtomUI.js' */                r.setAttribute(name, v);
/*Line 45 - 'AtomUI.js' */            }catch(ex){}
/*Line 46 - 'AtomUI.js' */        }

/*Line 48 - 'AtomUI.js' */        var firstChild = e.firstChild;
/*Line 49 - 'AtomUI.js' */        while (firstChild) {

/*Line 51 - 'AtomUI.js' */            if (firstChild.nodeType == 3) {
/*Line 52 - 'AtomUI.js' */                var n = document.createTextNode(firstChild.nodeValue);
/*Line 53 - 'AtomUI.js' */                r.appendChild(n);
/*Line 54 - 'AtomUI.js' */            } else if (firstChild.nodeType == 1) {
/*Line 55 - 'AtomUI.js' */                r.appendChild(AtomUI.cloneNode(firstChild));
/*Line 56 - 'AtomUI.js' */            }
/*Line 57 - 'AtomUI.js' */            firstChild = firstChild.nextSibling;
/*Line 58 - 'AtomUI.js' */        }

/*Line 60 - 'AtomUI.js' */        return r;
/*Line 61 - 'AtomUI.js' */    }) : function (e) {
/*Line 62 - 'AtomUI.js' */        return e.cloneNode(true);
/*Line 63 - 'AtomUI.js' */    }),

/*Line 65 - 'AtomUI.js' */    findPresenter: function (e) {
/*Line 66 - 'AtomUI.js' */        //if (!(AtomBrowser.isIE && AtomBrowser.majorVersion < 8)) {
/*Line 67 - 'AtomUI.js' */        //    return $(e).find("[atom-presenter]").get(0);
/*Line 68 - 'AtomUI.js' */        //}
/*Line 69 - 'AtomUI.js' */        var ae = new ChildEnumerator(e);
/*Line 70 - 'AtomUI.js' */        while (ae.next()) {
/*Line 71 - 'AtomUI.js' */            var item = ae.current();
/*Line 72 - 'AtomUI.js' */            var ap = $(item).attr("atom-presenter");
/*Line 73 - 'AtomUI.js' */            if (ap)
/*Line 74 - 'AtomUI.js' */                return item;
/*Line 75 - 'AtomUI.js' */            var c = AtomUI.findPresenter(item);
/*Line 76 - 'AtomUI.js' */            if (c)
/*Line 77 - 'AtomUI.js' */                return c;
/*Line 78 - 'AtomUI.js' */        }
/*Line 79 - 'AtomUI.js' */        return null;
/*Line 80 - 'AtomUI.js' */    },

/*Line 82 - 'AtomUI.js' */    parseUrl: function (url) {
/*Line 83 - 'AtomUI.js' */        var r = {};

/*Line 85 - 'AtomUI.js' */        var plist = url.split('&');

/*Line 87 - 'AtomUI.js' */        var ae = new AtomEnumerator(plist);
/*Line 88 - 'AtomUI.js' */        while (ae.next()) {
/*Line 89 - 'AtomUI.js' */            var p = ae.current().split('=');
/*Line 90 - 'AtomUI.js' */            var key = p[0];
/*Line 91 - 'AtomUI.js' */            var val = p[1];
/*Line 92 - 'AtomUI.js' */            if (val) {
/*Line 93 - 'AtomUI.js' */                val = decodeURIComponent(val);
/*Line 94 - 'AtomUI.js' */            }
/*Line 95 - 'AtomUI.js' */            val = AtomUI.parseValue(val);
/*Line 96 - 'AtomUI.js' */            r[key] = val;
/*Line 97 - 'AtomUI.js' */        }
/*Line 98 - 'AtomUI.js' */        return r;
/*Line 99 - 'AtomUI.js' */    },

/*Line 101 - 'AtomUI.js' */    parseValue: function (val) {
/*Line 102 - 'AtomUI.js' */        var n;
/*Line 103 - 'AtomUI.js' */        if (/^[0-9]+$/.test(val)) {
/*Line 104 - 'AtomUI.js' */            n = parseInt(val, 10);
/*Line 105 - 'AtomUI.js' */            if (!isNaN(n)) {
/*Line 106 - 'AtomUI.js' */                val = n;
/*Line 107 - 'AtomUI.js' */            }
/*Line 108 - 'AtomUI.js' */            return val;
/*Line 109 - 'AtomUI.js' */        }
/*Line 110 - 'AtomUI.js' */        if (/^[0-9]+\.[0-9]+/gi.test(val)) {
/*Line 111 - 'AtomUI.js' */            n = parseFloat(val);
/*Line 112 - 'AtomUI.js' */            if (!isNaN(n)) {
/*Line 113 - 'AtomUI.js' */                val = n;
/*Line 114 - 'AtomUI.js' */            }
/*Line 115 - 'AtomUI.js' */            return val;
/*Line 116 - 'AtomUI.js' */        }

/*Line 118 - 'AtomUI.js' */        if (/true/.test(val)) {
/*Line 119 - 'AtomUI.js' */            val = true;
/*Line 120 - 'AtomUI.js' */            return val;
/*Line 121 - 'AtomUI.js' */        }
/*Line 122 - 'AtomUI.js' */        if (/false/.test(val)) {
/*Line 123 - 'AtomUI.js' */            val = false;
/*Line 124 - 'AtomUI.js' */            return val;
/*Line 125 - 'AtomUI.js' */        }
/*Line 126 - 'AtomUI.js' */        return val;
/*Line 127 - 'AtomUI.js' */    },

/*Line 129 - 'AtomUI.js' */    cancelEvent: function (e) {

/*Line 131 - 'AtomUI.js' */        var t = e.target;
/*Line 132 - 'AtomUI.js' */        if (t && /input/gi.test(t.nodeName) && /checkbox/gi.test(t.type))
/*Line 133 - 'AtomUI.js' */            return;

/*Line 135 - 'AtomUI.js' */        if (e.preventDefault) { e.preventDefault(); }
/*Line 136 - 'AtomUI.js' */        else { e.stop(); }

/*Line 138 - 'AtomUI.js' */        e.returnValue = false;
/*Line 139 - 'AtomUI.js' */        e.stopPropagation();
/*Line 140 - 'AtomUI.js' */        return false;
/*Line 141 - 'AtomUI.js' */    },

/*Line 143 - 'AtomUI.js' */    assignID: function (element) {
/*Line 144 - 'AtomUI.js' */        if (!element.id) {
/*Line 145 - 'AtomUI.js' */            element.id = "__waID" + AtomUI.getNewIndex();
/*Line 146 - 'AtomUI.js' */        }
/*Line 147 - 'AtomUI.js' */        return element.id;
/*Line 148 - 'AtomUI.js' */    },

/*Line 150 - 'AtomUI.js' */    atomParent: function (element) {
/*Line 151 - 'AtomUI.js' */        if (element.atomControl) {
/*Line 152 - 'AtomUI.js' */            return element.atomControl;
/*Line 153 - 'AtomUI.js' */        }
/*Line 154 - 'AtomUI.js' */        if (element === document || element === window || !element.parentNode)
/*Line 155 - 'AtomUI.js' */            return null;
/*Line 156 - 'AtomUI.js' */        return AtomUI.atomParent(element._logicalParent || element.parentNode);
/*Line 157 - 'AtomUI.js' */    },
/*Line 158 - 'AtomUI.js' */    //startsWith: function (text, part) {
/*Line 159 - 'AtomUI.js' */    //    if (!text || text.constructor != String)
/*Line 160 - 'AtomUI.js' */    //        return false;
/*Line 161 - 'AtomUI.js' */    //    return text.indexOf(part) == 0;
/*Line 162 - 'AtomUI.js' */    //},
/*Line 163 - 'AtomUI.js' */    //endsWith: function (text, part) {
/*Line 164 - 'AtomUI.js' */    //    if (!text || text.constructor != String)
/*Line 165 - 'AtomUI.js' */    //        return false;
/*Line 166 - 'AtomUI.js' */    //    return text.lastIndexOf(part) == (text.length - part.length);
/*Line 167 - 'AtomUI.js' */    //},

/*Line 169 - 'AtomUI.js' */    toNumber: function (text) {
/*Line 170 - 'AtomUI.js' */        if (!text)
/*Line 171 - 'AtomUI.js' */            return 0;
/*Line 172 - 'AtomUI.js' */        if (text.constructor == String)
/*Line 173 - 'AtomUI.js' */            return parseFloat(text);
/*Line 174 - 'AtomUI.js' */        return text;
/*Line 175 - 'AtomUI.js' */    },

/*Line 177 - 'AtomUI.js' */    isNode: function (o) {
/*Line 178 - 'AtomUI.js' */        try {
/*Line 179 - 'AtomUI.js' */            if (window.XMLHttpRequest && o instanceof XMLHttpRequest)
/*Line 180 - 'AtomUI.js' */                return true;
/*Line 181 - 'AtomUI.js' */        } catch (ex) {
/*Line 182 - 'AtomUI.js' */        }
/*Line 183 - 'AtomUI.js' */        //if (o.addEventListener)
/*Line 184 - 'AtomUI.js' */        //    return true;

/*Line 186 - 'AtomUI.js' */        if (o === window || o === document)
/*Line 187 - 'AtomUI.js' */            return true;
/*Line 188 - 'AtomUI.js' */        return (
/*Line 189 - 'AtomUI.js' */        typeof Node === "object" ? o instanceof Node :
/*Line 190 - 'AtomUI.js' */        typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string"
/*Line 191 - 'AtomUI.js' */      );
/*Line 192 - 'AtomUI.js' */    },

/*Line 194 - 'AtomUI.js' */    createDelegate: function (instance, methodName) {
/*Line 195 - 'AtomUI.js' */        return this.getDelegate(instance, methodName, true);
/*Line 196 - 'AtomUI.js' */    },
/*Line 197 - 'AtomUI.js' */    getDelegate: function (instance, methodName, create) {
/*Line 198 - 'AtomUI.js' */        if (methodName && methodName.constructor != String)
/*Line 199 - 'AtomUI.js' */            throw new Error("methodName has to be string");
/*Line 200 - 'AtomUI.js' */        var d = instance.__delegates;
/*Line 201 - 'AtomUI.js' */        if (!d) {
/*Line 202 - 'AtomUI.js' */            if (!create)
/*Line 203 - 'AtomUI.js' */                return null;
/*Line 204 - 'AtomUI.js' */            d = {};
/*Line 205 - 'AtomUI.js' */            instance.__delegates = d;
/*Line 206 - 'AtomUI.js' */        }
/*Line 207 - 'AtomUI.js' */        var m = d[methodName];
/*Line 208 - 'AtomUI.js' */        if (!m) {
/*Line 209 - 'AtomUI.js' */            if (!create)
/*Line 210 - 'AtomUI.js' */                return null;
/*Line 211 - 'AtomUI.js' */            var f = instance[methodName];
/*Line 212 - 'AtomUI.js' */            if (!f) {
/*Line 213 - 'AtomUI.js' */                throw new Error("method " + methodName + " not found");
/*Line 214 - 'AtomUI.js' */            }
/*Line 215 - 'AtomUI.js' */            m = function () {
/*Line 216 - 'AtomUI.js' */                return f.apply(instance, arguments);
/*Line 217 - 'AtomUI.js' */            };
/*Line 218 - 'AtomUI.js' */            d[methodName] = m;
/*Line 219 - 'AtomUI.js' */        }
/*Line 220 - 'AtomUI.js' */        return m;
/*Line 221 - 'AtomUI.js' */    },

/*Line 223 - 'AtomUI.js' */    __index: 1000,
/*Line 224 - 'AtomUI.js' */    getNewIndex: function () {
/*Line 225 - 'AtomUI.js' */        this.__index = this.__index + 1;
/*Line 226 - 'AtomUI.js' */        return this.__index;
/*Line 227 - 'AtomUI.js' */    },

/*Line 229 - 'AtomUI.js' */    contains: function (array, item) {
/*Line 230 - 'AtomUI.js' */        var n = array.length;
/*Line 231 - 'AtomUI.js' */        var i = 0;
/*Line 232 - 'AtomUI.js' */        for (i = 0; i < n; i++) {
/*Line 233 - 'AtomUI.js' */            if (array[i] == item)
/*Line 234 - 'AtomUI.js' */                return true;
/*Line 235 - 'AtomUI.js' */        }
/*Line 236 - 'AtomUI.js' */        return false;
/*Line 237 - 'AtomUI.js' */    },

/*Line 239 - 'AtomUI.js' */    removeAllChildren: function (element) {
/*Line 240 - 'AtomUI.js' */        while (element.hasChildNodes()) {
/*Line 241 - 'AtomUI.js' */            var lc = element.lastChild;
/*Line 242 - 'AtomUI.js' */            if (!lc)
/*Line 243 - 'AtomUI.js' */                break;
/*Line 244 - 'AtomUI.js' */            //element.removeChild(lc);
/*Line 245 - 'AtomUI.js' */            if (lc.atomControl) {
/*Line 246 - 'AtomUI.js' */                lc.atomControl.dispose();
/*Line 247 - 'AtomUI.js' */                delete lc.atomControl;
/*Line 248 - 'AtomUI.js' */            }
/*Line 249 - 'AtomUI.js' */            $(lc).remove();
/*Line 250 - 'AtomUI.js' */            //delete lc;
/*Line 251 - 'AtomUI.js' */        }
/*Line 252 - 'AtomUI.js' */    },

/*Line 254 - 'AtomUI.js' */    isWebkit: function () {
/*Line 255 - 'AtomUI.js' */        if (window.navigator.userAgent.toLowerCase().indexOf("webkit") == -1)
/*Line 256 - 'AtomUI.js' */            return false;
/*Line 257 - 'AtomUI.js' */        return true;
/*Line 258 - 'AtomUI.js' */    },

/*Line 260 - 'AtomUI.js' */    isWeirdControl: function (e) {
/*Line 261 - 'AtomUI.js' */        return e.nodeName == "BUTTON" || e.nodeName == "SELECT" || (e.nodeName == "INPUT" && $(e).attr("type") == "submit");
/*Line 262 - 'AtomUI.js' */    },

/*Line 264 - 'AtomUI.js' */    parseCSS: function (e, a) {
/*Line 265 - 'AtomUI.js' */        var p = parseInt($(e).css(a), 10);
/*Line 266 - 'AtomUI.js' */        if (isNaN(p))
/*Line 267 - 'AtomUI.js' */            return 0;
/*Line 268 - 'AtomUI.js' */        return p;
/*Line 269 - 'AtomUI.js' */    },

/*Line 271 - 'AtomUI.js' */    setItemRect: function (e, r) {

/*Line 273 - 'AtomUI.js' */        var isButton = this.isWeirdControl(e);

/*Line 275 - 'AtomUI.js' */        if (r.width) {
/*Line 276 - 'AtomUI.js' */            r.width -= this.parseCSS(e, "marginLeft") + this.parseCSS(e, "marginRight");
/*Line 277 - 'AtomUI.js' */            if (!isButton) {
/*Line 278 - 'AtomUI.js' */                r.width -= this.parseCSS(e, "borderLeftWidth") + this.parseCSS(e, "borderRightWidth");
/*Line 279 - 'AtomUI.js' */                r.width -= this.parseCSS(e, "paddingLeft") + this.parseCSS(e, "paddingRight");
/*Line 280 - 'AtomUI.js' */            }
/*Line 281 - 'AtomUI.js' */            if (r.width < 0)
/*Line 282 - 'AtomUI.js' */                r.width = 0;
/*Line 283 - 'AtomUI.js' */            e.style.width = r.width + "px";
/*Line 284 - 'AtomUI.js' */        }
/*Line 285 - 'AtomUI.js' */        if (r.height) {
/*Line 286 - 'AtomUI.js' */            //r.height -= $(e).outerWidth(true) - $(e).width();
/*Line 287 - 'AtomUI.js' */            r.height -= this.parseCSS(e, "marginTop") + this.parseCSS(e, "marginBottom");
/*Line 288 - 'AtomUI.js' */            if (!isButton) {
/*Line 289 - 'AtomUI.js' */                r.height -= this.parseCSS(e, "borderTopWidth") + this.parseCSS(e, "borderBottomWidth");
/*Line 290 - 'AtomUI.js' */                r.height -= this.parseCSS(e, "paddingTop") + this.parseCSS(e, "paddingBottom");
/*Line 291 - 'AtomUI.js' */            }
/*Line 292 - 'AtomUI.js' */            if (r.height < 0)
/*Line 293 - 'AtomUI.js' */                r.height = 0;
/*Line 294 - 'AtomUI.js' */            e.style.height = r.height + "px";
/*Line 295 - 'AtomUI.js' */        }
/*Line 296 - 'AtomUI.js' */        if (r.left) {
/*Line 297 - 'AtomUI.js' */            e.style.left = r.left + "px";
/*Line 298 - 'AtomUI.js' */        }
/*Line 299 - 'AtomUI.js' */        if (r.top) {
/*Line 300 - 'AtomUI.js' */            e.style.top = r.top + "px";
/*Line 301 - 'AtomUI.js' */        }
/*Line 302 - 'AtomUI.js' */    },

/*Line 304 - 'AtomUI.js' */    getPresenterOwner: function (ctrl, p) {
/*Line 305 - 'AtomUI.js' */        if (ctrl._presenters) {
/*Line 306 - 'AtomUI.js' */            var ae = new AtomEnumerator(ctrl._presenters);
/*Line 307 - 'AtomUI.js' */            while (ae.next()) {
/*Line 308 - 'AtomUI.js' */                var c = ae.current();
/*Line 309 - 'AtomUI.js' */                if (c == p)
/*Line 310 - 'AtomUI.js' */                    return ctrl;
/*Line 311 - 'AtomUI.js' */            }
/*Line 312 - 'AtomUI.js' */        }
/*Line 313 - 'AtomUI.js' */        return this.getPresenterOwner(ctrl.get_atomParent(), p);
/*Line 314 - 'AtomUI.js' */    },

/*Line 316 - 'AtomUI.js' */    createCss: function (o) {
/*Line 317 - 'AtomUI.js' */        if (!o)
/*Line 318 - 'AtomUI.js' */            return "";
/*Line 319 - 'AtomUI.js' */        if (o.constructor == String)
/*Line 320 - 'AtomUI.js' */            return o;
/*Line 321 - 'AtomUI.js' */        var list = [];
/*Line 322 - 'AtomUI.js' */        for (var k in o) {
/*Line 323 - 'AtomUI.js' */            var v = o[k];
/*Line 324 - 'AtomUI.js' */            if (!v)
/*Line 325 - 'AtomUI.js' */                continue;
/*Line 326 - 'AtomUI.js' */            list.push(k);
/*Line 327 - 'AtomUI.js' */        }
/*Line 328 - 'AtomUI.js' */        return list.join(" ");
/*Line 329 - 'AtomUI.js' */    },

/*Line 331 - 'AtomUI.js' */    createControl: function (element, type, data, newScope) {
/*Line 332 - 'AtomUI.js' */        if (element.atomControl)
/*Line 333 - 'AtomUI.js' */            return;
/*Line 334 - 'AtomUI.js' */        if (!type) {
/*Line 335 - 'AtomUI.js' */            type = $(element).attr("atom-type");
/*Line 336 - 'AtomUI.js' */            type = WebAtoms[type];
/*Line 337 - 'AtomUI.js' */        } else {
/*Line 338 - 'AtomUI.js' */            if (type.constructor == String) {
/*Line 339 - 'AtomUI.js' */                type = WebAtoms[type];
/*Line 340 - 'AtomUI.js' */            }
/*Line 341 - 'AtomUI.js' */        }
/*Line 342 - 'AtomUI.js' */        if (type) {
/*Line 343 - 'AtomUI.js' */            var ctrl = new type(element);
/*Line 344 - 'AtomUI.js' */            if (data) {
/*Line 345 - 'AtomUI.js' */                ctrl._data = data;
/*Line 346 - 'AtomUI.js' */            }
/*Line 347 - 'AtomUI.js' */            if (newScope) {
/*Line 348 - 'AtomUI.js' */                ctrl._scope = newScope;
/*Line 349 - 'AtomUI.js' */            }

/*Line 351 - 'AtomUI.js' */            //inits templates..
/*Line 352 - 'AtomUI.js' */            //ctrl.prepareControl();

/*Line 354 - 'AtomUI.js' */            //init templates and creates controls...
/*Line 355 - 'AtomUI.js' */            ctrl.createChildren();

/*Line 357 - 'AtomUI.js' */            if (data) {
/*Line 358 - 'AtomUI.js' */                ctrl.init();
/*Line 359 - 'AtomUI.js' */            }
/*Line 360 - 'AtomUI.js' */            //$(element).removeAttr("atom-type");
/*Line 361 - 'AtomUI.js' */            return ctrl;
/*Line 362 - 'AtomUI.js' */        }
/*Line 363 - 'AtomUI.js' */        return null;
/*Line 364 - 'AtomUI.js' */    }

/*Line 366 - 'AtomUI.js' */};

/*Line 368 - 'AtomUI.js' */window.AtomUI = AtomUI;

/*Line 370 - 'AtomUI.js' */AtomUI.isIE7 = window.navigator.userAgent.indexOf("MSIE 7.0") != -1;
/*Line 371 - 'AtomUI.js' */AtomUI.isIE8 = window.navigator.userAgent.indexOf("MSIE 8.0") != -1;
/*Line 0 - 'AtomBindingHelper.js' */


/*Line 3 - 'AtomBindingHelper.js' */var AtomBinder = {
/*Line 4 - 'AtomBindingHelper.js' */    getClone: function (dupeObj) {
/*Line 5 - 'AtomBindingHelper.js' */        var retObj = {};
/*Line 6 - 'AtomBindingHelper.js' */        if (typeof (dupeObj) == 'object') {
/*Line 7 - 'AtomBindingHelper.js' */            if (typeof (dupeObj.length) != 'undefined')
/*Line 8 - 'AtomBindingHelper.js' */                var retObj = new Array();
/*Line 9 - 'AtomBindingHelper.js' */            for (var objInd in dupeObj) {
/*Line 10 - 'AtomBindingHelper.js' */                var val = dupeObj[objInd];
/*Line 11 - 'AtomBindingHelper.js' */                if (val === undefined)
/*Line 12 - 'AtomBindingHelper.js' */                    continue;
/*Line 13 - 'AtomBindingHelper.js' */                if (val === null) {
/*Line 14 - 'AtomBindingHelper.js' */                    retObj[objInd] = null;
/*Line 15 - 'AtomBindingHelper.js' */                    continue;
/*Line 16 - 'AtomBindingHelper.js' */                }
/*Line 17 - 'AtomBindingHelper.js' */                if (/^\_\$\_/gi.test(objInd))
/*Line 18 - 'AtomBindingHelper.js' */                    continue;
/*Line 19 - 'AtomBindingHelper.js' */                var type = typeof (val);
/*Line 20 - 'AtomBindingHelper.js' */                if (type == 'object') {
/*Line 21 - 'AtomBindingHelper.js' */                    if (val.constructor == Date) {
/*Line 22 - 'AtomBindingHelper.js' */                        retObj[objInd] = "/DateISO(" + AtomDate.toLocalTime(val) + ")/";
/*Line 23 - 'AtomBindingHelper.js' */                    } else {
/*Line 24 - 'AtomBindingHelper.js' */                        retObj[objInd] = AtomBinder.getClone(val);
/*Line 25 - 'AtomBindingHelper.js' */                    }
/*Line 26 - 'AtomBindingHelper.js' */                } else if (type == 'string') {
/*Line 27 - 'AtomBindingHelper.js' */                    retObj[objInd] = val;
/*Line 28 - 'AtomBindingHelper.js' */                } else if (type == 'number') {
/*Line 29 - 'AtomBindingHelper.js' */                    retObj[objInd] = val;
/*Line 30 - 'AtomBindingHelper.js' */                } else if (type == 'boolean') {
/*Line 31 - 'AtomBindingHelper.js' */                    ((val == true) ? retObj[objInd] = true : retObj[objInd] = false);
/*Line 32 - 'AtomBindingHelper.js' */                } else if (type == 'date') {
/*Line 33 - 'AtomBindingHelper.js' */                    retObj[objInd] = val.getTime();
/*Line 34 - 'AtomBindingHelper.js' */                }
/*Line 35 - 'AtomBindingHelper.js' */            }
/*Line 36 - 'AtomBindingHelper.js' */        }
/*Line 37 - 'AtomBindingHelper.js' */        return retObj;
/*Line 38 - 'AtomBindingHelper.js' */    },
/*Line 39 - 'AtomBindingHelper.js' */    setValue: function (target, key, value) {
/*Line 40 - 'AtomBindingHelper.js' */        if (!target && value === undefined)
/*Line 41 - 'AtomBindingHelper.js' */            return;
/*Line 42 - 'AtomBindingHelper.js' */        var oldValue = AtomBinder.getValue(target, key);
/*Line 43 - 'AtomBindingHelper.js' */        if (oldValue === value)
/*Line 44 - 'AtomBindingHelper.js' */            return;
/*Line 45 - 'AtomBindingHelper.js' */        var f = target["set_" + key];
/*Line 46 - 'AtomBindingHelper.js' */        if (f) {
/*Line 47 - 'AtomBindingHelper.js' */            f.apply(target, [value]);
/*Line 48 - 'AtomBindingHelper.js' */        }
/*Line 49 - 'AtomBindingHelper.js' */        else {
/*Line 50 - 'AtomBindingHelper.js' */            target[key] = value;
/*Line 51 - 'AtomBindingHelper.js' */        }
/*Line 52 - 'AtomBindingHelper.js' */        AtomBinder.refreshValue(target, key, oldValue, value);
/*Line 53 - 'AtomBindingHelper.js' */    },
/*Line 54 - 'AtomBindingHelper.js' */    refreshValue: function (target, key) {
/*Line 55 - 'AtomBindingHelper.js' */        var handlers = AtomBinder.get_WatchHandler(target, key);
/*Line 56 - 'AtomBindingHelper.js' */        if (handlers == undefined || handlers == null)
/*Line 57 - 'AtomBindingHelper.js' */            return;
/*Line 58 - 'AtomBindingHelper.js' */        var ae = new AtomEnumerator(handlers);
/*Line 59 - 'AtomBindingHelper.js' */        while (ae.next()) {
/*Line 60 - 'AtomBindingHelper.js' */            var item = ae.current();
/*Line 61 - 'AtomBindingHelper.js' */            item(target, key);
/*Line 62 - 'AtomBindingHelper.js' */        }

/*Line 64 - 'AtomBindingHelper.js' */        if (target._$_watcher) {
/*Line 65 - 'AtomBindingHelper.js' */            target._$_watcher._onRefreshValue(target, key);
/*Line 66 - 'AtomBindingHelper.js' */        }
/*Line 67 - 'AtomBindingHelper.js' */    },
/*Line 68 - 'AtomBindingHelper.js' */    getValue: function (target, key) {
/*Line 69 - 'AtomBindingHelper.js' */        if (target == null)
/*Line 70 - 'AtomBindingHelper.js' */            return null;
/*Line 71 - 'AtomBindingHelper.js' */        var f = target["get_" + key];
/*Line 72 - 'AtomBindingHelper.js' */        if (f) {
/*Line 73 - 'AtomBindingHelper.js' */            return f.apply(target);
/*Line 74 - 'AtomBindingHelper.js' */        }
/*Line 75 - 'AtomBindingHelper.js' */        return target[key];
/*Line 76 - 'AtomBindingHelper.js' */    },
/*Line 77 - 'AtomBindingHelper.js' */    add_WatchHandler: function (target, key, handler) {
/*Line 78 - 'AtomBindingHelper.js' */        if (target == null)
/*Line 79 - 'AtomBindingHelper.js' */            return;
/*Line 80 - 'AtomBindingHelper.js' */        var handlers = AtomBinder.get_WatchHandler(target, key);
/*Line 81 - 'AtomBindingHelper.js' */        handlers.push(handler);
/*Line 82 - 'AtomBindingHelper.js' */    },
/*Line 83 - 'AtomBindingHelper.js' */    get_WatchHandler: function (target, key) {
/*Line 84 - 'AtomBindingHelper.js' */        if (target == null)
/*Line 85 - 'AtomBindingHelper.js' */            return null;
/*Line 86 - 'AtomBindingHelper.js' */        var handlers = target._$_handlers;
/*Line 87 - 'AtomBindingHelper.js' */        if (!handlers) {
/*Line 88 - 'AtomBindingHelper.js' */            handlers = {};
/*Line 89 - 'AtomBindingHelper.js' */            target._$_handlers = handlers;
/*Line 90 - 'AtomBindingHelper.js' */        }
/*Line 91 - 'AtomBindingHelper.js' */        var handlersForKey = handlers[key];
/*Line 92 - 'AtomBindingHelper.js' */        if (handlersForKey == undefined || handlersForKey == null) {
/*Line 93 - 'AtomBindingHelper.js' */            handlersForKey = [];
/*Line 94 - 'AtomBindingHelper.js' */            handlers[key] = handlersForKey;
/*Line 95 - 'AtomBindingHelper.js' */        }
/*Line 96 - 'AtomBindingHelper.js' */        return handlersForKey;
/*Line 97 - 'AtomBindingHelper.js' */    },
/*Line 98 - 'AtomBindingHelper.js' */    remove_WatchHandler: function (target, key, handler) {
/*Line 99 - 'AtomBindingHelper.js' */        if (target == null)
/*Line 100 - 'AtomBindingHelper.js' */            return;
/*Line 101 - 'AtomBindingHelper.js' */        if (target._$_handlers === undefined || target._$_handlers === null)
/*Line 102 - 'AtomBindingHelper.js' */            return;
/*Line 103 - 'AtomBindingHelper.js' */        var handlersForKey = target._$_handlers[key];
/*Line 104 - 'AtomBindingHelper.js' */        if (handlersForKey == undefined || handlersForKey == null)
/*Line 105 - 'AtomBindingHelper.js' */            return;
/*Line 106 - 'AtomBindingHelper.js' */        var ae = new AtomEnumerator(handlersForKey);
/*Line 107 - 'AtomBindingHelper.js' */        while (ae.next()) {
/*Line 108 - 'AtomBindingHelper.js' */            if (ae.current() == handler) {
/*Line 109 - 'AtomBindingHelper.js' */                handlersForKey.splice(ae.currentIndex(), 1);
/*Line 110 - 'AtomBindingHelper.js' */                return;
/*Line 111 - 'AtomBindingHelper.js' */            }
/*Line 112 - 'AtomBindingHelper.js' */        }
/*Line 113 - 'AtomBindingHelper.js' */    },

/*Line 115 - 'AtomBindingHelper.js' */    invokeItemsEvent: function (target, mode, index, item) {
/*Line 116 - 'AtomBindingHelper.js' */        var key = "_items";
/*Line 117 - 'AtomBindingHelper.js' */        var handlers = AtomBinder.get_WatchHandler(target, key);
/*Line 118 - 'AtomBindingHelper.js' */        if (!handlers)
/*Line 119 - 'AtomBindingHelper.js' */            return;
/*Line 120 - 'AtomBindingHelper.js' */        var ae = new AtomEnumerator(handlers);
/*Line 121 - 'AtomBindingHelper.js' */        while (ae.next()) {
/*Line 122 - 'AtomBindingHelper.js' */            var obj = ae.current();
/*Line 123 - 'AtomBindingHelper.js' */            obj(mode, index, item);
/*Line 124 - 'AtomBindingHelper.js' */        }
/*Line 125 - 'AtomBindingHelper.js' */        if (target._$_watcher) {
/*Line 126 - 'AtomBindingHelper.js' */            target._$_watcher._onRefreshItems(target, mode, index, item);
/*Line 127 - 'AtomBindingHelper.js' */        }
/*Line 128 - 'AtomBindingHelper.js' */        AtomBinder.refreshValue(target, "length");
/*Line 129 - 'AtomBindingHelper.js' */    },
/*Line 130 - 'AtomBindingHelper.js' */    clear: function (ary) {
/*Line 131 - 'AtomBindingHelper.js' */        ary.length = 0;
/*Line 132 - 'AtomBindingHelper.js' */        AtomBinder.invokeItemsEvent(ary, "refresh", 0, null);
/*Line 133 - 'AtomBindingHelper.js' */    },
/*Line 134 - 'AtomBindingHelper.js' */    addItem: function (ary, item) {
/*Line 135 - 'AtomBindingHelper.js' */        var l = ary.length;
/*Line 136 - 'AtomBindingHelper.js' */        ary.push(item);
/*Line 137 - 'AtomBindingHelper.js' */        AtomBinder.invokeItemsEvent(ary, "add", l, item);
/*Line 138 - 'AtomBindingHelper.js' */    },
/*Line 139 - 'AtomBindingHelper.js' */    insertItem: function (ary, index, item) {
/*Line 140 - 'AtomBindingHelper.js' */        ary.splice(index, 0, item);
/*Line 141 - 'AtomBindingHelper.js' */        AtomBinder.invokeItemsEvent(ary, "add", index, item);
/*Line 142 - 'AtomBindingHelper.js' */    },
/*Line 143 - 'AtomBindingHelper.js' */    addItems: function (ary, items) {
/*Line 144 - 'AtomBindingHelper.js' */        var ae = new AtomEnumerator(items);
/*Line 145 - 'AtomBindingHelper.js' */        while (ae.next()) {
/*Line 146 - 'AtomBindingHelper.js' */            AtomBinder.addItem(ary, ae.current());
/*Line 147 - 'AtomBindingHelper.js' */        }
/*Line 148 - 'AtomBindingHelper.js' */    },
/*Line 149 - 'AtomBindingHelper.js' */    removeItem: function (ary, item) {
/*Line 150 - 'AtomBindingHelper.js' */        var i = ary.indexOf(item);
/*Line 151 - 'AtomBindingHelper.js' */        if (i == -1)
/*Line 152 - 'AtomBindingHelper.js' */            return;
/*Line 153 - 'AtomBindingHelper.js' */        ary.splice(i, 1);
/*Line 154 - 'AtomBindingHelper.js' */        AtomBinder.invokeItemsEvent(ary, "remove", i, item);
/*Line 155 - 'AtomBindingHelper.js' */    },
/*Line 156 - 'AtomBindingHelper.js' */    removeAtIndex: function (ary, i) {
/*Line 157 - 'AtomBindingHelper.js' */        if (i == -1)
/*Line 158 - 'AtomBindingHelper.js' */            return;
/*Line 159 - 'AtomBindingHelper.js' */        var item = ary[i];
/*Line 160 - 'AtomBindingHelper.js' */        ary.splice(i, 1);
/*Line 161 - 'AtomBindingHelper.js' */        AtomBinder.invokeItemsEvent(ary, "remove", i, item);
/*Line 162 - 'AtomBindingHelper.js' */    },
/*Line 163 - 'AtomBindingHelper.js' */    refreshItems: function (ary) {
/*Line 164 - 'AtomBindingHelper.js' */        AtomBinder.invokeItemsEvent(ary, "refresh", -1, null);
/*Line 165 - 'AtomBindingHelper.js' */    },
/*Line 166 - 'AtomBindingHelper.js' */    add_CollectionChanged: function (target, handler) {
/*Line 167 - 'AtomBindingHelper.js' */        if (target == null)
/*Line 168 - 'AtomBindingHelper.js' */            return;
/*Line 169 - 'AtomBindingHelper.js' */        var key = "_items";
/*Line 170 - 'AtomBindingHelper.js' */        var handlers = AtomBinder.get_WatchHandler(target, key);
/*Line 171 - 'AtomBindingHelper.js' */        handlers.push(handler);
/*Line 172 - 'AtomBindingHelper.js' */    },
/*Line 173 - 'AtomBindingHelper.js' */    remove_CollectionChanged: function (target, handler) {
/*Line 174 - 'AtomBindingHelper.js' */        if (target == null)
/*Line 175 - 'AtomBindingHelper.js' */            return;
/*Line 176 - 'AtomBindingHelper.js' */        if (!target._$_handlers)
/*Line 177 - 'AtomBindingHelper.js' */            return;
/*Line 178 - 'AtomBindingHelper.js' */        var key = "_items";
/*Line 179 - 'AtomBindingHelper.js' */        var handlersForKey = target._$_handlers[key];
/*Line 180 - 'AtomBindingHelper.js' */        if (handlersForKey == undefined || handlersForKey == null)
/*Line 181 - 'AtomBindingHelper.js' */            return;
/*Line 182 - 'AtomBindingHelper.js' */        var ae = new AtomEnumerator(handlersForKey);
/*Line 183 - 'AtomBindingHelper.js' */        while (ae.next()) {
/*Line 184 - 'AtomBindingHelper.js' */            if (ae.current() == handler) {
/*Line 185 - 'AtomBindingHelper.js' */                handlersForKey.splice(ae.currentIndex(), 1);
/*Line 186 - 'AtomBindingHelper.js' */                return;
/*Line 187 - 'AtomBindingHelper.js' */            }
/*Line 188 - 'AtomBindingHelper.js' */        }
/*Line 189 - 'AtomBindingHelper.js' */    },
/*Line 190 - 'AtomBindingHelper.js' */    setError: function (target, key, message) {
/*Line 191 - 'AtomBindingHelper.js' */        var errors = AtomBinder.getValue(target, "__errors");
/*Line 192 - 'AtomBindingHelper.js' */        if (!errors) {
/*Line 193 - 'AtomBindingHelper.js' */            AtomBinder.setValue(target, "__errors", {});
/*Line 194 - 'AtomBindingHelper.js' */        }
/*Line 195 - 'AtomBindingHelper.js' */        AtomBinder.setValue(errors, key, message);
/*Line 196 - 'AtomBindingHelper.js' */    }

/*Line 198 - 'AtomBindingHelper.js' */};

/*Line 200 - 'AtomBindingHelper.js' */window.AtomBinder = AtomBinder;

/*Line 202 - 'AtomBindingHelper.js' */Atom.clone = AtomBinder.getClone;
/*Line 203 - 'AtomBindingHelper.js' */Atom.add = AtomBinder.addItem;
/*Line 204 - 'AtomBindingHelper.js' */Atom.insert = AtomBinder.insertItem;
/*Line 205 - 'AtomBindingHelper.js' */Atom.remove = AtomBinder.removeItem;
/*Line 206 - 'AtomBindingHelper.js' */Atom.refresh = AtomBinder.refreshValue;
/*Line 207 - 'AtomBindingHelper.js' */Atom.refreshArray = AtomBinder.refreshItems;
/*Line 208 - 'AtomBindingHelper.js' */Atom.clearArray = AtomBinder.clear;
/*Line 0 - 'WebAtoms.Core.js' */
/*Line 1 - 'WebAtoms.Core.js' */
/*Line 2 - 'WebAtoms.Core.js' */
/*Line 3 - 'WebAtoms.Core.js' */
/*Line 4 - 'WebAtoms.Core.js' */
/*Line 5 - 'WebAtoms.Core.js' */
/*Line 6 - 'WebAtoms.Core.js' */
/*Line 7 - 'WebAtoms.Core.js' */
/*Line 8 - 'WebAtoms.Core.js' */
/*Line 9 - 'WebAtoms.Core.js' */
/*Line 10 - 'WebAtoms.Core.js' */

/*Line 12 - 'WebAtoms.Core.js' */Array.prototype.enumerator = function () {
/*Line 13 - 'WebAtoms.Core.js' */    return new AtomEnumerator(this);
/*Line 14 - 'WebAtoms.Core.js' */};

/*Line 16 - 'WebAtoms.Core.js' */if (!Array.prototype.indexOf) {
/*Line 17 - 'WebAtoms.Core.js' */    Array.prototype.indexOf = function (item) {
/*Line 18 - 'WebAtoms.Core.js' */        var i = 0;
/*Line 19 - 'WebAtoms.Core.js' */        for (i = 0; i < this.length; i++) {
/*Line 20 - 'WebAtoms.Core.js' */            if (item == this[i])
/*Line 21 - 'WebAtoms.Core.js' */                return i;
/*Line 22 - 'WebAtoms.Core.js' */        }
/*Line 23 - 'WebAtoms.Core.js' */        return -1;
/*Line 24 - 'WebAtoms.Core.js' */    };
/*Line 25 - 'WebAtoms.Core.js' */}

/*Line 27 - 'WebAtoms.Core.js' */var AtomArray = {

/*Line 29 - 'WebAtoms.Core.js' */    split: function (text, sep) {
/*Line 30 - 'WebAtoms.Core.js' */        if (sep && sep.constructor == String) {
/*Line 31 - 'WebAtoms.Core.js' */            sep = $.trim(sep);
/*Line 32 - 'WebAtoms.Core.js' */        }
/*Line 33 - 'WebAtoms.Core.js' */        var ar = text.split(sep);
/*Line 34 - 'WebAtoms.Core.js' */        var r = [];
/*Line 35 - 'WebAtoms.Core.js' */        var ae = new AtomEnumerator(ar);
/*Line 36 - 'WebAtoms.Core.js' */        var item;
/*Line 37 - 'WebAtoms.Core.js' */        while (ae.next()) {
/*Line 38 - 'WebAtoms.Core.js' */            item = ae.current();
/*Line 39 - 'WebAtoms.Core.js' */            if (item && item.constructor == String) {
/*Line 40 - 'WebAtoms.Core.js' */                item = $.trim(item);
/*Line 41 - 'WebAtoms.Core.js' */            }
/*Line 42 - 'WebAtoms.Core.js' */            r.push(item);
/*Line 43 - 'WebAtoms.Core.js' */        }
/*Line 44 - 'WebAtoms.Core.js' */        return r;
/*Line 45 - 'WebAtoms.Core.js' */    },

/*Line 47 - 'WebAtoms.Core.js' */    getValues: function (array, path) {
/*Line 48 - 'WebAtoms.Core.js' */        var item;
/*Line 49 - 'WebAtoms.Core.js' */        var result = array;
/*Line 50 - 'WebAtoms.Core.js' */        if (path) {
/*Line 51 - 'WebAtoms.Core.js' */            result = [];
/*Line 52 - 'WebAtoms.Core.js' */            var ae = new AtomEnumerator(array);
/*Line 53 - 'WebAtoms.Core.js' */            while (ae.next()) {
/*Line 54 - 'WebAtoms.Core.js' */                item = ae.current();
/*Line 55 - 'WebAtoms.Core.js' */                result.push(item[path]);
/*Line 56 - 'WebAtoms.Core.js' */            }
/*Line 57 - 'WebAtoms.Core.js' */        }
/*Line 58 - 'WebAtoms.Core.js' */        return result;
/*Line 59 - 'WebAtoms.Core.js' */    },

/*Line 61 - 'WebAtoms.Core.js' */    intersect: function (array, path, value) {
/*Line 62 - 'WebAtoms.Core.js' */        var result = [];
/*Line 63 - 'WebAtoms.Core.js' */        var ae = new AtomEnumerator(value);
/*Line 64 - 'WebAtoms.Core.js' */        var item;
/*Line 65 - 'WebAtoms.Core.js' */        var match;
/*Line 66 - 'WebAtoms.Core.js' */        while (ae.next()) {
/*Line 67 - 'WebAtoms.Core.js' */            item = ae.current();
/*Line 68 - 'WebAtoms.Core.js' */            match = this.getMatch(array, path, item);
/*Line 69 - 'WebAtoms.Core.js' */            if (match != undefined)
/*Line 70 - 'WebAtoms.Core.js' */                result.push(match);
/*Line 71 - 'WebAtoms.Core.js' */        }
/*Line 72 - 'WebAtoms.Core.js' */        return result;
/*Line 73 - 'WebAtoms.Core.js' */    },

/*Line 75 - 'WebAtoms.Core.js' */    getMatch: function (array, path, value) {
/*Line 76 - 'WebAtoms.Core.js' */        var ae = new AtomEnumerator(array);
/*Line 77 - 'WebAtoms.Core.js' */        var dataItem;
/*Line 78 - 'WebAtoms.Core.js' */        var item;
/*Line 79 - 'WebAtoms.Core.js' */        while (ae.next()) {
/*Line 80 - 'WebAtoms.Core.js' */            dataItem = ae.current();
/*Line 81 - 'WebAtoms.Core.js' */            item = dataItem;
/*Line 82 - 'WebAtoms.Core.js' */            if (path)
/*Line 83 - 'WebAtoms.Core.js' */                item = dataItem[path];
/*Line 84 - 'WebAtoms.Core.js' */            if (item == value)
/*Line 85 - 'WebAtoms.Core.js' */                return dataItem;
/*Line 86 - 'WebAtoms.Core.js' */        }
/*Line 87 - 'WebAtoms.Core.js' */    },

/*Line 89 - 'WebAtoms.Core.js' */    remove: function (array, item) {
/*Line 90 - 'WebAtoms.Core.js' */        var ae = new AtomEnumerator(array);
/*Line 91 - 'WebAtoms.Core.js' */        while (ae.next()) {
/*Line 92 - 'WebAtoms.Core.js' */            var arrayItem = ae.current();
/*Line 93 - 'WebAtoms.Core.js' */            if (arrayItem == item) {
/*Line 94 - 'WebAtoms.Core.js' */                array.splice(ae.currentIndex(), 1);
/*Line 95 - 'WebAtoms.Core.js' */                return;
/*Line 96 - 'WebAtoms.Core.js' */            }
/*Line 97 - 'WebAtoms.Core.js' */        }
/*Line 98 - 'WebAtoms.Core.js' */    }
/*Line 99 - 'WebAtoms.Core.js' */};

/*Line 101 - 'WebAtoms.Core.js' */window.AtomArray = AtomArray;

/*Line 103 - 'WebAtoms.Core.js' *///Creating AtomScope Class
/*Line 104 - 'WebAtoms.Core.js' */var AtomScope = (function (window,name, base) {
/*Line 105 - 'WebAtoms.Core.js' */    return classCreator(name, base,
/*Line 106 - 'WebAtoms.Core.js' */        function (owner,parent,app) {
/*Line 107 - 'WebAtoms.Core.js' */            this.owner = owner;
/*Line 108 - 'WebAtoms.Core.js' */            this.parent = parent;
/*Line 109 - 'WebAtoms.Core.js' */            if (app) {
/*Line 110 - 'WebAtoms.Core.js' */                this.__application = app;
/*Line 111 - 'WebAtoms.Core.js' */            }
/*Line 112 - 'WebAtoms.Core.js' */            if (this.__application == this.owner) {
/*Line 113 - 'WebAtoms.Core.js' */                //this._$_watcher = this.__application;
/*Line 114 - 'WebAtoms.Core.js' */                this._v = 0;
/*Line 115 - 'WebAtoms.Core.js' */                this.refreshCommand = function () {
/*Line 116 - 'WebAtoms.Core.js' */                    appScope._v = appScope._v + 1;
/*Line 117 - 'WebAtoms.Core.js' */                    AtomBinder.refreshValue(appScope, "_v");
/*Line 118 - 'WebAtoms.Core.js' */                };
/*Line 119 - 'WebAtoms.Core.js' */            }
/*Line 120 - 'WebAtoms.Core.js' */            this._refreshValue = function (name) {
/*Line 121 - 'WebAtoms.Core.js' */                AtomBinder.refreshValue(this, name);
/*Line 122 - 'WebAtoms.Core.js' */                if (this.__application === this.owner) {
/*Line 123 - 'WebAtoms.Core.js' */                    this.__application._onRefreshValue(this, name);
/*Line 124 - 'WebAtoms.Core.js' */                }
/*Line 125 - 'WebAtoms.Core.js' */            };

/*Line 127 - 'WebAtoms.Core.js' */        },
/*Line 128 - 'WebAtoms.Core.js' */        {
/*Line 129 - 'WebAtoms.Core.js' */            setValue: function (name, value, forceRefresh) {
/*Line 130 - 'WebAtoms.Core.js' */                if (AtomBinder.getValue(this, name) == value) {
/*Line 131 - 'WebAtoms.Core.js' */                    if (forceRefresh) {
/*Line 132 - 'WebAtoms.Core.js' */                        this._refreshValue(name);
/*Line 133 - 'WebAtoms.Core.js' */                    }
/*Line 134 - 'WebAtoms.Core.js' */                    return;
/*Line 135 - 'WebAtoms.Core.js' */                }
/*Line 136 - 'WebAtoms.Core.js' */                var f = this["set_" + name];
/*Line 137 - 'WebAtoms.Core.js' */                if (f) {
/*Line 138 - 'WebAtoms.Core.js' */                    f.apply(this, [value]);
/*Line 139 - 'WebAtoms.Core.js' */                } else {
/*Line 140 - 'WebAtoms.Core.js' */                    this[name] = value;
/*Line 141 - 'WebAtoms.Core.js' */                }
/*Line 142 - 'WebAtoms.Core.js' */                this._refreshValue(name);
/*Line 143 - 'WebAtoms.Core.js' */            }
/*Line 144 - 'WebAtoms.Core.js' */        });
/*Line 145 - 'WebAtoms.Core.js' */})(window,"WebAtoms.AtomScope", null);
/*Line 0 - 'AtomComponent.js' */
/*Line 1 - 'AtomComponent.js' */
/*Line 2 - 'AtomComponent.js' */

/*Line 4 - 'AtomComponent.js' */(function(window,name,base){
/*Line 5 - 'AtomComponent.js' */    return classCreator(name,base,
/*Line 6 - 'AtomComponent.js' */        function () {
/*Line 7 - 'AtomComponent.js' */            this._eventHandlers = [];
/*Line 8 - 'AtomComponent.js' */        },
/*Line 9 - 'AtomComponent.js' */        {
/*Line 10 - 'AtomComponent.js' */            bindEvent: function (element, name, methodName, key, method) {
/*Line 11 - 'AtomComponent.js' */                if (element == null)
/*Line 12 - 'AtomComponent.js' */                    return;
/*Line 13 - 'AtomComponent.js' */                if (typeof methodName == 'function') {
/*Line 14 - 'AtomComponent.js' */                    method = methodName;
/*Line 15 - 'AtomComponent.js' */                }
/*Line 16 - 'AtomComponent.js' */                method = method || AtomUI.createDelegate(this, methodName);
/*Line 17 - 'AtomComponent.js' */                var be = {
/*Line 18 - 'AtomComponent.js' */                    element: element,
/*Line 19 - 'AtomComponent.js' */                    name: name,
/*Line 20 - 'AtomComponent.js' */                    methodName: methodName,
/*Line 21 - 'AtomComponent.js' */                    handler: method
/*Line 22 - 'AtomComponent.js' */                };
/*Line 23 - 'AtomComponent.js' */                if (key) {
/*Line 24 - 'AtomComponent.js' */                    be.key = key;
/*Line 25 - 'AtomComponent.js' */                }
/*Line 26 - 'AtomComponent.js' */                if (AtomUI.isNode(element)) {
/*Line 27 - 'AtomComponent.js' */                    $(element).bind(name, null, method);
/*Line 28 - 'AtomComponent.js' */                } else {
/*Line 29 - 'AtomComponent.js' */                    if (element.addEventListener) {
/*Line 30 - 'AtomComponent.js' */                        element.addEventListener(name, method, false);
/*Line 31 - 'AtomComponent.js' */                    } else {
/*Line 32 - 'AtomComponent.js' */                        var f = element["add_" + name];
/*Line 33 - 'AtomComponent.js' */                        if (f == null) {
/*Line 34 - 'AtomComponent.js' */                            // try atom binder...
/*Line 35 - 'AtomComponent.js' */                            f = AtomBinder["add_" + name];
/*Line 36 - 'AtomComponent.js' */                            if (key) {
/*Line 37 - 'AtomComponent.js' */                                f.apply(AtomBinder, [element, key, method]);
/*Line 38 - 'AtomComponent.js' */                            }
/*Line 39 - 'AtomComponent.js' */                            else {
/*Line 40 - 'AtomComponent.js' */                                f.apply(AtomBinder, [element, method]);
/*Line 41 - 'AtomComponent.js' */                            }
/*Line 42 - 'AtomComponent.js' */                        } else {
/*Line 43 - 'AtomComponent.js' */                            f.apply(element, [method]);
/*Line 44 - 'AtomComponent.js' */                        }
/*Line 45 - 'AtomComponent.js' */                    }
/*Line 46 - 'AtomComponent.js' */                }
/*Line 47 - 'AtomComponent.js' */                this._eventHandlers.push(be);
/*Line 48 - 'AtomComponent.js' */            },

/*Line 50 - 'AtomComponent.js' */            unbindEvent: function (element, name, methodName, key) {
/*Line 51 - 'AtomComponent.js' */                var ae = new AtomEnumerator(this._eventHandlers);
/*Line 52 - 'AtomComponent.js' */                var removed = [];
/*Line 53 - 'AtomComponent.js' */                while (ae.next()) {
/*Line 54 - 'AtomComponent.js' */                    var be = ae.current();
/*Line 55 - 'AtomComponent.js' */                    if (element && element !== be.element)
/*Line 56 - 'AtomComponent.js' */                        continue;
/*Line 57 - 'AtomComponent.js' */                    if (name && name !== be.name)
/*Line 58 - 'AtomComponent.js' */                        continue;
/*Line 59 - 'AtomComponent.js' */                    if (methodName && methodName !== be.methodName)
/*Line 60 - 'AtomComponent.js' */                        continue;
/*Line 61 - 'AtomComponent.js' */                    if (key && key !== be.key)
/*Line 62 - 'AtomComponent.js' */                        continue;
/*Line 63 - 'AtomComponent.js' */                    if (AtomUI.isNode(be.element)) {
/*Line 64 - 'AtomComponent.js' */                        $(be.element).unbind(be.name, be.handler);
/*Line 65 - 'AtomComponent.js' */                    } else {
/*Line 66 - 'AtomComponent.js' */                        if (be.element.removeEventListener) {
/*Line 67 - 'AtomComponent.js' */                            // dont do any thing..
/*Line 68 - 'AtomComponent.js' */                            be.element.removeEventListener(name, be.handler, false);
/*Line 69 - 'AtomComponent.js' */                        } else {
/*Line 70 - 'AtomComponent.js' */                            var f = be.element["remove_" + be.name];
/*Line 71 - 'AtomComponent.js' */                            if (f == null) {
/*Line 72 - 'AtomComponent.js' */                                f = AtomBinder["remove_" + be.name];
/*Line 73 - 'AtomComponent.js' */                                if (be.key) {
/*Line 74 - 'AtomComponent.js' */                                    f.apply(AtomBinder, [be.element, be.key, be.handler]);
/*Line 75 - 'AtomComponent.js' */                                }
/*Line 76 - 'AtomComponent.js' */                                else {
/*Line 77 - 'AtomComponent.js' */                                    f.apply(AtomBinder, [be.element, be.handler]);
/*Line 78 - 'AtomComponent.js' */                                }
/*Line 79 - 'AtomComponent.js' */                            } else {
/*Line 80 - 'AtomComponent.js' */                                f.apply(be.element, [be.handler]);
/*Line 81 - 'AtomComponent.js' */                            }
/*Line 82 - 'AtomComponent.js' */                        }
/*Line 83 - 'AtomComponent.js' */                    }
/*Line 84 - 'AtomComponent.js' */                    removed.push(be);
/*Line 85 - 'AtomComponent.js' */                }

/*Line 87 - 'AtomComponent.js' */                if (removed.length == this._eventHandlers.length) {
/*Line 88 - 'AtomComponent.js' */                    this._eventHandlers.length = 0;
/*Line 89 - 'AtomComponent.js' */                } else {
/*Line 90 - 'AtomComponent.js' */                    ae = new AtomEnumerator(removed);
/*Line 91 - 'AtomComponent.js' */                    while (ae.next()) {
/*Line 92 - 'AtomComponent.js' */                        var be = ae.current();
/*Line 93 - 'AtomComponent.js' */                        AtomArray.remove(this._eventHandlers, be);
/*Line 94 - 'AtomComponent.js' */                    }
/*Line 95 - 'AtomComponent.js' */                }
/*Line 96 - 'AtomComponent.js' */            },


/*Line 99 - 'AtomComponent.js' */            init: function () {
/*Line 100 - 'AtomComponent.js' */            },
/*Line 101 - 'AtomComponent.js' */            dispose: function () {
/*Line 102 - 'AtomComponent.js' */                // remove all event handlers...
/*Line 103 - 'AtomComponent.js' */                this.unbindEvent(null, null, null);

/*Line 105 - 'AtomComponent.js' */                // also remove __delegates..
/*Line 106 - 'AtomComponent.js' */                if (this.__delegates)
/*Line 107 - 'AtomComponent.js' */                    this.__delegates = null;
/*Line 108 - 'AtomComponent.js' */            }
/*Line 109 - 'AtomComponent.js' */        });
/*Line 110 - 'AtomComponent.js' */})(this,"WebAtoms.AtomComponent",null);
/*Line 0 - 'AtomPromise.js' */


/*Line 3 - 'AtomPromise.js' */var AtomPromise = function () {

/*Line 5 - 'AtomPromise.js' */    this._success = [];
/*Line 6 - 'AtomPromise.js' */    this._failed = [];
/*Line 7 - 'AtomPromise.js' */    this._cached = false;

/*Line 9 - 'AtomPromise.js' */    this._process = null;

/*Line 11 - 'AtomPromise.js' */    this._calls = 0;

/*Line 13 - 'AtomPromise.js' */    this._showProgress = true;
/*Line 14 - 'AtomPromise.js' */    this._showError = true;
/*Line 15 - 'AtomPromise.js' */    var _this = this;
/*Line 16 - 'AtomPromise.js' */    this.success = function () {
/*Line 17 - 'AtomPromise.js' */        _this.onSuccess.apply(_this, arguments);
/*Line 18 - 'AtomPromise.js' */    };

/*Line 20 - 'AtomPromise.js' */    this.error = function () {
/*Line 21 - 'AtomPromise.js' */        _this.onError.apply(_this, arguments);
/*Line 22 - 'AtomPromise.js' */    };
/*Line 23 - 'AtomPromise.js' */};

/*Line 25 - 'AtomPromise.js' */window.AtomPromise = AtomPromise;

/*Line 27 - 'AtomPromise.js' */AtomPromise.prototype = {

/*Line 29 - 'AtomPromise.js' */    onSuccess: function (c) {
/*Line 30 - 'AtomPromise.js' */        this._value = c;
/*Line 31 - 'AtomPromise.js' */        if (this._process) {
/*Line 32 - 'AtomPromise.js' */            this._value = this._process(this._value);
/*Line 33 - 'AtomPromise.js' */        }
/*Line 34 - 'AtomPromise.js' */        var r = this._success;
/*Line 35 - 'AtomPromise.js' */        for (var i = 0; i < r.length ; i++) {
/*Line 36 - 'AtomPromise.js' */            r[i](this);
/*Line 37 - 'AtomPromise.js' */        }
/*Line 38 - 'AtomPromise.js' */    },

/*Line 40 - 'AtomPromise.js' */    onError: function () {
/*Line 41 - 'AtomPromise.js' */        this.errors = arguments;
/*Line 42 - 'AtomPromise.js' */        var r = this._failed;
/*Line 43 - 'AtomPromise.js' */        for (var i = 0; i < r.length; i++) {
/*Line 44 - 'AtomPromise.js' */            r[i](this);
/*Line 45 - 'AtomPromise.js' */        }
/*Line 46 - 'AtomPromise.js' */    },

/*Line 48 - 'AtomPromise.js' */    then: function (t) {
/*Line 49 - 'AtomPromise.js' */        this._success.push(t);
/*Line 50 - 'AtomPromise.js' */        return this;
/*Line 51 - 'AtomPromise.js' */    },

/*Line 53 - 'AtomPromise.js' */    process: function (f) {
/*Line 54 - 'AtomPromise.js' */        this._process = f;
/*Line 55 - 'AtomPromise.js' */        return this;
/*Line 56 - 'AtomPromise.js' */    },

/*Line 58 - 'AtomPromise.js' */    failed: function (f) {
/*Line 59 - 'AtomPromise.js' */        this._failed.push(f);
/*Line 60 - 'AtomPromise.js' */        return this;
/*Line 61 - 'AtomPromise.js' */    },

/*Line 63 - 'AtomPromise.js' */    value: function (v) {

/*Line 65 - 'AtomPromise.js' */        if (v !== undefined) {
/*Line 66 - 'AtomPromise.js' */            this._value = v;
/*Line 67 - 'AtomPromise.js' */            return;
/*Line 68 - 'AtomPromise.js' */        }
/*Line 69 - 'AtomPromise.js' */        return this._value;
/*Line 70 - 'AtomPromise.js' */    },

/*Line 72 - 'AtomPromise.js' */    onInvoke: function (r) {
/*Line 73 - 'AtomPromise.js' */        this._invoke = r;
/*Line 74 - 'AtomPromise.js' */        return this;
/*Line 75 - 'AtomPromise.js' */    },

/*Line 77 - 'AtomPromise.js' */    invoke: function () {
/*Line 78 - 'AtomPromise.js' */        if (!this._persist) {
/*Line 79 - 'AtomPromise.js' */            this.invokePromise();
/*Line 80 - 'AtomPromise.js' */            return this;
/*Line 81 - 'AtomPromise.js' */        }
/*Line 82 - 'AtomPromise.js' */        var _this = this;
/*Line 83 - 'AtomPromise.js' */        this.promiseTimeout = setTimeout(function () {
/*Line 84 - 'AtomPromise.js' */            _this.invokePromise();
/*Line 85 - 'AtomPromise.js' */        }, 100);
/*Line 86 - 'AtomPromise.js' */        return this;
/*Line 87 - 'AtomPromise.js' */    },

/*Line 89 - 'AtomPromise.js' */    invokePromise: function () {
/*Line 90 - 'AtomPromise.js' */        this.promiseTimeout = null;
/*Line 91 - 'AtomPromise.js' */        if (this._showProgress) {
/*Line 92 - 'AtomPromise.js' */            atomApplication.setBusy(true);
/*Line 93 - 'AtomPromise.js' */            if (this._calls === 0) {
/*Line 94 - 'AtomPromise.js' */                var f = function () {
/*Line 95 - 'AtomPromise.js' */                    atomApplication.setBusy(false);
/*Line 96 - 'AtomPromise.js' */                };
/*Line 97 - 'AtomPromise.js' */                this.then(f);
/*Line 98 - 'AtomPromise.js' */                this.failed(f);
/*Line 99 - 'AtomPromise.js' */            }
/*Line 100 - 'AtomPromise.js' */        }
/*Line 101 - 'AtomPromise.js' */        this._calls++;
/*Line 102 - 'AtomPromise.js' */        this._invoke(this);
/*Line 103 - 'AtomPromise.js' */        return this;
/*Line 104 - 'AtomPromise.js' */    },

/*Line 106 - 'AtomPromise.js' */    pushValue: function (v) {
/*Line 107 - 'AtomPromise.js' */        var _this = this;
/*Line 108 - 'AtomPromise.js' */        this._cached = true;
/*Line 109 - 'AtomPromise.js' */        setTimeout(function () {
/*Line 110 - 'AtomPromise.js' */            _this.onSuccess.apply(_this, [v]);
/*Line 111 - 'AtomPromise.js' */        }, 1);
/*Line 112 - 'AtomPromise.js' */    },


/*Line 115 - 'AtomPromise.js' */    showProgress: function (b) {
/*Line 116 - 'AtomPromise.js' */        this._showProgress = b;
/*Line 117 - 'AtomPromise.js' */        return this;
/*Line 118 - 'AtomPromise.js' */    },

/*Line 120 - 'AtomPromise.js' */    showError: function (b) {
/*Line 121 - 'AtomPromise.js' */        this._showError = b;
/*Line 122 - 'AtomPromise.js' */        return this;
/*Line 123 - 'AtomPromise.js' */    },

/*Line 125 - 'AtomPromise.js' */    persist: function (v) {
/*Line 126 - 'AtomPromise.js' */        if (v === undefined)
/*Line 127 - 'AtomPromise.js' */            this._persist = true;
/*Line 128 - 'AtomPromise.js' */        else
/*Line 129 - 'AtomPromise.js' */            this._persist = v;
/*Line 130 - 'AtomPromise.js' */        return this;
/*Line 131 - 'AtomPromise.js' */    },

/*Line 133 - 'AtomPromise.js' */    abort: function () {
/*Line 134 - 'AtomPromise.js' */        if (this.promiseTimeout) {
/*Line 135 - 'AtomPromise.js' */            clearTimeout(this.promiseTimeout);
/*Line 136 - 'AtomPromise.js' */            this.promiseTimeout = null;
/*Line 137 - 'AtomPromise.js' */            return;
/*Line 138 - 'AtomPromise.js' */        }
/*Line 139 - 'AtomPromise.js' */        this._failed.length = 0;
/*Line 140 - 'AtomPromise.js' */        this._success.length = 0;
/*Line 141 - 'AtomPromise.js' */        if (this._showProgress) {
/*Line 142 - 'AtomPromise.js' */            atomApplication.setBusy(false);
/*Line 143 - 'AtomPromise.js' */        }
/*Line 144 - 'AtomPromise.js' */        if (this.handle) {
/*Line 145 - 'AtomPromise.js' */            this.handle.abort();
/*Line 146 - 'AtomPromise.js' */        }
/*Line 147 - 'AtomPromise.js' */    }

/*Line 149 - 'AtomPromise.js' */};

/*Line 151 - 'AtomPromise.js' */AtomPromise.getUrl = function (url) {
/*Line 152 - 'AtomPromise.js' */    var pageUrl = location.href;
/*Line 153 - 'AtomPromise.js' */    var index = pageUrl.indexOf('#');
/*Line 154 - 'AtomPromise.js' */    if (index !== -1)
/*Line 155 - 'AtomPromise.js' */        pageUrl = pageUrl.substr(0, index);
/*Line 156 - 'AtomPromise.js' */    if (url) {
/*Line 157 - 'AtomPromise.js' */        index = pageUrl.lastIndexOf('/');
/*Line 158 - 'AtomPromise.js' */        if (index !== -1) {
/*Line 159 - 'AtomPromise.js' */            pageUrl = pageUrl.substr(0, index + 1);
/*Line 160 - 'AtomPromise.js' */        }


/*Line 163 - 'AtomPromise.js' */        //if (AtomUI.startsWith(url, "http://") || AtomUI.startsWith(url, "https://")) {
/*Line 164 - 'AtomPromise.js' */        //    return url;
/*Line 165 - 'AtomPromise.js' */        //}
/*Line 166 - 'AtomPromise.js' */        if (/^(http|https)\:\/\//gi.test(url)) {
/*Line 167 - 'AtomPromise.js' */            return url;
/*Line 168 - 'AtomPromise.js' */        }
/*Line 169 - 'AtomPromise.js' */        if (/^\//gi.test(url)) {
/*Line 170 - 'AtomPromise.js' */            return url;
/*Line 171 - 'AtomPromise.js' */        }
/*Line 172 - 'AtomPromise.js' */        if (/^\./gi.test(url)) {
/*Line 173 - 'AtomPromise.js' */            url = url.substr(1);
/*Line 174 - 'AtomPromise.js' */            //if (AtomUI.endsWith(pageUrl, "/") && AtomUI.startsWith(url, "/")) {
/*Line 175 - 'AtomPromise.js' */            //    url = url.substr(1);
/*Line 176 - 'AtomPromise.js' */            //}
/*Line 177 - 'AtomPromise.js' */            if (/\/$/gi.test(pageUrl) && /^\//gi.test(url)) {
/*Line 178 - 'AtomPromise.js' */                url = url.substr(1);
/*Line 179 - 'AtomPromise.js' */            }
/*Line 180 - 'AtomPromise.js' */            return pageUrl + url;
/*Line 181 - 'AtomPromise.js' */        }
/*Line 182 - 'AtomPromise.js' */        return pageUrl + url;
/*Line 183 - 'AtomPromise.js' */    } else {
/*Line 184 - 'AtomPromise.js' */        return pageUrl;
/*Line 185 - 'AtomPromise.js' */    }
/*Line 186 - 'AtomPromise.js' */};

/*Line 188 - 'AtomPromise.js' */AtomPromise.parseDates = function (obj) {
/*Line 189 - 'AtomPromise.js' */    if (!obj)
/*Line 190 - 'AtomPromise.js' */        return obj;
/*Line 191 - 'AtomPromise.js' */    var type = typeof (obj);
/*Line 192 - 'AtomPromise.js' */    if (type === 'object') {
/*Line 193 - 'AtomPromise.js' */        if (typeof (obj.length) !== 'undefined') {
/*Line 194 - 'AtomPromise.js' */            for (var i = 0; i < obj.length; i++) {
/*Line 195 - 'AtomPromise.js' */                obj[i] = AtomPromise.parseDates(obj[i]);
/*Line 196 - 'AtomPromise.js' */            }
/*Line 197 - 'AtomPromise.js' */            return obj;
/*Line 198 - 'AtomPromise.js' */        }

/*Line 200 - 'AtomPromise.js' */        for (var k in obj) {
/*Line 201 - 'AtomPromise.js' */            var v = obj[k];
/*Line 202 - 'AtomPromise.js' */            if (!v)
/*Line 203 - 'AtomPromise.js' */                continue;
/*Line 204 - 'AtomPromise.js' */            obj[k] = AtomPromise.parseDates(v);
/*Line 205 - 'AtomPromise.js' */        }

/*Line 207 - 'AtomPromise.js' */    }
/*Line 208 - 'AtomPromise.js' */    if (typeof (obj) === 'string' || obj.constructor === String) {
/*Line 209 - 'AtomPromise.js' */        if (/^\/date\(/gi.test(obj) && /\)\/$/gi.test(obj)) {
/*Line 210 - 'AtomPromise.js' */            return AtomDate.parse(obj);
/*Line 211 - 'AtomPromise.js' */        }
/*Line 212 - 'AtomPromise.js' */    }
/*Line 213 - 'AtomPromise.js' */    return obj;
/*Line 214 - 'AtomPromise.js' */};

/*Line 216 - 'AtomPromise.js' */AtomPromise.ajax = function (url, query, options, type) {
/*Line 217 - 'AtomPromise.js' */    var p = new AtomPromise();

/*Line 219 - 'AtomPromise.js' */    if (!options) {
/*Line 220 - 'AtomPromise.js' */        options = {
/*Line 221 - 'AtomPromise.js' */            type: "GET",
/*Line 222 - 'AtomPromise.js' */            dataType: "text",
/*Line 223 - 'AtomPromise.js' */            data: null
/*Line 224 - 'AtomPromise.js' */        };
/*Line 225 - 'AtomPromise.js' */    }

/*Line 227 - 'AtomPromise.js' */    if (AtomConfig.ajax.versionUrl)
/*Line 228 - 'AtomPromise.js' */    {
/*Line 229 - 'AtomPromise.js' */        if (options.versionUrl !== undefined && options.versionUrl) {
/*Line 230 - 'AtomPromise.js' */            query = query || {};
/*Line 231 - 'AtomPromise.js' */            query[AtomConfig.ajax.versionKey] = AtomConfig.ajax.version;
/*Line 232 - 'AtomPromise.js' */        }
/*Line 233 - 'AtomPromise.js' */    }


/*Line 236 - 'AtomPromise.js' */    options.success = p.success;
/*Line 237 - 'AtomPromise.js' */    options.error = p.error;

/*Line 239 - 'AtomPromise.js' */    // caching is disabled by default...
/*Line 240 - 'AtomPromise.js' */    if (options.cache === undefined) {
/*Line 241 - 'AtomPromise.js' */        options.cache = false;

/*Line 243 - 'AtomPromise.js' */    }


/*Line 246 - 'AtomPromise.js' */    var u = url;

/*Line 248 - 'AtomPromise.js' */    var dh = AtomConfig.ajax.headers;
/*Line 249 - 'AtomPromise.js' */    if (dh) {
/*Line 250 - 'AtomPromise.js' */        if (!options.headers) {
/*Line 251 - 'AtomPromise.js' */            options.headers = {};
/*Line 252 - 'AtomPromise.js' */        }
/*Line 253 - 'AtomPromise.js' */        for (var k in dh) {
/*Line 254 - 'AtomPromise.js' */            var v = dh[k];
/*Line 255 - 'AtomPromise.js' */            options.headers[k] = v;
/*Line 256 - 'AtomPromise.js' */            if (AtomConfig.debug) {
/*Line 257 - 'AtomPromise.js' */                log("Header set: " + k + "=" + v);
/*Line 258 - 'AtomPromise.js' */            }
/*Line 259 - 'AtomPromise.js' */        }
/*Line 260 - 'AtomPromise.js' */    }


/*Line 263 - 'AtomPromise.js' */    var sc = AtomConfig.ajax.statusCode;
/*Line 264 - 'AtomPromise.js' */    if (sc) {
/*Line 265 - 'AtomPromise.js' */        var osc = options.statusCode || {};
/*Line 266 - 'AtomPromise.js' */        for (var k in sc) {
/*Line 267 - 'AtomPromise.js' */            var v = sc[k];
/*Line 268 - 'AtomPromise.js' */            if (!osc[k]) {
/*Line 269 - 'AtomPromise.js' */                osc[k] = v;
/*Line 270 - 'AtomPromise.js' */            }
/*Line 271 - 'AtomPromise.js' */        }
/*Line 272 - 'AtomPromise.js' */        options.statusCode = osc;
/*Line 273 - 'AtomPromise.js' */    }

/*Line 275 - 'AtomPromise.js' */    var o = options;

/*Line 277 - 'AtomPromise.js' */    var data = o.data;

/*Line 279 - 'AtomPromise.js' */    if (data) {
/*Line 280 - 'AtomPromise.js' */        data = AtomBinder.getClone(data);
/*Line 281 - 'AtomPromise.js' */        var e = AtomConfig.ajax.jsonPostEncode;
/*Line 282 - 'AtomPromise.js' */        if (e) {
/*Line 283 - 'AtomPromise.js' */            data = e(data);
/*Line 284 - 'AtomPromise.js' */        } else {
/*Line 285 - 'AtomPromise.js' */            data = { formModel: JSON.stringify(data) };
/*Line 286 - 'AtomPromise.js' */        }
/*Line 287 - 'AtomPromise.js' */        o.data = data;
/*Line 288 - 'AtomPromise.js' */    }

/*Line 290 - 'AtomPromise.js' */    var attachments = o.attachments;
/*Line 291 - 'AtomPromise.js' */    if (attachments && attachments.length) {
/*Line 292 - 'AtomPromise.js' */        var fd = new FormData();
/*Line 293 - 'AtomPromise.js' */        var ae = new AtomEnumerator(attachments);
/*Line 294 - 'AtomPromise.js' */        while (ae.next()) {
/*Line 295 - 'AtomPromise.js' */            fd.append("file" + ae.currentIndex(), ae.current());
/*Line 296 - 'AtomPromise.js' */        }
/*Line 297 - 'AtomPromise.js' */        if (data) {
/*Line 298 - 'AtomPromise.js' */            for (var k in data) {
/*Line 299 - 'AtomPromise.js' */                fd.append(k, data[k]);
/*Line 300 - 'AtomPromise.js' */            }
/*Line 301 - 'AtomPromise.js' */        }
/*Line 302 - 'AtomPromise.js' */        o.type = "POST";
/*Line 303 - 'AtomPromise.js' */        o.xhr = function () {
/*Line 304 - 'AtomPromise.js' */            var myXhr = $.ajaxSettings.xhr();
/*Line 305 - 'AtomPromise.js' */            if (myXhr.upload) {
/*Line 306 - 'AtomPromise.js' */                myXhr.upload.addEventListener('progress', function (e) {
/*Line 307 - 'AtomPromise.js' */                    if (e.lengthComputable) {
/*Line 308 - 'AtomPromise.js' */                        var percentComplete = Math.round(e.loaded * 100 / e.total);
/*Line 309 - 'AtomPromise.js' */                        AtomBinder.setValue(atomApplication, 'progress', percentComplete);
/*Line 310 - 'AtomPromise.js' */                    }
/*Line 311 - 'AtomPromise.js' */                }, false);
/*Line 312 - 'AtomPromise.js' */            }
/*Line 313 - 'AtomPromise.js' */            return myXhr;
/*Line 314 - 'AtomPromise.js' */        };
/*Line 315 - 'AtomPromise.js' */        o.cache = false;
/*Line 316 - 'AtomPromise.js' */        o.contentType = false;
/*Line 317 - 'AtomPromise.js' */        o.processData = false;
/*Line 318 - 'AtomPromise.js' */    }

/*Line 320 - 'AtomPromise.js' */    if (query) {
/*Line 321 - 'AtomPromise.js' */        var q = {};
/*Line 322 - 'AtomPromise.js' */        if (!o.sendRawQueryString) {
/*Line 323 - 'AtomPromise.js' */            for (var k in query) {
/*Line 324 - 'AtomPromise.js' */                var v = query[k];
/*Line 325 - 'AtomPromise.js' */                if (v && ((typeof v) === "object")) {
/*Line 326 - 'AtomPromise.js' */                    v = JSON.stringify(AtomBinder.getClone(v));
/*Line 327 - 'AtomPromise.js' */                    if (v === undefined)
/*Line 328 - 'AtomPromise.js' */                        continue;
/*Line 329 - 'AtomPromise.js' */                    if (v === null)
/*Line 330 - 'AtomPromise.js' */                        continue;
/*Line 331 - 'AtomPromise.js' */                }
/*Line 332 - 'AtomPromise.js' */                q[k] = v;
/*Line 333 - 'AtomPromise.js' */            }
/*Line 334 - 'AtomPromise.js' */        }
/*Line 335 - 'AtomPromise.js' */        u = Atom.url(url, q);
/*Line 336 - 'AtomPromise.js' */    }

/*Line 338 - 'AtomPromise.js' */    if (url) {
/*Line 339 - 'AtomPromise.js' */        p.onInvoke(function () {
/*Line 340 - 'AtomPromise.js' */            p.handle = $.ajax(u, o);
/*Line 341 - 'AtomPromise.js' */        });
/*Line 342 - 'AtomPromise.js' */    }

/*Line 344 - 'AtomPromise.js' */    p.failed(function () {

/*Line 346 - 'AtomPromise.js' */        var res = p.errors[0].responseText;
/*Line 347 - 'AtomPromise.js' */        if (!res || p.errors[2] !== 'Internal Server Error') {
/*Line 348 - 'AtomPromise.js' */            res = p.errors[2];
/*Line 349 - 'AtomPromise.js' */        }

/*Line 351 - 'AtomPromise.js' */        p.error = {
/*Line 352 - 'AtomPromise.js' */            msg : res
/*Line 353 - 'AtomPromise.js' */        };

/*Line 355 - 'AtomPromise.js' */        if (p._showError) {
/*Line 356 - 'AtomPromise.js' */            if (p.error.msg) Atom.alert(p.error.msg);
/*Line 357 - 'AtomPromise.js' */        }
/*Line 358 - 'AtomPromise.js' */    });

/*Line 360 - 'AtomPromise.js' */    p.then(function (p) {
/*Line 361 - 'AtomPromise.js' */        var v = p.value();
/*Line 362 - 'AtomPromise.js' */        v = AtomPromise.parseDates(v);
/*Line 363 - 'AtomPromise.js' */        if (v && v.items && v.merge) {
/*Line 364 - 'AtomPromise.js' */            v.items.total = v.total;
/*Line 365 - 'AtomPromise.js' */            v = v.items;
/*Line 366 - 'AtomPromise.js' */            p.value(v);
/*Line 367 - 'AtomPromise.js' */        }
/*Line 368 - 'AtomPromise.js' */    });

/*Line 370 - 'AtomPromise.js' */    p.showError(true);
/*Line 371 - 'AtomPromise.js' */    p.showProgress(true);

/*Line 373 - 'AtomPromise.js' */    return p;
/*Line 374 - 'AtomPromise.js' */};

/*Line 376 - 'AtomPromise.js' */AtomPromise.get = function (url, query, options) {
/*Line 377 - 'AtomPromise.js' */    options = options || {};
/*Line 378 - 'AtomPromise.js' */    options.type = options.type || "get";
/*Line 379 - 'AtomPromise.js' */    options.dataType = options.dataType || "text";
/*Line 380 - 'AtomPromise.js' */    return AtomPromise.ajax(url, query, options, "get");
/*Line 381 - 'AtomPromise.js' */};

/*Line 383 - 'AtomPromise.js' */AtomPromise.plugins = {
/*Line 384 - 'AtomPromise.js' */};

/*Line 386 - 'AtomPromise.js' */AtomPromise.json = function (url, query, options) {
/*Line 387 - 'AtomPromise.js' */    options = options || {};
/*Line 388 - 'AtomPromise.js' */    options.type = options.type || "get";
/*Line 389 - 'AtomPromise.js' */    options.dataType = options.dataType || "json";

/*Line 391 - 'AtomPromise.js' */    var method = null;

/*Line 393 - 'AtomPromise.js' */    var i = url.indexOf('://');
/*Line 394 - 'AtomPromise.js' */    if (i !== -1) {
/*Line 395 - 'AtomPromise.js' */        var plugin = url.substr(0, i);
/*Line 396 - 'AtomPromise.js' */        if (!/http|https/i.test(plugin)) {
/*Line 397 - 'AtomPromise.js' */            url = url.substr(i + 3);
/*Line 398 - 'AtomPromise.js' */            method = AtomPromise.plugins[plugin];
/*Line 399 - 'AtomPromise.js' */        }
/*Line 400 - 'AtomPromise.js' */    }

/*Line 402 - 'AtomPromise.js' */    method = method || AtomPromise.ajax;

/*Line 404 - 'AtomPromise.js' */    return method(url, query, options, "json");
/*Line 405 - 'AtomPromise.js' */};

/*Line 407 - 'AtomPromise.js' */AtomPromise.cache = {
/*Line 408 - 'AtomPromise.js' */};

/*Line 410 - 'AtomPromise.js' */AtomPromise.cacheInProgress = {
/*Line 411 - 'AtomPromise.js' */};

/*Line 413 - 'AtomPromise.js' */AtomPromise.cachedPromise = function (key, p) {
/*Line 414 - 'AtomPromise.js' */    var c = AtomPromise.cache[key];

/*Line 416 - 'AtomPromise.js' */    if (!c && window.sessionStorage) {
/*Line 417 - 'AtomPromise.js' */        c = window.sessionStorage["__AP" + key];
/*Line 418 - 'AtomPromise.js' */        if (c) {
/*Line 419 - 'AtomPromise.js' */            c = JSON.parse(c);
/*Line 420 - 'AtomPromise.js' */            AtomPromise.cache[key] = c;
/*Line 421 - 'AtomPromise.js' */        }
/*Line 422 - 'AtomPromise.js' */    }

/*Line 424 - 'AtomPromise.js' */    if (c) {
/*Line 425 - 'AtomPromise.js' */        p.onInvoke(function () {
/*Line 426 - 'AtomPromise.js' */            p.pushValue(c);
/*Line 427 - 'AtomPromise.js' */        });
/*Line 428 - 'AtomPromise.js' */        return p;
/*Line 429 - 'AtomPromise.js' */    }

/*Line 431 - 'AtomPromise.js' */    p.then(function (p1) {
/*Line 432 - 'AtomPromise.js' */        AtomPromise.cache[key] = p1.value();
/*Line 433 - 'AtomPromise.js' */        if (window.sessionStorage) {
/*Line 434 - 'AtomPromise.js' */            window.sessionStorage["__AP" + key] = JSON.stringify( p1.value() );
/*Line 435 - 'AtomPromise.js' */        }
/*Line 436 - 'AtomPromise.js' */    });

/*Line 438 - 'AtomPromise.js' */    return p;
/*Line 439 - 'AtomPromise.js' */};

/*Line 441 - 'AtomPromise.js' */AtomPromise.cachedJson = function (url, query, options) {

/*Line 443 - 'AtomPromise.js' */    var vd = new Date();

/*Line 445 - 'AtomPromise.js' */    var v = AtomConfig.ajax.version;
/*Line 446 - 'AtomPromise.js' */    var vk = AtomConfig.ajax.versionKey + '=' + v;

/*Line 448 - 'AtomPromise.js' */    if (url.indexOf('?') === -1) {
/*Line 449 - 'AtomPromise.js' */        vk = '?' + vk;
/*Line 450 - 'AtomPromise.js' */    } else {
/*Line 451 - 'AtomPromise.js' */        if (!/\&$/.test(url)) {
/*Line 452 - 'AtomPromise.js' */            vk = '&' + vk;
/*Line 453 - 'AtomPromise.js' */        }
/*Line 454 - 'AtomPromise.js' */    }
/*Line 455 - 'AtomPromise.js' */    url += vk;

/*Line 457 - 'AtomPromise.js' */    options = options || {};
/*Line 458 - 'AtomPromise.js' */    // caching must be true everywhere
/*Line 459 - 'AtomPromise.js' */    options.cache = true;
/*Line 460 - 'AtomPromise.js' */    options.ifModified = true;
/*Line 461 - 'AtomPromise.js' */    options.versionUrl = false;

/*Line 463 - 'AtomPromise.js' */    var ap = AtomPromise.ajax(url, query, options, "json");
/*Line 464 - 'AtomPromise.js' */    return AtomPromise.cachedPromise(url, ap);
/*Line 465 - 'AtomPromise.js' */};

/*Line 467 - 'AtomPromise.js' */AtomPromise.configCache = {};

/*Line 469 - 'AtomPromise.js' */AtomPromise.configLabel = function (url, value, options) {

/*Line 471 - 'AtomPromise.js' */    if (value === null || value === undefined)
/*Line 472 - 'AtomPromise.js' */        return "";

/*Line 474 - 'AtomPromise.js' */    options = options || {};

/*Line 476 - 'AtomPromise.js' */    var valuePath = options.valuePath || "value";
/*Line 477 - 'AtomPromise.js' */    var labelPath = options.labelPath || "label";
/*Line 478 - 'AtomPromise.js' */    var isNumber = options.isNumber || false;

/*Line 480 - 'AtomPromise.js' */    if (isNumber) {
/*Line 481 - 'AtomPromise.js' */        if (typeof value !== "number") {
/*Line 482 - 'AtomPromise.js' */            value = parseFloat(value);
/*Line 483 - 'AtomPromise.js' */        }
/*Line 484 - 'AtomPromise.js' */    }

/*Line 486 - 'AtomPromise.js' */    var p = new AtomPromise();
/*Line 487 - 'AtomPromise.js' */    p.onInvoke(function () {

/*Line 489 - 'AtomPromise.js' */        var cf = AtomPromise.configCache[url];
/*Line 490 - 'AtomPromise.js' */        if (cf) {
/*Line 491 - 'AtomPromise.js' */            cf = cf[value];
/*Line 492 - 'AtomPromise.js' */            cf = cf ? cf[labelPath] : "";
/*Line 493 - 'AtomPromise.js' */            p.pushValue(cf);
/*Line 494 - 'AtomPromise.js' */            return;
/*Line 495 - 'AtomPromise.js' */        }

/*Line 497 - 'AtomPromise.js' */        var ap = AtomPromise.cachedJson(url);


/*Line 500 - 'AtomPromise.js' */        ap.then(function (a) {
/*Line 501 - 'AtomPromise.js' */            var v = "";

/*Line 503 - 'AtomPromise.js' */            var nv = {};

/*Line 505 - 'AtomPromise.js' */            var ae = new AtomEnumerator(a.value());
/*Line 506 - 'AtomPromise.js' */            while (ae.next()) {
/*Line 507 - 'AtomPromise.js' */                var item = ae.current();
/*Line 508 - 'AtomPromise.js' */                v = item[valuePath];
/*Line 509 - 'AtomPromise.js' */                if (isNumber) {
/*Line 510 - 'AtomPromise.js' */                    if (typeof v !== "number") {
/*Line 511 - 'AtomPromise.js' */                        v = parseFloat(v);
/*Line 512 - 'AtomPromise.js' */                    }
/*Line 513 - 'AtomPromise.js' */                }
/*Line 514 - 'AtomPromise.js' */                nv[v] = item;
/*Line 515 - 'AtomPromise.js' */            }
/*Line 516 - 'AtomPromise.js' */            AtomPromise.configCache[url] = nv;
/*Line 517 - 'AtomPromise.js' */            nv = nv[value];
/*Line 518 - 'AtomPromise.js' */            nv = nv ? nv[labelPath] : "";
/*Line 519 - 'AtomPromise.js' */            p.pushValue(nv);
/*Line 520 - 'AtomPromise.js' */        });

/*Line 522 - 'AtomPromise.js' */        ap.invoke();
/*Line 523 - 'AtomPromise.js' */    });

/*Line 525 - 'AtomPromise.js' */    return p;
/*Line 526 - 'AtomPromise.js' */};

/*Line 528 - 'AtomPromise.js' */AtomPromise.prototype.insertItem = function (index, item, arrayPath) {
/*Line 529 - 'AtomPromise.js' */    return this.then(function (p) {
/*Line 530 - 'AtomPromise.js' */        var v = p.value();
/*Line 531 - 'AtomPromise.js' */        if (v._$_itemInserted)
/*Line 532 - 'AtomPromise.js' */            return;
/*Line 533 - 'AtomPromise.js' */        if (arrayPath) {
/*Line 534 - 'AtomPromise.js' */            v = v[arrayPath];
/*Line 535 - 'AtomPromise.js' */        }
/*Line 536 - 'AtomPromise.js' */        if (index === -1) {
/*Line 537 - 'AtomPromise.js' */            v.push(item);
/*Line 538 - 'AtomPromise.js' */        } else {
/*Line 539 - 'AtomPromise.js' */            v.splice(index || 0, 0, item);
/*Line 540 - 'AtomPromise.js' */        }
/*Line 541 - 'AtomPromise.js' */        v._$_itemInserted = true;        
/*Line 542 - 'AtomPromise.js' */    });
/*Line 543 - 'AtomPromise.js' */};
/*Line 544 - 'AtomPromise.js' *///$setValue = AtomBinder.setValue;
/*Line 545 - 'AtomPromise.js' *///$getValue = AtomBinder.getValue;


/*Line 548 - 'AtomPromise.js' *///Object.prototype.setValue = function (key, value) {
/*Line 549 - 'AtomPromise.js' *///    
/*Line 550 - 'AtomPromise.js' *///    AtomBinder.setValue(this, key, value);
/*Line 551 - 'AtomPromise.js' *///};

/*Line 553 - 'AtomPromise.js' *///Object.prototype.getValue = function (key) {
/*Line 554 - 'AtomPromise.js' *///    return AtomBinder.getValue(this, key);
/*Line 555 - 'AtomPromise.js' *///};

/*Line 557 - 'AtomPromise.js' *///Object.prototype.add_WatchHandler = function(key,handler){
/*Line 558 - 'AtomPromise.js' *///    AtomBinder.add_WatchHandler(this,key,handler);
/*Line 559 - 'AtomPromise.js' *///};

/*Line 561 - 'AtomPromise.js' *///Object.prototype.remove_WatchHandler = function(key,handler){
/*Line 562 - 'AtomPromise.js' *///    AtomBinder.remove_WatchHandler(this,key,handler);
/*Line 563 - 'AtomPromise.js' *///};

/*Line 565 - 'AtomPromise.js' *///Array.prototype.add = function (item) {
/*Line 566 - 'AtomPromise.js' *///    AtomBinder.addItem(this, item);
/*Line 567 - 'AtomPromise.js' *///};

/*Line 569 - 'AtomPromise.js' *///Array.prototype.remove = function (item) {
/*Line 570 - 'AtomPromise.js' *///    AtomBinder.removeItem(this, item);
/*Line 571 - 'AtomPromise.js' *///};

/*Line 573 - 'AtomPromise.js' *///Array.prototype.add_CollectionHandler= function(handler){
/*Line 574 - 'AtomPromise.js' *///    AtomBinder.add_CollectionHandler(this,handler);
/*Line 575 - 'AtomPromise.js' *///};

/*Line 577 - 'AtomPromise.js' *///Array.prototype.remove_CollectionHandler= function(handler){
/*Line 578 - 'AtomPromise.js' *///    AtomBinder.remove_CollectionHandler(this,handler);
/*Line 579 - 'AtomPromise.js' *///};


/*Line 582 - 'AtomPromise.js' */var AtomLocalStorage = {

/*Line 584 - 'AtomPromise.js' */    list: function (storage, query)
/*Line 585 - 'AtomPromise.js' */    {
/*Line 586 - 'AtomPromise.js' */    },
/*Line 587 - 'AtomPromise.js' */    add: function (storage, query) {
/*Line 588 - 'AtomPromise.js' */    },
/*Line 589 - 'AtomPromise.js' */    remove: function (storage, query) {
/*Line 590 - 'AtomPromise.js' */    },
/*Line 591 - 'AtomPromise.js' */    clear: function (storage) {
/*Line 592 - 'AtomPromise.js' */    },
/*Line 593 - 'AtomPromise.js' */    set: function (storage, query, data) {
/*Line 594 - 'AtomPromise.js' */    },
/*Line 595 - 'AtomPromise.js' */    get: function (storage, query) {
/*Line 596 - 'AtomPromise.js' */    }

/*Line 598 - 'AtomPromise.js' */};


/*Line 601 - 'AtomPromise.js' */AtomPromise.plugins["local-storage"] = function (url, query, options) {
/*Line 602 - 'AtomPromise.js' */    var tokens = url.split('/');
/*Line 603 - 'AtomPromise.js' */    var storage = tokens[0];
/*Line 604 - 'AtomPromise.js' */    var method = tokens[1];
/*Line 605 - 'AtomPromise.js' */    var ap = new AtomPromise();
/*Line 606 - 'AtomPromise.js' */    ap.onInvoke(function (a) {
/*Line 607 - 'AtomPromise.js' */        var als = AtomLocalStorage;
/*Line 608 - 'AtomPromise.js' */        var r = als[method](storage, query, options.data);
/*Line 609 - 'AtomPromise.js' */        a.pushValue(r);
/*Line 610 - 'AtomPromise.js' */    });
/*Line 611 - 'AtomPromise.js' */    return ap;
/*Line 612 - 'AtomPromise.js' */};
/*Line 0 - 'AtomBinding.js' */
/*Line 1 - 'AtomBinding.js' */

/*Line 3 - 'AtomBinding.js' */(function (window, baseType) {
/*Line 4 - 'AtomBinding.js' */    return classCreatorEx({
/*Line 5 - 'AtomBinding.js' */        name: "WebAtoms.AtomBinding",
/*Line 6 - 'AtomBinding.js' */        base: baseType,
/*Line 7 - 'AtomBinding.js' */        start: function (control, element, key, path, twoWays, jq, vf, events) {
/*Line 8 - 'AtomBinding.js' */            this.element = element;
/*Line 9 - 'AtomBinding.js' */            this.control = control;
/*Line 10 - 'AtomBinding.js' */            this.vf = vf;
/*Line 11 - 'AtomBinding.js' */            this.key = key;
/*Line 12 - 'AtomBinding.js' */            this.events = events;

/*Line 14 - 'AtomBinding.js' */            if (path && path.constructor != String) {
/*Line 15 - 'AtomBinding.js' */                this.pathList = [];
/*Line 16 - 'AtomBinding.js' */                this.path = null;

/*Line 18 - 'AtomBinding.js' */                var ae = new AtomEnumerator(path);
/*Line 19 - 'AtomBinding.js' */                while (ae.next()) {
/*Line 20 - 'AtomBinding.js' */                    var pe = new AtomEnumerator(ae.current());
/*Line 21 - 'AtomBinding.js' */                    var p = [];
/*Line 22 - 'AtomBinding.js' */                    while (pe.next()) {
/*Line 23 - 'AtomBinding.js' */                        p.push({ path: pe.current(), value: null });
/*Line 24 - 'AtomBinding.js' */                    }
/*Line 25 - 'AtomBinding.js' */                    this.pathList.push(p);
/*Line 26 - 'AtomBinding.js' */                }

/*Line 28 - 'AtomBinding.js' */            } else {
/*Line 29 - 'AtomBinding.js' */                var ae = new AtomEnumerator(path.split("."));
/*Line 30 - 'AtomBinding.js' */                this.path = [];
/*Line 31 - 'AtomBinding.js' */                while (ae.next()) {
/*Line 32 - 'AtomBinding.js' */                    this.path.push({ path: ae.current(), value: null });
/*Line 33 - 'AtomBinding.js' */                }
/*Line 34 - 'AtomBinding.js' */            }
/*Line 35 - 'AtomBinding.js' */            this.twoWays = twoWays;
/*Line 36 - 'AtomBinding.js' */            this.jq = jq;
/*Line 37 - 'AtomBinding.js' */            this._isUpdating = false;
/*Line 38 - 'AtomBinding.js' */        },
/*Line 39 - 'AtomBinding.js' */        methods: {
/*Line 40 - 'AtomBinding.js' */            onPropChanged: function (sender, key) {
/*Line 41 - 'AtomBinding.js' */                // update target....
/*Line 42 - 'AtomBinding.js' */                // most like end of path...
/*Line 43 - 'AtomBinding.js' */                if (this.path == null || this.path.length == 0)
/*Line 44 - 'AtomBinding.js' */                    return;
/*Line 45 - 'AtomBinding.js' */                var ae = new AtomEnumerator(this.path);
/*Line 46 - 'AtomBinding.js' */                var obj = this.control;
/*Line 47 - 'AtomBinding.js' */                var objKey = null;
/*Line 48 - 'AtomBinding.js' */                while (ae.next()) {
/*Line 49 - 'AtomBinding.js' */                    objKey = ae.current();
/*Line 50 - 'AtomBinding.js' */                    objKey.value = obj;
/*Line 51 - 'AtomBinding.js' */                    if (!obj)
/*Line 52 - 'AtomBinding.js' */                        return;
/*Line 53 - 'AtomBinding.js' */                    if (!ae.isLast())
/*Line 54 - 'AtomBinding.js' */                        obj = AtomBinder.getValue(obj, objKey.path);
/*Line 55 - 'AtomBinding.js' */                }
/*Line 56 - 'AtomBinding.js' */                var value = null;
/*Line 57 - 'AtomBinding.js' */                if (this.jq) {
/*Line 58 - 'AtomBinding.js' */                    switch (this.key) {
/*Line 59 - 'AtomBinding.js' */                        case "valueAsDate":
/*Line 60 - 'AtomBinding.js' */                            value = this.element.valueAsDate;
/*Line 61 - 'AtomBinding.js' */                            break;
/*Line 62 - 'AtomBinding.js' */                        case "checked":
/*Line 63 - 'AtomBinding.js' */                            value = this.element.checked ? true : false;
/*Line 64 - 'AtomBinding.js' */                            break;
/*Line 65 - 'AtomBinding.js' */                        default:
/*Line 66 - 'AtomBinding.js' */                            value = $(this.element).val();
/*Line 67 - 'AtomBinding.js' */                    }
/*Line 68 - 'AtomBinding.js' */                } else {
/*Line 69 - 'AtomBinding.js' */                    value = AtomBinder.getValue(this.control, this.key);
/*Line 70 - 'AtomBinding.js' */                }
/*Line 71 - 'AtomBinding.js' */                AtomBinder.setValue(obj, objKey.path, value);
/*Line 72 - 'AtomBinding.js' */            },
/*Line 73 - 'AtomBinding.js' */            onDataChanged: function (sender, key) {
/*Line 74 - 'AtomBinding.js' */                if (this._isUpdating)
/*Line 75 - 'AtomBinding.js' */                    return;

/*Line 77 - 'AtomBinding.js' */                // called by jquery while posting an ajax request...
/*Line 78 - 'AtomBinding.js' */                if (arguments === undefined || arguments.length == 0)
/*Line 79 - 'AtomBinding.js' */                    return;

/*Line 81 - 'AtomBinding.js' */                var ae;
/*Line 82 - 'AtomBinding.js' */                var target = this.control;
/*Line 83 - 'AtomBinding.js' */                if (this.pathList) {
/*Line 84 - 'AtomBinding.js' */                    var newTarget = [];
/*Line 85 - 'AtomBinding.js' */                    ae = new AtomEnumerator(this.pathList);
/*Line 86 - 'AtomBinding.js' */                    while (ae.next()) {
/*Line 87 - 'AtomBinding.js' */                        newTarget.push(this.evaluate(target, ae.current()));
/*Line 88 - 'AtomBinding.js' */                    }
/*Line 89 - 'AtomBinding.js' */                    ae = new AtomEnumerator(newTarget);
/*Line 90 - 'AtomBinding.js' */                    while (ae.next()) {
/*Line 91 - 'AtomBinding.js' */                        if (ae.current() === undefined)
/*Line 92 - 'AtomBinding.js' */                            return;
/*Line 93 - 'AtomBinding.js' */                    }
/*Line 94 - 'AtomBinding.js' */                    this.setValue(newTarget);
/*Line 95 - 'AtomBinding.js' */                } else {
/*Line 96 - 'AtomBinding.js' */                    var path = this.path;
/*Line 97 - 'AtomBinding.js' */                    var newTarget = this.evaluate(target, path);
/*Line 98 - 'AtomBinding.js' */                    if (newTarget !== undefined)
/*Line 99 - 'AtomBinding.js' */                        this.setValue(newTarget);
/*Line 100 - 'AtomBinding.js' */                }
/*Line 101 - 'AtomBinding.js' */            },

/*Line 103 - 'AtomBinding.js' */            evaluate: function (target, path) {
/*Line 104 - 'AtomBinding.js' */                var newTarget = null;
/*Line 105 - 'AtomBinding.js' */                var property = null;
/*Line 106 - 'AtomBinding.js' */                var ae = new AtomEnumerator(path);

/*Line 108 - 'AtomBinding.js' */                // first remove old handlers...
/*Line 109 - 'AtomBinding.js' */                var remove = false;
/*Line 110 - 'AtomBinding.js' */                while (target && ae.next()) {
/*Line 111 - 'AtomBinding.js' */                    property = ae.current();
/*Line 112 - 'AtomBinding.js' */                    newTarget = AtomBinder.getValue(target, property.path);

/*Line 114 - 'AtomBinding.js' */                    if (!(/scope|appScope|atomParent|templateParent|localScope/gi.test(property.path))) {
/*Line 115 - 'AtomBinding.js' */                        var _this = this;
/*Line 116 - 'AtomBinding.js' */                        if (!property.value) {
/*Line 117 - 'AtomBinding.js' */                            this.bindEvent(target, "WatchHandler", "onDataChanged", property.path);
/*Line 118 - 'AtomBinding.js' */                            //this.bindEvent(target, "WatchHandler", function () {
/*Line 119 - 'AtomBinding.js' */                            //    _this.onDataChanged.apply(_this, arguments);
/*Line 120 - 'AtomBinding.js' */                            //}, property.path);
/*Line 121 - 'AtomBinding.js' */                        } else if (property.value != target) {
/*Line 122 - 'AtomBinding.js' */                            this.unbindEvent(property.value, "WatchHandler", null, property.path);
/*Line 123 - 'AtomBinding.js' */                            this.bindEvent(target, "WatchHandler", "onDataChanged", property.path);
/*Line 124 - 'AtomBinding.js' */                            //this.bindEvent(target, "WatchHandler", function () {
/*Line 125 - 'AtomBinding.js' */                            //    _this.onDataChanged.apply(_this, arguments);
/*Line 126 - 'AtomBinding.js' */                            //}, property.path);
/*Line 127 - 'AtomBinding.js' */                        }
/*Line 128 - 'AtomBinding.js' */                    }

/*Line 130 - 'AtomBinding.js' */                    property.value = target;
/*Line 131 - 'AtomBinding.js' */                    target = newTarget;
/*Line 132 - 'AtomBinding.js' */                }
/*Line 133 - 'AtomBinding.js' */                if (newTarget === undefined && AtomConfig.debug) {
/*Line 134 - 'AtomBinding.js' */                    log('Undefined:' + this.control._element.id + ' -> ' + ($.map(path, function (a) { return a.path; })).join('.'));
/*Line 135 - 'AtomBinding.js' */                }
/*Line 136 - 'AtomBinding.js' */                return newTarget;
/*Line 137 - 'AtomBinding.js' */            },

/*Line 139 - 'AtomBinding.js' */            onValChanged: function () {
/*Line 140 - 'AtomBinding.js' */                this.onPropChanged(null, null);
/*Line 141 - 'AtomBinding.js' */            },
/*Line 142 - 'AtomBinding.js' */            setup: function () {
/*Line 143 - 'AtomBinding.js' */                if (this.twoWays) {
/*Line 144 - 'AtomBinding.js' */                    if (this.jq) {
/*Line 145 - 'AtomBinding.js' */                        this.bindEvent(this.element, "change", "onValChanged");
/*Line 146 - 'AtomBinding.js' */                        if (this.events) {
/*Line 147 - 'AtomBinding.js' */                            var list = new AtomEnumerator(this.events.split(","));
/*Line 148 - 'AtomBinding.js' */                            while (list.next()) {
/*Line 149 - 'AtomBinding.js' */                                this.bindEvent(this.element, list.current(), "onValChanged");
/*Line 150 - 'AtomBinding.js' */                            }
/*Line 151 - 'AtomBinding.js' */                        }
/*Line 152 - 'AtomBinding.js' */                    } else {
/*Line 153 - 'AtomBinding.js' */                        this.bindEvent(this.control, "WatchHandler", "onPropChanged", this.key);
/*Line 154 - 'AtomBinding.js' */                    }
/*Line 155 - 'AtomBinding.js' */                }

/*Line 157 - 'AtomBinding.js' */                this.onDataChanged(this, null);

/*Line 159 - 'AtomBinding.js' */            },

/*Line 161 - 'AtomBinding.js' */            setValue: function (value) {

/*Line 163 - 'AtomBinding.js' */                if (!this.pathList && this.vf) {
/*Line 164 - 'AtomBinding.js' */                    value = [value];
/*Line 165 - 'AtomBinding.js' */                }

/*Line 167 - 'AtomBinding.js' */                if (this.vf) {
/*Line 168 - 'AtomBinding.js' */                    value.push(Atom);
/*Line 169 - 'AtomBinding.js' */                    value.push(AtomPromise);
/*Line 170 - 'AtomBinding.js' */                    value = this.vf.apply(this, value);
/*Line 171 - 'AtomBinding.js' */                }

/*Line 173 - 'AtomBinding.js' */                if (value instanceof AtomPromise) {
/*Line 174 - 'AtomBinding.js' */                    value._persist = true;
/*Line 175 - 'AtomBinding.js' */                }

/*Line 177 - 'AtomBinding.js' */                this._lastValue = value;
/*Line 178 - 'AtomBinding.js' */                this._isUpdating = true;
/*Line 179 - 'AtomBinding.js' */                this.control.setLocalValue(this.key, value, this.element, true);
/*Line 180 - 'AtomBinding.js' */                this._isUpdating = false;
/*Line 181 - 'AtomBinding.js' */            }


/*Line 184 - 'AtomBinding.js' */        }
/*Line 185 - 'AtomBinding.js' */    });
/*Line 186 - 'AtomBinding.js' */})(window, WebAtoms.AtomComponent.prototype);
/*Line 0 - 'AtomDispatcher.js' */

/*Line 2 - 'AtomDispatcher.js' */var allControls = {
/*Line 3 - 'AtomDispatcher.js' */};

/*Line 5 - 'AtomDispatcher.js' */window.allControls = allControls;

/*Line 7 - 'AtomDispatcher.js' */(function (name, base) {
/*Line 8 - 'AtomDispatcher.js' */    return classCreator(name, base,
/*Line 9 - 'AtomDispatcher.js' */        function () {
/*Line 10 - 'AtomDispatcher.js' */            this._paused = false;
/*Line 11 - 'AtomDispatcher.js' */            this.queue = [];
/*Line 12 - 'AtomDispatcher.js' */            this.onTimeout = function () {
/*Line 13 - 'AtomDispatcher.js' */                if (this._paused)
/*Line 14 - 'AtomDispatcher.js' */                    return;
/*Line 15 - 'AtomDispatcher.js' */                if (this.queue.length == 0) {
/*Line 16 - 'AtomDispatcher.js' */                    var app = atomApplication._element;
/*Line 17 - 'AtomDispatcher.js' */                    if (app.style.visibility == "hidden" || $(app).css("visibility") == "hidden") {
/*Line 18 - 'AtomDispatcher.js' */                        app.style.visibility = "visible";

/*Line 20 - 'AtomDispatcher.js' */                        app.atomControl.updateUI();
/*Line 21 - 'AtomDispatcher.js' */                    }
/*Line 22 - 'AtomDispatcher.js' */                    return;
/*Line 23 - 'AtomDispatcher.js' */                }
/*Line 24 - 'AtomDispatcher.js' */                var item = this.queue.shift();
/*Line 25 - 'AtomDispatcher.js' */                //try{
/*Line 26 - 'AtomDispatcher.js' */                item();
/*Line 27 - 'AtomDispatcher.js' */                //} catch (ex) {

/*Line 29 - 'AtomDispatcher.js' */                //    if (window.console) {
/*Line 30 - 'AtomDispatcher.js' */                //        window.console.log(item.toString());
/*Line 31 - 'AtomDispatcher.js' */                //        window.console.log(JSON.stringify(ex));
/*Line 32 - 'AtomDispatcher.js' */                //    }
/*Line 33 - 'AtomDispatcher.js' */                //}
/*Line 34 - 'AtomDispatcher.js' */                window.setTimeout(this._onTimeout, 1);
/*Line 35 - 'AtomDispatcher.js' */            };
/*Line 36 - 'AtomDispatcher.js' */            //this._onTimeout = Function.createDelegate(this, this.onTimeout);
/*Line 37 - 'AtomDispatcher.js' */            var _this = this;
/*Line 38 - 'AtomDispatcher.js' */            this._onTimeout = function () {
/*Line 39 - 'AtomDispatcher.js' */                _this.onTimeout();
/*Line 40 - 'AtomDispatcher.js' */            };
/*Line 41 - 'AtomDispatcher.js' */        },
/*Line 42 - 'AtomDispatcher.js' */        {
/*Line 43 - 'AtomDispatcher.js' */            pause: function () {
/*Line 44 - 'AtomDispatcher.js' */                this._paused = true;
/*Line 45 - 'AtomDispatcher.js' */            },
/*Line 46 - 'AtomDispatcher.js' */            start: function () {
/*Line 47 - 'AtomDispatcher.js' */                this._paused = false;
/*Line 48 - 'AtomDispatcher.js' */                window.setTimeout(this._onTimeout, 1);
/*Line 49 - 'AtomDispatcher.js' */            },
/*Line 50 - 'AtomDispatcher.js' */            callLater: function (fn) {
/*Line 51 - 'AtomDispatcher.js' */                this.queue.push(fn);
/*Line 52 - 'AtomDispatcher.js' */                if (!this._paused)
/*Line 53 - 'AtomDispatcher.js' */                    this.start();
/*Line 54 - 'AtomDispatcher.js' */            },
/*Line 55 - 'AtomDispatcher.js' */            setupControls: function () {

/*Line 57 - 'AtomDispatcher.js' */                //if (window.console) {
/*Line 58 - 'AtomDispatcher.js' */                //    window.console.log("Starting Web Atoms");
/*Line 59 - 'AtomDispatcher.js' */                //}

/*Line 61 - 'AtomDispatcher.js' */                var a = $('[atom-type]').first()[0];
/*Line 62 - 'AtomDispatcher.js' */                if (a.atomControl != undefined && a.atomControl != null)
/*Line 63 - 'AtomDispatcher.js' */                    return;
/*Line 64 - 'AtomDispatcher.js' */                var ct = $(a).attr("atom-type");
/*Line 65 - 'AtomDispatcher.js' */                $(a).removeAttr("atom-type");
/*Line 66 - 'AtomDispatcher.js' */                var ctrl = new (WebAtoms[ct])(a);
/*Line 67 - 'AtomDispatcher.js' */                ctrl.setup();

/*Line 69 - 'AtomDispatcher.js' */            }
/*Line 70 - 'AtomDispatcher.js' */        }
/*Line 71 - 'AtomDispatcher.js' */        );
/*Line 72 - 'AtomDispatcher.js' */})("WebAtoms.AtomDispatcher",null);

/*Line 74 - 'AtomDispatcher.js' */WebAtoms.dispatcher = new WebAtoms.AtomDispatcher();

/*Line 0 - 'AtomUIComponent.js' */

/*Line 2 - 'AtomUIComponent.js' */(function (window, name, base) {
/*Line 3 - 'AtomUIComponent.js' */    return classCreator(name, base,
/*Line 4 - 'AtomUIComponent.js' */        function () {
/*Line 5 - 'AtomUIComponent.js' */        },
/*Line 6 - 'AtomUIComponent.js' */        {
/*Line 7 - 'AtomUIComponent.js' */            get_owner: function () {
/*Line 8 - 'AtomUIComponent.js' */                return this;
/*Line 9 - 'AtomUIComponent.js' */            },

/*Line 11 - 'AtomUIComponent.js' */            get_appScope: function () {
/*Line 12 - 'AtomUIComponent.js' */                return appScope;
/*Line 13 - 'AtomUIComponent.js' */            },

/*Line 15 - 'AtomUIComponent.js' */            get_scope: function () {
/*Line 16 - 'AtomUIComponent.js' */                if (this._scope === undefined) {
/*Line 17 - 'AtomUIComponent.js' */                    var ap = this.get_atomParent(this._element._logicalParent || this._element.parentNode);
/*Line 18 - 'AtomUIComponent.js' */                    if (ap) {
/*Line 19 - 'AtomUIComponent.js' */                        return ap._localScope || ap.get_scope();
/*Line 20 - 'AtomUIComponent.js' */                    }
/*Line 21 - 'AtomUIComponent.js' */                    else {
/*Line 22 - 'AtomUIComponent.js' */                        return appScope;
/*Line 23 - 'AtomUIComponent.js' */                    }
/*Line 24 - 'AtomUIComponent.js' */                }
/*Line 25 - 'AtomUIComponent.js' */                return this._scope;
/*Line 26 - 'AtomUIComponent.js' */            },

/*Line 28 - 'AtomUIComponent.js' */            get_localScope: function () {
/*Line 29 - 'AtomUIComponent.js' */                if (this._localScope === undefined) {
/*Line 30 - 'AtomUIComponent.js' */                    var ap = this.get_atomParent(this._element._logicalParent || this._element.parentNode);
/*Line 31 - 'AtomUIComponent.js' */                    if (ap) {
/*Line 32 - 'AtomUIComponent.js' */                        return ap.get_localScope();
/*Line 33 - 'AtomUIComponent.js' */                    } else {
/*Line 34 - 'AtomUIComponent.js' */                        throw new Error("Local Scope does not exist");
/*Line 35 - 'AtomUIComponent.js' */                    }
/*Line 36 - 'AtomUIComponent.js' */                }
/*Line 37 - 'AtomUIComponent.js' */                return this._localScope;
/*Line 38 - 'AtomUIComponent.js' */            },
/*Line 39 - 'AtomUIComponent.js' */            set_scope: function (v) {
/*Line 40 - 'AtomUIComponent.js' */                var scope = this.get_scope();
/*Line 41 - 'AtomUIComponent.js' */                for (var k in v) {
/*Line 42 - 'AtomUIComponent.js' */                    if (/^(application|owner|app|parent)$/gi.test(k))
/*Line 43 - 'AtomUIComponent.js' */                        throw new Error("Invalid name for the scope property");
/*Line 44 - 'AtomUIComponent.js' */                    // if value is already set...
/*Line 45 - 'AtomUIComponent.js' */                    if (scope[k])
/*Line 46 - 'AtomUIComponent.js' */                        continue;
/*Line 47 - 'AtomUIComponent.js' */                    scope[k] = v[k];
/*Line 48 - 'AtomUIComponent.js' */                }
/*Line 49 - 'AtomUIComponent.js' */            },

/*Line 51 - 'AtomUIComponent.js' */            get_name: function () {
/*Line 52 - 'AtomUIComponent.js' */                return this._name;
/*Line 53 - 'AtomUIComponent.js' */            },

/*Line 55 - 'AtomUIComponent.js' */            getTemplate: function (k) {

/*Line 57 - 'AtomUIComponent.js' */                var t = this["_" + k];
/*Line 58 - 'AtomUIComponent.js' */                if (t !== undefined && t !== null)
/*Line 59 - 'AtomUIComponent.js' */                    return t;

/*Line 61 - 'AtomUIComponent.js' */                // resolve...
/*Line 62 - 'AtomUIComponent.js' */                t = Templates.get(this.constructor, k);
/*Line 63 - 'AtomUIComponent.js' */                if (!t) {
/*Line 64 - 'AtomUIComponent.js' */                    return null;
/*Line 65 - 'AtomUIComponent.js' */                }
/*Line 66 - 'AtomUIComponent.js' */                this["_" + k] = t;
/*Line 67 - 'AtomUIComponent.js' */                return t;
/*Line 68 - 'AtomUIComponent.js' */            }
/*Line 69 - 'AtomUIComponent.js' */        },
/*Line 70 - 'AtomUIComponent.js' */        {
/*Line 71 - 'AtomUIComponent.js' */            next: null,
/*Line 72 - 'AtomUIComponent.js' */            value: undefined
/*Line 73 - 'AtomUIComponent.js' */        });
/*Line 74 - 'AtomUIComponent.js' */})(window, "WebAtoms.AtomUIComponent", WebAtoms.AtomComponent.prototype);


/*Line 77 - 'AtomUIComponent.js' */Templates.compiled = {
/*Line 78 - 'AtomUIComponent.js' */};

/*Line 80 - 'AtomUIComponent.js' */var document = window.document;

/*Line 82 - 'AtomUIComponent.js' */Templates.compileElement = function (e) {
/*Line 83 - 'AtomUIComponent.js' */    var ae = new AtomEnumerator(e);
/*Line 84 - 'AtomUIComponent.js' */    ae.next();
/*Line 85 - 'AtomUIComponent.js' */    var a = ae.current();
/*Line 86 - 'AtomUIComponent.js' */    var e1 = document.createElement(a);
/*Line 87 - 'AtomUIComponent.js' */    if (!ae.next())
/*Line 88 - 'AtomUIComponent.js' */        return e1;
/*Line 89 - 'AtomUIComponent.js' */    a = ae.current();
/*Line 90 - 'AtomUIComponent.js' */    if (a) {
/*Line 91 - 'AtomUIComponent.js' */        for (var k in a) {
/*Line 92 - 'AtomUIComponent.js' */            e1.setAttribute(k, a[k]);
/*Line 93 - 'AtomUIComponent.js' */        }
/*Line 94 - 'AtomUIComponent.js' */    }
    
/*Line 96 - 'AtomUIComponent.js' */    while (ae.next()) {
/*Line 97 - 'AtomUIComponent.js' */        a = ae.current();
/*Line 98 - 'AtomUIComponent.js' */        if (!a)
/*Line 99 - 'AtomUIComponent.js' */            break;
/*Line 100 - 'AtomUIComponent.js' */        if (a.constructor == String) {
/*Line 101 - 'AtomUIComponent.js' */            e1.appendChild(document.createTextNode(a));
/*Line 102 - 'AtomUIComponent.js' */        } else {
/*Line 103 - 'AtomUIComponent.js' */            e1.appendChild(Templates.compileElement(a));
/*Line 104 - 'AtomUIComponent.js' */        }
/*Line 105 - 'AtomUIComponent.js' */    }
/*Line 106 - 'AtomUIComponent.js' */    return e1;
/*Line 107 - 'AtomUIComponent.js' */};

/*Line 109 - 'AtomUIComponent.js' */Templates.compileJsonML = function (j) {

/*Line 111 - 'AtomUIComponent.js' */    if (j.length == 1)
/*Line 112 - 'AtomUIComponent.js' */        return Templates.compileElement(j[0]);

/*Line 114 - 'AtomUIComponent.js' */    var r = [];
/*Line 115 - 'AtomUIComponent.js' */    var ae = new AtomEnumerator(j);
/*Line 116 - 'AtomUIComponent.js' */    while (ae.next()) {
/*Line 117 - 'AtomUIComponent.js' */        r.push(Templates.compileElement(ae.current()));
/*Line 118 - 'AtomUIComponent.js' */    }
/*Line 119 - 'AtomUIComponent.js' */    return r;
/*Line 120 - 'AtomUIComponent.js' */};

/*Line 122 - 'AtomUIComponent.js' */Templates.compile = function (type, name, t) {

/*Line 124 - 'AtomUIComponent.js' */    var div = document.createElement("div");
/*Line 125 - 'AtomUIComponent.js' */    div.innerHTML = t;

/*Line 127 - 'AtomUIComponent.js' */    if ($(div).children().length == 1) {
/*Line 128 - 'AtomUIComponent.js' */        t = AtomUI.cloneNode((div.firstElementChild || div.children[0]));
/*Line 129 - 'AtomUIComponent.js' */    }

/*Line 131 - 'AtomUIComponent.js' */    return t;
/*Line 132 - 'AtomUIComponent.js' */};

/*Line 134 - 'AtomUIComponent.js' */Templates.get = function (type, k) {
/*Line 135 - 'AtomUIComponent.js' */    //var x = this.compileType(type);
/*Line 136 - 'AtomUIComponent.js' */    //return x[k];

/*Line 138 - 'AtomUIComponent.js' */    var name = type.__typeName + "." + k;
/*Line 139 - 'AtomUIComponent.js' */    var x = this.compiled[name];
/*Line 140 - 'AtomUIComponent.js' */    if (x)
/*Line 141 - 'AtomUIComponent.js' */        return x;
/*Line 142 - 'AtomUIComponent.js' */    x = Templates.jsonML[name];
/*Line 143 - 'AtomUIComponent.js' */    if (!x) {
/*Line 144 - 'AtomUIComponent.js' */        if (type.__baseType) {
/*Line 145 - 'AtomUIComponent.js' */            x = Templates.get(type.__baseType, k);
/*Line 146 - 'AtomUIComponent.js' */        }
/*Line 147 - 'AtomUIComponent.js' */    } else {
/*Line 148 - 'AtomUIComponent.js' */        x = Templates.compileJsonML(x);
/*Line 149 - 'AtomUIComponent.js' */    }
/*Line 150 - 'AtomUIComponent.js' */    if (!x)
/*Line 151 - 'AtomUIComponent.js' */        return null;
/*Line 152 - 'AtomUIComponent.js' */    this.compiled[name] = x;
/*Line 153 - 'AtomUIComponent.js' */    return x;

/*Line 155 - 'AtomUIComponent.js' */};

/*Line 157 - 'AtomUIComponent.js' */Templates.compileType = function (type) {

/*Line 159 - 'AtomUIComponent.js' */    var name = type.__typeName;
/*Line 160 - 'AtomUIComponent.js' */    var shortName = name.split(".");
/*Line 161 - 'AtomUIComponent.js' */    shortName = shortName[shortName.length - 1];

/*Line 163 - 'AtomUIComponent.js' */    var x = this.compiled[name];
/*Line 164 - 'AtomUIComponent.js' */    if (x)
/*Line 165 - 'AtomUIComponent.js' */        return x;

/*Line 167 - 'AtomUIComponent.js' */    x = {
/*Line 168 - 'AtomUIComponent.js' */    };

/*Line 170 - 'AtomUIComponent.js' */    var tl = this[name] || this[shortName];
/*Line 171 - 'AtomUIComponent.js' */    if (tl) {
/*Line 172 - 'AtomUIComponent.js' */        for (var t in tl) {
/*Line 173 - 'AtomUIComponent.js' */            x[t] = this.compile(type, t, tl[t]);
/*Line 174 - 'AtomUIComponent.js' */        }
/*Line 175 - 'AtomUIComponent.js' */    }

/*Line 177 - 'AtomUIComponent.js' */    if (type.__baseType) {
/*Line 178 - 'AtomUIComponent.js' */        var y = this.compileType(type.__baseType);
/*Line 179 - 'AtomUIComponent.js' */        for (var yt in y) {
/*Line 180 - 'AtomUIComponent.js' */            if (!x[yt]) {
/*Line 181 - 'AtomUIComponent.js' */                x[yt] = y[yt];
/*Line 182 - 'AtomUIComponent.js' */            }
/*Line 183 - 'AtomUIComponent.js' */        }
/*Line 184 - 'AtomUIComponent.js' */    }

/*Line 186 - 'AtomUIComponent.js' */    this.compiled[name] = x;

/*Line 188 - 'AtomUIComponent.js' */    var t = this;
/*Line 189 - 'AtomUIComponent.js' */    delete t[name];
/*Line 190 - 'AtomUIComponent.js' */    delete t[shortName];

/*Line 192 - 'AtomUIComponent.js' */    return x;
/*Line 193 - 'AtomUIComponent.js' */};
/*Line 0 - 'AtomControl.js' */
/*Line 1 - 'AtomControl.js' */
/*Line 2 - 'AtomControl.js' */
/*Line 3 - 'AtomControl.js' */


/*Line 6 - 'AtomControl.js' */// Binding Handlers
/*Line 7 - 'AtomControl.js' */var AtomBinders = {
/*Line 8 - 'AtomControl.js' */    "{": function (ctrl, key, value, element) {
/*Line 9 - 'AtomControl.js' */        value = value.substr(1, value.length - 2);
/*Line 10 - 'AtomControl.js' */        var be = AtomEvaluator.parse(value);
/*Line 11 - 'AtomControl.js' */        if (be.path) {
/*Line 12 - 'AtomControl.js' */            var ae = new AtomEnumerator(be.path);
/*Line 13 - 'AtomControl.js' */            value = [];
/*Line 14 - 'AtomControl.js' */            while (ae.next()) {
/*Line 15 - 'AtomControl.js' */                var pe = new AtomEnumerator(ae.current());
/*Line 16 - 'AtomControl.js' */                var v = ctrl;
/*Line 17 - 'AtomControl.js' */                while (pe.next()) {
/*Line 18 - 'AtomControl.js' */                    v = AtomBinder.getValue(v, pe.current());
/*Line 19 - 'AtomControl.js' */                }
/*Line 20 - 'AtomControl.js' */                value.push(v);
/*Line 21 - 'AtomControl.js' */            }
/*Line 22 - 'AtomControl.js' */        } else {
/*Line 23 - 'AtomControl.js' */            value = [value];
/*Line 24 - 'AtomControl.js' */        }
/*Line 25 - 'AtomControl.js' */        value.push(Atom);
/*Line 26 - 'AtomControl.js' */        value.push(AtomPromise);
/*Line 27 - 'AtomControl.js' */        value = be.method.apply(null, value);

/*Line 29 - 'AtomControl.js' */        ctrl.setLocalValue(key, value, element);
/*Line 30 - 'AtomControl.js' */    },
/*Line 31 - 'AtomControl.js' */    "[": function (ctrl, key, value, element) {
/*Line 32 - 'AtomControl.js' */        value = value.substr(1, value.length - 2);
/*Line 33 - 'AtomControl.js' */        var be = AtomEvaluator.parse(value);
/*Line 34 - 'AtomControl.js' */        if (be.length == 0) {
/*Line 35 - 'AtomControl.js' */            value = eval(value);
/*Line 36 - 'AtomControl.js' */            AtomBinder.setValue(ctrl, key, value);
/*Line 37 - 'AtomControl.js' */        } else {
/*Line 38 - 'AtomControl.js' */            if (be.length == 1 && be.path[0] == be.original) {
/*Line 39 - 'AtomControl.js' */                ctrl.bind(element, key, value, false);
/*Line 40 - 'AtomControl.js' */            }
/*Line 41 - 'AtomControl.js' */            else {
/*Line 42 - 'AtomControl.js' */                ctrl.bind(element, key, be.path, false, be.method);
/*Line 43 - 'AtomControl.js' */            }
/*Line 44 - 'AtomControl.js' */        }
/*Line 45 - 'AtomControl.js' */    },
/*Line 46 - 'AtomControl.js' */    "$[": function (ctrl, key, value, element) {
/*Line 47 - 'AtomControl.js' */        var l = value.lastIndexOf("]");
/*Line 48 - 'AtomControl.js' */        var events = null;
/*Line 49 - 'AtomControl.js' */        if (l < value.length - 1) {
/*Line 50 - 'AtomControl.js' */            events = value.substr(l + 2);
/*Line 51 - 'AtomControl.js' */            events = events.substr(0, events.length - 1);
/*Line 52 - 'AtomControl.js' */        }
/*Line 53 - 'AtomControl.js' */        value = value.substr(0, l);
/*Line 54 - 'AtomControl.js' */        value = value.substr(2);
/*Line 55 - 'AtomControl.js' */        if (/^(@|\$)/g.test(value)) {
/*Line 56 - 'AtomControl.js' */            value = value.substr(1);
/*Line 57 - 'AtomControl.js' */        }
/*Line 58 - 'AtomControl.js' */        ctrl.bind(element, key, value, true, null, events);
/*Line 59 - 'AtomControl.js' */    },
/*Line 60 - 'AtomControl.js' */    "^[": function (ctrl, key, value, element) {
/*Line 61 - 'AtomControl.js' */        value = value.substr(2, value.length - 3);
/*Line 62 - 'AtomControl.js' */        if (/^(@|\$)/g.test(value)) {
/*Line 63 - 'AtomControl.js' */            value = value.substr(1);
/*Line 64 - 'AtomControl.js' */        }
/*Line 65 - 'AtomControl.js' */        ctrl.bind(element, key, value, true, null, "keyup,keydown,keypress,blur");
/*Line 66 - 'AtomControl.js' */    }
/*Line 67 - 'AtomControl.js' */};

/*Line 69 - 'AtomControl.js' */// Property Handlers
/*Line 70 - 'AtomControl.js' */var AtomProperties = {
/*Line 71 - 'AtomControl.js' */    any: function (e, v, k) {
/*Line 72 - 'AtomControl.js' */        //$(e).attr(k, v);
/*Line 73 - 'AtomControl.js' */        e.setAttribute(k, v);
/*Line 74 - 'AtomControl.js' */    },
/*Line 75 - 'AtomControl.js' */    isEnabled: function(element,value){
/*Line 76 - 'AtomControl.js' */        if (value) {
/*Line 77 - 'AtomControl.js' */            $(element).removeAttr("disabled");
/*Line 78 - 'AtomControl.js' */        } else {
/*Line 79 - 'AtomControl.js' */            $(element).attr("disabled", "disabled");
/*Line 80 - 'AtomControl.js' */        }
/*Line 81 - 'AtomControl.js' */    },
/*Line 82 - 'AtomControl.js' */    checked: function (element, value) {
/*Line 83 - 'AtomControl.js' */        if (element.checked != value) {
/*Line 84 - 'AtomControl.js' */            element.checked = value ? true : false;
/*Line 85 - 'AtomControl.js' */        }
/*Line 86 - 'AtomControl.js' */    },
/*Line 87 - 'AtomControl.js' */    value: function (element, value) {
/*Line 88 - 'AtomControl.js' */        if (/date|datetime/gi.test(element.type)) {
/*Line 89 - 'AtomControl.js' */            element.valueAsDate = AtomDate.parse(value);
/*Line 90 - 'AtomControl.js' */        } else {
/*Line 91 - 'AtomControl.js' */            $(element).val(value);
/*Line 92 - 'AtomControl.js' */        }
/*Line 93 - 'AtomControl.js' */    },
/*Line 94 - 'AtomControl.js' */    valueAsDate: function (element, value) {
/*Line 95 - 'AtomControl.js' */        element.valueAsDate = AtomDate.parse(value);
/*Line 96 - 'AtomControl.js' */    },
/*Line 97 - 'AtomControl.js' */    text: function (element, value) {
/*Line 98 - 'AtomControl.js' */        //clears everything..
/*Line 99 - 'AtomControl.js' */        element.innerHTML = "";
/*Line 100 - 'AtomControl.js' */        var a = document.createTextNode(value);
/*Line 101 - 'AtomControl.js' */        element.appendChild(a);
/*Line 102 - 'AtomControl.js' */    },
/*Line 103 - 'AtomControl.js' */    html: function (element, value) {
/*Line 104 - 'AtomControl.js' */        element.innerHTML = value;
/*Line 105 - 'AtomControl.js' */    },
/*Line 106 - 'AtomControl.js' */    absPos: function (element, value) {
/*Line 107 - 'AtomControl.js' */        AtomProperties.setPosition(true, element, value);
/*Line 108 - 'AtomControl.js' */    },
/*Line 109 - 'AtomControl.js' */    relPos: function (element, value) {
/*Line 110 - 'AtomControl.js' */        AtomProperties.setPosition(false, element, value);
/*Line 111 - 'AtomControl.js' */    },
/*Line 112 - 'AtomControl.js' */    "class": function (element,value) {
/*Line 113 - 'AtomControl.js' */        if (element.atomClass) {
/*Line 114 - 'AtomControl.js' */            $(element).removeClass(element.atomClass);
/*Line 115 - 'AtomControl.js' */        }
/*Line 116 - 'AtomControl.js' */        if (value) {
/*Line 117 - 'AtomControl.js' */            value = AtomUI.createCss(value);
/*Line 118 - 'AtomControl.js' */            if (value) {
/*Line 119 - 'AtomControl.js' */                $(element).addClass(value);
/*Line 120 - 'AtomControl.js' */            }
/*Line 121 - 'AtomControl.js' */            element.atomClass = value;
/*Line 122 - 'AtomControl.js' */        }
/*Line 123 - 'AtomControl.js' */    },
/*Line 124 - 'AtomControl.js' */    setPosition: function (a, e, val) {
/*Line 125 - 'AtomControl.js' */        var l = val;

/*Line 127 - 'AtomControl.js' */        if (l.constructor == String) {
/*Line 128 - 'AtomControl.js' */            l = eval("[" + l + "]");
/*Line 129 - 'AtomControl.js' */        }

/*Line 131 - 'AtomControl.js' */        e.style.position = a ? 'absolute' : 'relative';

/*Line 133 - 'AtomControl.js' */        var left = l[0];
/*Line 134 - 'AtomControl.js' */        var top = l[1];

/*Line 136 - 'AtomControl.js' */        if (left !== null) {
/*Line 137 - 'AtomControl.js' */            e.style.left = left + "px";
/*Line 138 - 'AtomControl.js' */        }
/*Line 139 - 'AtomControl.js' */        if (top !== null) {
/*Line 140 - 'AtomControl.js' */            e.style.top = top + "px";
/*Line 141 - 'AtomControl.js' */        }
/*Line 142 - 'AtomControl.js' */        if (l.length > 2) {
/*Line 143 - 'AtomControl.js' */            var width = l[2];
/*Line 144 - 'AtomControl.js' */            var height = l[3];
/*Line 145 - 'AtomControl.js' */            if (width !== undefined && width !== null) {
/*Line 146 - 'AtomControl.js' */                e.style.width = width + "px";
/*Line 147 - 'AtomControl.js' */            }
/*Line 148 - 'AtomControl.js' */            if (height !== undefined && height !== null) {
/*Line 149 - 'AtomControl.js' */                e.style.height = height + "px";
/*Line 150 - 'AtomControl.js' */            }
/*Line 151 - 'AtomControl.js' */        }
/*Line 152 - 'AtomControl.js' */    }
/*Line 153 - 'AtomControl.js' */};

/*Line 155 - 'AtomControl.js' */window.AtomProperties = AtomProperties;

/*Line 157 - 'AtomControl.js' */(function (window, name, base) {


/*Line 160 - 'AtomControl.js' */    return classCreatorEx({
/*Line 161 - 'AtomControl.js' */        name: name,
/*Line 162 - 'AtomControl.js' */        base: base,
/*Line 163 - 'AtomControl.js' */        start: function (element) {
/*Line 164 - 'AtomControl.js' */            element.atomControl = this;
/*Line 165 - 'AtomControl.js' */            this._element = element;

/*Line 167 - 'AtomControl.js' */            this.dispatcher = WebAtoms.dispatcher;
/*Line 168 - 'AtomControl.js' */            this.bindings = [];
/*Line 169 - 'AtomControl.js' */            this._isVisible = true;

/*Line 171 - 'AtomControl.js' */            if (element.id && appScope) {
/*Line 172 - 'AtomControl.js' */                appScope[element.id] = this;
/*Line 173 - 'AtomControl.js' */            }
/*Line 174 - 'AtomControl.js' */            AtomUI.assignID(element);

/*Line 176 - 'AtomControl.js' */            allControls[element.id] = this;
/*Line 177 - 'AtomControl.js' */        },
/*Line 178 - 'AtomControl.js' */        properties: {
/*Line 179 - 'AtomControl.js' */            layout: null,
/*Line 180 - 'AtomControl.js' */            loadNext: null,
/*Line 181 - 'AtomControl.js' */            next: null,
/*Line 182 - 'AtomControl.js' */            merge: undefined,
/*Line 183 - 'AtomControl.js' */            value: undefined
/*Line 184 - 'AtomControl.js' */        },
/*Line 185 - 'AtomControl.js' */        methods: {
/*Line 186 - 'AtomControl.js' */            set_merge: function (v) {
/*Line 187 - 'AtomControl.js' */                this._mergeData2 = null;
/*Line 188 - 'AtomControl.js' */                if (!v)
/*Line 189 - 'AtomControl.js' */                    return;
/*Line 190 - 'AtomControl.js' */                var d = v.data;
/*Line 191 - 'AtomControl.js' */                if (d) {
/*Line 192 - 'AtomControl.js' */                    Atom.merge(this.get_data(), d, true);
/*Line 193 - 'AtomControl.js' */                    this._mergeData2 = d;
/*Line 194 - 'AtomControl.js' */                }
/*Line 195 - 'AtomControl.js' */                d = v.scope;
/*Line 196 - 'AtomControl.js' */                if (d) {
/*Line 197 - 'AtomControl.js' */                    Atom.merge(this.get_scope(), d, true);
/*Line 198 - 'AtomControl.js' */                }
/*Line 199 - 'AtomControl.js' */                d = v.appScope;
/*Line 200 - 'AtomControl.js' */                if (d) {
/*Line 201 - 'AtomControl.js' */                    Atom.merge(this.get_appScope(), d, true);
/*Line 202 - 'AtomControl.js' */                }
/*Line 203 - 'AtomControl.js' */                d = v.localScope;
/*Line 204 - 'AtomControl.js' */                if (d) {
/*Line 205 - 'AtomControl.js' */                    Atom.merge(this.get_localScope(), d, true);
/*Line 206 - 'AtomControl.js' */                }
/*Line 207 - 'AtomControl.js' */                d = v.owner;
/*Line 208 - 'AtomControl.js' */                if (d) {
/*Line 209 - 'AtomControl.js' */                    Atom.merge(this,d,true);
/*Line 210 - 'AtomControl.js' */                }
/*Line 211 - 'AtomControl.js' */            },
/*Line 212 - 'AtomControl.js' */            invokeAction: function (action, evt) {
/*Line 213 - 'AtomControl.js' */                if (!action)
/*Line 214 - 'AtomControl.js' */                    return;
/*Line 215 - 'AtomControl.js' */                if (action.constructor == String) {
/*Line 216 - 'AtomControl.js' */                    location.href = action;
/*Line 217 - 'AtomControl.js' */                }
/*Line 218 - 'AtomControl.js' */                else {

/*Line 220 - 'AtomControl.js' */                    var f = action;

/*Line 222 - 'AtomControl.js' */                    // is it atomControl?
/*Line 223 - 'AtomControl.js' */                    if (f.atomControl) {
/*Line 224 - 'AtomControl.js' */                        f = f.atomControl;
/*Line 225 - 'AtomControl.js' */                        if (f.refresh) {
/*Line 226 - 'AtomControl.js' */                            f.refresh(this.get_scope(), this);
/*Line 227 - 'AtomControl.js' */                        } else {
/*Line 228 - 'AtomControl.js' */                            Atom.alert("no default action defined");
/*Line 229 - 'AtomControl.js' */                        }
/*Line 230 - 'AtomControl.js' */                    } else {
/*Line 231 - 'AtomControl.js' */                        if (f._element) {
/*Line 232 - 'AtomControl.js' */                            f.refresh(this.get_scope(), this);
/*Line 233 - 'AtomControl.js' */                        } else {

/*Line 235 - 'AtomControl.js' */                            //is it function

/*Line 237 - 'AtomControl.js' */                            if ((typeof f) == 'function') {

/*Line 239 - 'AtomControl.js' */                                // invoke method...
/*Line 240 - 'AtomControl.js' */                                f(this.get_scope(), this, evt);
/*Line 241 - 'AtomControl.js' */                            } else {

/*Line 243 - 'AtomControl.js' */                                // it is an array...
/*Line 244 - 'AtomControl.js' */                                if (f.length) {
/*Line 245 - 'AtomControl.js' */                                    var ae = new AtomEnumerator(f);
/*Line 246 - 'AtomControl.js' */                                    while (ae.next()) {
/*Line 247 - 'AtomControl.js' */                                        this.invokeAction(ae.current(), evt);
/*Line 248 - 'AtomControl.js' */                                    }
/*Line 249 - 'AtomControl.js' */                                    return;
/*Line 250 - 'AtomControl.js' */                                }

/*Line 252 - 'AtomControl.js' */                                // identify scope and actions...
/*Line 253 - 'AtomControl.js' */                                var action = (f.timeOut || f.timeout);
/*Line 254 - 'AtomControl.js' */                                if (action) {
/*Line 255 - 'AtomControl.js' */                                    var _this = this;
/*Line 256 - 'AtomControl.js' */                                    var tm = 100;
/*Line 257 - 'AtomControl.js' */                                    if (action.hasOwnProperty("length")) {
/*Line 258 - 'AtomControl.js' */                                        if (action.length > 1) {
/*Line 259 - 'AtomControl.js' */                                            tm = action[0];
/*Line 260 - 'AtomControl.js' */                                            action = action[1];
/*Line 261 - 'AtomControl.js' */                                        }
/*Line 262 - 'AtomControl.js' */                                    }
/*Line 263 - 'AtomControl.js' */                                    setTimeout(function () {
/*Line 264 - 'AtomControl.js' */                                        _this.invokeAction(action);
/*Line 265 - 'AtomControl.js' */                                    }, tm);
/*Line 266 - 'AtomControl.js' */                                    return;
/*Line 267 - 'AtomControl.js' */                                }
/*Line 268 - 'AtomControl.js' */                                this.set_merge(f);
/*Line 269 - 'AtomControl.js' */                                action = f.confirm;
/*Line 270 - 'AtomControl.js' */                                if (action) {
/*Line 271 - 'AtomControl.js' */                                    var msg = "Are you sure?";
/*Line 272 - 'AtomControl.js' */                                    if (action.hasOwnProperty("length")) {
/*Line 273 - 'AtomControl.js' */                                        if (action.length > 1) {
/*Line 274 - 'AtomControl.js' */                                            msg = action[0];
/*Line 275 - 'AtomControl.js' */                                            action = action[1];
/*Line 276 - 'AtomControl.js' */                                        } else {
/*Line 277 - 'AtomControl.js' */                                            action = action[0];
/*Line 278 - 'AtomControl.js' */                                        }
/*Line 279 - 'AtomControl.js' */                                    }
/*Line 280 - 'AtomControl.js' */                                    var _this = this;
/*Line 281 - 'AtomControl.js' */                                    var _action = action;
/*Line 282 - 'AtomControl.js' */                                    var _evt = evt;
/*Line 283 - 'AtomControl.js' */                                    Atom.confirm(msg, function () {
/*Line 284 - 'AtomControl.js' */                                        _this.invokeAction(_action, _evt);
/*Line 285 - 'AtomControl.js' */                                    });
/*Line 286 - 'AtomControl.js' */                                }
/*Line 287 - 'AtomControl.js' */                                action = f.alert;
/*Line 288 - 'AtomControl.js' */                                if (action) {
/*Line 289 - 'AtomControl.js' */                                    Atom.alert(action);
/*Line 290 - 'AtomControl.js' */                                }
/*Line 291 - 'AtomControl.js' */                                action = f.next;
/*Line 292 - 'AtomControl.js' */                                if (action) {
/*Line 293 - 'AtomControl.js' */                                    this.invokeAction(action, evt);
/*Line 294 - 'AtomControl.js' */                                    return;
/*Line 295 - 'AtomControl.js' */                                }
/*Line 296 - 'AtomControl.js' */                                action = f.control;
/*Line 297 - 'AtomControl.js' */                                if (action) {
/*Line 298 - 'AtomControl.js' */                                    allControls[action].refresh();
/*Line 299 - 'AtomControl.js' */                                }

/*Line 301 - 'AtomControl.js' */                            }
/*Line 302 - 'AtomControl.js' */                        }
/*Line 303 - 'AtomControl.js' */                    }
/*Line 304 - 'AtomControl.js' */                }
/*Line 305 - 'AtomControl.js' */            },

/*Line 307 - 'AtomControl.js' */            refresh: function () {
/*Line 308 - 'AtomControl.js' */                // invoke some default action...!!!
/*Line 309 - 'AtomControl.js' */            },

/*Line 311 - 'AtomControl.js' */            get_element: function () {
/*Line 312 - 'AtomControl.js' */                return this._element;
/*Line 313 - 'AtomControl.js' */            },

/*Line 315 - 'AtomControl.js' */            clearBinding: function (element, key) {
/*Line 316 - 'AtomControl.js' */                var ae = new AtomEnumerator(this.bindings);
/*Line 317 - 'AtomControl.js' */                var item;
/*Line 318 - 'AtomControl.js' */                var removed = [];
/*Line 319 - 'AtomControl.js' */                while (ae.next()) {
/*Line 320 - 'AtomControl.js' */                    item = ae.current();
/*Line 321 - 'AtomControl.js' */                    if (element && item.element != element)
/*Line 322 - 'AtomControl.js' */                        continue;
/*Line 323 - 'AtomControl.js' */                    if (key && item.key != key)
/*Line 324 - 'AtomControl.js' */                        continue;
/*Line 325 - 'AtomControl.js' */                    //this.bindings.splice(ae.currentIndex(), 1);
/*Line 326 - 'AtomControl.js' */                    item.dispose();
/*Line 327 - 'AtomControl.js' */                    removed.push(item);
/*Line 328 - 'AtomControl.js' */                }
/*Line 329 - 'AtomControl.js' */                ae = new AtomEnumerator(removed);
/*Line 330 - 'AtomControl.js' */                while (ae.next()) {
/*Line 331 - 'AtomControl.js' */                    AtomArray.remove(this.bindings, ae.current());
/*Line 332 - 'AtomControl.js' */                }
/*Line 333 - 'AtomControl.js' */            },
/*Line 334 - 'AtomControl.js' */            addBinding: function (target, element, key, path, twoWays, jq, valueFunction, events) {
/*Line 335 - 'AtomControl.js' */                this.clearBinding(element, key);
/*Line 336 - 'AtomControl.js' */                var ab = new WebAtoms.AtomBinding(target, element, key, path, twoWays, jq, valueFunction, events);
/*Line 337 - 'AtomControl.js' */                this.bindings.push(ab);
/*Line 338 - 'AtomControl.js' */                ab.setup();
/*Line 339 - 'AtomControl.js' */            },

/*Line 341 - 'AtomControl.js' */            get_atomParent: function (element) {
/*Line 342 - 'AtomControl.js' */                if (element == null) {
/*Line 343 - 'AtomControl.js' */                    if (this._element._logicalParent || this._element.parentNode)
/*Line 344 - 'AtomControl.js' */                        element = this._element._logicalParent || this._element.parentNode;
/*Line 345 - 'AtomControl.js' */                    else
/*Line 346 - 'AtomControl.js' */                        return null;
/*Line 347 - 'AtomControl.js' */                }
/*Line 348 - 'AtomControl.js' */                if (element.atomControl) {
/*Line 349 - 'AtomControl.js' */                    return element.atomControl;
/*Line 350 - 'AtomControl.js' */                }
/*Line 351 - 'AtomControl.js' */                if (element === document || element === window || !element.parentNode)
/*Line 352 - 'AtomControl.js' */                    return null;
/*Line 353 - 'AtomControl.js' */                return this.get_atomParent(element._logicalParent || element.parentNode);
/*Line 354 - 'AtomControl.js' */            },

/*Line 356 - 'AtomControl.js' */            get_templateParent: function (element) {
/*Line 357 - 'AtomControl.js' */                if (!element) {
/*Line 358 - 'AtomControl.js' */                    element = this._element;
/*Line 359 - 'AtomControl.js' */                }
/*Line 360 - 'AtomControl.js' */                if (element._templateParent) {
/*Line 361 - 'AtomControl.js' */                    return element._templateParent;
/*Line 362 - 'AtomControl.js' */                }
/*Line 363 - 'AtomControl.js' */                var p = element._logicalParent || element.parentNode;
/*Line 364 - 'AtomControl.js' */                if (!p)
/*Line 365 - 'AtomControl.js' */                    throw new Error("Could not find templateParent");
/*Line 366 - 'AtomControl.js' */                return this.get_templateParent(element._logicalParent || element.parentNode);
/*Line 367 - 'AtomControl.js' */            },

/*Line 369 - 'AtomControl.js' */            get_data: function () {
/*Line 370 - 'AtomControl.js' */                if (this._data === undefined) {
/*Line 371 - 'AtomControl.js' */                    // get parent...
/*Line 372 - 'AtomControl.js' */                    var ap = this.get_atomParent(this._element._logicalParent || this._element.parentNode);
/*Line 373 - 'AtomControl.js' */                    if (ap)
/*Line 374 - 'AtomControl.js' */                        return ap.get_data();
/*Line 375 - 'AtomControl.js' */                }
/*Line 376 - 'AtomControl.js' */                return this._data;
/*Line 377 - 'AtomControl.js' */            },
/*Line 378 - 'AtomControl.js' */            set_data: function (d) {
/*Line 379 - 'AtomControl.js' */                this._data = d;
/*Line 380 - 'AtomControl.js' */                this.mergeData();
/*Line 381 - 'AtomControl.js' */                // update child references...
/*Line 382 - 'AtomControl.js' */                this.updateChildBindings(this._element);
/*Line 383 - 'AtomControl.js' */            },

/*Line 385 - 'AtomControl.js' */            mergeData: function () {
/*Line 386 - 'AtomControl.js' */                if (!this._mergeData2)
/*Line 387 - 'AtomControl.js' */                    return;
/*Line 388 - 'AtomControl.js' */                Atom.merge(this.get_data(), this._mergeData2, true);
/*Line 389 - 'AtomControl.js' */            },

/*Line 391 - 'AtomControl.js' */            updateChildBindings: function (element) {
/*Line 392 - 'AtomControl.js' */                var ae = new ChildEnumerator(element);
/*Line 393 - 'AtomControl.js' */                while (ae.next()) {
/*Line 394 - 'AtomControl.js' */                    var child = ae.current();
/*Line 395 - 'AtomControl.js' */                    if (child.atomControl && child.atomControl._created) {
/*Line 396 - 'AtomControl.js' */                        var ctrl = child.atomControl;
/*Line 397 - 'AtomControl.js' */                        if (ctrl._data !== undefined)
/*Line 398 - 'AtomControl.js' */                            continue;
/*Line 399 - 'AtomControl.js' */                        AtomBinder.refreshValue(ctrl, "data");
/*Line 400 - 'AtomControl.js' */                        ctrl.mergeData();
/*Line 401 - 'AtomControl.js' */                    }
/*Line 402 - 'AtomControl.js' */                    this.updateChildBindings(child);
/*Line 403 - 'AtomControl.js' */                }
/*Line 404 - 'AtomControl.js' */            },

/*Line 406 - 'AtomControl.js' */            initProperties: function () {

/*Line 408 - 'AtomControl.js' */                if (this._disposed)
/*Line 409 - 'AtomControl.js' */                    return;

/*Line 411 - 'AtomControl.js' */                //// init properties...
/*Line 412 - 'AtomControl.js' */                var element = this.get_element();

/*Line 414 - 'AtomControl.js' */                this.setProperties(element);
/*Line 415 - 'AtomControl.js' */                this._created = true;
/*Line 416 - 'AtomControl.js' */                this.onCreated();
/*Line 417 - 'AtomControl.js' */                this.onLoaded();
/*Line 418 - 'AtomControl.js' */            },


/*Line 421 - 'AtomControl.js' */            createChildren: function () {

/*Line 423 - 'AtomControl.js' */                this.onCreateChildren(this._element);

/*Line 425 - 'AtomControl.js' */                var t = this.getTemplate("template");

/*Line 427 - 'AtomControl.js' */                if (t) {
/*Line 428 - 'AtomControl.js' */                    if ($(this._element).children().length == 0) {
/*Line 429 - 'AtomControl.js' */                        if (t.constructor == String) {
/*Line 430 - 'AtomControl.js' */                            this._element.innerHTML = t;
/*Line 431 - 'AtomControl.js' */                            var caller = this;
/*Line 432 - 'AtomControl.js' */                            $(this._element).children().each(function () {
/*Line 433 - 'AtomControl.js' */                                this._templateParent = caller;
/*Line 434 - 'AtomControl.js' */                            });
/*Line 435 - 'AtomControl.js' */                        } else {
/*Line 436 - 'AtomControl.js' */                            //this._element.innerHTML = this._template;
/*Line 437 - 'AtomControl.js' */                            if (AtomUI.isNode(t)) {
/*Line 438 - 'AtomControl.js' */                                t = AtomUI.cloneNode(t);
/*Line 439 - 'AtomControl.js' */                                t._templateParent = this;
/*Line 440 - 'AtomControl.js' */                                this._element.appendChild(t);
/*Line 441 - 'AtomControl.js' */                            } else {
/*Line 442 - 'AtomControl.js' */                                // should be an array...
/*Line 443 - 'AtomControl.js' */                                var ae = new AtomEnumerator(t);
/*Line 444 - 'AtomControl.js' */                                while (ae.next()) {
/*Line 445 - 'AtomControl.js' */                                    var tc = ae.current();
/*Line 446 - 'AtomControl.js' */                                    tc = AtomUI.cloneNode(tc);
/*Line 447 - 'AtomControl.js' */                                    tc._templateParent = this;
/*Line 448 - 'AtomControl.js' */                                    this._element.appendChild(tc);
/*Line 449 - 'AtomControl.js' */                                }
/*Line 450 - 'AtomControl.js' */                            }
/*Line 451 - 'AtomControl.js' */                        }
/*Line 452 - 'AtomControl.js' */                        this.onCreateChildren(this._element);
/*Line 453 - 'AtomControl.js' */                    }
/*Line 454 - 'AtomControl.js' */                }
/*Line 455 - 'AtomControl.js' */            },


/*Line 458 - 'AtomControl.js' */            onCreateChildren: function (element) {

/*Line 460 - 'AtomControl.js' */                var ae = new ChildEnumerator(element);
/*Line 461 - 'AtomControl.js' */                var child;
/*Line 462 - 'AtomControl.js' */                while (ae.next()) {
/*Line 463 - 'AtomControl.js' */                    child = ae.current();

/*Line 465 - 'AtomControl.js' */                    var amap = AtomUI.attributeMap(child, /^atom\-(template|presenter|type|template\-name)$/gi);

/*Line 467 - 'AtomControl.js' */                    var t = amap["atom-template"];
/*Line 468 - 'AtomControl.js' */                    if (t) {
/*Line 469 - 'AtomControl.js' */                        child.removeAttributeNode(t.node);
/*Line 470 - 'AtomControl.js' */                        element.templateOwner = true;
/*Line 471 - 'AtomControl.js' */                        this["_" + t.value] = child;
/*Line 472 - 'AtomControl.js' */                        element.removeChild(child);
/*Line 473 - 'AtomControl.js' */                        continue;
/*Line 474 - 'AtomControl.js' */                    }

/*Line 476 - 'AtomControl.js' */                    var tn = amap["atom-template-name"];
/*Line 477 - 'AtomControl.js' */                    if (tn) {
/*Line 478 - 'AtomControl.js' */                        child.removeAttributeNode(tn.node);
/*Line 479 - 'AtomControl.js' */                        this._scopeTemplates = this._scopeTemplates || {};
/*Line 480 - 'AtomControl.js' */                        this._scopeTemplates[tn.value] = child;
/*Line 481 - 'AtomControl.js' */                        element.removeChild(child);
/*Line 482 - 'AtomControl.js' */                        continue;
/*Line 483 - 'AtomControl.js' */                    }

/*Line 485 - 'AtomControl.js' */                    var p = amap["atom-presenter"];
/*Line 486 - 'AtomControl.js' */                    if (p) {
/*Line 487 - 'AtomControl.js' */                        // search upwords for expected presenter...
/*Line 488 - 'AtomControl.js' */                        var owner = AtomUI.getPresenterOwner(this, p.value);
/*Line 489 - 'AtomControl.js' */                        owner["_" + p.value] = child;
/*Line 490 - 'AtomControl.js' */                    }

/*Line 492 - 'AtomControl.js' */                    var childType = amap["atom-type"];

/*Line 494 - 'AtomControl.js' */                    if (childType) {
/*Line 495 - 'AtomControl.js' */                        AtomUI.createControl(child, childType.value);
/*Line 496 - 'AtomControl.js' */                        //element.removeAttributeNode(childType.node);
/*Line 497 - 'AtomControl.js' */                    } else {
/*Line 498 - 'AtomControl.js' */                        this.onCreateChildren(child);
/*Line 499 - 'AtomControl.js' */                    }
/*Line 500 - 'AtomControl.js' */                }
/*Line 501 - 'AtomControl.js' */            },

/*Line 503 - 'AtomControl.js' */            onLoaded: function () {
/*Line 504 - 'AtomControl.js' */            },

/*Line 506 - 'AtomControl.js' */            onUpdateUI: function () {
/*Line 507 - 'AtomControl.js' */                if (this._layout) {
/*Line 508 - 'AtomControl.js' */                    this._layout.doLayout(this._element);
/*Line 509 - 'AtomControl.js' */                } else {
/*Line 510 - 'AtomControl.js' */                    this.updateChildUI(this.get_element());
/*Line 511 - 'AtomControl.js' */                }
/*Line 512 - 'AtomControl.js' */            },

/*Line 514 - 'AtomControl.js' */            updateUI: function () {
/*Line 515 - 'AtomControl.js' */                var ctrl = this;
/*Line 516 - 'AtomControl.js' */                this.dispatcher.callLater(function () {
/*Line 517 - 'AtomControl.js' */                    ctrl.onUpdateUI();
/*Line 518 - 'AtomControl.js' */                });
/*Line 519 - 'AtomControl.js' */            },

/*Line 521 - 'AtomControl.js' */            updateChildUI: function (parent) {
/*Line 522 - 'AtomControl.js' */                if (!parent)
/*Line 523 - 'AtomControl.js' */                    parent = this._element;
/*Line 524 - 'AtomControl.js' */                var ae = new ChildEnumerator(parent);
/*Line 525 - 'AtomControl.js' */                while (ae.next()) {
/*Line 526 - 'AtomControl.js' */                    var child = ae.current();
/*Line 527 - 'AtomControl.js' */                    if (child.atomControl) {
/*Line 528 - 'AtomControl.js' */                        child.atomControl.updateUI();
/*Line 529 - 'AtomControl.js' */                        continue;
/*Line 530 - 'AtomControl.js' */                    }
/*Line 531 - 'AtomControl.js' */                    this.updateChildUI(child);
/*Line 532 - 'AtomControl.js' */                }
/*Line 533 - 'AtomControl.js' */            },

/*Line 535 - 'AtomControl.js' */            onCreated: function () {
/*Line 536 - 'AtomControl.js' */                this.updateUI();
/*Line 537 - 'AtomControl.js' */            },

/*Line 539 - 'AtomControl.js' */            setProperties: function (element) {


/*Line 542 - 'AtomControl.js' */                var obj;
/*Line 543 - 'AtomControl.js' */                var key;
/*Line 544 - 'AtomControl.js' */                var value;
/*Line 545 - 'AtomControl.js' */                var fn;
/*Line 546 - 'AtomControl.js' */                var at;

/*Line 548 - 'AtomControl.js' */                var attr = element.attributes;
/*Line 549 - 'AtomControl.js' */                var ae = new AtomEnumerator(attr);

/*Line 551 - 'AtomControl.js' */                var remove = [];

/*Line 553 - 'AtomControl.js' */                var nodeValue = "value";
/*Line 554 - 'AtomControl.js' */                if (AtomBrowser.isIE && AtomBrowser.majorVersion < 9) {
/*Line 555 - 'AtomControl.js' */                    nodeValue = "nodeValue";
/*Line 556 - 'AtomControl.js' */                }

/*Line 558 - 'AtomControl.js' */                var bindList = {};

/*Line 560 - 'AtomControl.js' */                while (ae.next()) {
/*Line 561 - 'AtomControl.js' */                    at = ae.current();
/*Line 562 - 'AtomControl.js' */                    key = at.nodeName;
/*Line 563 - 'AtomControl.js' */                    value = at[nodeValue];
/*Line 564 - 'AtomControl.js' */                    if (/^atomControl$/g.test(key)) {
/*Line 565 - 'AtomControl.js' */                        continue;
/*Line 566 - 'AtomControl.js' */                    }
/*Line 567 - 'AtomControl.js' */                    if (/^atom\-type$/.test(key)) {
/*Line 568 - 'AtomControl.js' */                        remove.push(at);
/*Line 569 - 'AtomControl.js' */                        continue;
/*Line 570 - 'AtomControl.js' */                    }
/*Line 571 - 'AtomControl.js' */                    if (!(/^(atom|bind|style|event)\-/g.test(key)))
/*Line 572 - 'AtomControl.js' */                        continue;
/*Line 573 - 'AtomControl.js' */                    if (!(/^(style|event)\-/g.test(key)))
/*Line 574 - 'AtomControl.js' */                        key = key.substr(5);

/*Line 576 - 'AtomControl.js' */                    if (!value)
/*Line 577 - 'AtomControl.js' */                        continue;

/*Line 579 - 'AtomControl.js' */                    if (!/(^style$|dock)/.test(key)) {
/*Line 580 - 'AtomControl.js' */                        remove.push(at);
/*Line 581 - 'AtomControl.js' */                    }

/*Line 583 - 'AtomControl.js' */                    // rename key...
/*Line 584 - 'AtomControl.js' */                    key = $.camelCase(key);

/*Line 586 - 'AtomControl.js' */                    bindList[key] = value;

/*Line 588 - 'AtomControl.js' */                }

/*Line 590 - 'AtomControl.js' */                // Since setValue may add up new attributes
/*Line 591 - 'AtomControl.js' */                // We set value after we have collected attribute list
/*Line 592 - 'AtomControl.js' */                for (key in bindList) {
/*Line 593 - 'AtomControl.js' */                    this.setValue(key, bindList[key], true, element);
/*Line 594 - 'AtomControl.js' */                }

/*Line 596 - 'AtomControl.js' */                ae = new AtomEnumerator(remove);
/*Line 597 - 'AtomControl.js' */                while (ae.next()) {
/*Line 598 - 'AtomControl.js' */                    //$(element).removeAttr(ae.current().nodeName);
/*Line 599 - 'AtomControl.js' */                    element.removeAttributeNode(ae.current());
/*Line 600 - 'AtomControl.js' */                }

/*Line 602 - 'AtomControl.js' */                var child = new ChildEnumerator(element);
/*Line 603 - 'AtomControl.js' */                while (child.next()) {
/*Line 604 - 'AtomControl.js' */                    var childItem = child.current();
/*Line 605 - 'AtomControl.js' */                    if (childItem.atomControl)
/*Line 606 - 'AtomControl.js' */                        continue;
/*Line 607 - 'AtomControl.js' */                    this.setProperties(childItem);
/*Line 608 - 'AtomControl.js' */                }

/*Line 610 - 'AtomControl.js' */            },

/*Line 612 - 'AtomControl.js' */            setValue: function (key, value, bind, element) {
/*Line 613 - 'AtomControl.js' */                if (value && value.constructor == String) {

/*Line 615 - 'AtomControl.js' */                    var s = value[0];

/*Line 617 - 'AtomControl.js' */                    var f = AtomBinders[s];
/*Line 618 - 'AtomControl.js' */                    if (f) {
/*Line 619 - 'AtomControl.js' */                        f(this, key, value, element);
/*Line 620 - 'AtomControl.js' */                        return;
/*Line 621 - 'AtomControl.js' */                    }

/*Line 623 - 'AtomControl.js' */                    s += value[1];
/*Line 624 - 'AtomControl.js' */                    f = AtomBinders[s];
/*Line 625 - 'AtomControl.js' */                    if (f) {
/*Line 626 - 'AtomControl.js' */                        f(this, key, value, element);
/*Line 627 - 'AtomControl.js' */                        return;
/*Line 628 - 'AtomControl.js' */                    }

/*Line 630 - 'AtomControl.js' */                }

/*Line 632 - 'AtomControl.js' */                this.setLocalValue(key, value, element);
/*Line 633 - 'AtomControl.js' */            },

/*Line 635 - 'AtomControl.js' */            setLocalValue: function (key, value, element, refresh) {

/*Line 637 - 'AtomControl.js' */                // undefined can never be set
/*Line 638 - 'AtomControl.js' */                if (value === undefined)
/*Line 639 - 'AtomControl.js' */                    return;

/*Line 641 - 'AtomControl.js' */                if (value && value instanceof AtomPromise) {

/*Line 643 - 'AtomControl.js' */                    element._promisesQueue = element._promisesQueue || {};

/*Line 645 - 'AtomControl.js' */                    var op = element._promisesQueue[key];
/*Line 646 - 'AtomControl.js' */                    if (op) {
/*Line 647 - 'AtomControl.js' */                        op.abort();
/*Line 648 - 'AtomControl.js' */                    }
/*Line 649 - 'AtomControl.js' */                    element._promisesQueue[key] = value;

/*Line 651 - 'AtomControl.js' */                    if (value._persist) {

/*Line 653 - 'AtomControl.js' */                        // is it a promise?
/*Line 654 - 'AtomControl.js' */                        this._promises = this._promises || {};

/*Line 656 - 'AtomControl.js' */                        // cache promise...
/*Line 657 - 'AtomControl.js' */                        this._promises[key] = value;


/*Line 660 - 'AtomControl.js' */                    }

/*Line 662 - 'AtomControl.js' */                    var caller = this;

/*Line 664 - 'AtomControl.js' */                    value.then(function (p) {

/*Line 666 - 'AtomControl.js' */                        if (element._promisesQueue[key] == p) {
/*Line 667 - 'AtomControl.js' */                            element._promisesQueue[key] = null;
/*Line 668 - 'AtomControl.js' */                        }

/*Line 670 - 'AtomControl.js' */                        element._promisesQueue[key] = null;

/*Line 672 - 'AtomControl.js' */                        caller.setLocalValue(key, p.value(), element, true);

/*Line 674 - 'AtomControl.js' */                        if (caller._loadNext) {
/*Line 675 - 'AtomControl.js' */                            caller.invokeAction(caller._loadNext);
/*Line 676 - 'AtomControl.js' */                        }
/*Line 677 - 'AtomControl.js' */                    });

/*Line 679 - 'AtomControl.js' */                    value.failed(function (p) {
/*Line 680 - 'AtomControl.js' */                        if (element._promisesQueue[key] == p) {
/*Line 681 - 'AtomControl.js' */                            element._promisesQueue[key] = null;
/*Line 682 - 'AtomControl.js' */                        }
/*Line 683 - 'AtomControl.js' */                    });

/*Line 685 - 'AtomControl.js' */                    value.invoke();
/*Line 686 - 'AtomControl.js' */                    return;

/*Line 688 - 'AtomControl.js' */                }

/*Line 690 - 'AtomControl.js' */                if (this._element == element) {
/*Line 691 - 'AtomControl.js' */                    var fn = this["set_" + key];
/*Line 692 - 'AtomControl.js' */                    if (fn != null) {
/*Line 693 - 'AtomControl.js' */                        if (refresh) {
/*Line 694 - 'AtomControl.js' */                            // checking old value is necessary
/*Line 695 - 'AtomControl.js' */                            // as two way binding may cause recursive
/*Line 696 - 'AtomControl.js' */                            // updates
/*Line 697 - 'AtomControl.js' */                            var oldValue = AtomBinder.getValue(this, key);
/*Line 698 - 'AtomControl.js' */                            if (oldValue == value)
/*Line 699 - 'AtomControl.js' */                                return;
/*Line 700 - 'AtomControl.js' */                        }
/*Line 701 - 'AtomControl.js' */                        fn.apply(this, [value]);
/*Line 702 - 'AtomControl.js' */                        if (refresh) {
/*Line 703 - 'AtomControl.js' */                            AtomBinder.refreshValue(this, key);
/*Line 704 - 'AtomControl.js' */                        }
/*Line 705 - 'AtomControl.js' */                        return;
/*Line 706 - 'AtomControl.js' */                    }
/*Line 707 - 'AtomControl.js' */                }

/*Line 709 - 'AtomControl.js' */                if (/^style/g.test(key) && key.length > 5) {
/*Line 710 - 'AtomControl.js' */                    var k = key.substr(5);
/*Line 711 - 'AtomControl.js' */                    k = String.fromCharCode(k.charCodeAt(0)).toLowerCase() + k.substr(1);
/*Line 712 - 'AtomControl.js' */                    element.style[k] = value;
/*Line 713 - 'AtomControl.js' */                    return;
/*Line 714 - 'AtomControl.js' */                }

/*Line 716 - 'AtomControl.js' */                if (/^event/g.test(key) && key.length > 5) {
/*Line 717 - 'AtomControl.js' */                    var k = key.substr(5);
/*Line 718 - 'AtomControl.js' */                    k = String.fromCharCode(k.charCodeAt(0)).toLowerCase() + k.substr(1);
/*Line 719 - 'AtomControl.js' */                    var _this = this;
/*Line 720 - 'AtomControl.js' */                    // unbind previous event...
/*Line 721 - 'AtomControl.js' */                    this.unbindEvent(element, k);
/*Line 722 - 'AtomControl.js' */                    this.bindEvent(element, k, null, null, function (evt) {
/*Line 723 - 'AtomControl.js' */                        _this.invokeAction(value, evt);
/*Line 724 - 'AtomControl.js' */                    });
/*Line 725 - 'AtomControl.js' */                    return;
/*Line 726 - 'AtomControl.js' */                }

/*Line 728 - 'AtomControl.js' */                var f = AtomProperties[key] || AtomProperties.any;
/*Line 729 - 'AtomControl.js' */                if (f) {
/*Line 730 - 'AtomControl.js' */                    f(element || this._element, value, key);
/*Line 731 - 'AtomControl.js' */                }

/*Line 733 - 'AtomControl.js' */            },

/*Line 735 - 'AtomControl.js' */            bind: function (element, key, value, twoWays, vf, events) {

/*Line 737 - 'AtomControl.js' */                if (value == null) {
/*Line 738 - 'AtomControl.js' */                    // remove existing binding...
/*Line 739 - 'AtomControl.js' */                    this.clearBinding(element, key);
/*Line 740 - 'AtomControl.js' */                    return;
/*Line 741 - 'AtomControl.js' */                }

/*Line 743 - 'AtomControl.js' */                var target = this;
/*Line 744 - 'AtomControl.js' */                if (value && value.constructor == String && /^window\./g.test(value)) {
/*Line 745 - 'AtomControl.js' */                    target = window;
/*Line 746 - 'AtomControl.js' */                }

/*Line 748 - 'AtomControl.js' */                var thisElement = this.get_element();

/*Line 750 - 'AtomControl.js' */                var jq = thisElement != element;

/*Line 752 - 'AtomControl.js' */                if (!jq) {
/*Line 753 - 'AtomControl.js' */                    var f = this["get_" + key];
/*Line 754 - 'AtomControl.js' */                    if (f == undefined || f == null) {
/*Line 755 - 'AtomControl.js' */                        jq = true;
/*Line 756 - 'AtomControl.js' */                    }
/*Line 757 - 'AtomControl.js' */                }

/*Line 759 - 'AtomControl.js' */                switch (key) {
/*Line 760 - 'AtomControl.js' */                    case "value":
/*Line 761 - 'AtomControl.js' */                        if (/input/gi.test(element.nodeName)) { jq = true; }
/*Line 762 - 'AtomControl.js' */                        this.addBinding(target, element, "value", value, twoWays, jq, vf, events);
/*Line 763 - 'AtomControl.js' */                        break;
/*Line 764 - 'AtomControl.js' */                    case "text":
/*Line 765 - 'AtomControl.js' */                        this.addBinding(target, element, "text", value, false, true, vf, events);
/*Line 766 - 'AtomControl.js' */                        break;
/*Line 767 - 'AtomControl.js' */                    default:
/*Line 768 - 'AtomControl.js' */                        this.addBinding(target, element, key, value, twoWays, jq, vf, events);
/*Line 769 - 'AtomControl.js' */                        break;
/*Line 770 - 'AtomControl.js' */                }

/*Line 772 - 'AtomControl.js' */            },

/*Line 774 - 'AtomControl.js' */            onInitialized: function () {
/*Line 775 - 'AtomControl.js' */            },

/*Line 777 - 'AtomControl.js' */            init: function () {

/*Line 779 - 'AtomControl.js' */                // first remove all templates ...
/*Line 780 - 'AtomControl.js' */                base.init.apply(this, arguments);

/*Line 782 - 'AtomControl.js' */                // init properties...
/*Line 783 - 'AtomControl.js' */                var element = this.get_element();

/*Line 785 - 'AtomControl.js' */                var amap = AtomUI.attributeMap(element, /^atom\-(name|local\-scope)$/gi);

/*Line 787 - 'AtomControl.js' */                var ls = amap["atom-name"];
/*Line 788 - 'AtomControl.js' */                if (ls) {
/*Line 789 - 'AtomControl.js' */                    if (/^(app|window|owner|scope|localScope|parent)$/gi.test(ls.value))
/*Line 790 - 'AtomControl.js' */                        throw new Error("Invalid Control Name '" + ls.value + "'");
/*Line 791 - 'AtomControl.js' */                    var s = this.get_scope();
/*Line 792 - 'AtomControl.js' */                    AtomBinder.setValue(s, ls.value, this);
/*Line 793 - 'AtomControl.js' */                    this._name = ls.value;
/*Line 794 - 'AtomControl.js' */                    element.removeAttributeNode(ls.node);
/*Line 795 - 'AtomControl.js' */                }


/*Line 798 - 'AtomControl.js' */                ls = amap["atom-local-scope"];
/*Line 799 - 'AtomControl.js' */                if (ls) {
/*Line 800 - 'AtomControl.js' */                    this._localScope = new AtomScope(this, this.get_scope(), atomApplication);
/*Line 801 - 'AtomControl.js' */                    this._scope = this._localScope;
/*Line 802 - 'AtomControl.js' */                    if (this._name) {
/*Line 803 - 'AtomControl.js' */                        this._localScope[this._name] = this;
/*Line 804 - 'AtomControl.js' */                    }
/*Line 805 - 'AtomControl.js' */                    element.removeAttributeNode(ls.node);
/*Line 806 - 'AtomControl.js' */                }

/*Line 808 - 'AtomControl.js' */                // scope is now ready, set scopeTemplates...
/*Line 809 - 'AtomControl.js' */                var st = this._scopeTemplates;
/*Line 810 - 'AtomControl.js' */                if (st) {
/*Line 811 - 'AtomControl.js' */                    var s = this.get_scope();
/*Line 812 - 'AtomControl.js' */                    for (var i in st) {
/*Line 813 - 'AtomControl.js' */                        var t = st[i];
/*Line 814 - 'AtomControl.js' */                        AtomBinder.setValue(s, i, t);
/*Line 815 - 'AtomControl.js' */                    }
/*Line 816 - 'AtomControl.js' */                    //try {
/*Line 817 - 'AtomControl.js' */                    //    delete this._scopeTemplates;
/*Line 818 - 'AtomControl.js' */                    //} catch (exx) {

/*Line 820 - 'AtomControl.js' */                    //}
/*Line 821 - 'AtomControl.js' */                }

/*Line 823 - 'AtomControl.js' */                //var fn = Function.createDelegate(this, this.initProperties);
/*Line 824 - 'AtomControl.js' */                var _this = this;
/*Line 825 - 'AtomControl.js' */                WebAtoms.dispatcher.callLater(function () {
/*Line 826 - 'AtomControl.js' */                    _this.initProperties();
/*Line 827 - 'AtomControl.js' */                });

/*Line 829 - 'AtomControl.js' */                // init every children..
/*Line 830 - 'AtomControl.js' */                this.initChildren(this._element);

/*Line 832 - 'AtomControl.js' */                //fn = Function.createDelegate(this, this.onInitialized);
/*Line 833 - 'AtomControl.js' */                WebAtoms.dispatcher.callLater(function () {
/*Line 834 - 'AtomControl.js' */                    _this.onInitialized();
/*Line 835 - 'AtomControl.js' */                });
/*Line 836 - 'AtomControl.js' */            },


/*Line 839 - 'AtomControl.js' */            dispose: function (e) {

/*Line 841 - 'AtomControl.js' */                // disposing only one element
/*Line 842 - 'AtomControl.js' */                if (e) {
/*Line 843 - 'AtomControl.js' */                    var eac = e.atomControl;
/*Line 844 - 'AtomControl.js' */                    if (eac) {
/*Line 845 - 'AtomControl.js' */                        eac.dispose();
/*Line 846 - 'AtomControl.js' */                    } else {
/*Line 847 - 'AtomControl.js' */                        this.clearBinding(e);
/*Line 848 - 'AtomControl.js' */                        this.disposeChildren(e);
/*Line 849 - 'AtomControl.js' */                    }
/*Line 850 - 'AtomControl.js' */                    $(e).remove();
/*Line 851 - 'AtomControl.js' */                    return;
/*Line 852 - 'AtomControl.js' */                }

/*Line 854 - 'AtomControl.js' */                this._disposed = true;
/*Line 855 - 'AtomControl.js' */                this.disposeChildren(this._element);
/*Line 856 - 'AtomControl.js' */                this.clearBinding();
/*Line 857 - 'AtomControl.js' */                this.bindings.length = 0;
/*Line 858 - 'AtomControl.js' */                base.dispose.apply(this, arguments);
/*Line 859 - 'AtomControl.js' */            },


/*Line 862 - 'AtomControl.js' */            disposeChildren: function (e) {
/*Line 863 - 'AtomControl.js' */                var oldIE = AtomBrowser.isIE && AtomBrowser.majorVersion < 9;
/*Line 864 - 'AtomControl.js' */                var ae = new ChildEnumerator(e);
/*Line 865 - 'AtomControl.js' */                while (ae.next()) {
/*Line 866 - 'AtomControl.js' */                    var ce = ae.current();
/*Line 867 - 'AtomControl.js' */                    if (ce.atomControl) {
/*Line 868 - 'AtomControl.js' */                        ce.atomControl.dispose();
/*Line 869 - 'AtomControl.js' */                        if (oldIE) {
/*Line 870 - 'AtomControl.js' */                            ce.atomControl = undefined;
/*Line 871 - 'AtomControl.js' */                        } else {
/*Line 872 - 'AtomControl.js' */                            delete ce.atomControl;
/*Line 873 - 'AtomControl.js' */                        }
/*Line 874 - 'AtomControl.js' */                    } else {
/*Line 875 - 'AtomControl.js' */                        this.clearBinding(ce);
/*Line 876 - 'AtomControl.js' */                        this.unbindEvent(ce);
/*Line 877 - 'AtomControl.js' */                        this.disposeChildren(ce);
/*Line 878 - 'AtomControl.js' */                    }
/*Line 879 - 'AtomControl.js' */                    //$(ce).remove();
/*Line 880 - 'AtomControl.js' */                }
/*Line 881 - 'AtomControl.js' */                // this will and should remove every children..
/*Line 882 - 'AtomControl.js' */                try {
/*Line 883 - 'AtomControl.js' */                    e.innerHTML = "";
/*Line 884 - 'AtomControl.js' */                } catch (ex) {
/*Line 885 - 'AtomControl.js' */                    $(e).html('');
/*Line 886 - 'AtomControl.js' */                }
/*Line 887 - 'AtomControl.js' */            },

/*Line 889 - 'AtomControl.js' */            get_innerTemplate: function () {
/*Line 890 - 'AtomControl.js' */                return this._template;
/*Line 891 - 'AtomControl.js' */            },

/*Line 893 - 'AtomControl.js' */            set_innerTemplate: function (v) {
/*Line 894 - 'AtomControl.js' */                if (this._template === v) {
/*Line 895 - 'AtomControl.js' */                    if (this._created)
/*Line 896 - 'AtomControl.js' */                        return;
/*Line 897 - 'AtomControl.js' */                }
/*Line 898 - 'AtomControl.js' */                if (!this._created) {
/*Line 899 - 'AtomControl.js' */                    var _this = this;
/*Line 900 - 'AtomControl.js' */                    // this is because, sometimes template change occurs while creation
/*Line 901 - 'AtomControl.js' */                    // which creates endless loop
/*Line 902 - 'AtomControl.js' */                    WebAtoms.dispatcher.callLater(function () {
/*Line 903 - 'AtomControl.js' */                        _this.set_innerTemplate(v);
/*Line 904 - 'AtomControl.js' */                    });
/*Line 905 - 'AtomControl.js' */                    return;
/*Line 906 - 'AtomControl.js' */                }
/*Line 907 - 'AtomControl.js' */                this._template = v;
/*Line 908 - 'AtomControl.js' */                // disposing all children...
/*Line 909 - 'AtomControl.js' */                this.disposeChildren(this._element);

/*Line 911 - 'AtomControl.js' */                this.createChildren();
/*Line 912 - 'AtomControl.js' */                this.setProperties(this._element);
/*Line 913 - 'AtomControl.js' */                this.initChildren(this._element);
/*Line 914 - 'AtomControl.js' */                this.updateUI();
/*Line 915 - 'AtomControl.js' */            },

/*Line 917 - 'AtomControl.js' */            initChildren: function (e) {
/*Line 918 - 'AtomControl.js' */                var ae = new ChildEnumerator(e);
/*Line 919 - 'AtomControl.js' */                var item;
/*Line 920 - 'AtomControl.js' */                var ctrl;

/*Line 922 - 'AtomControl.js' */                var remove = [];

/*Line 924 - 'AtomControl.js' */                while (ae.next()) {
/*Line 925 - 'AtomControl.js' */                    item = ae.current();

/*Line 927 - 'AtomControl.js' */                    if (item.nodeName == "SCRIPT") {

/*Line 929 - 'AtomControl.js' */                        // evalute and set scope...
/*Line 930 - 'AtomControl.js' */                        var s = $.trim(item.innerHTML);
/*Line 931 - 'AtomControl.js' */                        if (/^\(\{/.test(s) && /\}\)$/.test(s)) {
/*Line 932 - 'AtomControl.js' */                            try {
/*Line 933 - 'AtomControl.js' */                                s = (new Function("return " + s + ";"))()
/*Line 934 - 'AtomControl.js' */                                //this.set_scope(s);
/*Line 935 - 'AtomControl.js' */                                var scope = this._localScope || this.get_scope();
/*Line 936 - 'AtomControl.js' */                                for (var k in s) {
/*Line 937 - 'AtomControl.js' */                                    if (scope[k])
/*Line 938 - 'AtomControl.js' */                                        continue;
/*Line 939 - 'AtomControl.js' */                                    scope[k] = s[k];
/*Line 940 - 'AtomControl.js' */                                }
/*Line 941 - 'AtomControl.js' */                            } catch (ex) {
/*Line 942 - 'AtomControl.js' */                                log(JSON.stringify(ex));
/*Line 943 - 'AtomControl.js' */                                alert(JSON.stringify(ex));
/*Line 944 - 'AtomControl.js' */                            }

/*Line 946 - 'AtomControl.js' */                        }
/*Line 947 - 'AtomControl.js' */                        remove.push(item);
/*Line 948 - 'AtomControl.js' */                        continue;

/*Line 950 - 'AtomControl.js' */                    }

/*Line 952 - 'AtomControl.js' */                    ctrl = item.atomControl;
/*Line 953 - 'AtomControl.js' */                    if (ctrl) {
/*Line 954 - 'AtomControl.js' */                        ctrl.init();
/*Line 955 - 'AtomControl.js' */                    } else {
/*Line 956 - 'AtomControl.js' */                        this.initChildren(item);
/*Line 957 - 'AtomControl.js' */                    }
/*Line 958 - 'AtomControl.js' */                }

/*Line 960 - 'AtomControl.js' */                ae = new AtomEnumerator(remove);
/*Line 961 - 'AtomControl.js' */                while (ae.next()) {
/*Line 962 - 'AtomControl.js' */                    e.removeChild(ae.current());
/*Line 963 - 'AtomControl.js' */                }
/*Line 964 - 'AtomControl.js' */            }
/*Line 965 - 'AtomControl.js' */        }
/*Line 966 - 'AtomControl.js' */    });
/*Line 967 - 'AtomControl.js' */})(window,"WebAtoms.AtomControl",WebAtoms.AtomUIComponent.prototype);
/*Line 0 - 'AtomItemsControl.js' */

/*Line 2 - 'AtomItemsControl.js' */(function (window, base) {
/*Line 3 - 'AtomItemsControl.js' */    return classCreatorEx({
/*Line 4 - 'AtomItemsControl.js' */        name: "WebAtoms.AtomItemsControl",
/*Line 5 - 'AtomItemsControl.js' */        base: base,
/*Line 6 - 'AtomItemsControl.js' */        start: function () {
/*Line 7 - 'AtomItemsControl.js' */            this._selectedItems = [];
/*Line 8 - 'AtomItemsControl.js' */            this._selectedElements = [];
/*Line 9 - 'AtomItemsControl.js' */            this._selectedIndexSet = false;
/*Line 10 - 'AtomItemsControl.js' */            this._onUIChanged = false;
/*Line 11 - 'AtomItemsControl.js' */            this._itemsPresenter = null;
/*Line 12 - 'AtomItemsControl.js' */            this._itemsPanel = null;
/*Line 13 - 'AtomItemsControl.js' */            this._presenters = ["itemsPresenter"];
/*Line 14 - 'AtomItemsControl.js' */            this._childItemType = WebAtoms.AtomControl;
/*Line 15 - 'AtomItemsControl.js' */        },
/*Line 16 - 'AtomItemsControl.js' */        properties: {
/*Line 17 - 'AtomItemsControl.js' */            allowSelectFirst: false,
/*Line 18 - 'AtomItemsControl.js' */            allowMultipleSelection: false,
/*Line 19 - 'AtomItemsControl.js' */            uiVirtualize: false,
/*Line 20 - 'AtomItemsControl.js' */            defaultValue: null,
/*Line 21 - 'AtomItemsControl.js' */            autoScrollToSelection: false,
/*Line 22 - 'AtomItemsControl.js' */            /* this forces SelectAll Checkbox to ignore value of get_selectAll and forces its own value on click */
/*Line 23 - 'AtomItemsControl.js' */            selectAll: undefined,
/*Line 24 - 'AtomItemsControl.js' */            labelPath: "label",
/*Line 25 - 'AtomItemsControl.js' */            valuePath: "value",
/*Line 26 - 'AtomItemsControl.js' */            sortPath: null,
/*Line 27 - 'AtomItemsControl.js' */            valueSeparator: null,
/*Line 28 - 'AtomItemsControl.js' */            postData: null,
/*Line 29 - 'AtomItemsControl.js' */            postUrl: null,
/*Line 30 - 'AtomItemsControl.js' */            confirm: false,
/*Line 31 - 'AtomItemsControl.js' */            confirmMessage: null,
/*Line 32 - 'AtomItemsControl.js' */            filter: null,
/*Line 33 - 'AtomItemsControl.js' */            items: null,
/*Line 34 - 'AtomItemsControl.js' */            itemTemplate: null
/*Line 35 - 'AtomItemsControl.js' */        },
/*Line 36 - 'AtomItemsControl.js' */        methods: {
/*Line 37 - 'AtomItemsControl.js' */            get_postData: function () {
/*Line 38 - 'AtomItemsControl.js' */                return this._postData || this.get_selectedItem();
/*Line 39 - 'AtomItemsControl.js' */            },
/*Line 40 - 'AtomItemsControl.js' */            get_allValues: function () {
/*Line 41 - 'AtomItemsControl.js' */                if (!this._valueSeparator)
/*Line 42 - 'AtomItemsControl.js' */                    return;
/*Line 43 - 'AtomItemsControl.js' */                if (!this._valuePath)
/*Line 44 - 'AtomItemsControl.js' */                    return;
/*Line 45 - 'AtomItemsControl.js' */                var list = [];
/*Line 46 - 'AtomItemsControl.js' */                var vp = this._valuePath;
/*Line 47 - 'AtomItemsControl.js' */                var vfp = function (item) {
/*Line 48 - 'AtomItemsControl.js' */                    return item[vp];
/*Line 49 - 'AtomItemsControl.js' */                };
/*Line 50 - 'AtomItemsControl.js' */                var ae = Atom.query(this.get_dataItems());
/*Line 51 - 'AtomItemsControl.js' */                while (ae.next()) {
/*Line 52 - 'AtomItemsControl.js' */                    list.push( vfp( ae.current()));                    
/*Line 53 - 'AtomItemsControl.js' */                }
/*Line 54 - 'AtomItemsControl.js' */                return list.join(this._valueSeparator);
/*Line 55 - 'AtomItemsControl.js' */            },
/*Line 56 - 'AtomItemsControl.js' */            get_value: function () {

/*Line 58 - 'AtomItemsControl.js' */                if (this._allowMultipleSelection) {
/*Line 59 - 'AtomItemsControl.js' */                    var items = this._selectedItems;
/*Line 60 - 'AtomItemsControl.js' */                    if (items.length == 0) {
/*Line 61 - 'AtomItemsControl.js' */                        if (this._value !== undefined)
/*Line 62 - 'AtomItemsControl.js' */                            return this._value;
/*Line 63 - 'AtomItemsControl.js' */                        return null;
/*Line 64 - 'AtomItemsControl.js' */                    }
/*Line 65 - 'AtomItemsControl.js' */                    items = AtomArray.getValues(items, this._valuePath);
/*Line 66 - 'AtomItemsControl.js' */                    if (this._valueSeparator)
/*Line 67 - 'AtomItemsControl.js' */                        items = items.join(this._valueSeparator);
/*Line 68 - 'AtomItemsControl.js' */                    return items;
/*Line 69 - 'AtomItemsControl.js' */                }

/*Line 71 - 'AtomItemsControl.js' */                var s = this.get_selectedItem();
/*Line 72 - 'AtomItemsControl.js' */                if (!s) {
/*Line 73 - 'AtomItemsControl.js' */                    if (this._value !== undefined)
/*Line 74 - 'AtomItemsControl.js' */                        return this._value;
/*Line 75 - 'AtomItemsControl.js' */                    return null;
/*Line 76 - 'AtomItemsControl.js' */                }
/*Line 77 - 'AtomItemsControl.js' */                if (this._valuePath) {
/*Line 78 - 'AtomItemsControl.js' */                    s = s[this._valuePath];
/*Line 79 - 'AtomItemsControl.js' */                }
/*Line 80 - 'AtomItemsControl.js' */                return s;
/*Line 81 - 'AtomItemsControl.js' */            },
/*Line 82 - 'AtomItemsControl.js' */            set_value: function (v) {
/*Line 83 - 'AtomItemsControl.js' */                this._value = v;
/*Line 84 - 'AtomItemsControl.js' */                if (v === undefined || v === null) {
/*Line 85 - 'AtomItemsControl.js' */                    // reset...
/*Line 86 - 'AtomItemsControl.js' */                    AtomBinder.clear(this._selectedItems);
/*Line 87 - 'AtomItemsControl.js' */                    return;
/*Line 88 - 'AtomItemsControl.js' */                }
/*Line 89 - 'AtomItemsControl.js' */                var dataItems = this.get_dataItems();
/*Line 90 - 'AtomItemsControl.js' */                if (this._allowMultipleSelection && this._valueSeparator) {
/*Line 91 - 'AtomItemsControl.js' */                    if (v.constructor != String) {
/*Line 92 - 'AtomItemsControl.js' */                        v = "" + v;
/*Line 93 - 'AtomItemsControl.js' */                    }
/*Line 94 - 'AtomItemsControl.js' */                    v = AtomArray.split(v, this._valueSeparator);
/*Line 95 - 'AtomItemsControl.js' */                } else {
/*Line 96 - 'AtomItemsControl.js' */                    v = [v];
/*Line 97 - 'AtomItemsControl.js' */                }
/*Line 98 - 'AtomItemsControl.js' */                var items = AtomArray.intersect(dataItems, this._valuePath, v);
/*Line 99 - 'AtomItemsControl.js' */                this._selectedItems.length = 0;
/*Line 100 - 'AtomItemsControl.js' */                var ae = new AtomEnumerator(items);
/*Line 101 - 'AtomItemsControl.js' */                while (ae.next()) {
/*Line 102 - 'AtomItemsControl.js' */                    //AtomBinder.addItem(this._selectedItems, ae.current());
/*Line 103 - 'AtomItemsControl.js' */                    this._selectedItems.push(ae.current());
/*Line 104 - 'AtomItemsControl.js' */                }
/*Line 105 - 'AtomItemsControl.js' */                AtomBinder.refreshItems(this._selectedItems);
/*Line 106 - 'AtomItemsControl.js' */            },
/*Line 107 - 'AtomItemsControl.js' */            set_sortPath: function (v) {
/*Line 108 - 'AtomItemsControl.js' */                this._sortPath = v;
/*Line 109 - 'AtomItemsControl.js' */                if (v) {
/*Line 110 - 'AtomItemsControl.js' */                    this.onCollectionChangedInternal("refresh", -1, null);
/*Line 111 - 'AtomItemsControl.js' */                }
/*Line 112 - 'AtomItemsControl.js' */            },
/*Line 113 - 'AtomItemsControl.js' */            set_selectAll: function (v) {
/*Line 114 - 'AtomItemsControl.js' */                if (v === undefined || v === null)
/*Line 115 - 'AtomItemsControl.js' */                    return;
/*Line 116 - 'AtomItemsControl.js' */                this._selectedItems.length = 0;
/*Line 117 - 'AtomItemsControl.js' */                var items = this.get_dataItems();
/*Line 118 - 'AtomItemsControl.js' */                if (v && items) {
/*Line 119 - 'AtomItemsControl.js' */                    var ae = new AtomEnumerator(items);
/*Line 120 - 'AtomItemsControl.js' */                    while (ae.next()) {
/*Line 121 - 'AtomItemsControl.js' */                        this._selectedItems.push(ae.current());
/*Line 122 - 'AtomItemsControl.js' */                    }
/*Line 123 - 'AtomItemsControl.js' */                }
/*Line 124 - 'AtomItemsControl.js' */                AtomBinder.refreshItems(this._selectedItems);
/*Line 125 - 'AtomItemsControl.js' */            },
/*Line 126 - 'AtomItemsControl.js' */            refresh: function () {
/*Line 127 - 'AtomItemsControl.js' */                if (this._promises && this._promises.items) {
/*Line 128 - 'AtomItemsControl.js' */                    this._promises.items.invoke();
/*Line 129 - 'AtomItemsControl.js' */                }

/*Line 131 - 'AtomItemsControl.js' */            },

/*Line 133 - 'AtomItemsControl.js' */            set_defaultValue: function (v) {
/*Line 134 - 'AtomItemsControl.js' */                if (this.get_value())
/*Line 135 - 'AtomItemsControl.js' */                    return;
/*Line 136 - 'AtomItemsControl.js' */                AtomBinder.setValue(this, "value", v);
/*Line 137 - 'AtomItemsControl.js' */            },
/*Line 138 - 'AtomItemsControl.js' */            invokePost: function () {
/*Line 139 - 'AtomItemsControl.js' */                if (!this._onUIChanged)
/*Line 140 - 'AtomItemsControl.js' */                    return;

/*Line 142 - 'AtomItemsControl.js' */                if (this._confirm) {
/*Line 143 - 'AtomItemsControl.js' */                    if (!confirm(this._confirmMessage))
/*Line 144 - 'AtomItemsControl.js' */                        return;
/*Line 145 - 'AtomItemsControl.js' */                }

/*Line 147 - 'AtomItemsControl.js' */                if (!this._postUrl) {
/*Line 148 - 'AtomItemsControl.js' */                    this.invokeAction(this._next);
/*Line 149 - 'AtomItemsControl.js' */                    return;
/*Line 150 - 'AtomItemsControl.js' */                }

/*Line 152 - 'AtomItemsControl.js' */                var data = this.get_postData();

/*Line 154 - 'AtomItemsControl.js' */                if (data === null || data === undefined)
/*Line 155 - 'AtomItemsControl.js' */                    return;

/*Line 157 - 'AtomItemsControl.js' */                data = AtomBinder.getClone(data);

/*Line 159 - 'AtomItemsControl.js' */                var caller = this;
/*Line 160 - 'AtomItemsControl.js' */                var p = AtomPromise.json(this._postUrl, null, { type: "POST", data: data });
/*Line 161 - 'AtomItemsControl.js' */                p.then(function () {
/*Line 162 - 'AtomItemsControl.js' */                    caller.invokeNext();
/*Line 163 - 'AtomItemsControl.js' */                });
/*Line 164 - 'AtomItemsControl.js' */                p.invoke();
/*Line 165 - 'AtomItemsControl.js' */            },

/*Line 167 - 'AtomItemsControl.js' */            invokeNext: function () {
/*Line 168 - 'AtomItemsControl.js' */                this.invokeAction(this._next);
/*Line 169 - 'AtomItemsControl.js' */            },

/*Line 171 - 'AtomItemsControl.js' */            set_filter: function (f) {
/*Line 172 - 'AtomItemsControl.js' */                if (f == this._filter)
/*Line 173 - 'AtomItemsControl.js' */                    return;
/*Line 174 - 'AtomItemsControl.js' */                this._filter = f;
/*Line 175 - 'AtomItemsControl.js' */                this._filteredItems = null;
/*Line 176 - 'AtomItemsControl.js' */                this.applyFilter();
/*Line 177 - 'AtomItemsControl.js' */            },

/*Line 179 - 'AtomItemsControl.js' */            applyFilter: function () {

/*Line 181 - 'AtomItemsControl.js' */                if (this._filter && this.hasItems()) {
/*Line 182 - 'AtomItemsControl.js' */                    this.onCollectionChangedInternal("refresh", -1, null);
/*Line 183 - 'AtomItemsControl.js' */                }

/*Line 185 - 'AtomItemsControl.js' */            },

/*Line 187 - 'AtomItemsControl.js' */            isSelected: function (item) {
/*Line 188 - 'AtomItemsControl.js' */                var se = new AtomEnumerator(this._selectedItems);
/*Line 189 - 'AtomItemsControl.js' */                var sitem = null;
/*Line 190 - 'AtomItemsControl.js' */                while (se.next()) {
/*Line 191 - 'AtomItemsControl.js' */                    sitem = se.current();
/*Line 192 - 'AtomItemsControl.js' */                    if (sitem == item) {
/*Line 193 - 'AtomItemsControl.js' */                        return true;
/*Line 194 - 'AtomItemsControl.js' */                    }
/*Line 195 - 'AtomItemsControl.js' */                }
/*Line 196 - 'AtomItemsControl.js' */                return false;
/*Line 197 - 'AtomItemsControl.js' */            },

/*Line 199 - 'AtomItemsControl.js' */            get_dataItems: function () {
/*Line 200 - 'AtomItemsControl.js' */                var r = this._items;
/*Line 201 - 'AtomItemsControl.js' */                if (this.hasItems()) {
/*Line 202 - 'AtomItemsControl.js' */                    var f = this._filter;
/*Line 203 - 'AtomItemsControl.js' */                    if (f) {
/*Line 204 - 'AtomItemsControl.js' */                        //if (this._filteredItems)
/*Line 205 - 'AtomItemsControl.js' */                        //    return this._filteredItems;
/*Line 206 - 'AtomItemsControl.js' */                        var a = [];
/*Line 207 - 'AtomItemsControl.js' */                        if (typeof f == 'object') {
/*Line 208 - 'AtomItemsControl.js' */                            a = Atom.query(r).where(f).toArray();
/*Line 209 - 'AtomItemsControl.js' */                        } else {
/*Line 210 - 'AtomItemsControl.js' */                            var ae = new AtomEnumerator(r);
/*Line 211 - 'AtomItemsControl.js' */                            while (ae.next()) {
/*Line 212 - 'AtomItemsControl.js' */                                var item = ae.current();
/*Line 213 - 'AtomItemsControl.js' */                                if (f(item, ae.currentIndex())) {
/*Line 214 - 'AtomItemsControl.js' */                                    a.push(item);
/*Line 215 - 'AtomItemsControl.js' */                                }
/*Line 216 - 'AtomItemsControl.js' */                            }
/*Line 217 - 'AtomItemsControl.js' */                        }
/*Line 218 - 'AtomItemsControl.js' */                        this._filteredItems = a;
/*Line 219 - 'AtomItemsControl.js' */                        r = a;
/*Line 220 - 'AtomItemsControl.js' */                    }

/*Line 222 - 'AtomItemsControl.js' */                    var sp = this._sortPath;
/*Line 223 - 'AtomItemsControl.js' */                    if (sp) {
/*Line 224 - 'AtomItemsControl.js' */                        if (sp.constructor == String) {

/*Line 226 - 'AtomItemsControl.js' */                            var desc = false;
/*Line 227 - 'AtomItemsControl.js' */                            var index = sp.indexOf(' ');
/*Line 228 - 'AtomItemsControl.js' */                            if (index != -1) {
/*Line 229 - 'AtomItemsControl.js' */                                var d = sp.substr(index + 1);
/*Line 230 - 'AtomItemsControl.js' */                                sp = sp.substr(0, index);
/*Line 231 - 'AtomItemsControl.js' */                                desc = /desc/gi.test(d);
/*Line 232 - 'AtomItemsControl.js' */                            }

/*Line 234 - 'AtomItemsControl.js' */                            var f = desc ? (function (a, b) {
/*Line 235 - 'AtomItemsControl.js' */                                return b[sp].localeCompare(a[sp]);
/*Line 236 - 'AtomItemsControl.js' */                            }) : (function (a, b) {
/*Line 237 - 'AtomItemsControl.js' */                                return a[sp].localeCompare(b[sp]);
/*Line 238 - 'AtomItemsControl.js' */                            });
/*Line 239 - 'AtomItemsControl.js' */                            r = r.sort(f);
/*Line 240 - 'AtomItemsControl.js' */                        } else {
/*Line 241 - 'AtomItemsControl.js' */                            r = r.sort(sp);
/*Line 242 - 'AtomItemsControl.js' */                        }
/*Line 243 - 'AtomItemsControl.js' */                    }
/*Line 244 - 'AtomItemsControl.js' */                    return r;
/*Line 245 - 'AtomItemsControl.js' */                }
/*Line 246 - 'AtomItemsControl.js' */                return $(this._itemsPresenter).children();
/*Line 247 - 'AtomItemsControl.js' */            },

/*Line 249 - 'AtomItemsControl.js' */            getIndexOfDataItem: function (item) {
/*Line 250 - 'AtomItemsControl.js' */                if (item == null)
/*Line 251 - 'AtomItemsControl.js' */                    return -1;
/*Line 252 - 'AtomItemsControl.js' */                var array = this.get_dataItems();
/*Line 253 - 'AtomItemsControl.js' */                var ae = new AtomEnumerator(array);
/*Line 254 - 'AtomItemsControl.js' */                while (ae.next()) {
/*Line 255 - 'AtomItemsControl.js' */                    if (ae.current() == item)
/*Line 256 - 'AtomItemsControl.js' */                        return ae.currentIndex();
/*Line 257 - 'AtomItemsControl.js' */                }
/*Line 258 - 'AtomItemsControl.js' */                return -1;
/*Line 259 - 'AtomItemsControl.js' */            },
/*Line 260 - 'AtomItemsControl.js' */            getDataItemAtIndex: function (index) {
/*Line 261 - 'AtomItemsControl.js' */                if (index == -1)
/*Line 262 - 'AtomItemsControl.js' */                    return null;
/*Line 263 - 'AtomItemsControl.js' */                return this.get_dataItems()[index];
/*Line 264 - 'AtomItemsControl.js' */            },

/*Line 266 - 'AtomItemsControl.js' */            get_childAtomControls: function () {
/*Line 267 - 'AtomItemsControl.js' */                var p = this._itemsPresenter || this._element;
/*Line 268 - 'AtomItemsControl.js' */                var r = [];
/*Line 269 - 'AtomItemsControl.js' */                var ce = new ChildEnumerator(p);
/*Line 270 - 'AtomItemsControl.js' */                while (ce.next()) {
/*Line 271 - 'AtomItemsControl.js' */                    var a = ce.current();
/*Line 272 - 'AtomItemsControl.js' */                    a = !a || a.atomControl;
/*Line 273 - 'AtomItemsControl.js' */                    if (!a)
/*Line 274 - 'AtomItemsControl.js' */                        continue;
/*Line 275 - 'AtomItemsControl.js' */                    r.push(a);
/*Line 276 - 'AtomItemsControl.js' */                }
/*Line 277 - 'AtomItemsControl.js' */                return r;
/*Line 278 - 'AtomItemsControl.js' */            },

/*Line 280 - 'AtomItemsControl.js' */            get_selectedChild: function () {
/*Line 281 - 'AtomItemsControl.js' */                var item = this.get_selectedItem();
/*Line 282 - 'AtomItemsControl.js' */                if (!this.hasItems())
/*Line 283 - 'AtomItemsControl.js' */                    return item;
/*Line 284 - 'AtomItemsControl.js' */                var ce = new ChildEnumerator(this._itemsPresenter);
/*Line 285 - 'AtomItemsControl.js' */                while (ce.next()) {
/*Line 286 - 'AtomItemsControl.js' */                    var child = ce.current();
/*Line 287 - 'AtomItemsControl.js' */                    if (child.atomControl.get_data() == item)
/*Line 288 - 'AtomItemsControl.js' */                        return child;
/*Line 289 - 'AtomItemsControl.js' */                }
/*Line 290 - 'AtomItemsControl.js' */                return null;
/*Line 291 - 'AtomItemsControl.js' */            },

/*Line 293 - 'AtomItemsControl.js' */            set_allowSelectFirst: function (b) {
/*Line 294 - 'AtomItemsControl.js' */                b = b ? b != "false" : b;
/*Line 295 - 'AtomItemsControl.js' */                this._allowSelectFirst = b;
/*Line 296 - 'AtomItemsControl.js' */            },

/*Line 298 - 'AtomItemsControl.js' */            get_selectedItem: function () {
/*Line 299 - 'AtomItemsControl.js' */                if (this._selectedItems.length > 0)
/*Line 300 - 'AtomItemsControl.js' */                    return this._selectedItems[0];
/*Line 301 - 'AtomItemsControl.js' */                return null;
/*Line 302 - 'AtomItemsControl.js' */            },
/*Line 303 - 'AtomItemsControl.js' */            set_selectedItem: function (value) {
/*Line 304 - 'AtomItemsControl.js' */                if (value) {
/*Line 305 - 'AtomItemsControl.js' */                    this._selectedItems.length = 1;
/*Line 306 - 'AtomItemsControl.js' */                    this._selectedItems[0] = value;
/*Line 307 - 'AtomItemsControl.js' */                } else {
/*Line 308 - 'AtomItemsControl.js' */                    this._selectedItems.length = 0;
/*Line 309 - 'AtomItemsControl.js' */                }
/*Line 310 - 'AtomItemsControl.js' */                AtomBinder.refreshItems(this._selectedItems);
/*Line 311 - 'AtomItemsControl.js' */            },

/*Line 313 - 'AtomItemsControl.js' */            get_selectedItems: function () {
/*Line 314 - 'AtomItemsControl.js' */                return this._selectedItems;
/*Line 315 - 'AtomItemsControl.js' */            },
/*Line 316 - 'AtomItemsControl.js' */            set_selectedItems: function () {
/*Line 317 - 'AtomItemsControl.js' */                // watching !!!
/*Line 318 - 'AtomItemsControl.js' */                // updating !!!
/*Line 319 - 'AtomItemsControl.js' */                throw new Error("Not yet implemented");
/*Line 320 - 'AtomItemsControl.js' */            },

/*Line 322 - 'AtomItemsControl.js' */            get_selectedIndex: function () {
/*Line 323 - 'AtomItemsControl.js' */                var item = this.get_selectedItem();
/*Line 324 - 'AtomItemsControl.js' */                return this.getIndexOfDataItem(item);
/*Line 325 - 'AtomItemsControl.js' */            },
/*Line 326 - 'AtomItemsControl.js' */            set_selectedIndex: function (value) {
/*Line 327 - 'AtomItemsControl.js' */                AtomBinder.setValue(this, "selectedItem", this.getDataItemAtIndex(value));
/*Line 328 - 'AtomItemsControl.js' */            },

/*Line 330 - 'AtomItemsControl.js' */            updateChildSelections: function (type, index, item) {

/*Line 332 - 'AtomItemsControl.js' */            },

/*Line 334 - 'AtomItemsControl.js' */            bringSelectionIntoView: function () {

/*Line 336 - 'AtomItemsControl.js' */                // do not scroll for first auto select 
/*Line 337 - 'AtomItemsControl.js' */                if (this._allowSelectFirst && this.get_selectedIndex() == 0)
/*Line 338 - 'AtomItemsControl.js' */                    return;

/*Line 340 - 'AtomItemsControl.js' */                //var children = $(this._itemsPresenter).children();
/*Line 341 - 'AtomItemsControl.js' */                var ae = new ChildEnumerator(this._itemsPresenter);
/*Line 342 - 'AtomItemsControl.js' */                while (ae.next()) {
/*Line 343 - 'AtomItemsControl.js' */                    var item = ae.current();
/*Line 344 - 'AtomItemsControl.js' */                    var dataItem = item.atomControl ? item.atomControl.get_data() : item;
/*Line 345 - 'AtomItemsControl.js' */                    if (this.isSelected(dataItem)) {
/*Line 346 - 'AtomItemsControl.js' */                        item.scrollIntoView();
/*Line 347 - 'AtomItemsControl.js' */                        return;
/*Line 348 - 'AtomItemsControl.js' */                    }
/*Line 349 - 'AtomItemsControl.js' */                }
/*Line 350 - 'AtomItemsControl.js' */            },

/*Line 352 - 'AtomItemsControl.js' */            updateSelectionBindings: function () {
/*Line 353 - 'AtomItemsControl.js' */                AtomBinder.refreshValue(this, "value");
/*Line 354 - 'AtomItemsControl.js' */                AtomBinder.refreshValue(this, "selectedItem");
/*Line 355 - 'AtomItemsControl.js' */                AtomBinder.refreshValue(this, "selectedItems");
/*Line 356 - 'AtomItemsControl.js' */                AtomBinder.refreshValue(this, "selectedIndex");
/*Line 357 - 'AtomItemsControl.js' */            },

/*Line 359 - 'AtomItemsControl.js' */            onSelectedItemsChanged: function (type, index, item) {
/*Line 360 - 'AtomItemsControl.js' */                if (!this._onUIChanged) {
/*Line 361 - 'AtomItemsControl.js' */                    this.updateChildSelections(type, index, item);
/*Line 362 - 'AtomItemsControl.js' */                    if (this._autoScrollToSelection) {
/*Line 363 - 'AtomItemsControl.js' */                        this.bringSelectionIntoView();
/*Line 364 - 'AtomItemsControl.js' */                    }
/*Line 365 - 'AtomItemsControl.js' */                }
/*Line 366 - 'AtomItemsControl.js' */                this.updateSelectionBindings();
/*Line 367 - 'AtomItemsControl.js' */                this.updateUI();

/*Line 369 - 'AtomItemsControl.js' */                this.invokePost();
/*Line 370 - 'AtomItemsControl.js' */            },


/*Line 373 - 'AtomItemsControl.js' */            hasItems: function () {
/*Line 374 - 'AtomItemsControl.js' */                return this._items != undefined && this._items != null;
/*Line 375 - 'AtomItemsControl.js' */            },

/*Line 377 - 'AtomItemsControl.js' */            get_items: function () {
/*Line 378 - 'AtomItemsControl.js' */                return this._items;
/*Line 379 - 'AtomItemsControl.js' */            },
/*Line 380 - 'AtomItemsControl.js' */            set_items: function (v) {
/*Line 381 - 'AtomItemsControl.js' */                var _this = this;
/*Line 382 - 'AtomItemsControl.js' */                if (this._items) {
/*Line 383 - 'AtomItemsControl.js' */                    this.unbindEvent(this._items, "CollectionChanged", null);
/*Line 384 - 'AtomItemsControl.js' */                }
/*Line 385 - 'AtomItemsControl.js' */                this._items = v;
/*Line 386 - 'AtomItemsControl.js' */                this._filteredItems = null;
/*Line 387 - 'AtomItemsControl.js' */                // try starting observing....
/*Line 388 - 'AtomItemsControl.js' */                if (v != null) {
/*Line 389 - 'AtomItemsControl.js' */                    this.bindEvent(this._items, "CollectionChanged", function () {
/*Line 390 - 'AtomItemsControl.js' */                        _this.onCollectionChangedInternal.apply(_this, arguments);
/*Line 391 - 'AtomItemsControl.js' */                    });
/*Line 392 - 'AtomItemsControl.js' */                    this.onCollectionChangedInternal("refresh", -1, null);
/*Line 393 - 'AtomItemsControl.js' */                }
/*Line 394 - 'AtomItemsControl.js' */            },
/*Line 395 - 'AtomItemsControl.js' */            set_itemTemplate: function (v) {
/*Line 396 - 'AtomItemsControl.js' */                this._itemTemplate = v;
/*Line 397 - 'AtomItemsControl.js' */                this.onCollectionChangedInternal("refresh", -1, null);
/*Line 398 - 'AtomItemsControl.js' */            },

/*Line 400 - 'AtomItemsControl.js' */            onCollectionChangedInternal: function (mode, index, item) {
/*Line 401 - 'AtomItemsControl.js' */                if (!this._created)
/*Line 402 - 'AtomItemsControl.js' */                    return;

/*Line 404 - 'AtomItemsControl.js' */                Atom.refresh(this, "allValues");

/*Line 406 - 'AtomItemsControl.js' */                var value = this.get_value();

/*Line 408 - 'AtomItemsControl.js' */                if (this.hasItems()) {
/*Line 409 - 'AtomItemsControl.js' */                    this.onCollectionChanged(mode, index, item);
/*Line 410 - 'AtomItemsControl.js' */                    //this._selectedItems.length = 0;
/*Line 411 - 'AtomItemsControl.js' */                    if (!(value || this._allowSelectFirst)) {
/*Line 412 - 'AtomItemsControl.js' */                        AtomBinder.clear(this._selectedItems);
/*Line 413 - 'AtomItemsControl.js' */                    }
/*Line 414 - 'AtomItemsControl.js' */                }


/*Line 417 - 'AtomItemsControl.js' */                if (value != null) {
/*Line 418 - 'AtomItemsControl.js' */                    this.set_value(value);
/*Line 419 - 'AtomItemsControl.js' */                    if (this.get_selectedIndex() != -1)
/*Line 420 - 'AtomItemsControl.js' */                        return;
/*Line 421 - 'AtomItemsControl.js' */                }

/*Line 423 - 'AtomItemsControl.js' */                this.selectDefault();

/*Line 425 - 'AtomItemsControl.js' */            },

/*Line 427 - 'AtomItemsControl.js' */            selectDefault: function () {


/*Line 430 - 'AtomItemsControl.js' */                if (this._allowSelectFirst) {
/*Line 431 - 'AtomItemsControl.js' */                    if (this.get_dataItems().length > 0) {
/*Line 432 - 'AtomItemsControl.js' */                        this.set_selectedIndex(0);
/*Line 433 - 'AtomItemsControl.js' */                        return;
/*Line 434 - 'AtomItemsControl.js' */                    }
/*Line 435 - 'AtomItemsControl.js' */                }

/*Line 437 - 'AtomItemsControl.js' */                this.updateSelectionBindings();
/*Line 438 - 'AtomItemsControl.js' */            },

/*Line 440 - 'AtomItemsControl.js' */            onScroll: function () {
/*Line 441 - 'AtomItemsControl.js' */                if (this.scrollTimeout) {
/*Line 442 - 'AtomItemsControl.js' */                    clearTimeout(this.scrollTimeout);
/*Line 443 - 'AtomItemsControl.js' */                }
/*Line 444 - 'AtomItemsControl.js' */                var _this = this;
/*Line 445 - 'AtomItemsControl.js' */                this.scrollTimeout = setTimeout(function () {
/*Line 446 - 'AtomItemsControl.js' */                    _this.scrollTimeout = 0;
/*Line 447 - 'AtomItemsControl.js' */                    _this.onCollectionChangedInternal("refresh", -1, null);
/*Line 448 - 'AtomItemsControl.js' */                }, 1000);
/*Line 449 - 'AtomItemsControl.js' */            },

/*Line 451 - 'AtomItemsControl.js' */            onCollectionChanged: function (mode, index, item) {


/*Line 454 - 'AtomItemsControl.js' */                // just reset for now...
/*Line 455 - 'AtomItemsControl.js' */                if (/remove/gi.test(mode)) {
/*Line 456 - 'AtomItemsControl.js' */                    // simply delete and remove...
/*Line 457 - 'AtomItemsControl.js' */                    var ce = new ChildEnumerator(this._itemsPresenter);
/*Line 458 - 'AtomItemsControl.js' */                    while (ce.next()) {
/*Line 459 - 'AtomItemsControl.js' */                        var c = ce.current();
/*Line 460 - 'AtomItemsControl.js' */                        if (c.atomControl && c.atomControl.get_data() == item) {
/*Line 461 - 'AtomItemsControl.js' */                            c.atomControl.dispose();
/*Line 462 - 'AtomItemsControl.js' */                            $(c).remove();
/*Line 463 - 'AtomItemsControl.js' */                            break;
/*Line 464 - 'AtomItemsControl.js' */                        }
/*Line 465 - 'AtomItemsControl.js' */                    }
/*Line 466 - 'AtomItemsControl.js' */                    this.updateUI();
/*Line 467 - 'AtomItemsControl.js' */                    return;
/*Line 468 - 'AtomItemsControl.js' */                }

/*Line 470 - 'AtomItemsControl.js' */                var parentScope = this.get_scope();

/*Line 472 - 'AtomItemsControl.js' */                var et = this.getTemplate("itemTemplate");
/*Line 473 - 'AtomItemsControl.js' */                if (et) {
/*Line 474 - 'AtomItemsControl.js' */                    et = $(et).attr("atom-type");
/*Line 475 - 'AtomItemsControl.js' */                    if (et) {
/*Line 476 - 'AtomItemsControl.js' */                        this._childItemType = et;
/*Line 477 - 'AtomItemsControl.js' */                    }
/*Line 478 - 'AtomItemsControl.js' */                }

/*Line 480 - 'AtomItemsControl.js' */                if (/add/gi.test(mode)) {
/*Line 481 - 'AtomItemsControl.js' */                    WebAtoms.dispatcher.pause();

/*Line 483 - 'AtomItemsControl.js' */                    var ae = new AtomEnumerator(this._items);
/*Line 484 - 'AtomItemsControl.js' */                    var ce = new ChildEnumerator(this._itemsPresenter);
/*Line 485 - 'AtomItemsControl.js' */                    while (ae.next()) {
/*Line 486 - 'AtomItemsControl.js' */                        ce.next();
/*Line 487 - 'AtomItemsControl.js' */                        var c = ce.current();
/*Line 488 - 'AtomItemsControl.js' */                        if (ae.currentIndex() == index) {
/*Line 489 - 'AtomItemsControl.js' */                            var ctrl = this.createChildElement(parentScope, this._itemsPresenter, item, ae, c);
/*Line 490 - 'AtomItemsControl.js' */                            this.applyItemStyle(ctrl, item, ae.isFirst(), ae.isLast());
/*Line 491 - 'AtomItemsControl.js' */                            break;
/*Line 492 - 'AtomItemsControl.js' */                        }
/*Line 493 - 'AtomItemsControl.js' */                        if (ae.isLast()) {
/*Line 494 - 'AtomItemsControl.js' */                            var ctrl = this.createChildElement(parentScope, this._itemsPresenter, item, ae);
/*Line 495 - 'AtomItemsControl.js' */                            this.applyItemStyle(ctrl, item, ae.isFirst(), ae.isLast());
/*Line 496 - 'AtomItemsControl.js' */                            break;
/*Line 497 - 'AtomItemsControl.js' */                        }
/*Line 498 - 'AtomItemsControl.js' */                    }

/*Line 500 - 'AtomItemsControl.js' */                    WebAtoms.dispatcher.start();
/*Line 501 - 'AtomItemsControl.js' */                    this.updateUI();
/*Line 502 - 'AtomItemsControl.js' */                    return;
/*Line 503 - 'AtomItemsControl.js' */                }

/*Line 505 - 'AtomItemsControl.js' */                var element = this._itemsPresenter;

/*Line 507 - 'AtomItemsControl.js' */                var dataItems = this.get_dataItems();


/*Line 510 - 'AtomItemsControl.js' */                //AtomUI.removeAllChildren(element);
/*Line 511 - 'AtomItemsControl.js' */                this.disposeChildren(element);
/*Line 512 - 'AtomItemsControl.js' */                //this._dataElements.length = 0;
/*Line 513 - 'AtomItemsControl.js' */                // rebuild from template...

/*Line 515 - 'AtomItemsControl.js' */                WebAtoms.dispatcher.pause();

/*Line 517 - 'AtomItemsControl.js' */                // implement stock...


/*Line 520 - 'AtomItemsControl.js' */                var items = this.get_dataItems(true);


/*Line 523 - 'AtomItemsControl.js' */                var ae = new AtomEnumerator(items);

/*Line 525 - 'AtomItemsControl.js' */                if (false) {


/*Line 528 - 'AtomItemsControl.js' */                    if (this._itemsPresenter == this._element) {
/*Line 529 - 'AtomItemsControl.js' */                        var d = document.createElement("DIV");
/*Line 530 - 'AtomItemsControl.js' */                        $(d).addClass("atom-virtual-container");
/*Line 531 - 'AtomItemsControl.js' */                        $(d).css("width", "100%");
/*Line 532 - 'AtomItemsControl.js' */                        this._element.innerHTML = "";
/*Line 533 - 'AtomItemsControl.js' */                        this._element.appendChild(d);
/*Line 534 - 'AtomItemsControl.js' */                        this._itemsPresenter = d;
/*Line 535 - 'AtomItemsControl.js' */                        element = this._itemsPresenter;
/*Line 536 - 'AtomItemsControl.js' */                    }

/*Line 538 - 'AtomItemsControl.js' */                    var scroller = this._itemsPresenter.parentElement;
/*Line 539 - 'AtomItemsControl.js' */                    var st = scroller.scrollTop;
/*Line 540 - 'AtomItemsControl.js' */                    var sh = scroller.scrollHeight;

/*Line 542 - 'AtomItemsControl.js' */                    this.unbindEvent(scroller, "scroll");

/*Line 544 - 'AtomItemsControl.js' */                    var n = items.length;
/*Line 545 - 'AtomItemsControl.js' */                    var presenterWidth = $(this._itemsPresenter).innerWidth();



/*Line 549 - 'AtomItemsControl.js' */                    var t = this.getTemplate("itemTemplate");
/*Line 550 - 'AtomItemsControl.js' */                    var h = $(t).outerHeight(true);
/*Line 551 - 'AtomItemsControl.js' */                    var w = $(t).outerWidth(true);

/*Line 553 - 'AtomItemsControl.js' */                    var cols = Math.floor(presenterWidth / w);
/*Line 554 - 'AtomItemsControl.js' */                    var rows = Math.ceil(n / cols);

/*Line 556 - 'AtomItemsControl.js' */                    rows = rows * h + 100;

/*Line 558 - 'AtomItemsControl.js' */                    $(this.itemsPresenter).height(rows);

/*Line 560 - 'AtomItemsControl.js' */                    var copy = document.createElement("DIV");
/*Line 561 - 'AtomItemsControl.js' */                    copy.style.height = h + "px";
/*Line 562 - 'AtomItemsControl.js' */                    copy.style.width = w + "px";


/*Line 565 - 'AtomItemsControl.js' */                    var sw = $(element).innerWidth();

/*Line 567 - 'AtomItemsControl.js' */                    var itemsPerLine = Math.ceil(presenterWidth / w);
/*Line 568 - 'AtomItemsControl.js' */                    var hiddenLines = Math.ceil( st / h );
/*Line 569 - 'AtomItemsControl.js' */                    var visibleLines = Math.ceil(sh / h);
/*Line 570 - 'AtomItemsControl.js' */                    var si = hiddenLines * itemsPerLine;

/*Line 572 - 'AtomItemsControl.js' */                    if (!itemsPerLine) {
/*Line 573 - 'AtomItemsControl.js' */                        console.log("itemsPerLine is zero");
/*Line 574 - 'AtomItemsControl.js' */                    } else {
/*Line 575 - 'AtomItemsControl.js' */                        console.log(JSON.stringify({ itemsPerLine: itemsPerLine, st: st, sh: sh, si : si }));
/*Line 576 - 'AtomItemsControl.js' */                    }

/*Line 578 - 'AtomItemsControl.js' */                    var ei = (visibleLines + 1) * itemsPerLine;

/*Line 580 - 'AtomItemsControl.js' */                    while (ae.next()) {
/*Line 581 - 'AtomItemsControl.js' */                        var i = ae.currentIndex();
/*Line 582 - 'AtomItemsControl.js' */                        if (i < si || i > ei) {
/*Line 583 - 'AtomItemsControl.js' */                            // add a copy...
/*Line 584 - 'AtomItemsControl.js' */                            element.appendChild(copy.cloneNode(true));
/*Line 585 - 'AtomItemsControl.js' */                        } else {
/*Line 586 - 'AtomItemsControl.js' */                            var data = ae.current();
/*Line 587 - 'AtomItemsControl.js' */                            var elementChild = this.createChildElement(parentScope, element, data, ae);
/*Line 588 - 'AtomItemsControl.js' */                            this.applyItemStyle(elementChild, data, ae.isFirst(), ae.isLast());
/*Line 589 - 'AtomItemsControl.js' */                        }
/*Line 590 - 'AtomItemsControl.js' */                    }

/*Line 592 - 'AtomItemsControl.js' */                    scroller.scrollTop = st;
/*Line 593 - 'AtomItemsControl.js' */                    var _this = this;
/*Line 594 - 'AtomItemsControl.js' */                    this.bindEvent(scroller, "scroll", function () {
/*Line 595 - 'AtomItemsControl.js' */                        _this.onScroll();
/*Line 596 - 'AtomItemsControl.js' */                    });


/*Line 599 - 'AtomItemsControl.js' */                } else {

/*Line 601 - 'AtomItemsControl.js' */                    while (ae.next()) {
/*Line 602 - 'AtomItemsControl.js' */                        var data = ae.current();
/*Line 603 - 'AtomItemsControl.js' */                        var elementChild = this.createChildElement(parentScope, element, data, ae);
/*Line 604 - 'AtomItemsControl.js' */                        this.applyItemStyle(elementChild, data, ae.isFirst(), ae.isLast());
/*Line 605 - 'AtomItemsControl.js' */                    }
/*Line 606 - 'AtomItemsControl.js' */                }

/*Line 608 - 'AtomItemsControl.js' */                //var ae = new AtomEnumerator(items);
/*Line 609 - 'AtomItemsControl.js' */                //while (ae.next()) {
/*Line 610 - 'AtomItemsControl.js' */                //    var data = ae.current();
/*Line 611 - 'AtomItemsControl.js' */                //    var elementChild = this.createChildElement(parentScope, element, data, ae);
/*Line 612 - 'AtomItemsControl.js' */                //    this.applyItemStyle(elementChild, data, ae.isFirst(), ae.isLast());
/*Line 613 - 'AtomItemsControl.js' */                //}



/*Line 617 - 'AtomItemsControl.js' */                WebAtoms.dispatcher.start();

/*Line 619 - 'AtomItemsControl.js' */                AtomBinder.refreshValue(this, "childAtomControls");


/*Line 622 - 'AtomItemsControl.js' */            },

/*Line 624 - 'AtomItemsControl.js' */            set_innerTemplate: function (v) {
/*Line 625 - 'AtomItemsControl.js' */                this._itemsPresenter = this._element;
/*Line 626 - 'AtomItemsControl.js' */                base.set_innerTemplate.apply(this, arguments);
/*Line 627 - 'AtomItemsControl.js' */                this.onCollectionChangedInternal("mode", -1, null);
/*Line 628 - 'AtomItemsControl.js' */            },

/*Line 630 - 'AtomItemsControl.js' */            applyItemStyle: function (item, dataItem, first, last) {
/*Line 631 - 'AtomItemsControl.js' */            },

/*Line 633 - 'AtomItemsControl.js' */            createChildElement: function (parentScope, parentElement, data, ae, before) {
/*Line 634 - 'AtomItemsControl.js' */                //if (!this._template)
/*Line 635 - 'AtomItemsControl.js' */                //    return null;

/*Line 637 - 'AtomItemsControl.js' */                this.getTemplate("itemTemplate");

/*Line 639 - 'AtomItemsControl.js' */                var elementChild = AtomUI.cloneNode(this._itemTemplate);
/*Line 640 - 'AtomItemsControl.js' */                elementChild._templateParent = this;
/*Line 641 - 'AtomItemsControl.js' */                if (before) {
/*Line 642 - 'AtomItemsControl.js' */                    parentElement.insertBefore(elementChild, before);
/*Line 643 - 'AtomItemsControl.js' */                } else {
/*Line 644 - 'AtomItemsControl.js' */                    parentElement.appendChild(elementChild);
/*Line 645 - 'AtomItemsControl.js' */                }

/*Line 647 - 'AtomItemsControl.js' */                var scope = new AtomScope(this, parentScope, parentScope.__application);
/*Line 648 - 'AtomItemsControl.js' */                if (ae) {
/*Line 649 - 'AtomItemsControl.js' */                    scope.itemIsFirst = ae.isFirst();
/*Line 650 - 'AtomItemsControl.js' */                    scope.itemIsLast = ae.isLast();
/*Line 651 - 'AtomItemsControl.js' */                    scope.itemIndex = ae.currentIndex();
/*Line 652 - 'AtomItemsControl.js' */                    scope.itemExpanded = false;
/*Line 653 - 'AtomItemsControl.js' */                    scope.data = data;
/*Line 654 - 'AtomItemsControl.js' */                    scope.get_itemSelected = function () {
/*Line 655 - 'AtomItemsControl.js' */                        return scope.owner.isSelected(data);
/*Line 656 - 'AtomItemsControl.js' */                    };
/*Line 657 - 'AtomItemsControl.js' */                    scope.set_itemSelected = function (v) {
/*Line 658 - 'AtomItemsControl.js' */                        scope.owner.toggleSelection(data, true);
/*Line 659 - 'AtomItemsControl.js' */                    };
/*Line 660 - 'AtomItemsControl.js' */                }

/*Line 662 - 'AtomItemsControl.js' */                var ac = AtomUI.createControl(elementChild, this._childItemType, data, scope);
/*Line 663 - 'AtomItemsControl.js' */                return elementChild;
/*Line 664 - 'AtomItemsControl.js' */            },

/*Line 666 - 'AtomItemsControl.js' */            toggleSelection: function (data) {
/*Line 667 - 'AtomItemsControl.js' */                this._onUIChanged = true;
/*Line 668 - 'AtomItemsControl.js' */                this._value = undefined;
/*Line 669 - 'AtomItemsControl.js' */                if (this._allowMultipleSelection) {
/*Line 670 - 'AtomItemsControl.js' */                    if (AtomUI.contains(this._selectedItems, data)) {
/*Line 671 - 'AtomItemsControl.js' */                        AtomBinder.removeItem(this._selectedItems, data);
/*Line 672 - 'AtomItemsControl.js' */                    } else {
/*Line 673 - 'AtomItemsControl.js' */                        AtomBinder.addItem(this._selectedItems, data);
/*Line 674 - 'AtomItemsControl.js' */                    }
/*Line 675 - 'AtomItemsControl.js' */                } else {
/*Line 676 - 'AtomItemsControl.js' */                    this._selectedItems.length = 1;
/*Line 677 - 'AtomItemsControl.js' */                    this._selectedItems[0] = data;
/*Line 678 - 'AtomItemsControl.js' */                    AtomBinder.refreshItems(this._selectedItems);
/*Line 679 - 'AtomItemsControl.js' */                }
/*Line 680 - 'AtomItemsControl.js' */                this._onUIChanged = false;
/*Line 681 - 'AtomItemsControl.js' */            },

/*Line 683 - 'AtomItemsControl.js' */            onUpdateUI: function () {
/*Line 684 - 'AtomItemsControl.js' */                base.onUpdateUI.call(this);
/*Line 685 - 'AtomItemsControl.js' */                var ae = new ChildEnumerator(this._itemsPresenter);
/*Line 686 - 'AtomItemsControl.js' */                while (ae.next()) {
/*Line 687 - 'AtomItemsControl.js' */                    var item = ae.current();
/*Line 688 - 'AtomItemsControl.js' */                    if (!item.atomControl)
/*Line 689 - 'AtomItemsControl.js' */                        continue;
/*Line 690 - 'AtomItemsControl.js' */                    var dataItem = item.atomControl.get_data();
/*Line 691 - 'AtomItemsControl.js' */                    AtomBinder.refreshValue(item.atomControl.get_scope(), "itemSelected");
/*Line 692 - 'AtomItemsControl.js' */                    this.applyItemStyle(item, dataItem, ae.isFirst(), ae.isLast());
/*Line 693 - 'AtomItemsControl.js' */                }
/*Line 694 - 'AtomItemsControl.js' */            },

/*Line 696 - 'AtomItemsControl.js' */            onCreated: function () {


/*Line 699 - 'AtomItemsControl.js' */                if (this._items) {
/*Line 700 - 'AtomItemsControl.js' */                    this.onCollectionChangedInternal("refresh", -1, null);
/*Line 701 - 'AtomItemsControl.js' */                }

/*Line 703 - 'AtomItemsControl.js' */                var caller = this;

/*Line 705 - 'AtomItemsControl.js' */                this.dispatcher.callLater(function () {
/*Line 706 - 'AtomItemsControl.js' */                    if (caller._autoScrollToSelection) {
/*Line 707 - 'AtomItemsControl.js' */                        caller.bringSelectionIntoView();
/*Line 708 - 'AtomItemsControl.js' */                    }
/*Line 709 - 'AtomItemsControl.js' */                });

/*Line 711 - 'AtomItemsControl.js' */            },


/*Line 714 - 'AtomItemsControl.js' */            init: function () {

/*Line 716 - 'AtomItemsControl.js' */                var element = this.get_element();


/*Line 719 - 'AtomItemsControl.js' */                // set self as Items Presenter..
/*Line 720 - 'AtomItemsControl.js' */                if (!this._itemsPresenter) {
/*Line 721 - 'AtomItemsControl.js' */                    this._itemsPresenter = this._element;
/*Line 722 - 'AtomItemsControl.js' */                }
/*Line 723 - 'AtomItemsControl.js' */                else {
/*Line 724 - 'AtomItemsControl.js' */                    //this._layout = WebAtoms.AtomViewBoxLayout.defaultInstnace;
/*Line 725 - 'AtomItemsControl.js' */                }

/*Line 727 - 'AtomItemsControl.js' */                var _this = this;
/*Line 728 - 'AtomItemsControl.js' */                this.bindEvent(this._selectedItems, "CollectionChanged", function () {
/*Line 729 - 'AtomItemsControl.js' */                    _this.onSelectedItemsChanged.apply(_this, arguments);
/*Line 730 - 'AtomItemsControl.js' */                });
/*Line 731 - 'AtomItemsControl.js' */                base.init.apply(this, arguments);


/*Line 734 - 'AtomItemsControl.js' */                var caller = this;

/*Line 736 - 'AtomItemsControl.js' */                this.removeItemCommand = function (scope, sender) {
/*Line 737 - 'AtomItemsControl.js' */                    if (!sender)
/*Line 738 - 'AtomItemsControl.js' */                        return;
/*Line 739 - 'AtomItemsControl.js' */                    var d = sender.get_data();
/*Line 740 - 'AtomItemsControl.js' */                    AtomBinder.removeItem(caller._items, d);
/*Line 741 - 'AtomItemsControl.js' */                };

/*Line 743 - 'AtomItemsControl.js' */                this.removeSelectedCommand = function (scope, sender) {
/*Line 744 - 'AtomItemsControl.js' */                    var s = caller.get_selectedItems().slice(0);
/*Line 745 - 'AtomItemsControl.js' */                    var ae = new AtomEnumerator(s);
/*Line 746 - 'AtomItemsControl.js' */                    while (ae.next()) {
/*Line 747 - 'AtomItemsControl.js' */                        AtomBinder.removeItem(caller.get_items(), ae.current());
/*Line 748 - 'AtomItemsControl.js' */                    }
/*Line 749 - 'AtomItemsControl.js' */                };

/*Line 751 - 'AtomItemsControl.js' */                this.removeAllCommand = function (scope, sender) {
/*Line 752 - 'AtomItemsControl.js' */                    AtomBinder.clear(caller.get_items());
/*Line 753 - 'AtomItemsControl.js' */                };
/*Line 754 - 'AtomItemsControl.js' */            }
/*Line 755 - 'AtomItemsControl.js' */        }
/*Line 756 - 'AtomItemsControl.js' */    });
/*Line 757 - 'AtomItemsControl.js' */})(window, WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomButton.js' */

/*Line 2 - 'AtomButton.js' */(function (window, base) {
/*Line 3 - 'AtomButton.js' */    return classCreatorEx(
/*Line 4 - 'AtomButton.js' */    {
/*Line 5 - 'AtomButton.js' */        name: "WebAtoms.AtomButton",
/*Line 6 - 'AtomButton.js' */        base: base,
/*Line 7 - 'AtomButton.js' */        start: function (e) {
/*Line 8 - 'AtomButton.js' */            this._sendData = false;
/*Line 9 - 'AtomButton.js' */            $(e).addClass("atom-button");
/*Line 10 - 'AtomButton.js' */        },
/*Line 11 - 'AtomButton.js' */        properties: {
/*Line 12 - 'AtomButton.js' */            sendData: false
/*Line 13 - 'AtomButton.js' */        },
/*Line 14 - 'AtomButton.js' */        methods: {
/*Line 15 - 'AtomButton.js' */            onClickHandler: function (e) {

/*Line 17 - 'AtomButton.js' */                AtomUI.cancelEvent(e);

/*Line 19 - 'AtomButton.js' */                if (this._next) {
/*Line 20 - 'AtomButton.js' */                    if (this._sendData && this._next) {
/*Line 21 - 'AtomButton.js' */                        AtomBinder.setValue(this._next, "data", this.get_data());
/*Line 22 - 'AtomButton.js' */                    }
/*Line 23 - 'AtomButton.js' */                    this.invokeAction(this._next);
/*Line 24 - 'AtomButton.js' */                }
/*Line 25 - 'AtomButton.js' */                return false;
/*Line 26 - 'AtomButton.js' */            },

/*Line 28 - 'AtomButton.js' */            init: function () {

/*Line 30 - 'AtomButton.js' */                var element = this._element;
/*Line 31 - 'AtomButton.js' */                this.bindEvent(element, "click", "onClickHandler");
/*Line 32 - 'AtomButton.js' */                base.init.apply(this);
/*Line 33 - 'AtomButton.js' */            }
/*Line 34 - 'AtomButton.js' */        }

/*Line 36 - 'AtomButton.js' */    });
/*Line 37 - 'AtomButton.js' */})(window, WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomDockPanel.js' */

/*Line 2 - 'AtomDockPanel.js' */(function (window, base) {

/*Line 4 - 'AtomDockPanel.js' */    var AtomUI = window.AtomUI;

/*Line 6 - 'AtomDockPanel.js' */    return classCreatorEx({
/*Line 7 - 'AtomDockPanel.js' */        name: "WebAtoms.AtomDockPanel",
/*Line 8 - 'AtomDockPanel.js' */        base: base,
/*Line 9 - 'AtomDockPanel.js' */        start: function (e) {
/*Line 10 - 'AtomDockPanel.js' */            $(e).addClass("atom-dock-panel");
/*Line 11 - 'AtomDockPanel.js' */        },
/*Line 12 - 'AtomDockPanel.js' */        properties: {
/*Line 13 - 'AtomDockPanel.js' */            resizeOnChildResized: false
/*Line 14 - 'AtomDockPanel.js' */        },
/*Line 15 - 'AtomDockPanel.js' */        methods: {
/*Line 16 - 'AtomDockPanel.js' */            resizeChild: function (item) {
/*Line 17 - 'AtomDockPanel.js' */                if (item.atomControl) {
/*Line 18 - 'AtomDockPanel.js' */                    item.atomControl.updateUI();
/*Line 19 - 'AtomDockPanel.js' */                } else {
/*Line 20 - 'AtomDockPanel.js' */                    this.updateChildUI(item);
/*Line 21 - 'AtomDockPanel.js' */                }
/*Line 22 - 'AtomDockPanel.js' */            },

/*Line 24 - 'AtomDockPanel.js' */            calculateSize: function () {
/*Line 25 - 'AtomDockPanel.js' */                var element = this.get_element();

/*Line 27 - 'AtomDockPanel.js' */                var size = { width: $(element).width(), height: $(element).height() };

/*Line 29 - 'AtomDockPanel.js' */                //if (AtomBrowser.isIE && AtomBrowser.majorVersion < 10) {
/*Line 30 - 'AtomDockPanel.js' */                //    size = { width: element.offsetWidth, height: element.offsetHeight };
/*Line 31 - 'AtomDockPanel.js' */                //}else {

/*Line 33 - 'AtomDockPanel.js' */                //var s = AtomUI.getComputedStyle(element);

/*Line 35 - 'AtomDockPanel.js' */                //size = { width: AtomUI.parseStyleNumber(s.width), height: AtomUI.parseStyleNumber(s.height) };
/*Line 36 - 'AtomDockPanel.js' */                //}

/*Line 38 - 'AtomDockPanel.js' */                if (!this._resizeOnChildResized)
/*Line 39 - 'AtomDockPanel.js' */                    return size;

/*Line 41 - 'AtomDockPanel.js' */                var desiredHeight = 0;

/*Line 43 - 'AtomDockPanel.js' */                var ae = new ChildEnumerator(element);
/*Line 44 - 'AtomDockPanel.js' */                while (ae.next()) {
/*Line 45 - 'AtomDockPanel.js' */                    var child = ae.current();
/*Line 46 - 'AtomDockPanel.js' */                    var dock = $(child).attr("atom-dock");
/*Line 47 - 'AtomDockPanel.js' */                    switch (dock) {
/*Line 48 - 'AtomDockPanel.js' */                        case "Bottom":
/*Line 49 - 'AtomDockPanel.js' */                        case "Fill":
/*Line 50 - 'AtomDockPanel.js' */                        case "Top":
/*Line 51 - 'AtomDockPanel.js' */                            var h;
/*Line 52 - 'AtomDockPanel.js' */                            if (AtomBrowser.isIE && AtomBrowser.majorVersion < 10) {
/*Line 53 - 'AtomDockPanel.js' */                                h = child.offsetHeight;
/*Line 54 - 'AtomDockPanel.js' */                            } else {
/*Line 55 - 'AtomDockPanel.js' */                                //h = AtomUI.getItemRect(child).height;
/*Line 56 - 'AtomDockPanel.js' */                                h = $(child).outerHeight(true);
/*Line 57 - 'AtomDockPanel.js' */                            }
/*Line 58 - 'AtomDockPanel.js' */                            desiredHeight += h;
/*Line 59 - 'AtomDockPanel.js' */                            break;
/*Line 60 - 'AtomDockPanel.js' */                    }
/*Line 61 - 'AtomDockPanel.js' */                }

/*Line 63 - 'AtomDockPanel.js' */                if (size.height < desiredHeight) {
/*Line 64 - 'AtomDockPanel.js' */                    size.height = desiredHeight;
/*Line 65 - 'AtomDockPanel.js' */                    $(element).height(size.height);
/*Line 66 - 'AtomDockPanel.js' */                }

/*Line 68 - 'AtomDockPanel.js' */                return size;
/*Line 69 - 'AtomDockPanel.js' */            },

/*Line 71 - 'AtomDockPanel.js' */            onUpdateUI: function () {


/*Line 74 - 'AtomDockPanel.js' */                var element = this.get_element();


/*Line 77 - 'AtomDockPanel.js' */                var i;
/*Line 78 - 'AtomDockPanel.js' */                var left = 0;
/*Line 79 - 'AtomDockPanel.js' */                var top = parseInt($(element).css("paddingTop"), 10);

/*Line 81 - 'AtomDockPanel.js' */                var s = this.calculateSize();

/*Line 83 - 'AtomDockPanel.js' */                // is parent of this is body??
/*Line 84 - 'AtomDockPanel.js' */                var height = s.height;
/*Line 85 - 'AtomDockPanel.js' */                var width = s.width;

/*Line 87 - 'AtomDockPanel.js' */                var children = [];
/*Line 88 - 'AtomDockPanel.js' */                var en;
/*Line 89 - 'AtomDockPanel.js' */                var item;

/*Line 91 - 'AtomDockPanel.js' */                var itemRect;
/*Line 92 - 'AtomDockPanel.js' */                var clientRect;

/*Line 94 - 'AtomDockPanel.js' */                var itemHeight;
/*Line 95 - 'AtomDockPanel.js' */                var itemWidth;

/*Line 97 - 'AtomDockPanel.js' */                en = new AtomEnumerator($(element).children("[atom-dock='Top']"));
/*Line 98 - 'AtomDockPanel.js' */                while (en.next()) {
/*Line 99 - 'AtomDockPanel.js' */                    item = en.current();

/*Line 101 - 'AtomDockPanel.js' */                    itemHeight = $(item).outerHeight(true);

/*Line 103 - 'AtomDockPanel.js' */                    AtomUI.setItemRect(item, { top: top, left: left, width: width });

/*Line 105 - 'AtomDockPanel.js' */                    top += itemHeight;
/*Line 106 - 'AtomDockPanel.js' */                    height -= itemHeight;

/*Line 108 - 'AtomDockPanel.js' */                    this.resizeChild(item);
/*Line 109 - 'AtomDockPanel.js' */                }

/*Line 111 - 'AtomDockPanel.js' */                en = new AtomEnumerator($(element).children("[atom-dock='Bottom']").get().reverse());
/*Line 112 - 'AtomDockPanel.js' */                while (en.next()) {
/*Line 113 - 'AtomDockPanel.js' */                    item = en.current();
/*Line 114 - 'AtomDockPanel.js' */                    itemHeight = $(item).outerHeight(true);

/*Line 116 - 'AtomDockPanel.js' */                    height -= itemHeight;

/*Line 118 - 'AtomDockPanel.js' */                    AtomUI.setItemRect(item, { top: (top + height), width: width });

/*Line 120 - 'AtomDockPanel.js' */                    this.resizeChild(item);
/*Line 121 - 'AtomDockPanel.js' */                }

/*Line 123 - 'AtomDockPanel.js' */                en = new AtomEnumerator($(element).children("[atom-dock='Left']"));
/*Line 124 - 'AtomDockPanel.js' */                while (en.next()) {
/*Line 125 - 'AtomDockPanel.js' */                    item = en.current();

/*Line 127 - 'AtomDockPanel.js' */                    var itemWidth = $(item).outerWidth(true);
/*Line 128 - 'AtomDockPanel.js' */                    width -= itemWidth;

/*Line 130 - 'AtomDockPanel.js' */                    AtomUI.setItemRect(item, { top: top, left: left, height: height });
/*Line 131 - 'AtomDockPanel.js' */                    left += itemWidth;

/*Line 133 - 'AtomDockPanel.js' */                    this.resizeChild(item);
/*Line 134 - 'AtomDockPanel.js' */                }

/*Line 136 - 'AtomDockPanel.js' */                en = new AtomEnumerator($(element).children("[atom-dock='Right']").get().reverse());
/*Line 137 - 'AtomDockPanel.js' */                while (en.next()) {
/*Line 138 - 'AtomDockPanel.js' */                    item = en.current();
/*Line 139 - 'AtomDockPanel.js' */                    var itemWidth = $(item).outerWidth(true);
/*Line 140 - 'AtomDockPanel.js' */                    width -= itemWidth;

/*Line 142 - 'AtomDockPanel.js' */                    AtomUI.setItemRect(item, { left: (width + left), top: top, height: height });

/*Line 144 - 'AtomDockPanel.js' */                    this.resizeChild(item);
/*Line 145 - 'AtomDockPanel.js' */                }

/*Line 147 - 'AtomDockPanel.js' */                en = new AtomEnumerator($(element).children("[atom-dock='Fill']"));
/*Line 148 - 'AtomDockPanel.js' */                while (en.next()) {
/*Line 149 - 'AtomDockPanel.js' */                    item = en.current();
/*Line 150 - 'AtomDockPanel.js' */                    itemWidth = $(item).css("max-width");
/*Line 151 - 'AtomDockPanel.js' */                    if (itemWidth) {
/*Line 152 - 'AtomDockPanel.js' */                        itemWidth = parseFloat(itemWidth);
/*Line 153 - 'AtomDockPanel.js' */                        if (itemWidth > 0) {
/*Line 154 - 'AtomDockPanel.js' */                            width = itemWidth;
/*Line 155 - 'AtomDockPanel.js' */                        }
/*Line 156 - 'AtomDockPanel.js' */                    }

/*Line 158 - 'AtomDockPanel.js' */                    AtomUI.setItemRect(item, { left: left, top: top, width: width, height: height });

/*Line 160 - 'AtomDockPanel.js' */                    this.resizeChild(item);
/*Line 161 - 'AtomDockPanel.js' */                }

/*Line 163 - 'AtomDockPanel.js' */            }
/*Line 164 - 'AtomDockPanel.js' */        }
/*Line 165 - 'AtomDockPanel.js' */    });
/*Line 166 - 'AtomDockPanel.js' */})(window, WebAtoms.AtomControl.prototype);

/*Line 0 - 'AtomListBox.js' */

/*Line 2 - 'AtomListBox.js' */(function (window, baseType) {
/*Line 3 - 'AtomListBox.js' */    return classCreatorEx({
/*Line 4 - 'AtomListBox.js' */        name: "WebAtoms.AtomListBox",
/*Line 5 - 'AtomListBox.js' */        base: baseType,
/*Line 6 - 'AtomListBox.js' */        start: function (e) {
/*Line 7 - 'AtomListBox.js' */            this._labelPath = "label";
/*Line 8 - 'AtomListBox.js' */            this._valuePath = "value";

/*Line 10 - 'AtomListBox.js' */            this._autoScrollToSelection = false;

/*Line 12 - 'AtomListBox.js' */            $(e).addClass("atom-list-box");
/*Line 13 - 'AtomListBox.js' */        },
/*Line 14 - 'AtomListBox.js' */        properties: {
/*Line 15 - 'AtomListBox.js' */            autoSelectOnClick: true
/*Line 16 - 'AtomListBox.js' */        },
/*Line 17 - 'AtomListBox.js' */        methods: {
/*Line 18 - 'AtomListBox.js' */            onClick: function (event) {

/*Line 20 - 'AtomListBox.js' */                if (!this._autoSelectOnClick)
/*Line 21 - 'AtomListBox.js' */                    return;

/*Line 23 - 'AtomListBox.js' */                this.onSelectItem(null, null, event);
/*Line 24 - 'AtomListBox.js' */                //return AtomUI.cancelEvent(event);
/*Line 25 - 'AtomListBox.js' */            },

/*Line 27 - 'AtomListBox.js' */            get_itemWidth: function () {
/*Line 28 - 'AtomListBox.js' */                if (!this._items || !this._items.length)
/*Line 29 - 'AtomListBox.js' */                    return 0;
/*Line 30 - 'AtomListBox.js' */                var w = $(this._element).innerWidth();
/*Line 31 - 'AtomListBox.js' */                return w / this._items.length;
/*Line 32 - 'AtomListBox.js' */            },

/*Line 34 - 'AtomListBox.js' */            applyItemStyle: function (item, dataItem, first, last) {
/*Line 35 - 'AtomListBox.js' */                $(item).removeClass("selected-item list-item first-item last-item");
/*Line 36 - 'AtomListBox.js' */                //$(item).removeClass("list-item");
/*Line 37 - 'AtomListBox.js' */                //$(item).removeClass("first-item");
/*Line 38 - 'AtomListBox.js' */                //$(item).removeClass("last-item");
/*Line 39 - 'AtomListBox.js' */                if (!dataItem)
/*Line 40 - 'AtomListBox.js' */                    return;
/*Line 41 - 'AtomListBox.js' */                $(item).addClass("list-item");
/*Line 42 - 'AtomListBox.js' */                if (first) {
/*Line 43 - 'AtomListBox.js' */                    $(item).addClass("first-item");
/*Line 44 - 'AtomListBox.js' */                }
/*Line 45 - 'AtomListBox.js' */                if (last) {
/*Line 46 - 'AtomListBox.js' */                    $(item).addClass("last-item");
/*Line 47 - 'AtomListBox.js' */                }
/*Line 48 - 'AtomListBox.js' */                if (this.isSelected(dataItem)) {
/*Line 49 - 'AtomListBox.js' */                    $(item).addClass("selected-item");
/*Line 50 - 'AtomListBox.js' */                }
/*Line 51 - 'AtomListBox.js' */            },

/*Line 53 - 'AtomListBox.js' */            onCreated: function () {
/*Line 54 - 'AtomListBox.js' */                this.bindEvent(this._itemsPresenter, "click", "onClick");
/*Line 55 - 'AtomListBox.js' */                baseType.onCreated.call(this);
/*Line 56 - 'AtomListBox.js' */            },

/*Line 58 - 'AtomListBox.js' */            invokePost: function () {
/*Line 59 - 'AtomListBox.js' */                if (this.get_selectedIndex() != -1) {
/*Line 60 - 'AtomListBox.js' */                    baseType.invokePost.apply(this, arguments);
/*Line 61 - 'AtomListBox.js' */                }
/*Line 62 - 'AtomListBox.js' */            },

/*Line 64 - 'AtomListBox.js' */            onSelectItem: function (scope, sender, event) {
/*Line 65 - 'AtomListBox.js' */                var target = event ? event.target : null;
/*Line 66 - 'AtomListBox.js' */                var element = this._itemsPresenter;
/*Line 67 - 'AtomListBox.js' */                var childElement = target || sender._element;
/*Line 68 - 'AtomListBox.js' */                while (childElement.parentNode != null && childElement.parentNode != element)
/*Line 69 - 'AtomListBox.js' */                    childElement = childElement.parentNode;
/*Line 70 - 'AtomListBox.js' */                if (childElement == document) {
/*Line 71 - 'AtomListBox.js' */                    //console.log("listbox clicked outside");
/*Line 72 - 'AtomListBox.js' */                    return;
/*Line 73 - 'AtomListBox.js' */                }
/*Line 74 - 'AtomListBox.js' */                var dataItem = childElement;
/*Line 75 - 'AtomListBox.js' */                if (this.hasItems()) {
/*Line 76 - 'AtomListBox.js' */                    dataItem = childElement.atomControl.get_data();
/*Line 77 - 'AtomListBox.js' */                }

/*Line 79 - 'AtomListBox.js' */                this.toggleSelection(dataItem);

/*Line 81 - 'AtomListBox.js' */            },

/*Line 83 - 'AtomListBox.js' */            init: function () {


/*Line 86 - 'AtomListBox.js' */                baseType.init.call(this);
/*Line 87 - 'AtomListBox.js' */                var _this = this;

/*Line 89 - 'AtomListBox.js' */                this.selectCommand = function () {
/*Line 90 - 'AtomListBox.js' */                    _this.onSelectItem.apply(_this, arguments);
/*Line 91 - 'AtomListBox.js' */                };
/*Line 92 - 'AtomListBox.js' */                this.selectAllCommand = function () {
/*Line 93 - 'AtomListBox.js' */                    _this.set_selectAll(true);
/*Line 94 - 'AtomListBox.js' */                };
/*Line 95 - 'AtomListBox.js' */                this.clearSelectionCommand = function () {
/*Line 96 - 'AtomListBox.js' */                    _this.set_selectedIndex(-1);
/*Line 97 - 'AtomListBox.js' */                };
/*Line 98 - 'AtomListBox.js' */            }
/*Line 99 - 'AtomListBox.js' */        }
/*Line 100 - 'AtomListBox.js' */    });
/*Line 101 - 'AtomListBox.js' */})(window, WebAtoms.AtomItemsControl.prototype);

/*Line 0 - 'AtomAutoCompleteBox.js' */
/*Line 1 - 'AtomAutoCompleteBox.js' */

/*Line 3 - 'AtomAutoCompleteBox.js' */(function (window, base) {
/*Line 4 - 'AtomAutoCompleteBox.js' */    return classCreatorEx(
/*Line 5 - 'AtomAutoCompleteBox.js' */    {
/*Line 6 - 'AtomAutoCompleteBox.js' */        name: "WebAtoms.AtomAutoCompleteBox",
/*Line 7 - 'AtomAutoCompleteBox.js' */        base: base,
/*Line 8 - 'AtomAutoCompleteBox.js' */        start:
/*Line 9 - 'AtomAutoCompleteBox.js' */            function (e) {
/*Line 10 - 'AtomAutoCompleteBox.js' */                $(e).addClass("atom-auto-complete-box");
/*Line 11 - 'AtomAutoCompleteBox.js' */                this._presenters = ["itemsPresenter", "inputBox", "selectionBox"];
/*Line 12 - 'AtomAutoCompleteBox.js' */                this._mouseCapture = 0;
/*Line 13 - 'AtomAutoCompleteBox.js' */            },
/*Line 14 - 'AtomAutoCompleteBox.js' */        properties: {
/*Line 15 - 'AtomAutoCompleteBox.js' */            isPopupOpen: false,
/*Line 16 - 'AtomAutoCompleteBox.js' */            autoOpen: false,
/*Line 17 - 'AtomAutoCompleteBox.js' */            selectedText:'',
/*Line 18 - 'AtomAutoCompleteBox.js' */            placeholder: undefined,
/*Line 19 - 'AtomAutoCompleteBox.js' */            keyPressed: undefined,
/*Line 20 - 'AtomAutoCompleteBox.js' */            displayLabel: undefined
/*Line 21 - 'AtomAutoCompleteBox.js' */        },
/*Line 22 - 'AtomAutoCompleteBox.js' */        methods: {
/*Line 23 - 'AtomAutoCompleteBox.js' */            get_offsetLeft: function () {
/*Line 24 - 'AtomAutoCompleteBox.js' */                //return $(this._element).offset().left - parseInt( $(atomApplication._element).css("left") , 10);
/*Line 25 - 'AtomAutoCompleteBox.js' */                return $(this._element).offset().left;
/*Line 26 - 'AtomAutoCompleteBox.js' */            },
/*Line 27 - 'AtomAutoCompleteBox.js' */            get_offsetTop: function () {
/*Line 28 - 'AtomAutoCompleteBox.js' */                return $(this._element).offset().top;
/*Line 29 - 'AtomAutoCompleteBox.js' */            },

/*Line 31 - 'AtomAutoCompleteBox.js' */            get_offsetWidth: function () {
/*Line 32 - 'AtomAutoCompleteBox.js' */                return $(this._inputBox).offset().width;
/*Line 33 - 'AtomAutoCompleteBox.js' */            },

/*Line 35 - 'AtomAutoCompleteBox.js' */            set_itemsUrl: function (v) {
/*Line 36 - 'AtomAutoCompleteBox.js' */                var url = "[ !$owner.keyPressed ? undefined : AtomPromise.json('" + v + "').showProgress(false) ]";
/*Line 37 - 'AtomAutoCompleteBox.js' */                this.setValue("items", url, true, this._element);
/*Line 38 - 'AtomAutoCompleteBox.js' */            },

/*Line 40 - 'AtomAutoCompleteBox.js' */            set_isPopupOpen: function (v) {
/*Line 41 - 'AtomAutoCompleteBox.js' */                this._isPopupOpen = v;
/*Line 42 - 'AtomAutoCompleteBox.js' */                if (v) {
/*Line 43 - 'AtomAutoCompleteBox.js' */                    AtomBinder.refreshValue(this, "offsetTop");
/*Line 44 - 'AtomAutoCompleteBox.js' */                    AtomBinder.refreshValue(this, "offsetLeft");
/*Line 45 - 'AtomAutoCompleteBox.js' */                    AtomBinder.refreshValue(this, "offsetWidth");
/*Line 46 - 'AtomAutoCompleteBox.js' */                    //this.bindEvent(window, "click", "onWindowClick");
/*Line 47 - 'AtomAutoCompleteBox.js' */                    var _this = this;
/*Line 48 - 'AtomAutoCompleteBox.js' */                    this.trySelect();
/*Line 49 - 'AtomAutoCompleteBox.js' */                    this.bindEvent(window, "click", function () {
/*Line 50 - 'AtomAutoCompleteBox.js' */                        _this.onWindowClick.apply(_this, arguments);
/*Line 51 - 'AtomAutoCompleteBox.js' */                    });
/*Line 52 - 'AtomAutoCompleteBox.js' */                } else {
/*Line 53 - 'AtomAutoCompleteBox.js' */                    //this.unbindEvent(window, "click", "onWindowClick");
/*Line 54 - 'AtomAutoCompleteBox.js' */                    this.unbindEvent(window, "click");
/*Line 55 - 'AtomAutoCompleteBox.js' */                }
/*Line 56 - 'AtomAutoCompleteBox.js' */            },

/*Line 58 - 'AtomAutoCompleteBox.js' */            onSelectedItemsChanged: function () {
/*Line 59 - 'AtomAutoCompleteBox.js' */                if (this._onUIChanged) {
/*Line 60 - 'AtomAutoCompleteBox.js' */                    if (this._selectedItems.length > 0) {
/*Line 61 - 'AtomAutoCompleteBox.js' */                        this.refreshLabel();
/*Line 62 - 'AtomAutoCompleteBox.js' */                    }
/*Line 63 - 'AtomAutoCompleteBox.js' */                }
/*Line 64 - 'AtomAutoCompleteBox.js' */                base.onSelectedItemsChanged.apply(this, arguments);
/*Line 65 - 'AtomAutoCompleteBox.js' */            },

/*Line 67 - 'AtomAutoCompleteBox.js' */            onClick: function (e) {
/*Line 68 - 'AtomAutoCompleteBox.js' */                base.onClick.apply(this, arguments);
/*Line 69 - 'AtomAutoCompleteBox.js' */                this._backupValue = this.get_value();
/*Line 70 - 'AtomAutoCompleteBox.js' */                this.refreshLabel();
/*Line 71 - 'AtomAutoCompleteBox.js' */                this._backupLabel = this.get_displayLabel();
/*Line 72 - 'AtomAutoCompleteBox.js' */                AtomBinder.setValue(this, "keyPressed", false);
/*Line 73 - 'AtomAutoCompleteBox.js' */                AtomBinder.setValue(this, "isPopupOpen", false);
/*Line 74 - 'AtomAutoCompleteBox.js' */            },

/*Line 76 - 'AtomAutoCompleteBox.js' */            restoreSelection: function () {
/*Line 77 - 'AtomAutoCompleteBox.js' */                AtomBinder.setValue(this, "isPopupOpen", false);
/*Line 78 - 'AtomAutoCompleteBox.js' */                if (this._backupValue) {
/*Line 79 - 'AtomAutoCompleteBox.js' */                    AtomBinder.setValue(this, "value", this._backupValue);
/*Line 80 - 'AtomAutoCompleteBox.js' */                    AtomBinder.setValue(this, "displayLabel", this._backupLabel);
/*Line 81 - 'AtomAutoCompleteBox.js' */                    this._backupValue = null;
/*Line 82 - 'AtomAutoCompleteBox.js' */                } else {
/*Line 83 - 'AtomAutoCompleteBox.js' */                    AtomBinder.setValue(this, "selectedIndex", -1);
/*Line 84 - 'AtomAutoCompleteBox.js' */                }
/*Line 85 - 'AtomAutoCompleteBox.js' */            },

/*Line 87 - 'AtomAutoCompleteBox.js' */            onKeyUp: function (e) {

/*Line 89 - 'AtomAutoCompleteBox.js' */                AtomBinder.setValue(this, "isPopupOpen", true);

/*Line 91 - 'AtomAutoCompleteBox.js' */                switch (e.keyCode) {
/*Line 92 - 'AtomAutoCompleteBox.js' */                    case 27:
/*Line 93 - 'AtomAutoCompleteBox.js' */                        AtomBinder.setValue(this, "keyPressed", false);
/*Line 94 - 'AtomAutoCompleteBox.js' */                        this.restoreSelection();
/*Line 95 - 'AtomAutoCompleteBox.js' */                        return;
/*Line 96 - 'AtomAutoCompleteBox.js' */                    case 13:
/*Line 97 - 'AtomAutoCompleteBox.js' */                        AtomBinder.setValue(this, "keyPressed", false);
/*Line 98 - 'AtomAutoCompleteBox.js' */                        AtomBinder.setValue(this, "isPopupOpen", false);
/*Line 99 - 'AtomAutoCompleteBox.js' */                        this._backupValue = this.get_value();
/*Line 100 - 'AtomAutoCompleteBox.js' */                        this.refreshLabel();
/*Line 101 - 'AtomAutoCompleteBox.js' */                        this._backupLabel = this.get_displayLabel();
/*Line 102 - 'AtomAutoCompleteBox.js' */                        return AtomUI.cancelEvent(e);
/*Line 103 - 'AtomAutoCompleteBox.js' */                    case 37:
/*Line 104 - 'AtomAutoCompleteBox.js' */                        // Left
/*Line 105 - 'AtomAutoCompleteBox.js' */                        break;
/*Line 106 - 'AtomAutoCompleteBox.js' */                    case 38:
/*Line 107 - 'AtomAutoCompleteBox.js' */                        // up
/*Line 108 - 'AtomAutoCompleteBox.js' */                        AtomBinder.setValue(this, "keyPressed", false);
/*Line 109 - 'AtomAutoCompleteBox.js' */                        this.moveSelection(true);
/*Line 110 - 'AtomAutoCompleteBox.js' */                        return;
/*Line 111 - 'AtomAutoCompleteBox.js' */                    case 39:
/*Line 112 - 'AtomAutoCompleteBox.js' */                        // right
/*Line 113 - 'AtomAutoCompleteBox.js' */                        break;
/*Line 114 - 'AtomAutoCompleteBox.js' */                    case 40:
/*Line 115 - 'AtomAutoCompleteBox.js' */                        AtomBinder.setValue(this, "keyPressed", false);
/*Line 116 - 'AtomAutoCompleteBox.js' */                        this.moveSelection(false);
/*Line 117 - 'AtomAutoCompleteBox.js' */                        return;
/*Line 118 - 'AtomAutoCompleteBox.js' */                    default:
/*Line 119 - 'AtomAutoCompleteBox.js' */                        // try selecting complete word...
/*Line 120 - 'AtomAutoCompleteBox.js' */                        var caller = this;
/*Line 121 - 'AtomAutoCompleteBox.js' */                        this.dispatcher.callLater(function () {
/*Line 122 - 'AtomAutoCompleteBox.js' */                            caller.trySelect();
/*Line 123 - 'AtomAutoCompleteBox.js' */                        });
/*Line 124 - 'AtomAutoCompleteBox.js' */                        break;
/*Line 125 - 'AtomAutoCompleteBox.js' */                }

/*Line 127 - 'AtomAutoCompleteBox.js' */                if (this.oldTimeout) {
/*Line 128 - 'AtomAutoCompleteBox.js' */                    clearTimeout(this.oldTimeout);
/*Line 129 - 'AtomAutoCompleteBox.js' */                }
/*Line 130 - 'AtomAutoCompleteBox.js' */                var _this = this;
/*Line 131 - 'AtomAutoCompleteBox.js' */                this.oldTimeout = setTimeout(function () {
/*Line 132 - 'AtomAutoCompleteBox.js' */                    AtomBinder.setValue(_this, "keyPressed", true);
/*Line 133 - 'AtomAutoCompleteBox.js' */                }, 500);

/*Line 135 - 'AtomAutoCompleteBox.js' */            },

/*Line 137 - 'AtomAutoCompleteBox.js' */            trySelect: function () {

/*Line 139 - 'AtomAutoCompleteBox.js' */                if (!this._items || this._items.length == 0)
/*Line 140 - 'AtomAutoCompleteBox.js' */                    return;

/*Line 142 - 'AtomAutoCompleteBox.js' */                //if (this.get_selectedIndex() != -1)
/*Line 143 - 'AtomAutoCompleteBox.js' */                //    return;

/*Line 145 - 'AtomAutoCompleteBox.js' */                var ae = new AtomEnumerator(this._items);
/*Line 146 - 'AtomAutoCompleteBox.js' */                var lp = this._labelPath;

/*Line 148 - 'AtomAutoCompleteBox.js' */                var cl = this._displayLabel;

/*Line 150 - 'AtomAutoCompleteBox.js' */                if (cl)
/*Line 151 - 'AtomAutoCompleteBox.js' */                    cl = cl.toLowerCase();

/*Line 153 - 'AtomAutoCompleteBox.js' */                while (ae.next()) {
/*Line 154 - 'AtomAutoCompleteBox.js' */                    var item = ae.current();
/*Line 155 - 'AtomAutoCompleteBox.js' */                    var l = item;
/*Line 156 - 'AtomAutoCompleteBox.js' */                    if (lp)
/*Line 157 - 'AtomAutoCompleteBox.js' */                        l = l[lp];
/*Line 158 - 'AtomAutoCompleteBox.js' */                    if (l.toLowerCase().indexOf(cl)==0) {
/*Line 159 - 'AtomAutoCompleteBox.js' */                        AtomBinder.setValue(this, "selectedItem", item);
/*Line 160 - 'AtomAutoCompleteBox.js' */                        AtomBinder.setValue(this, "selectedText", l);
/*Line 161 - 'AtomAutoCompleteBox.js' */                        this.bringSelectionIntoView();
/*Line 162 - 'AtomAutoCompleteBox.js' */                        return;
/*Line 163 - 'AtomAutoCompleteBox.js' */                    }
/*Line 164 - 'AtomAutoCompleteBox.js' */                }
/*Line 165 - 'AtomAutoCompleteBox.js' */            },

/*Line 167 - 'AtomAutoCompleteBox.js' */            moveSelection: function (up) {
/*Line 168 - 'AtomAutoCompleteBox.js' */                if (!this._items || !this._items.length)
/*Line 169 - 'AtomAutoCompleteBox.js' */                    return;
/*Line 170 - 'AtomAutoCompleteBox.js' */                var i = this.get_selectedIndex();

/*Line 172 - 'AtomAutoCompleteBox.js' */                if (i == -1) {
/*Line 173 - 'AtomAutoCompleteBox.js' */                    this.backupLabel = this.get_displayLabel();
/*Line 174 - 'AtomAutoCompleteBox.js' */                }

/*Line 176 - 'AtomAutoCompleteBox.js' */                i = up ? (i - 1) : (i + 1);
/*Line 177 - 'AtomAutoCompleteBox.js' */                if (up && i == -2) {
/*Line 178 - 'AtomAutoCompleteBox.js' */                    i = this._items.length - 1;
/*Line 179 - 'AtomAutoCompleteBox.js' */                }
/*Line 180 - 'AtomAutoCompleteBox.js' */                if (!up && i == this._items.length) {
/*Line 181 - 'AtomAutoCompleteBox.js' */                    i = -1;
/*Line 182 - 'AtomAutoCompleteBox.js' */                }

/*Line 184 - 'AtomAutoCompleteBox.js' */                AtomBinder.setValue(this, "selectedIndex", i);
/*Line 185 - 'AtomAutoCompleteBox.js' */                if (i == -1) {
/*Line 186 - 'AtomAutoCompleteBox.js' */                    AtomBinder.setValue(this, "displayLabel", this.backupLabel || "");
/*Line 187 - 'AtomAutoCompleteBox.js' */                } else {
/*Line 188 - 'AtomAutoCompleteBox.js' */                    this.refreshLabel();
/*Line 189 - 'AtomAutoCompleteBox.js' */                }
/*Line 190 - 'AtomAutoCompleteBox.js' */            },

/*Line 192 - 'AtomAutoCompleteBox.js' */            refreshLabel: function () {
/*Line 193 - 'AtomAutoCompleteBox.js' */                var item = this.get_selectedItem();
/*Line 194 - 'AtomAutoCompleteBox.js' */                var l = item;
/*Line 195 - 'AtomAutoCompleteBox.js' */                if (l && this._labelPath) {
/*Line 196 - 'AtomAutoCompleteBox.js' */                    l = l[this._labelPath];
/*Line 197 - 'AtomAutoCompleteBox.js' */                }
/*Line 198 - 'AtomAutoCompleteBox.js' */                AtomBinder.setValue(this, "displayLabel", l || "");
/*Line 199 - 'AtomAutoCompleteBox.js' */            },

/*Line 201 - 'AtomAutoCompleteBox.js' */            onWindowClick: function (e) {
/*Line 202 - 'AtomAutoCompleteBox.js' */                var se = this._element;
/*Line 203 - 'AtomAutoCompleteBox.js' */                var p = this._itemsPresenter;
/*Line 204 - 'AtomAutoCompleteBox.js' */                var childElement = e.target;
/*Line 205 - 'AtomAutoCompleteBox.js' */                while (childElement.parentNode != null && childElement != se && childElement != p)
/*Line 206 - 'AtomAutoCompleteBox.js' */                    childElement = childElement.parentNode;
/*Line 207 - 'AtomAutoCompleteBox.js' */                if (childElement == se || childElement == p)
/*Line 208 - 'AtomAutoCompleteBox.js' */                    return;
/*Line 209 - 'AtomAutoCompleteBox.js' */                // close popup....
/*Line 210 - 'AtomAutoCompleteBox.js' */                this.restoreSelection();

/*Line 212 - 'AtomAutoCompleteBox.js' */            },

/*Line 214 - 'AtomAutoCompleteBox.js' */            onInputFocus: function () {
/*Line 215 - 'AtomAutoCompleteBox.js' */                if (!this._autoOpen)
/*Line 216 - 'AtomAutoCompleteBox.js' */                    return;
/*Line 217 - 'AtomAutoCompleteBox.js' */                this._backupValue = this.get_value();
/*Line 218 - 'AtomAutoCompleteBox.js' */                this._backupLabel = this.get_displayLabel();
/*Line 219 - 'AtomAutoCompleteBox.js' */                AtomBinder.setValue(this, "isPopupOpen", true);
/*Line 220 - 'AtomAutoCompleteBox.js' */                $(this._inputBox).select();
/*Line 221 - 'AtomAutoCompleteBox.js' */            },

/*Line 223 - 'AtomAutoCompleteBox.js' */            onInputBlur: function () {
/*Line 224 - 'AtomAutoCompleteBox.js' */                if (this._mouseCapture)
/*Line 225 - 'AtomAutoCompleteBox.js' */                    return;
/*Line 226 - 'AtomAutoCompleteBox.js' */                var caller = this;

/*Line 228 - 'AtomAutoCompleteBox.js' */                setTimeout(function () {
/*Line 229 - 'AtomAutoCompleteBox.js' */                    if (caller._isPopupOpen) {
/*Line 230 - 'AtomAutoCompleteBox.js' */                        AtomBinder.setValue(caller, "isPopupOpen", false);
/*Line 231 - 'AtomAutoCompleteBox.js' */                        caller.restoreSelection();
/*Line 232 - 'AtomAutoCompleteBox.js' */                    }
/*Line 233 - 'AtomAutoCompleteBox.js' */                }, 10);
/*Line 234 - 'AtomAutoCompleteBox.js' */            },

/*Line 236 - 'AtomAutoCompleteBox.js' */            onCreated: function () {

/*Line 238 - 'AtomAutoCompleteBox.js' */                this._itemsPresenter._logicalParent = this._element;

/*Line 240 - 'AtomAutoCompleteBox.js' */                $(this._itemsPresenter).remove();

/*Line 242 - 'AtomAutoCompleteBox.js' */                document.body.appendChild(this._itemsPresenter);

/*Line 244 - 'AtomAutoCompleteBox.js' */                $(this._itemsPresenter).addClass("atom-auto-complete-popup");

/*Line 246 - 'AtomAutoCompleteBox.js' */                base.onCreated.apply(this, arguments);
/*Line 247 - 'AtomAutoCompleteBox.js' */                this.bindEvent(this._itemsPresenter, "mouseover", "onMouseOver");
/*Line 248 - 'AtomAutoCompleteBox.js' */                this.bindEvent(this._itemsPresenter, "mouseout", "onMouseOut");
/*Line 249 - 'AtomAutoCompleteBox.js' */            },

/*Line 251 - 'AtomAutoCompleteBox.js' */            onMouseOver: function () {
/*Line 252 - 'AtomAutoCompleteBox.js' */                this._mouseCapture++;

/*Line 254 - 'AtomAutoCompleteBox.js' */            },

/*Line 256 - 'AtomAutoCompleteBox.js' */            onMouseOut: function () {
/*Line 257 - 'AtomAutoCompleteBox.js' */                var _this = this;
/*Line 258 - 'AtomAutoCompleteBox.js' */                setTimeout(function () {
/*Line 259 - 'AtomAutoCompleteBox.js' */                    _this._mouseCapture--;

/*Line 261 - 'AtomAutoCompleteBox.js' */                }, 1000);
/*Line 262 - 'AtomAutoCompleteBox.js' */            },

/*Line 264 - 'AtomAutoCompleteBox.js' */            init: function () {

/*Line 266 - 'AtomAutoCompleteBox.js' */                base.init.apply(this, arguments);
/*Line 267 - 'AtomAutoCompleteBox.js' */                this.bindEvent(this._inputBox, "focus", "onInputFocus");
/*Line 268 - 'AtomAutoCompleteBox.js' */                this.bindEvent(this._inputBox, "blur", "onInputBlur");
/*Line 269 - 'AtomAutoCompleteBox.js' */                this.bindEvent(this._inputBox, "keyup", "onKeyUp");
/*Line 270 - 'AtomAutoCompleteBox.js' */            },
/*Line 271 - 'AtomAutoCompleteBox.js' */            dispose: function () {
/*Line 272 - 'AtomAutoCompleteBox.js' */                if(this._itemsPresenter){
/*Line 273 - 'AtomAutoCompleteBox.js' */                    this.disposeChildren(this._itemsPresenter);
/*Line 274 - 'AtomAutoCompleteBox.js' */                    $(this._itemsPresenter).remove();
/*Line 275 - 'AtomAutoCompleteBox.js' */                    this._itemsPresenter = null;
/*Line 276 - 'AtomAutoCompleteBox.js' */                }
/*Line 277 - 'AtomAutoCompleteBox.js' */                base.dispose.call(this);
/*Line 278 - 'AtomAutoCompleteBox.js' */            }
/*Line 279 - 'AtomAutoCompleteBox.js' */        }
/*Line 280 - 'AtomAutoCompleteBox.js' */    });
/*Line 281 - 'AtomAutoCompleteBox.js' */})(window, WebAtoms.AtomListBox.prototype);

/*Line 0 - 'AtomCheckBoxList.js' */

/*Line 2 - 'AtomCheckBoxList.js' */(function (window, base) {
/*Line 3 - 'AtomCheckBoxList.js' */    return classCreatorEx(
/*Line 4 - 'AtomCheckBoxList.js' */    {
/*Line 5 - 'AtomCheckBoxList.js' */        name: "WebAtoms.AtomCheckBoxList",
/*Line 6 - 'AtomCheckBoxList.js' */        base: base,
/*Line 7 - 'AtomCheckBoxList.js' */        start: function () {
/*Line 8 - 'AtomCheckBoxList.js' */            this._allowMultipleSelection = true;
/*Line 9 - 'AtomCheckBoxList.js' */            this._valueSeparator = ", ";
/*Line 10 - 'AtomCheckBoxList.js' */            this._dataElements = [];
/*Line 11 - 'AtomCheckBoxList.js' */        },
/*Line 12 - 'AtomCheckBoxList.js' */        methods: {
/*Line 13 - 'AtomCheckBoxList.js' */            init: function () {
/*Line 14 - 'AtomCheckBoxList.js' */                base.init.call(this);
/*Line 15 - 'AtomCheckBoxList.js' */                $(this._element).addClass("atom-check-box-list");
/*Line 16 - 'AtomCheckBoxList.js' */            }
/*Line 17 - 'AtomCheckBoxList.js' */        }
/*Line 18 - 'AtomCheckBoxList.js' */    });
/*Line 19 - 'AtomCheckBoxList.js' */})(window, WebAtoms.AtomItemsControl.prototype);

/*Line 0 - 'AtomComboBox.js' */
/*Line 1 - 'AtomComboBox.js' */


/*Line 4 - 'AtomComboBox.js' */(function (window, base) {
/*Line 5 - 'AtomComboBox.js' */    return classCreatorEx(
/*Line 6 - 'AtomComboBox.js' */    {
/*Line 7 - 'AtomComboBox.js' */        name: "WebAtoms.AtomComboBox",
/*Line 8 - 'AtomComboBox.js' */        base: base,
/*Line 9 - 'AtomComboBox.js' */        start: function () {
/*Line 10 - 'AtomComboBox.js' */            this._labelPath = "label";
/*Line 11 - 'AtomComboBox.js' */            this._valuePath = "value";
/*Line 12 - 'AtomComboBox.js' */            this._allowSelectFirst = true;
/*Line 13 - 'AtomComboBox.js' */        },
/*Line 14 - 'AtomComboBox.js' */        methods: {
/*Line 15 - 'AtomComboBox.js' */            invokePost: function () {
/*Line 16 - 'AtomComboBox.js' */                if (this.get_selectedIndex() > 0) {
/*Line 17 - 'AtomComboBox.js' */                    base.invokePost.apply(this, arguments);
/*Line 18 - 'AtomComboBox.js' */                }
/*Line 19 - 'AtomComboBox.js' */            },

/*Line 21 - 'AtomComboBox.js' */            invokeNext: function () {
/*Line 22 - 'AtomComboBox.js' */                base.invokeNext.apply(this, arguments);
/*Line 23 - 'AtomComboBox.js' */                if (this._postUrl) {
/*Line 24 - 'AtomComboBox.js' */                    AtomBinder.setValue(this, "selectedIndex", 0);
/*Line 25 - 'AtomComboBox.js' */                    this.updateChildSelections();
/*Line 26 - 'AtomComboBox.js' */                }
/*Line 27 - 'AtomComboBox.js' */            },

/*Line 29 - 'AtomComboBox.js' */            onSelectionChanged: function () {
/*Line 30 - 'AtomComboBox.js' */                this._onUIChanged = true;
/*Line 31 - 'AtomComboBox.js' */                var element = this.get_element();
/*Line 32 - 'AtomComboBox.js' */                this.set_selectedIndex(element.selectedIndex);
/*Line 33 - 'AtomComboBox.js' */                this._onUIChanged = false;

/*Line 35 - 'AtomComboBox.js' */                //this.invokeAction(this._next);
/*Line 36 - 'AtomComboBox.js' */            },

/*Line 38 - 'AtomComboBox.js' */            updateChildSelections: function () {
/*Line 39 - 'AtomComboBox.js' */                var element = this._element;
/*Line 40 - 'AtomComboBox.js' */                element.selectedIndex = this.get_selectedIndex();
/*Line 41 - 'AtomComboBox.js' */            },

/*Line 43 - 'AtomComboBox.js' */            onCollectionChanged: function (mode, index, item) {
/*Line 44 - 'AtomComboBox.js' */                var element = this.get_element();
/*Line 45 - 'AtomComboBox.js' */                var dataItems = this.get_dataItems();
/*Line 46 - 'AtomComboBox.js' */                element.options.length = dataItems.length;
/*Line 47 - 'AtomComboBox.js' */                var ae = new AtomEnumerator(dataItems);

/*Line 49 - 'AtomComboBox.js' */                var lp = this._labelPath;
/*Line 50 - 'AtomComboBox.js' */                var vp = this._valuePath;
/*Line 51 - 'AtomComboBox.js' */                var label = null;
/*Line 52 - 'AtomComboBox.js' */                var value = null;
/*Line 53 - 'AtomComboBox.js' */                var selectedValue = this.get_value();
/*Line 54 - 'AtomComboBox.js' */                while (ae.next()) {
/*Line 55 - 'AtomComboBox.js' */                    var data = ae.current();
/*Line 56 - 'AtomComboBox.js' */                    label = data;
/*Line 57 - 'AtomComboBox.js' */                    value = data;
/*Line 58 - 'AtomComboBox.js' */                    if (lp)
/*Line 59 - 'AtomComboBox.js' */                        label = label[lp];
/*Line 60 - 'AtomComboBox.js' */                    if (vp)
/*Line 61 - 'AtomComboBox.js' */                        value = value[vp];

/*Line 63 - 'AtomComboBox.js' */                    element.options[ae.currentIndex()] = new Option(label, value, false, value == selectedValue);
/*Line 64 - 'AtomComboBox.js' */                }
/*Line 65 - 'AtomComboBox.js' */            },

/*Line 67 - 'AtomComboBox.js' */            verifyTemplates: function () {
/*Line 68 - 'AtomComboBox.js' */            },

/*Line 70 - 'AtomComboBox.js' */            init: function () {

/*Line 72 - 'AtomComboBox.js' */                var element = this.get_element();
/*Line 73 - 'AtomComboBox.js' */                this.bindEvent(element, "change", "onSelectionChanged");
/*Line 74 - 'AtomComboBox.js' */                base.init.apply(this, arguments);
/*Line 75 - 'AtomComboBox.js' */            }
/*Line 76 - 'AtomComboBox.js' */        }
/*Line 77 - 'AtomComboBox.js' */    });
/*Line 78 - 'AtomComboBox.js' */})(window, WebAtoms.AtomItemsControl.prototype);



/*Line 0 - 'AtomDateListBox.js' */

/*Line 2 - 'AtomDateListBox.js' */(function (window, base) {
/*Line 3 - 'AtomDateListBox.js' */    return classCreatorEx({
/*Line 4 - 'AtomDateListBox.js' */        name: "WebAtoms.AtomDateListBox",
/*Line 5 - 'AtomDateListBox.js' */        base: base,
/*Line 6 - 'AtomDateListBox.js' */        start: function (element) {
/*Line 7 - 'AtomDateListBox.js' */            this._monthList = AtomDate.monthList;

/*Line 9 - 'AtomDateListBox.js' */            var today = new Date();
/*Line 10 - 'AtomDateListBox.js' */            this._month = today.getMonth() + 1;
/*Line 11 - 'AtomDateListBox.js' */            this._year = today.getFullYear();
/*Line 12 - 'AtomDateListBox.js' */            this._selectedItems = [];

/*Line 14 - 'AtomDateListBox.js' */            this._presenters = ['itemsPresenter'];

/*Line 16 - 'AtomDateListBox.js' */            this._startYear = -5;
/*Line 17 - 'AtomDateListBox.js' */            this._endYear = 10;

/*Line 19 - 'AtomDateListBox.js' */            this._currentYear = (new Date()).getFullYear();
/*Line 20 - 'AtomDateListBox.js' */            this._value = null;
/*Line 21 - 'AtomDateListBox.js' */        },
/*Line 22 - 'AtomDateListBox.js' */        properties: {
/*Line 23 - 'AtomDateListBox.js' */            month: 0,
/*Line 24 - 'AtomDateListBox.js' */            year: 0,
/*Line 25 - 'AtomDateListBox.js' */            selectedItems: [],
/*Line 26 - 'AtomDateListBox.js' */            startYear: -5,
/*Line 27 - 'AtomDateListBox.js' */            endYear: 0,
/*Line 28 - 'AtomDateListBox.js' */            currentYear: 0,
/*Line 29 - 'AtomDateListBox.js' */            monthList: null,
/*Line 30 - 'AtomDateListBox.js' */            items: undefined,
/*Line 31 - 'AtomDateListBox.js' */            month: null,
/*Line 32 - 'AtomDateListBox.js' */            visibleDate: undefined
/*Line 33 - 'AtomDateListBox.js' */        },
/*Line 34 - 'AtomDateListBox.js' */        methods: {
/*Line 35 - 'AtomDateListBox.js' */            set_month: function (v) {
/*Line 36 - 'AtomDateListBox.js' */                this._month = v;
/*Line 37 - 'AtomDateListBox.js' */                this.updateList();
/*Line 38 - 'AtomDateListBox.js' */            },

/*Line 40 - 'AtomDateListBox.js' */            set_year: function (v) {
/*Line 41 - 'AtomDateListBox.js' */                this._year = v;
/*Line 42 - 'AtomDateListBox.js' */                this.updateList();
/*Line 43 - 'AtomDateListBox.js' */            },

/*Line 45 - 'AtomDateListBox.js' */            set_visibleDate: function (v) {
/*Line 46 - 'AtomDateListBox.js' */                if (!v)
/*Line 47 - 'AtomDateListBox.js' */                    return;
/*Line 48 - 'AtomDateListBox.js' */                this._visibleDate = v;
/*Line 49 - 'AtomDateListBox.js' */                this._year = v.getFullYear();
/*Line 50 - 'AtomDateListBox.js' */                this._month = v.getMonth() + 1;
/*Line 51 - 'AtomDateListBox.js' */                this.updateList();
/*Line 52 - 'AtomDateListBox.js' */                AtomBinder.refreshValue(this, "year");
/*Line 53 - 'AtomDateListBox.js' */                AtomBinder.refreshValue(this, "month");
/*Line 54 - 'AtomDateListBox.js' */            },

/*Line 56 - 'AtomDateListBox.js' */            init: function () {
/*Line 57 - 'AtomDateListBox.js' */                base.init.apply(this);
/*Line 58 - 'AtomDateListBox.js' */                var _this = this;
/*Line 59 - 'AtomDateListBox.js' */                this.toggleDateCommand = function (scope, sender) {
/*Line 60 - 'AtomDateListBox.js' */                    _this.toggleDate.apply(_this, arguments);
/*Line 61 - 'AtomDateListBox.js' */                };
/*Line 62 - 'AtomDateListBox.js' */            },

/*Line 64 - 'AtomDateListBox.js' */            onLoaded: function () {
/*Line 65 - 'AtomDateListBox.js' */                var t = this.getTemplate("itemTemplate");

/*Line 67 - 'AtomDateListBox.js' */                var s = this.get_scope();

/*Line 69 - 'AtomDateListBox.js' */                var its = this._itemsPresenter;

/*Line 71 - 'AtomDateListBox.js' */                var et = this.getTemplate("itemTemplate");
/*Line 72 - 'AtomDateListBox.js' */                if (et) {
/*Line 73 - 'AtomDateListBox.js' */                    et = $(et).attr("atom-type");
/*Line 74 - 'AtomDateListBox.js' */                    if (!et) {
/*Line 75 - 'AtomDateListBox.js' */                        et = WebAtoms.AtomControl;
/*Line 76 - 'AtomDateListBox.js' */                    }
/*Line 77 - 'AtomDateListBox.js' */                }


/*Line 80 - 'AtomDateListBox.js' */                this.updateList();
/*Line 81 - 'AtomDateListBox.js' */                if (!t)
/*Line 82 - 'AtomDateListBox.js' */                    return;
/*Line 83 - 'AtomDateListBox.js' */                var list = this._items;
/*Line 84 - 'AtomDateListBox.js' */                for (var i = 0; i < 42; i++) {
/*Line 85 - 'AtomDateListBox.js' */                    var e = AtomUI.cloneNode(t);
/*Line 86 - 'AtomDateListBox.js' */                    e._templateParent = this;
/*Line 87 - 'AtomDateListBox.js' */                    var sc = new AtomScope(this, s, atomApplication);
/*Line 88 - 'AtomDateListBox.js' */                    sc.itemIndex = i;
/*Line 89 - 'AtomDateListBox.js' */                    $(its).append(e);
/*Line 90 - 'AtomDateListBox.js' */                    var ac = AtomUI.createControl(e, et, list[i], sc);
/*Line 91 - 'AtomDateListBox.js' */                }
/*Line 92 - 'AtomDateListBox.js' */            },

/*Line 94 - 'AtomDateListBox.js' */            toggleDate: function (scope, sender) {
/*Line 95 - 'AtomDateListBox.js' */                var item = sender.get_data();
/*Line 96 - 'AtomDateListBox.js' */                var s = $.inArray(item.value, $.map(this._selectedItems, function (a) { return a.value; }));
/*Line 97 - 'AtomDateListBox.js' */                if (s > -1) {

/*Line 99 - 'AtomDateListBox.js' */                    AtomBinder.removeAtIndex(this._selectedItems, s);
/*Line 100 - 'AtomDateListBox.js' */                } else {
/*Line 101 - 'AtomDateListBox.js' */                    AtomBinder.addItem(this._selectedItems, item);
/*Line 102 - 'AtomDateListBox.js' */                }
/*Line 103 - 'AtomDateListBox.js' */                AtomBinder.refreshValue(this, "value");
/*Line 104 - 'AtomDateListBox.js' */                AtomBinder.refreshValue(this, "selectedItems");
/*Line 105 - 'AtomDateListBox.js' */                this.invokeAction(this._next);
/*Line 106 - 'AtomDateListBox.js' */            },

/*Line 108 - 'AtomDateListBox.js' */            getItemClass: function (item, sv) {
/*Line 109 - 'AtomDateListBox.js' */                var s = $.inArray(item.value, $.map(this._selectedItems, function (a) { return a.value; })) > -1;
/*Line 110 - 'AtomDateListBox.js' */                var d = item.date.getDay();
/*Line 111 - 'AtomDateListBox.js' */                // weekend..
/*Line 112 - 'AtomDateListBox.js' */                var w = d == 0 || d == 6;

/*Line 114 - 'AtomDateListBox.js' */                var cls = "atom-date-list-box-day-list-item ";
/*Line 115 - 'AtomDateListBox.js' */                cls += w ? "atom-date-list-box-weekend " : "";
/*Line 116 - 'AtomDateListBox.js' */                cls += s ? "atom-date-list-box-selected " : "atom-date-list-box-item ";
/*Line 117 - 'AtomDateListBox.js' */                cls += (this._month == item.date.getMonth() + 1) ? "" : "atom-date-list-box-day-list-item-other";

/*Line 119 - 'AtomDateListBox.js' */                return cls;
/*Line 120 - 'AtomDateListBox.js' */            },

/*Line 122 - 'AtomDateListBox.js' */            set_value: function (v) {
/*Line 123 - 'AtomDateListBox.js' */                if (v === undefined) {
/*Line 124 - 'AtomDateListBox.js' */                    return;
/*Line 125 - 'AtomDateListBox.js' */                }
/*Line 126 - 'AtomDateListBox.js' */                this._selectedItems.length = 0;
/*Line 127 - 'AtomDateListBox.js' */                if (v !== null) {
/*Line 128 - 'AtomDateListBox.js' */                    var items = v.split(',');
/*Line 129 - 'AtomDateListBox.js' */                    for (var i = 0; i < items.length; i++) {
/*Line 130 - 'AtomDateListBox.js' */                        var item = items[i];
/*Line 131 - 'AtomDateListBox.js' */                        if (!item) {
/*Line 132 - 'AtomDateListBox.js' */                            continue;
/*Line 133 - 'AtomDateListBox.js' */                        }
/*Line 134 - 'AtomDateListBox.js' */                        var dts = item.split('/');
/*Line 135 - 'AtomDateListBox.js' */                        var d = new Date(parseInt(dts[2], 10), parseInt(dts[0], 10) - 1, parseInt(dts[1], 10));
/*Line 136 - 'AtomDateListBox.js' */                        this._selectedItems.push({ date: d, dateLabel: AtomDate.toShortDateString(d), value: item, label: d.getDate() });
/*Line 137 - 'AtomDateListBox.js' */                    }
/*Line 138 - 'AtomDateListBox.js' */                }
/*Line 139 - 'AtomDateListBox.js' */                if (this._created) {
/*Line 140 - 'AtomDateListBox.js' */                    AtomBinder.refreshItems(this._selectedItems);
/*Line 141 - 'AtomDateListBox.js' */                    AtomBinder.refreshValue(this, "value");
/*Line 142 - 'AtomDateListBox.js' */                    AtomBinder.refreshValue(this, "selectedItems");
/*Line 143 - 'AtomDateListBox.js' */                }
/*Line 144 - 'AtomDateListBox.js' */            },
/*Line 145 - 'AtomDateListBox.js' */            get_value: function (v) {
/*Line 146 - 'AtomDateListBox.js' */                return $.map(this._selectedItems, function (a) { return a.value; }).join(",");
/*Line 147 - 'AtomDateListBox.js' */            },

/*Line 149 - 'AtomDateListBox.js' */            updateList: function () {
/*Line 150 - 'AtomDateListBox.js' */                if (!this._month || !this._year)
/*Line 151 - 'AtomDateListBox.js' */                    return;

/*Line 153 - 'AtomDateListBox.js' */                var now = new Date();

/*Line 155 - 'AtomDateListBox.js' */                var d = new Date(this._year, this._month - 1, 1);
/*Line 156 - 'AtomDateListBox.js' */                var first = new Date(this._year, this._month - 1, 1);

/*Line 158 - 'AtomDateListBox.js' */                if (first.getDay()) {
/*Line 159 - 'AtomDateListBox.js' */                    // go to first day of the month...
/*Line 160 - 'AtomDateListBox.js' */                    var start = first.getDay() - 1;
/*Line 161 - 'AtomDateListBox.js' */                    start = -start;

/*Line 163 - 'AtomDateListBox.js' */                    first.setDate(start);
/*Line 164 - 'AtomDateListBox.js' */                }

/*Line 166 - 'AtomDateListBox.js' */                var m = first.getMonth();
/*Line 167 - 'AtomDateListBox.js' */                var y = first.getFullYear();

/*Line 169 - 'AtomDateListBox.js' */                var items = [];

/*Line 171 - 'AtomDateListBox.js' */                var i = 0;

/*Line 173 - 'AtomDateListBox.js' */                var cm = this._month - 1;

/*Line 175 - 'AtomDateListBox.js' */                for (i = 0; i < 42; i++) {
/*Line 176 - 'AtomDateListBox.js' */                    var cd = i + first.getDate();
/*Line 177 - 'AtomDateListBox.js' */                    var id = new Date(y, m, cd);
/*Line 178 - 'AtomDateListBox.js' */                    var w = id.getDay();
/*Line 179 - 'AtomDateListBox.js' */                    w = w == 0 || w == 6;
/*Line 180 - 'AtomDateListBox.js' */                    items.push({
/*Line 181 - 'AtomDateListBox.js' */                        label: id.getDate(),
/*Line 182 - 'AtomDateListBox.js' */                        isWeekEnd: w,
/*Line 183 - 'AtomDateListBox.js' */                        isToday:
/*Line 184 - 'AtomDateListBox.js' */                            now.getDate() == id.getDate()
/*Line 185 - 'AtomDateListBox.js' */                            && now.getMonth() == id.getMonth()
/*Line 186 - 'AtomDateListBox.js' */                            && now.getFullYear() == id.getFullYear(),
/*Line 187 - 'AtomDateListBox.js' */                        isOtherMonth: id.getMonth() != cm,
/*Line 188 - 'AtomDateListBox.js' */                        dateLabel: AtomDate.toShortDateString(id),
/*Line 189 - 'AtomDateListBox.js' */                        value: AtomDate.toMMDDYY(id),
/*Line 190 - 'AtomDateListBox.js' */                        date: id
/*Line 191 - 'AtomDateListBox.js' */                    });
/*Line 192 - 'AtomDateListBox.js' */                }

/*Line 194 - 'AtomDateListBox.js' */                this._items = items;
/*Line 195 - 'AtomDateListBox.js' */                AtomBinder.refreshValue(this, "items");
/*Line 196 - 'AtomDateListBox.js' */                AtomBinder.refreshValue(this, "selectedItems");
/*Line 197 - 'AtomDateListBox.js' */                if (this._created) {
/*Line 198 - 'AtomDateListBox.js' */                    AtomBinder.refreshValue(this, "value");
/*Line 199 - 'AtomDateListBox.js' */                }
/*Line 200 - 'AtomDateListBox.js' */            }
/*Line 201 - 'AtomDateListBox.js' */        }
/*Line 202 - 'AtomDateListBox.js' */    });
/*Line 203 - 'AtomDateListBox.js' */})(window, WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomPostButton.js' */

/*Line 2 - 'AtomPostButton.js' */(function (window, base) {
/*Line 3 - 'AtomPostButton.js' */    return classCreatorEx({
/*Line 4 - 'AtomPostButton.js' */        name: "WebAtoms.AtomPostButton",
/*Line 5 - 'AtomPostButton.js' */        base: base,
/*Line 6 - 'AtomPostButton.js' */        start:function(){
/*Line 7 - 'AtomPostButton.js' */        },
/*Line 8 - 'AtomPostButton.js' */        properties: {
/*Line 9 - 'AtomPostButton.js' */            postData: null,
/*Line 10 - 'AtomPostButton.js' */            postResult: null,
/*Line 11 - 'AtomPostButton.js' */            postUrl: null,
/*Line 12 - 'AtomPostButton.js' */            next: null,
/*Line 13 - 'AtomPostButton.js' */            confirm: false,
/*Line 14 - 'AtomPostButton.js' */            confirmMessage: null,
/*Line 15 - 'AtomPostButton.js' */            mergeData: null
/*Line 16 - 'AtomPostButton.js' */        },
/*Line 17 - 'AtomPostButton.js' */        methods: {
/*Line 18 - 'AtomPostButton.js' */            get_postData: function () {
/*Line 19 - 'AtomPostButton.js' */                return this._postData || this.get_data();
/*Line 20 - 'AtomPostButton.js' */            },

/*Line 22 - 'AtomPostButton.js' */            onClickHandler: function (e) {
/*Line 23 - 'AtomPostButton.js' */                if (this._confirm) {
/*Line 24 - 'AtomPostButton.js' */                    var _this = this;
/*Line 25 - 'AtomPostButton.js' */                    Atom.confirm(this._confirmMessage, function () {
/*Line 26 - 'AtomPostButton.js' */                        _this.onConfirmed(e);
/*Line 27 - 'AtomPostButton.js' */                    });
/*Line 28 - 'AtomPostButton.js' */                    return;
/*Line 29 - 'AtomPostButton.js' */                }
/*Line 30 - 'AtomPostButton.js' */                this.onConfirmed(e);
/*Line 31 - 'AtomPostButton.js' */            },

/*Line 33 - 'AtomPostButton.js' */            onConfirmed: function (e) {


/*Line 36 - 'AtomPostButton.js' */                if (!this._postUrl) {
/*Line 37 - 'AtomPostButton.js' */                    base.onClickHandler.apply(this, arguments);
/*Line 38 - 'AtomPostButton.js' */                    return;
/*Line 39 - 'AtomPostButton.js' */                }

/*Line 41 - 'AtomPostButton.js' */                var data = this.get_postData();

/*Line 43 - 'AtomPostButton.js' */                if (data === null || data === undefined)
/*Line 44 - 'AtomPostButton.js' */                    return;

/*Line 46 - 'AtomPostButton.js' */                var m = this._mergeData;
/*Line 47 - 'AtomPostButton.js' */                if (m) {
/*Line 48 - 'AtomPostButton.js' */                    for (var i in m) {
/*Line 49 - 'AtomPostButton.js' */                        data[i] = m[i];
/*Line 50 - 'AtomPostButton.js' */                    }
/*Line 51 - 'AtomPostButton.js' */                }

/*Line 53 - 'AtomPostButton.js' */                //data = AtomBinder.getClone(data);

/*Line 55 - 'AtomPostButton.js' */                var caller = this;
/*Line 56 - 'AtomPostButton.js' */                var invokeNext = function (p) {
/*Line 57 - 'AtomPostButton.js' */                    AtomBinder.setValue(caller, "postResult", p.value());
/*Line 58 - 'AtomPostButton.js' */                    caller.invokeAction(caller._next);
/*Line 59 - 'AtomPostButton.js' */                };

/*Line 61 - 'AtomPostButton.js' */                //this.invokeAjax(this._postUrl, { type: "POST", data: data, success: invokeNext });
/*Line 62 - 'AtomPostButton.js' */                AtomPromise.json(this._postUrl, null, { type: "POST", data: data }).then(invokeNext).invoke();

/*Line 64 - 'AtomPostButton.js' */            }
/*Line 65 - 'AtomPostButton.js' */        }
/*Line 66 - 'AtomPostButton.js' */    });
/*Line 67 - 'AtomPostButton.js' */})(window, WebAtoms.AtomButton.prototype);
/*Line 0 - 'AtomToggleButtonBar.js' */

/*Line 2 - 'AtomToggleButtonBar.js' */(function (window, baseType) {
/*Line 3 - 'AtomToggleButtonBar.js' */    return classCreatorEx({
/*Line 4 - 'AtomToggleButtonBar.js' */        name: "WebAtoms.AtomToggleButtonBar",
/*Line 5 - 'AtomToggleButtonBar.js' */        base: baseType,
/*Line 6 - 'AtomToggleButtonBar.js' */        start: function (e) {
/*Line 7 - 'AtomToggleButtonBar.js' */            this._allowSelectFirst = true;
/*Line 8 - 'AtomToggleButtonBar.js' */            this._allowMultipleSelection = false;
/*Line 9 - 'AtomToggleButtonBar.js' */            this._showTabs = false;
/*Line 10 - 'AtomToggleButtonBar.js' */            this._autoScrollToSelection = false;

/*Line 12 - 'AtomToggleButtonBar.js' */            $(e).removeClass("atom-list-box");
/*Line 13 - 'AtomToggleButtonBar.js' */        },
/*Line 14 - 'AtomToggleButtonBar.js' */        properties: {
/*Line 15 - 'AtomToggleButtonBar.js' */            showTabs: false
/*Line 16 - 'AtomToggleButtonBar.js' */        },
/*Line 17 - 'AtomToggleButtonBar.js' */        methods: {
/*Line 18 - 'AtomToggleButtonBar.js' */            init: function () {

/*Line 20 - 'AtomToggleButtonBar.js' */                baseType.init.call(this);

/*Line 22 - 'AtomToggleButtonBar.js' */                this.setValue("class", "[$owner.showTabs ? 'atom-tab-button-bar' : 'atom-toggle-button-bar']", true, this._element);
/*Line 23 - 'AtomToggleButtonBar.js' */            }
/*Line 24 - 'AtomToggleButtonBar.js' */        }
/*Line 25 - 'AtomToggleButtonBar.js' */    });
/*Line 26 - 'AtomToggleButtonBar.js' */})(window, WebAtoms.AtomListBox.prototype);
/*Line 0 - 'AtomApplication.js' */

/*Line 2 - 'AtomApplication.js' */this.appScope = null;

/*Line 4 - 'AtomApplication.js' */this.atomApplication = null;

/*Line 6 - 'AtomApplication.js' */(function (window, name, base) {

/*Line 8 - 'AtomApplication.js' */    return classCreator(name, base,
/*Line 9 - 'AtomApplication.js' */        function (element) {
/*Line 10 - 'AtomApplication.js' */            $(element).removeClass("atom-dock-panel");
/*Line 11 - 'AtomApplication.js' */            $(element).addClass("atom-application");

/*Line 13 - 'AtomApplication.js' */            this._scope = new AtomScope(this, null, this);
/*Line 14 - 'AtomApplication.js' */            window.appScope = this._scope;

/*Line 16 - 'AtomApplication.js' */            if (window.model) {
/*Line 17 - 'AtomApplication.js' */                window.appScope.model = window.model;
/*Line 18 - 'AtomApplication.js' */                this._data = window.model;
/*Line 19 - 'AtomApplication.js' */            }

/*Line 21 - 'AtomApplication.js' */            window.atomApplication = this;
/*Line 22 - 'AtomApplication.js' */            if (location.hash) {
/*Line 23 - 'AtomApplication.js' */                var url = location.hash.substring(1);
/*Line 24 - 'AtomApplication.js' */                this._urlScope = AtomUI.parseUrl(url);
/*Line 25 - 'AtomApplication.js' */            } else {
/*Line 26 - 'AtomApplication.js' */                this._urlScope = {};
/*Line 27 - 'AtomApplication.js' */            }

/*Line 29 - 'AtomApplication.js' */            // load hash values...
/*Line 30 - 'AtomApplication.js' */            this.onHashChanged();

/*Line 32 - 'AtomApplication.js' */            this.busyCount = 0;
/*Line 33 - 'AtomApplication.js' */        },
/*Line 34 - 'AtomApplication.js' */        {
/*Line 35 - 'AtomApplication.js' */            get_title: function () {
/*Line 36 - 'AtomApplication.js' */                return window.document.title;
/*Line 37 - 'AtomApplication.js' */            },
/*Line 38 - 'AtomApplication.js' */            set_title: function (v) {
/*Line 39 - 'AtomApplication.js' */                window.document.title = v;
/*Line 40 - 'AtomApplication.js' */            },

/*Line 42 - 'AtomApplication.js' */            get_isBusy: function () {
/*Line 43 - 'AtomApplication.js' */                return this.busyCount;
/*Line 44 - 'AtomApplication.js' */            },

/*Line 46 - 'AtomApplication.js' */            setBusy: function (b, msg) {
/*Line 47 - 'AtomApplication.js' */                if (b) {
/*Line 48 - 'AtomApplication.js' */                    this.busyCount++;
/*Line 49 - 'AtomApplication.js' */                } else {
/*Line 50 - 'AtomApplication.js' */                    this.busyCount--;
/*Line 51 - 'AtomApplication.js' */                }
/*Line 52 - 'AtomApplication.js' */                if (msg !== undefined) {
/*Line 53 - 'AtomApplication.js' */                    if (!msg)
/*Line 54 - 'AtomApplication.js' */                        msg = "";
/*Line 55 - 'AtomApplication.js' */                    AtomBinder.setValue(this, "busyMessage", msg);
/*Line 56 - 'AtomApplication.js' */                } else {
/*Line 57 - 'AtomApplication.js' */                    AtomBinder.setValue(this, "busyMessage", "Loading...");
/*Line 58 - 'AtomApplication.js' */                }
/*Line 59 - 'AtomApplication.js' */                AtomBinder.refreshValue(this, "isBusy");
/*Line 60 - 'AtomApplication.js' */            },

/*Line 62 - 'AtomApplication.js' */            updateUI: function () {
/*Line 63 - 'AtomApplication.js' */                //if (!this._renderAsPage) {
/*Line 64 - 'AtomApplication.js' */                //    var element = this.get_element();
/*Line 65 - 'AtomApplication.js' */                //    var ep = element.parentNode;
/*Line 66 - 'AtomApplication.js' */                //    var pw = $(ep).outerWidth();
/*Line 67 - 'AtomApplication.js' */                //    var left = (pw - $(element).width()) / 2;
/*Line 68 - 'AtomApplication.js' */                //    element.style.left = left + "px";
/*Line 69 - 'AtomApplication.js' */                //    element.style.position = "absolute";
/*Line 70 - 'AtomApplication.js' */                //}
/*Line 71 - 'AtomApplication.js' */                base.updateUI.call(this);

/*Line 73 - 'AtomApplication.js' */                AtomBinder.refreshValue(this, "appWidth");
/*Line 74 - 'AtomApplication.js' */                AtomBinder.refreshValue(this, "appHeight");
/*Line 75 - 'AtomApplication.js' */                AtomBinder.refreshValue(this, "bodyWidth");
/*Line 76 - 'AtomApplication.js' */                AtomBinder.refreshValue(this, "bodyHeight");
/*Line 77 - 'AtomApplication.js' */            },

/*Line 79 - 'AtomApplication.js' */            onUpdateUI: function () {
/*Line 80 - 'AtomApplication.js' */                if (!this._renderAsPage) {
/*Line 81 - 'AtomApplication.js' */                    base.onUpdateUI.call(this);
/*Line 82 - 'AtomApplication.js' */                }
/*Line 83 - 'AtomApplication.js' */            },

/*Line 85 - 'AtomApplication.js' */            get_appWidth: function () {
/*Line 86 - 'AtomApplication.js' */                return $(this._element).width();
/*Line 87 - 'AtomApplication.js' */            },
/*Line 88 - 'AtomApplication.js' */            get_appHeight: function () {
/*Line 89 - 'AtomApplication.js' */                return $(this._element).height();
/*Line 90 - 'AtomApplication.js' */            },

/*Line 92 - 'AtomApplication.js' */            get_bodyWidth: function () {
/*Line 93 - 'AtomApplication.js' */                return $(document.body).width();
/*Line 94 - 'AtomApplication.js' */            },
/*Line 95 - 'AtomApplication.js' */            get_bodyHeight: function () {
/*Line 96 - 'AtomApplication.js' */                return $(document.body).height();
/*Line 97 - 'AtomApplication.js' */            },


/*Line 100 - 'AtomApplication.js' */            onHashChanged: function () {

/*Line 102 - 'AtomApplication.js' */                if (this._noHashRefresh)
/*Line 103 - 'AtomApplication.js' */                    return;
/*Line 104 - 'AtomApplication.js' */                var scope = this._scope;

/*Line 106 - 'AtomApplication.js' */                var url = location.hash ? location.hash : this._defaultScope;
/*Line 107 - 'AtomApplication.js' */                if (!url) {
/*Line 108 - 'AtomApplication.js' */                    return;
/*Line 109 - 'AtomApplication.js' */                }

/*Line 111 - 'AtomApplication.js' */                //log("#changed:" + url);

/*Line 113 - 'AtomApplication.js' */                this._noHashRefresh = true;
/*Line 114 - 'AtomApplication.js' */                url = url.substr(1);

/*Line 116 - 'AtomApplication.js' */                var s = AtomUI.parseUrl(url);

/*Line 118 - 'AtomApplication.js' */                if (this._created) {
/*Line 119 - 'AtomApplication.js' */                    for (var key in s) {
/*Line 120 - 'AtomApplication.js' */                        var val = s[key];
/*Line 121 - 'AtomApplication.js' */                        if (scope[key] != val) {
/*Line 122 - 'AtomApplication.js' */                            AtomBinder.setValue(scope, key, val);
/*Line 123 - 'AtomApplication.js' */                        }
/*Line 124 - 'AtomApplication.js' */                    }
/*Line 125 - 'AtomApplication.js' */                } else {
/*Line 126 - 'AtomApplication.js' */                    Atom.merge(scope, s);
/*Line 127 - 'AtomApplication.js' */                }

/*Line 129 - 'AtomApplication.js' */                this._noHashRefresh = false;

/*Line 131 - 'AtomApplication.js' */            },

/*Line 133 - 'AtomApplication.js' */            invokeUpdateUI: function () {
/*Line 134 - 'AtomApplication.js' */                var container = this;
/*Line 135 - 'AtomApplication.js' */                var _this = this;
/*Line 136 - 'AtomApplication.js' */                window.setTimeout(function () {
/*Line 137 - 'AtomApplication.js' */                    return _this.updateUI();
/*Line 138 - 'AtomApplication.js' */                }, 5);
/*Line 139 - 'AtomApplication.js' */            },

/*Line 141 - 'AtomApplication.js' */            onRefreshValue: function (target, key) {
/*Line 142 - 'AtomApplication.js' */                if (this._noHashRefresh)
/*Line 143 - 'AtomApplication.js' */                    return;

/*Line 145 - 'AtomApplication.js' */                var i = key;
/*Line 146 - 'AtomApplication.js' */                if (i.indexOf('_') == 0)
/*Line 147 - 'AtomApplication.js' */                    return;
/*Line 148 - 'AtomApplication.js' */                var val = this._scope[i];
/*Line 149 - 'AtomApplication.js' */                if (val === undefined)
/*Line 150 - 'AtomApplication.js' */                    return;
/*Line 151 - 'AtomApplication.js' */                if (val === null)
/*Line 152 - 'AtomApplication.js' */                    return;
/*Line 153 - 'AtomApplication.js' */                var t = typeof (val);
/*Line 154 - 'AtomApplication.js' */                if (t != 'string' && t != 'number' && t != 'boolean') {
/*Line 155 - 'AtomApplication.js' */                    return;
/*Line 156 - 'AtomApplication.js' */                }


/*Line 159 - 'AtomApplication.js' */                var diff = {};
/*Line 160 - 'AtomApplication.js' */                var src = this._scope;
/*Line 161 - 'AtomApplication.js' */                var dest = this._defaultScopeValues || {};

/*Line 163 - 'AtomApplication.js' */                for (var k in src) {
/*Line 164 - 'AtomApplication.js' */                    var v = src[k];
/*Line 165 - 'AtomApplication.js' */                    if (!this._urlScope[k]) {
/*Line 166 - 'AtomApplication.js' */                        if (v == dest[k])
/*Line 167 - 'AtomApplication.js' */                            continue;
/*Line 168 - 'AtomApplication.js' */                    }
/*Line 169 - 'AtomApplication.js' */                    diff[k] = v;
/*Line 170 - 'AtomApplication.js' */                }

/*Line 172 - 'AtomApplication.js' */                // update hash !!!
/*Line 173 - 'AtomApplication.js' */                var p = Atom.encodeParameters(diff);
/*Line 174 - 'AtomApplication.js' */                if (!p) {
/*Line 175 - 'AtomApplication.js' */                    if (history && history.pushState) {
/*Line 176 - 'AtomApplication.js' */                        history.pushState({}, document.title, location.href.split('#')[0]);
/*Line 177 - 'AtomApplication.js' */                    } else {
/*Line 178 - 'AtomApplication.js' */                        location.hash = "";
/*Line 179 - 'AtomApplication.js' */                    }
/*Line 180 - 'AtomApplication.js' */                    return;
/*Line 181 - 'AtomApplication.js' */                }
/*Line 182 - 'AtomApplication.js' */                p = "#" + p;


/*Line 185 - 'AtomApplication.js' */                if (location.hash != p) {

/*Line 187 - 'AtomApplication.js' */                    this._noHashRefresh = true;
/*Line 188 - 'AtomApplication.js' */                    if (history && history.pushState) {
/*Line 189 - 'AtomApplication.js' */                        history.pushState({}, document.title, (location.href.split('#')[0]) + p);
/*Line 190 - 'AtomApplication.js' */                    } else {
/*Line 191 - 'AtomApplication.js' */                        location.href = p;
/*Line 192 - 'AtomApplication.js' */                    }
/*Line 193 - 'AtomApplication.js' */                    this._noHashRefresh = false;
/*Line 194 - 'AtomApplication.js' */                }
/*Line 195 - 'AtomApplication.js' */            },

/*Line 197 - 'AtomApplication.js' */            onInitialized: function () {

/*Line 199 - 'AtomApplication.js' */                // To save URL persistance of Scope Values
/*Line 200 - 'AtomApplication.js' */                // We have to remember default scope values set 
/*Line 201 - 'AtomApplication.js' */                // at time of page creation.
/*Line 202 - 'AtomApplication.js' */                var d = {};
/*Line 203 - 'AtomApplication.js' */                var src = this._scope;
/*Line 204 - 'AtomApplication.js' */                for (var k in src) {
/*Line 205 - 'AtomApplication.js' */                    if (k.indexOf('_') == 0)
/*Line 206 - 'AtomApplication.js' */                        continue;
/*Line 207 - 'AtomApplication.js' */                    var val = src[k];
/*Line 208 - 'AtomApplication.js' */                    if (val === undefined)
/*Line 209 - 'AtomApplication.js' */                        continue;
/*Line 210 - 'AtomApplication.js' */                    if (val === null)
/*Line 211 - 'AtomApplication.js' */                        continue;
/*Line 212 - 'AtomApplication.js' */                    var t = typeof (val);
/*Line 213 - 'AtomApplication.js' */                    if (t != 'string' && t != 'number' && t != 'boolean') {
/*Line 214 - 'AtomApplication.js' */                        continue;
/*Line 215 - 'AtomApplication.js' */                    }
/*Line 216 - 'AtomApplication.js' */                    d[k] = val;
/*Line 217 - 'AtomApplication.js' */                }
/*Line 218 - 'AtomApplication.js' */                this._defaultScopeValues = d;


/*Line 221 - 'AtomApplication.js' */                var p = Atom.encodeParameters(this._scope);
/*Line 222 - 'AtomApplication.js' */                if (p) {
/*Line 223 - 'AtomApplication.js' */                    this._defaultScope = "#" + p;
/*Line 224 - 'AtomApplication.js' */                }
/*Line 225 - 'AtomApplication.js' */                base.onInitialized.call(this);
/*Line 226 - 'AtomApplication.js' */            },

/*Line 228 - 'AtomApplication.js' */            createChildren: function () {
/*Line 229 - 'AtomApplication.js' */                base.createChildren.call(this);

/*Line 231 - 'AtomApplication.js' */                this.getTemplate("busyTemplate");
/*Line 232 - 'AtomApplication.js' */                if (this._busyTemplate) {
/*Line 233 - 'AtomApplication.js' */                    this._element.appendChild(this._busyTemplate);

/*Line 235 - 'AtomApplication.js' */                    this.onCreateChildren(this._busyTemplate);
/*Line 236 - 'AtomApplication.js' */                }
/*Line 237 - 'AtomApplication.js' */            },

/*Line 239 - 'AtomApplication.js' */            onCreated: function () {
/*Line 240 - 'AtomApplication.js' */                base.onCreated.call(this);


/*Line 243 - 'AtomApplication.js' */                if (AtomBrowser.isIE && AtomBrowser.majorVersion < 8) {
/*Line 244 - 'AtomApplication.js' */                    // setup timer...
/*Line 245 - 'AtomApplication.js' */                    var _this = this;
/*Line 246 - 'AtomApplication.js' */                    setInterval(function () {
/*Line 247 - 'AtomApplication.js' */                        _this.onCheckHash();
/*Line 248 - 'AtomApplication.js' */                    }, 1000);
/*Line 249 - 'AtomApplication.js' */                    this._lastHash = location.hash;
/*Line 250 - 'AtomApplication.js' */                } else {
/*Line 251 - 'AtomApplication.js' */                    var eventName = window.onhashchange ? "onhashchange" : "hashchange";
/*Line 252 - 'AtomApplication.js' */                    this.bindEvent(window, eventName, "onHashChanged");
/*Line 253 - 'AtomApplication.js' */                }

/*Line 255 - 'AtomApplication.js' */                if (this._next) {
/*Line 256 - 'AtomApplication.js' */                    WebAtoms.dispatcher.callLater(function () {
/*Line 257 - 'AtomApplication.js' */                        window.atomApplication.invokeAction(window.atomApplication._next);
/*Line 258 - 'AtomApplication.js' */                    });
/*Line 259 - 'AtomApplication.js' */                }
/*Line 260 - 'AtomApplication.js' */            },

/*Line 262 - 'AtomApplication.js' */            onCheckHash: function () {
/*Line 263 - 'AtomApplication.js' */                if (this._lastHash != location.hash) {
/*Line 264 - 'AtomApplication.js' */                    this.onHashChanged();
/*Line 265 - 'AtomApplication.js' */                    this._lastHash = location.hash;
/*Line 266 - 'AtomApplication.js' */                }
/*Line 267 - 'AtomApplication.js' */            },

/*Line 269 - 'AtomApplication.js' */            onCloseCommand: function () {
/*Line 270 - 'AtomApplication.js' */                if (!parent)
/*Line 271 - 'AtomApplication.js' */                    return;
/*Line 272 - 'AtomApplication.js' */                //var iframe = parent.document.getElementById(frameElement.id);
/*Line 273 - 'AtomApplication.js' */                var win = frameElement.atomWindow;
/*Line 274 - 'AtomApplication.js' */                win._value = this._value;
/*Line 275 - 'AtomApplication.js' */                win.onCloseCommand();
/*Line 276 - 'AtomApplication.js' */            },

/*Line 278 - 'AtomApplication.js' */            setup: function () {
/*Line 279 - 'AtomApplication.js' */                this.createChildren();
/*Line 280 - 'AtomApplication.js' */                this.init();
/*Line 281 - 'AtomApplication.js' */            },

/*Line 283 - 'AtomApplication.js' */            onInitialized: function () {
/*Line 284 - 'AtomApplication.js' */                base.onInitialized.apply(this, arguments);
/*Line 285 - 'AtomApplication.js' */                if (!this._renderAsPage) {
/*Line 286 - 'AtomApplication.js' */                    $(this._element).addClass("atom-dock-application");
/*Line 287 - 'AtomApplication.js' */                }
/*Line 288 - 'AtomApplication.js' */            },

/*Line 290 - 'AtomApplication.js' */            init: function () {

/*Line 292 - 'AtomApplication.js' */                this.bindEvent(window, "resize", "invokeUpdateUI");

/*Line 294 - 'AtomApplication.js' */                var _this = this;
/*Line 295 - 'AtomApplication.js' */                this._onRefreshValue = function () {
/*Line 296 - 'AtomApplication.js' */                    _this.onRefreshValue.apply(_this, arguments);
/*Line 297 - 'AtomApplication.js' */                };

/*Line 299 - 'AtomApplication.js' */                this._scope._$_watcher = this;

/*Line 301 - 'AtomApplication.js' */                base.init.call(this);


/*Line 304 - 'AtomApplication.js' */                this.closeCommand = function () {
/*Line 305 - 'AtomApplication.js' */                    _this.onCloseCommand.apply(_this, arguments);
/*Line 306 - 'AtomApplication.js' */                };

/*Line 308 - 'AtomApplication.js' */            }
/*Line 309 - 'AtomApplication.js' */        },
/*Line 310 - 'AtomApplication.js' */        {
/*Line 311 - 'AtomApplication.js' */            renderAsPage: false,
/*Line 312 - 'AtomApplication.js' */            busyMessage: "",
/*Line 313 - 'AtomApplication.js' */            progress: 0

/*Line 315 - 'AtomApplication.js' */        });
/*Line 316 - 'AtomApplication.js' */})(window, "WebAtoms.AtomApplication", WebAtoms.AtomDockPanel.prototype);
/*Line 0 - 'AtomForm.js' */

/*Line 2 - 'AtomForm.js' */(function (baseType) {
/*Line 3 - 'AtomForm.js' */    return classCreatorEx({
/*Line 4 - 'AtomForm.js' */        name: "WebAtoms.AtomForm",
/*Line 5 - 'AtomForm.js' */        base: baseType,
/*Line 6 - 'AtomForm.js' */        start: function () {
/*Line 7 - 'AtomForm.js' */            this._success = null;
/*Line 8 - 'AtomForm.js' */            this._submit = null;
/*Line 9 - 'AtomForm.js' */            this._error = null;
/*Line 10 - 'AtomForm.js' */            this._attachments = null;
/*Line 11 - 'AtomForm.js' */        },
/*Line 12 - 'AtomForm.js' */        properties: {
/*Line 13 - 'AtomForm.js' */            result: null,
/*Line 14 - 'AtomForm.js' */            mergeData: null,
/*Line 15 - 'AtomForm.js' */            mergeResult: true,
/*Line 16 - 'AtomForm.js' */            postUrl: null,
/*Line 17 - 'AtomForm.js' */            postData: null,
/*Line 18 - 'AtomForm.js' */            successMessage: null,
/*Line 19 - 'AtomForm.js' */            clearData:false
/*Line 20 - 'AtomForm.js' */        },
/*Line 21 - 'AtomForm.js' */        methods: {
/*Line 22 - 'AtomForm.js' */            createFormLayout: function () {
/*Line 23 - 'AtomForm.js' */            },


/*Line 26 - 'AtomForm.js' */            preparePostData: function () {


/*Line 29 - 'AtomForm.js' */                var element = this.get_element();
/*Line 30 - 'AtomForm.js' */                var data = this._postData || this.get_data();

/*Line 32 - 'AtomForm.js' */                var m = this._mergeData;
/*Line 33 - 'AtomForm.js' */                if (m) {
/*Line 34 - 'AtomForm.js' */                    for (var i in m) {
/*Line 35 - 'AtomForm.js' */                        data[i] = m[i];
/*Line 36 - 'AtomForm.js' */                    }
/*Line 37 - 'AtomForm.js' */                }

/*Line 39 - 'AtomForm.js' */                return data;
/*Line 40 - 'AtomForm.js' */            },

/*Line 42 - 'AtomForm.js' */            onSubmit: function () {

/*Line 44 - 'AtomForm.js' */                if (!this.isValid()) {
/*Line 45 - 'AtomForm.js' */                    return;
/*Line 46 - 'AtomForm.js' */                }

/*Line 48 - 'AtomForm.js' */                var data = this.preparePostData();
/*Line 49 - 'AtomForm.js' */                var url = AtomPromise.getUrl(this._postUrl);
/*Line 50 - 'AtomForm.js' */                AtomPromise.json(url, { _tv: Atom.time() }, { type: "POST", data: data }).then(this._success).invoke();
/*Line 51 - 'AtomForm.js' */            },

/*Line 53 - 'AtomForm.js' */            onSuccess: function (p) {

/*Line 55 - 'AtomForm.js' */                var result = p.value();

/*Line 57 - 'AtomForm.js' */                AtomBinder.setValue(this, "result", result);

/*Line 59 - 'AtomForm.js' */                if (this._mergeResult) {
/*Line 60 - 'AtomForm.js' */                    // merge...
/*Line 61 - 'AtomForm.js' */                    // AtomBinder.setValue(this, "data", result);
/*Line 62 - 'AtomForm.js' */                    var data = this.get_data();
/*Line 63 - 'AtomForm.js' */                    for (var index in result) {
/*Line 64 - 'AtomForm.js' */                        AtomBinder.setValue(data, index, result[index]);
/*Line 65 - 'AtomForm.js' */                    }
/*Line 66 - 'AtomForm.js' */                }

/*Line 68 - 'AtomForm.js' */                if (this._clearData) {
/*Line 69 - 'AtomForm.js' */                    var data = this.get_data();
/*Line 70 - 'AtomForm.js' */                    for (var index in this._clearData) {
/*Line 71 - 'AtomForm.js' */                        AtomBinder.setValue(data, index, result[index]);
/*Line 72 - 'AtomForm.js' */                    }
/*Line 73 - 'AtomForm.js' */                }

/*Line 75 - 'AtomForm.js' */                if (this._successMessage) {
/*Line 76 - 'AtomForm.js' */                    Atom.alert(this._successMessage);
/*Line 77 - 'AtomForm.js' */                }

/*Line 79 - 'AtomForm.js' */                this.invokeAction(this._next);

/*Line 81 - 'AtomForm.js' */            },

/*Line 83 - 'AtomForm.js' */            onKeyUp: function (e) {
/*Line 84 - 'AtomForm.js' */                if (e.target && e.target.nodeName && /textarea/gi.test(e.target.nodeName))
/*Line 85 - 'AtomForm.js' */                    return;
/*Line 86 - 'AtomForm.js' */                if (e.keyCode == 13) {
/*Line 87 - 'AtomForm.js' */                    var _this = this;
/*Line 88 - 'AtomForm.js' */                    // fix for IE 11, IE 11 does not fire Change event on enter
/*Line 89 - 'AtomForm.js' */                    if (/input/gi.test(e.target.nodeName)) {
/*Line 90 - 'AtomForm.js' */                        $(e.target).change();
/*Line 91 - 'AtomForm.js' */                    }
/*Line 92 - 'AtomForm.js' */                    WebAtoms.dispatcher.callLater(function () {
/*Line 93 - 'AtomForm.js' */                        _this.onSubmit();
/*Line 94 - 'AtomForm.js' */                    });
/*Line 95 - 'AtomForm.js' */                }
/*Line 96 - 'AtomForm.js' */            },

/*Line 98 - 'AtomForm.js' */            isValid: function () {
/*Line 99 - 'AtomForm.js' */                var element = this.get_element();
/*Line 100 - 'AtomForm.js' */                var ae = new ChildEnumerator(element);
/*Line 101 - 'AtomForm.js' */                var formValid = true;
/*Line 102 - 'AtomForm.js' */                while (ae.next()) {
/*Line 103 - 'AtomForm.js' */                    var field = ae.current();
/*Line 104 - 'AtomForm.js' */                    if (!this.validate(field))
/*Line 105 - 'AtomForm.js' */                        formValid = false;
/*Line 106 - 'AtomForm.js' */                }
/*Line 107 - 'AtomForm.js' */                return formValid;
/*Line 108 - 'AtomForm.js' */            },


/*Line 111 - 'AtomForm.js' */            validateField: function (e) {
/*Line 112 - 'AtomForm.js' */                var target = e.target;
/*Line 113 - 'AtomForm.js' */                this.validate(target);
/*Line 114 - 'AtomForm.js' */            },

/*Line 116 - 'AtomForm.js' */            validate: function (e, ef) {

/*Line 118 - 'AtomForm.js' */                if (!ef)
/*Line 119 - 'AtomForm.js' */                    ef = $(e).data("field-error");

/*Line 121 - 'AtomForm.js' */                var ctrl = e.atomControl;
/*Line 122 - 'AtomForm.js' */                var val = null;
/*Line 123 - 'AtomForm.js' */                var skip = false;
/*Line 124 - 'AtomForm.js' */                if (!ctrl) {
/*Line 125 - 'AtomForm.js' */                    if ((/input|select|textarea/i).test(e.nodeName)) {
/*Line 126 - 'AtomForm.js' */                        val = $(e).val();
/*Line 127 - 'AtomForm.js' */                    } else {
/*Line 128 - 'AtomForm.js' */                        skip = true;
/*Line 129 - 'AtomForm.js' */                    }
/*Line 130 - 'AtomForm.js' */                } else {
/*Line 131 - 'AtomForm.js' */                    if (ctrl.constructor == WebAtoms.AtomFormField) {
/*Line 132 - 'AtomForm.js' */                        return ctrl.validate();
/*Line 133 - 'AtomForm.js' */                    }
/*Line 134 - 'AtomForm.js' */                    val = AtomBinder.getValue(ctrl, "value");
/*Line 135 - 'AtomForm.js' */                }

/*Line 137 - 'AtomForm.js' */                if (!skip) {

/*Line 139 - 'AtomForm.js' */                    var req = $(e).attr("atom-required");
/*Line 140 - 'AtomForm.js' */                    if (req && !val) {
/*Line 141 - 'AtomForm.js' */                        // error...
/*Line 142 - 'AtomForm.js' */                        $(ef).text("Required");
/*Line 143 - 'AtomForm.js' */                        $(e).addClass("atom-data-error");
/*Line 144 - 'AtomForm.js' */                        return false;
/*Line 145 - 'AtomForm.js' */                    }


/*Line 148 - 'AtomForm.js' */                    var re = $(e).attr("atom-regex");
/*Line 149 - 'AtomForm.js' */                    if (!re) {
/*Line 150 - 'AtomForm.js' */                        var dt = $(e).attr("atom-data-type");
/*Line 151 - 'AtomForm.js' */                        if (dt) {
/*Line 152 - 'AtomForm.js' */                            switch (dt) {
/*Line 153 - 'AtomForm.js' */                                case "email":
/*Line 154 - 'AtomForm.js' */                                    re = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
/*Line 155 - 'AtomForm.js' */                                    break;
/*Line 156 - 'AtomForm.js' */                            }
/*Line 157 - 'AtomForm.js' */                        }
/*Line 158 - 'AtomForm.js' */                    } else {
/*Line 159 - 'AtomForm.js' */                        re = eval("(" + re + ")");
/*Line 160 - 'AtomForm.js' */                    }

/*Line 162 - 'AtomForm.js' */                    if (re) {
/*Line 163 - 'AtomForm.js' */                        if (!re.test(val)) {
/*Line 164 - 'AtomForm.js' */                            $(ef).text("Invalid");
/*Line 165 - 'AtomForm.js' */                            $(e).addClass("atom-data-error");
/*Line 166 - 'AtomForm.js' */                            return false;
/*Line 167 - 'AtomForm.js' */                        }
/*Line 168 - 'AtomForm.js' */                    }

/*Line 170 - 'AtomForm.js' */                    $(ef).text("");
/*Line 171 - 'AtomForm.js' */                    $(e).removeClass("atom-data-error");
/*Line 172 - 'AtomForm.js' */                }

/*Line 174 - 'AtomForm.js' */                // return for every children??
/*Line 175 - 'AtomForm.js' */                var ae = new ChildEnumerator(e);
/*Line 176 - 'AtomForm.js' */                var isValid = true;
/*Line 177 - 'AtomForm.js' */                while (ae.next()) {
/*Line 178 - 'AtomForm.js' */                    if (!this.validate(ae.current(), ef)) {
/*Line 179 - 'AtomForm.js' */                        isValid = false;
/*Line 180 - 'AtomForm.js' */                    }
/*Line 181 - 'AtomForm.js' */                }

/*Line 183 - 'AtomForm.js' */                return isValid;
/*Line 184 - 'AtomForm.js' */            },

/*Line 186 - 'AtomForm.js' */            init: function () {
/*Line 187 - 'AtomForm.js' */                baseType.init.call(this);

/*Line 189 - 'AtomForm.js' */                var _this = this;
/*Line 190 - 'AtomForm.js' */                this._success = function () {
/*Line 191 - 'AtomForm.js' */                    _this.onSuccess.apply(_this, arguments);
/*Line 192 - 'AtomForm.js' */                };

/*Line 194 - 'AtomForm.js' */                this._submit = function () {
/*Line 195 - 'AtomForm.js' */                    _this.onSubmit.apply(_this, arguments);
/*Line 196 - 'AtomForm.js' */                };

/*Line 198 - 'AtomForm.js' */                var element = this.get_element();

/*Line 200 - 'AtomForm.js' */                this.submitCommand = this._submit;

/*Line 202 - 'AtomForm.js' */                this.bindEvent(element, "keyup", "onKeyUp");

/*Line 204 - 'AtomForm.js' */                $(element).find("input[type=submit]").bind("click", null, this._submit);
/*Line 205 - 'AtomForm.js' */                $(element).find("button[type=submit]").bind("click", null, this._submit);


/*Line 208 - 'AtomForm.js' */                var _this = this;
/*Line 209 - 'AtomForm.js' */                this._vh = function () {
/*Line 210 - 'AtomForm.js' */                    _this.validateField.apply(_this, arguments);
/*Line 211 - 'AtomForm.js' */                };

/*Line 213 - 'AtomForm.js' */                $(element).find("input,select,textarea").bind("blur", null, this._vh);



/*Line 217 - 'AtomForm.js' */            }

/*Line 219 - 'AtomForm.js' */        }
/*Line 220 - 'AtomForm.js' */    });
/*Line 221 - 'AtomForm.js' */})(WebAtoms.AtomControl.prototype);

/*Line 0 - 'AtomFormLayout.js' */

/*Line 2 - 'AtomFormLayout.js' */(function (baseType) {
/*Line 3 - 'AtomFormLayout.js' */    return classCreatorEx({
/*Line 4 - 'AtomFormLayout.js' */        name: "WebAtoms.AtomFormLayout",
/*Line 5 - 'AtomFormLayout.js' */        base: baseType,
/*Line 6 - 'AtomFormLayout.js' */        start: function () {
/*Line 7 - 'AtomFormLayout.js' */            this._useTable = true;
/*Line 8 - 'AtomFormLayout.js' */            this._errorItems = [];
/*Line 9 - 'AtomFormLayout.js' */            this._minLabelWidth = 0;
/*Line 10 - 'AtomFormLayout.js' */        },
/*Line 11 - 'AtomFormLayout.js' */        properties: {
/*Line 12 - 'AtomFormLayout.js' */            minLabelWidth: 0
/*Line 13 - 'AtomFormLayout.js' */        },
/*Line 14 - 'AtomFormLayout.js' */        methods: {
/*Line 15 - 'AtomFormLayout.js' */            createField: function (parent, child) {



/*Line 19 - 'AtomFormLayout.js' */                var amap = AtomUI.attributeMap(child, /^(atom\-(type|label|required|regex|data\-type|is\-valid|field\-(value|visible|class)|error))$/i);

/*Line 21 - 'AtomFormLayout.js' */                var at = amap["atom-type"];
/*Line 22 - 'AtomFormLayout.js' */                if (at) {
/*Line 23 - 'AtomFormLayout.js' */                    amap["atom-type"] = null;
/*Line 24 - 'AtomFormLayout.js' */                    switch (at.value) {
/*Line 25 - 'AtomFormLayout.js' */                        case "AtomFormGridLayout":
/*Line 26 - 'AtomFormLayout.js' */                        case "AtomFormTab":
/*Line 27 - 'AtomFormLayout.js' */                            parent.appendChild(child);
/*Line 28 - 'AtomFormLayout.js' */                            var a = AtomUI.createControl(child, at.value);
/*Line 29 - 'AtomFormLayout.js' */                            return a;
/*Line 30 - 'AtomFormLayout.js' */                            break;
/*Line 31 - 'AtomFormLayout.js' */                    }
/*Line 32 - 'AtomFormLayout.js' */                }

/*Line 34 - 'AtomFormLayout.js' */                var field = AtomUI.cloneNode(this._fieldTemplate);

/*Line 36 - 'AtomFormLayout.js' */                var cp = AtomUI.findPresenter(field);
/*Line 37 - 'AtomFormLayout.js' */                if (cp) {
/*Line 38 - 'AtomFormLayout.js' */                    cp.appendChild(child);
/*Line 39 - 'AtomFormLayout.js' */                    $(cp).removeAttr("atom-presenter");
/*Line 40 - 'AtomFormLayout.js' */                } else {
/*Line 41 - 'AtomFormLayout.js' */                    field.contentElement = child;
/*Line 42 - 'AtomFormLayout.js' */                }

/*Line 44 - 'AtomFormLayout.js' */                parent.appendChild(field);

/*Line 46 - 'AtomFormLayout.js' */                for (var k in amap) {
/*Line 47 - 'AtomFormLayout.js' */                    var v = amap[k];
/*Line 48 - 'AtomFormLayout.js' */                    if (!v)
/*Line 49 - 'AtomFormLayout.js' */                        continue;
/*Line 50 - 'AtomFormLayout.js' */                    child.removeAttributeNode(v.node);
/*Line 51 - 'AtomFormLayout.js' */                    field.setAttributeNode(v.node);
/*Line 52 - 'AtomFormLayout.js' */                }

/*Line 54 - 'AtomFormLayout.js' */                amap = AtomUI.attributeMap(field, /^atom\-(field\-value|is\-valid)$/i);

/*Line 56 - 'AtomFormLayout.js' */                if (!(amap["atom-field-value"] || amap["atom-is-valid"])) {
/*Line 57 - 'AtomFormLayout.js' */                    var v = $(child).attr("atom-value");
/*Line 58 - 'AtomFormLayout.js' */                    if (v && /^\$\[/gi.test(v)) {
/*Line 59 - 'AtomFormLayout.js' */                        // must be a two way binding..
/*Line 60 - 'AtomFormLayout.js' */                        v = v.substr(2);
/*Line 61 - 'AtomFormLayout.js' */                        if (!/^\$/gi.test(v)) {
/*Line 62 - 'AtomFormLayout.js' */                            v = "$" + v;
/*Line 63 - 'AtomFormLayout.js' */                        }
/*Line 64 - 'AtomFormLayout.js' */                        v = "[" + v;
/*Line 65 - 'AtomFormLayout.js' */                        var ind = v.indexOf(']');
/*Line 66 - 'AtomFormLayout.js' */                        v = v.substr(0, ind + 1);
/*Line 67 - 'AtomFormLayout.js' */                        $(field).attr("atom-field-value", v);
/*Line 68 - 'AtomFormLayout.js' */                    }
/*Line 69 - 'AtomFormLayout.js' */                }

/*Line 71 - 'AtomFormLayout.js' */                return AtomUI.createControl(field, WebAtoms.AtomFieldType);
/*Line 72 - 'AtomFormLayout.js' */            },

/*Line 74 - 'AtomFormLayout.js' */            createChildren: function () {
/*Line 75 - 'AtomFormLayout.js' */                var element = this._element;
/*Line 76 - 'AtomFormLayout.js' */                $(element).addClass("atom-form");
/*Line 77 - 'AtomFormLayout.js' */                var ae = new AtomEnumerator($(element).children());

/*Line 79 - 'AtomFormLayout.js' */                // add table...
/*Line 80 - 'AtomFormLayout.js' */                var table = document.createElement("TABLE");

/*Line 82 - 'AtomFormLayout.js' */                $(table).addClass("atom-form-table");

/*Line 84 - 'AtomFormLayout.js' */                var tbody = document.createElement("TBODY");

/*Line 86 - 'AtomFormLayout.js' */                AtomUI.removeAllChildren(element);
/*Line 87 - 'AtomFormLayout.js' */                //element.innerHTML = "";

/*Line 89 - 'AtomFormLayout.js' */                element.appendChild(table);
/*Line 90 - 'AtomFormLayout.js' */                table.appendChild(tbody);

/*Line 92 - 'AtomFormLayout.js' */                var child;
/*Line 93 - 'AtomFormLayout.js' */                this.getTemplate("fieldTemplate");

/*Line 95 - 'AtomFormLayout.js' */                while (ae.next()) {
/*Line 96 - 'AtomFormLayout.js' */                    child = ae.current();
/*Line 97 - 'AtomFormLayout.js' */                    if (!child)
/*Line 98 - 'AtomFormLayout.js' */                        continue;

/*Line 100 - 'AtomFormLayout.js' */                    this.createField(tbody, child);

/*Line 102 - 'AtomFormLayout.js' */                }

/*Line 104 - 'AtomFormLayout.js' */            }
/*Line 105 - 'AtomFormLayout.js' */        }
/*Line 106 - 'AtomFormLayout.js' */    });
/*Line 107 - 'AtomFormLayout.js' */})(WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomLayout.js' */

/*Line 2 - 'AtomLayout.js' */(function () {
/*Line 3 - 'AtomLayout.js' */    return classCreatorEx({
/*Line 4 - 'AtomLayout.js' */        name: "WebAtoms.AtomLayout",
/*Line 5 - 'AtomLayout.js' */        start: function () {
/*Line 6 - 'AtomLayout.js' */        },
/*Line 7 - 'AtomLayout.js' */        methods: {
/*Line 8 - 'AtomLayout.js' */            doLayout: function () {
/*Line 9 - 'AtomLayout.js' */            }
/*Line 10 - 'AtomLayout.js' */        }
/*Line 11 - 'AtomLayout.js' */    });
/*Line 12 - 'AtomLayout.js' */})();
/*Line 0 - 'AtomWindow.js' */

/*Line 2 - 'AtomWindow.js' */(function (baseType) {
/*Line 3 - 'AtomWindow.js' */    return classCreatorEx({
/*Line 4 - 'AtomWindow.js' */        name: "WebAtoms.AtomWindow",
/*Line 5 - 'AtomWindow.js' */        base: baseType,
/*Line 6 - 'AtomWindow.js' */        start: function () {
/*Line 7 - 'AtomWindow.js' */            this._presenters = ["windowDiv", "windowTitleDiv", "windowCloseButton", "iframe", "windowPlaceholder"];
/*Line 8 - 'AtomWindow.js' */        },
/*Line 9 - 'AtomWindow.js' */        properties: {
/*Line 10 - 'AtomWindow.js' */            opener: null,
/*Line 11 - 'AtomWindow.js' */            openerData: null,
/*Line 12 - 'AtomWindow.js' */            windowTemplate: null,
/*Line 13 - 'AtomWindow.js' */            isOpen: false,
/*Line 14 - 'AtomWindow.js' */            windowHeight: 300,
/*Line 15 - 'AtomWindow.js' */            windowWidth: 500,
/*Line 16 - 'AtomWindow.js' */            url: undefined,
/*Line 17 - 'AtomWindow.js' */            title: undefined
/*Line 18 - 'AtomWindow.js' */        },
/*Line 19 - 'AtomWindow.js' */        methods: {


/*Line 22 - 'AtomWindow.js' */            get_openerData: function () {
/*Line 23 - 'AtomWindow.js' */                var v = this.get_opener();
/*Line 24 - 'AtomWindow.js' */                if (!v)
/*Line 25 - 'AtomWindow.js' */                    return;
/*Line 26 - 'AtomWindow.js' */                return v.get_data();
/*Line 27 - 'AtomWindow.js' */            },

/*Line 29 - 'AtomWindow.js' */            onCloseCommand: function (scope, sender) {
/*Line 30 - 'AtomWindow.js' */                AtomBinder.setValue(this, "isOpen", false);
/*Line 31 - 'AtomWindow.js' */                var val = this._value;
/*Line 32 - 'AtomWindow.js' */                var caller = this;
/*Line 33 - 'AtomWindow.js' */                this._value = null;

/*Line 35 - 'AtomWindow.js' */                this.disposeChildren(this._element);

/*Line 37 - 'AtomWindow.js' */                setTimeout(function () {
/*Line 38 - 'AtomWindow.js' */                    AtomBinder.setValue(caller, "value", val);
/*Line 39 - 'AtomWindow.js' */                    caller.invokeAction(caller._next);
/*Line 40 - 'AtomWindow.js' */                }, 1);
/*Line 41 - 'AtomWindow.js' */            },

/*Line 43 - 'AtomWindow.js' */            refresh: function (scope, sender) {
/*Line 44 - 'AtomWindow.js' */                this.openWindow(scope, sender);
/*Line 45 - 'AtomWindow.js' */            },

/*Line 47 - 'AtomWindow.js' */            openWindow: function (scope, sender) {

/*Line 49 - 'AtomWindow.js' */                var tt = this.getTemplate("frameTemplate");

/*Line 51 - 'AtomWindow.js' */                tt = AtomUI.cloneNode(tt);

/*Line 53 - 'AtomWindow.js' */                var wdiv = $(tt).find("[atom-presenter=windowDiv]").get(0);
/*Line 54 - 'AtomWindow.js' */                var wtitle = $(tt).find("[atom-presenter=windowTitleDiv]").get(0);

/*Line 56 - 'AtomWindow.js' */                var wt = this.getTemplate("windowTemplate");

/*Line 58 - 'AtomWindow.js' */                $(wt).addClass("atom-window-template");

/*Line 60 - 'AtomWindow.js' */                if (!($(wt).attr("atom-dock"))) {
/*Line 61 - 'AtomWindow.js' */                    $(wt).attr("atom-dock", "Fill");
/*Line 62 - 'AtomWindow.js' */                }

/*Line 64 - 'AtomWindow.js' */                if (wt.length) {
/*Line 65 - 'AtomWindow.js' */                    for (var i = 0; i < wt.length; i++) {
/*Line 66 - 'AtomWindow.js' */                        wdiv.appendChild(wt[i]);
/*Line 67 - 'AtomWindow.js' */                    }
/*Line 68 - 'AtomWindow.js' */                } else {
/*Line 69 - 'AtomWindow.js' */                    wdiv.appendChild(wt);
/*Line 70 - 'AtomWindow.js' */                }

/*Line 72 - 'AtomWindow.js' */                var wct = this.getTemplate("commandTemplate");
/*Line 73 - 'AtomWindow.js' */                if (wct) {
/*Line 74 - 'AtomWindow.js' */                    wct.setAttribute("atom-dock", "Bottom");
/*Line 75 - 'AtomWindow.js' */                    wct.setAttribute("class", "atom-wizard-command-bar");
/*Line 76 - 'AtomWindow.js' */                    wdiv.appendChild(wct);
/*Line 77 - 'AtomWindow.js' */                }

/*Line 79 - 'AtomWindow.js' */                this.set_innerTemplate(tt);

/*Line 81 - 'AtomWindow.js' */                if (this._iframe) {
/*Line 82 - 'AtomWindow.js' */                    this._iframe.atomWindow = this;
/*Line 83 - 'AtomWindow.js' */                }

/*Line 85 - 'AtomWindow.js' */                if (sender) {
/*Line 86 - 'AtomWindow.js' */                    this._opener = sender;
/*Line 87 - 'AtomWindow.js' */                    AtomBinder.refreshValue(this, "opener");
/*Line 88 - 'AtomWindow.js' */                    AtomBinder.refreshValue(this, "openerData");
/*Line 89 - 'AtomWindow.js' */                }

/*Line 91 - 'AtomWindow.js' */                var _this = this;
/*Line 92 - 'AtomWindow.js' */                WebAtoms.dispatcher.callLater(function () {
/*Line 93 - 'AtomWindow.js' */                    AtomBinder.setValue(_this, "isOpen", true);
/*Line 94 - 'AtomWindow.js' */                    if (!_this._url) {
/*Line 95 - 'AtomWindow.js' */                        var children = $(_this._windowPlaceholder).find("input");
/*Line 96 - 'AtomWindow.js' */                        if (children.length > 0) {
/*Line 97 - 'AtomWindow.js' */                            var item = children.get(0);
/*Line 98 - 'AtomWindow.js' */                            try {
/*Line 99 - 'AtomWindow.js' */                                item.focus();
/*Line 100 - 'AtomWindow.js' */                            } catch (er) {
/*Line 101 - 'AtomWindow.js' */                            }
/*Line 102 - 'AtomWindow.js' */                        }
/*Line 103 - 'AtomWindow.js' */                    }
/*Line 104 - 'AtomWindow.js' */                });
/*Line 105 - 'AtomWindow.js' */            },

/*Line 107 - 'AtomWindow.js' */            init: function () {



/*Line 111 - 'AtomWindow.js' */                $(this._element).addClass("atom-window-placeholder");
/*Line 112 - 'AtomWindow.js' */                baseType.init.call(this);

/*Line 114 - 'AtomWindow.js' */                var _this = this;
/*Line 115 - 'AtomWindow.js' */                this.closeCommand = function () {
/*Line 116 - 'AtomWindow.js' */                    _this.onCloseCommand.apply(_this, arguments);
/*Line 117 - 'AtomWindow.js' */                };

/*Line 119 - 'AtomWindow.js' */                this.openCommand = function () {
/*Line 120 - 'AtomWindow.js' */                    _this.openWindow.apply(_this, arguments);
/*Line 121 - 'AtomWindow.js' */                };

/*Line 123 - 'AtomWindow.js' */                WebAtoms.dispatcher.callLater(function () {
/*Line 124 - 'AtomWindow.js' */                    _this._element._logicalParent = _this._element.parentNode;
/*Line 125 - 'AtomWindow.js' */                    $(_this._element).remove();
/*Line 126 - 'AtomWindow.js' */                    document.body.appendChild(_this._element);
/*Line 127 - 'AtomWindow.js' */                });
/*Line 128 - 'AtomWindow.js' */            }
/*Line 129 - 'AtomWindow.js' */        }
/*Line 130 - 'AtomWindow.js' */    });
/*Line 131 - 'AtomWindow.js' */})(WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomCalendar.js' */

/*Line 2 - 'AtomCalendar.js' */(function (window, baseType) {
/*Line 3 - 'AtomCalendar.js' */    return classCreatorEx({
/*Line 4 - 'AtomCalendar.js' */        name: "WebAtoms.AtomCalendar",
/*Line 5 - 'AtomCalendar.js' */        start: function () {
/*Line 6 - 'AtomCalendar.js' */        },
/*Line 7 - 'AtomCalendar.js' */        properties: {
/*Line 8 - 'AtomCalendar.js' */            currentMonth: (new Date()).getMonth()+1,
/*Line 9 - 'AtomCalendar.js' */            currentYear: (new Date()).getFullYear(),
/*Line 10 - 'AtomCalendar.js' */            startDate: null,
/*Line 11 - 'AtomCalendar.js' */            endDate: null
/*Line 12 - 'AtomCalendar.js' */        },
/*Line 13 - 'AtomCalendar.js' */        methods: {
/*Line 14 - 'AtomCalendar.js' */            set_currentMonth: function (v) {
/*Line 15 - 'AtomCalendar.js' */                this._currentMonth = v;
/*Line 16 - 'AtomCalendar.js' */                this.updateCalendar();
/*Line 17 - 'AtomCalendar.js' */            },
/*Line 18 - 'AtomCalendar.js' */            set_currentYear: function (v) {
/*Line 19 - 'AtomCalendar.js' */                this._currentYear = v;
/*Line 20 - 'AtomCalendar.js' */                this.updateCalendar();
/*Line 21 - 'AtomCalendar.js' */            },
/*Line 22 - 'AtomCalendar.js' */            onCreated: function () {
/*Line 23 - 'AtomCalendar.js' */                baseType.onCreated.call(this);
/*Line 24 - 'AtomCalendar.js' */                this.updateCalendar();
/*Line 25 - 'AtomCalendar.js' */            },

/*Line 27 - 'AtomCalendar.js' */            applyItemStyle: function (item, data, first, last) {
/*Line 28 - 'AtomCalendar.js' */                $(item).removeClass("other weekend today");
/*Line 29 - 'AtomCalendar.js' */                $(item).addClass("calendar-item");
/*Line 30 - 'AtomCalendar.js' */                if (data.IsOtherMonth) {
/*Line 31 - 'AtomCalendar.js' */                    $(item).addClass("other");
/*Line 32 - 'AtomCalendar.js' */                }
/*Line 33 - 'AtomCalendar.js' */                if (data.IsWeekEnd) {
/*Line 34 - 'AtomCalendar.js' */                    $(item).addClass("weekend");
/*Line 35 - 'AtomCalendar.js' */                }
/*Line 36 - 'AtomCalendar.js' */                if (data.IsToday) {
/*Line 37 - 'AtomCalendar.js' */                    $(item).addClass("today");
/*Line 38 - 'AtomCalendar.js' */                }
/*Line 39 - 'AtomCalendar.js' */            },

/*Line 41 - 'AtomCalendar.js' */            updateCalendar: function(){
/*Line 42 - 'AtomCalendar.js' */                if (!this._created)
/*Line 43 - 'AtomCalendar.js' */                    return;
/*Line 44 - 'AtomCalendar.js' */                var year = this._currentYear;
/*Line 45 - 'AtomCalendar.js' */                var month = this._currentMonth-1;

/*Line 47 - 'AtomCalendar.js' */                var start = new Date(year, month, 1);
/*Line 48 - 'AtomCalendar.js' */                while (start.getDay() > 0) {
/*Line 49 - 'AtomCalendar.js' */                    var nd = new Date(start.getTime());
/*Line 50 - 'AtomCalendar.js' */                    nd.setDate(start.getDate() - 1);
/*Line 51 - 'AtomCalendar.js' */                    start = nd;
/*Line 52 - 'AtomCalendar.js' */                }
/*Line 53 - 'AtomCalendar.js' */                var dates = [];
/*Line 54 - 'AtomCalendar.js' */                var end = new Date(start.getTime());
/*Line 55 - 'AtomCalendar.js' */                end.setDate(end.getDate() + 42);
/*Line 56 - 'AtomCalendar.js' */                for (var i = start; i.getTime() < end.getTime() ;) {

/*Line 58 - 'AtomCalendar.js' */                    var nd = new Date(i.getTime());
/*Line 59 - 'AtomCalendar.js' */                    nd.setDate(i.getDate() + 1);

/*Line 61 - 'AtomCalendar.js' */                    dates.push({
/*Line 62 - 'AtomCalendar.js' */                        value: i,
/*Line 63 - 'AtomCalendar.js' */                        label: i.getDate(),
/*Line 64 - 'AtomCalendar.js' */                        next: nd,
/*Line 65 - 'AtomCalendar.js' */                        IsOtherMonth: i.getMonth() != month,
/*Line 66 - 'AtomCalendar.js' */                        IsWeekEnd: i.getDay() == 0 || i.getDay() == 6,
/*Line 67 - 'AtomCalendar.js' */                        IsToday: i.getDate() == now.getDate() && i.getMonth() == now.getMonth()
/*Line 68 - 'AtomCalendar.js' */                    });
/*Line 69 - 'AtomCalendar.js' */                    i = nd;
/*Line 70 - 'AtomCalendar.js' */                }

/*Line 72 - 'AtomCalendar.js' */                AtomBinder.setValue(this, "items", dates);
/*Line 73 - 'AtomCalendar.js' */                AtomBinder.setValue(this, "startDate", start);
/*Line 74 - 'AtomCalendar.js' */                AtomBinder.setValue(this, "endDate", end);
/*Line 75 - 'AtomCalendar.js' */            },
/*Line 76 - 'AtomCalendar.js' */            changeMonth: function (n) {
/*Line 77 - 'AtomCalendar.js' */                var m = this._currentMonth;
/*Line 78 - 'AtomCalendar.js' */                m += n;
/*Line 79 - 'AtomCalendar.js' */                if (m > 12) {
/*Line 80 - 'AtomCalendar.js' */                    m = 1;
/*Line 81 - 'AtomCalendar.js' */                    this._currentYear += 1;
/*Line 82 - 'AtomCalendar.js' */                }
/*Line 83 - 'AtomCalendar.js' */                if (m == 0) {
/*Line 84 - 'AtomCalendar.js' */                    this._currentYear -= 1;
/*Line 85 - 'AtomCalendar.js' */                    m = 12;
/*Line 86 - 'AtomCalendar.js' */                }
/*Line 87 - 'AtomCalendar.js' */                AtomBinder.setValue(this, "currentMonth",m);
/*Line 88 - 'AtomCalendar.js' */            },
/*Line 89 - 'AtomCalendar.js' */            init: function () {
/*Line 90 - 'AtomCalendar.js' */                baseType.init.call(this);
/*Line 91 - 'AtomCalendar.js' */                var _this = this;
/*Line 92 - 'AtomCalendar.js' */                this.nextMonthCommand = function () {
/*Line 93 - 'AtomCalendar.js' */                    _this.changeMonth(1);
/*Line 94 - 'AtomCalendar.js' */                };
/*Line 95 - 'AtomCalendar.js' */                this.prevMonthCommand = function () {
/*Line 96 - 'AtomCalendar.js' */                    _this.changeMonth(-1);
/*Line 97 - 'AtomCalendar.js' */                }
/*Line 98 - 'AtomCalendar.js' */            }
/*Line 99 - 'AtomCalendar.js' */        }
/*Line 100 - 'AtomCalendar.js' */    });
/*Line 101 - 'AtomCalendar.js' */})(window,WebAtoms.AtomListBox.prototype);
/*Line 0 - 'AtomCheckBox.js' *////// <reference path="AtomControl.js" />

/*Line 2 - 'AtomCheckBox.js' *///WebAtoms.AtomCheckBox = function (element) {
/*Line 3 - 'AtomCheckBox.js' *///    WebAtoms.AtomCheckBox.initBase(this, [element]);
/*Line 4 - 'AtomCheckBox.js' *///    log("AtomCheckBox is depricated, use atom-checked instead on checkbox item");
/*Line 5 - 'AtomCheckBox.js' *///};

/*Line 7 - 'AtomCheckBox.js' *///WebAtoms.AtomCheckBox.prototype = {

/*Line 9 - 'AtomCheckBox.js' *///    get_value: function () {
/*Line 10 - 'AtomCheckBox.js' *///        return this.get_isChecked();
/*Line 11 - 'AtomCheckBox.js' *///    },
/*Line 12 - 'AtomCheckBox.js' *///    set_value: function (v) {
/*Line 13 - 'AtomCheckBox.js' *///        this.set_isChecked(v);
/*Line 14 - 'AtomCheckBox.js' *///    },

/*Line 16 - 'AtomCheckBox.js' *///    get_isChecked: function () {
/*Line 17 - 'AtomCheckBox.js' *///        var element = this._element;
/*Line 18 - 'AtomCheckBox.js' *///        var attr = element.checked || $(element).attr("checked");
       
/*Line 20 - 'AtomCheckBox.js' *///        if (attr)
/*Line 21 - 'AtomCheckBox.js' *///            return true;
/*Line 22 - 'AtomCheckBox.js' *///        return false;
/*Line 23 - 'AtomCheckBox.js' *///    },
/*Line 24 - 'AtomCheckBox.js' *///    set_isChecked: function (v) {
/*Line 25 - 'AtomCheckBox.js' *///        var element = this._element;
/*Line 26 - 'AtomCheckBox.js' *///        if (v && v !== "false") {
/*Line 27 - 'AtomCheckBox.js' *///            $(element).attr("checked", "checked");
/*Line 28 - 'AtomCheckBox.js' *///        } else {
/*Line 29 - 'AtomCheckBox.js' *///            $(element).removeAttr("checked");
/*Line 30 - 'AtomCheckBox.js' *///        }
/*Line 31 - 'AtomCheckBox.js' *///    },

/*Line 33 - 'AtomCheckBox.js' *///    onChange: function () {
/*Line 34 - 'AtomCheckBox.js' *///        AtomBinder.refreshValue(this, "isChecked");
/*Line 35 - 'AtomCheckBox.js' *///    },

/*Line 37 - 'AtomCheckBox.js' *///    init: function () {
/*Line 38 - 'AtomCheckBox.js' *///        var _this = this;
/*Line 39 - 'AtomCheckBox.js' *///        this.bindEvent(this._element, "change", function () {
/*Line 40 - 'AtomCheckBox.js' *///            _this.onChange.apply(_this, arguments);
/*Line 41 - 'AtomCheckBox.js' *///        });
/*Line 42 - 'AtomCheckBox.js' *///        WebAtoms.AtomCheckBox.baseType.init.apply(this, arguments);
/*Line 43 - 'AtomCheckBox.js' *///    }
/*Line 44 - 'AtomCheckBox.js' *///};

/*Line 46 - 'AtomCheckBox.js' *///WebAtoms.AtomCheckBox.registerClass("WebAtoms.AtomCheckBox", WebAtoms.AtomControl);
/*Line 0 - 'AtomDataPager.js' */

/*Line 2 - 'AtomDataPager.js' */(function (window, name, base) {

/*Line 4 - 'AtomDataPager.js' */    return classCreatorEx(
/*Line 5 - 'AtomDataPager.js' */        {
/*Line 6 - 'AtomDataPager.js' */            name: name,
/*Line 7 - 'AtomDataPager.js' */            base: base,
/*Line 8 - 'AtomDataPager.js' */            properties:{
/*Line 9 - 'AtomDataPager.js' */                itemsPath: "items",
/*Line 10 - 'AtomDataPager.js' */                totalPath: "total",
/*Line 11 - 'AtomDataPager.js' */                pageSize: 25,
/*Line 12 - 'AtomDataPager.js' */                currentPage: 0,
/*Line 13 - 'AtomDataPager.js' */                items: null,
/*Line 14 - 'AtomDataPager.js' */                total: 0,
/*Line 15 - 'AtomDataPager.js' */                pages: []
/*Line 16 - 'AtomDataPager.js' */            },

/*Line 18 - 'AtomDataPager.js' */            start: function () {
/*Line 19 - 'AtomDataPager.js' */                this._presenters = ["pageList"];

/*Line 21 - 'AtomDataPager.js' */                var caller = this;

/*Line 23 - 'AtomDataPager.js' */                var binder = AtomBinder;

/*Line 25 - 'AtomDataPager.js' */                this.goFirstCommand = function () {
/*Line 26 - 'AtomDataPager.js' */                    binder.setValue(caller, "currentPage", 0);
/*Line 27 - 'AtomDataPager.js' */                };

/*Line 29 - 'AtomDataPager.js' */                this.goLastCommand = function () {
/*Line 30 - 'AtomDataPager.js' */                    binder.setValue(caller, "currentPage", caller._pages.length - 1);
/*Line 31 - 'AtomDataPager.js' */                };

/*Line 33 - 'AtomDataPager.js' */                this.goNextCommand = function () {
/*Line 34 - 'AtomDataPager.js' */                    binder.setValue(caller, "currentPage", caller.get_currentPage() + 1);
/*Line 35 - 'AtomDataPager.js' */                };

/*Line 37 - 'AtomDataPager.js' */                this.goPrevCommand = function () {
/*Line 38 - 'AtomDataPager.js' */                    binder.setValue(caller, "currentPage", caller.get_currentPage() - 1);
/*Line 39 - 'AtomDataPager.js' */                };
/*Line 40 - 'AtomDataPager.js' */            },

/*Line 42 - 'AtomDataPager.js' */            methods:{
/*Line 43 - 'AtomDataPager.js' */                preparePages: function () {
/*Line 44 - 'AtomDataPager.js' */                    if (!this._items)
/*Line 45 - 'AtomDataPager.js' */                        return;
/*Line 46 - 'AtomDataPager.js' */                    if (!this._total)
/*Line 47 - 'AtomDataPager.js' */                        return;
/*Line 48 - 'AtomDataPager.js' */                    var l = this._items.length;
/*Line 49 - 'AtomDataPager.js' */                    var t = this._total;
/*Line 50 - 'AtomDataPager.js' */                    var count = Math.ceil(t / this._pageSize);

/*Line 52 - 'AtomDataPager.js' */                    if (count == this._pages.length)
/*Line 53 - 'AtomDataPager.js' */                        return;

/*Line 55 - 'AtomDataPager.js' */                    var ps = this._pageSize;
/*Line 56 - 'AtomDataPager.js' */                    var pages = [];
/*Line 57 - 'AtomDataPager.js' */                    var i;
/*Line 58 - 'AtomDataPager.js' */                    for (i = 0; i < count; i++) {
/*Line 59 - 'AtomDataPager.js' */                        pages.push({
/*Line 60 - 'AtomDataPager.js' */                            value: i,
/*Line 61 - 'AtomDataPager.js' */                            label: i + 1
/*Line 62 - 'AtomDataPager.js' */                        });
/*Line 63 - 'AtomDataPager.js' */                    }
/*Line 64 - 'AtomDataPager.js' */                    AtomBinder.setValue(this, "pages", pages);
/*Line 65 - 'AtomDataPager.js' */                },

/*Line 67 - 'AtomDataPager.js' */                set_items: function (v) {

/*Line 69 - 'AtomDataPager.js' */                    if (v != this._items) {
/*Line 70 - 'AtomDataPager.js' */                        if (this._items) {
/*Line 71 - 'AtomDataPager.js' */                            this.unbindEvent(this._items, "CollectionChanged", "onCollectionChangedInternal");
/*Line 72 - 'AtomDataPager.js' */                        }
/*Line 73 - 'AtomDataPager.js' */                    }

/*Line 75 - 'AtomDataPager.js' */                    if (!v)
/*Line 76 - 'AtomDataPager.js' */                        return;
/*Line 77 - 'AtomDataPager.js' */                    this._items = v;

/*Line 79 - 'AtomDataPager.js' */                    if (v != null && this._created) {
/*Line 80 - 'AtomDataPager.js' */                        this.bindEvent(this._items, "CollectionChanged", "onCollectionChangedInternal");
/*Line 81 - 'AtomDataPager.js' */                        this.onCollectionChangedInternal("refresh", -1, null);
/*Line 82 - 'AtomDataPager.js' */                    }

/*Line 84 - 'AtomDataPager.js' */                },

/*Line 86 - 'AtomDataPager.js' */                onCollectionChangedInternal: function () {
/*Line 87 - 'AtomDataPager.js' */                    var v = this._items;
/*Line 88 - 'AtomDataPager.js' */                    if (v.length === undefined) {
/*Line 89 - 'AtomDataPager.js' */                        var val = v[this._itemsPath];

/*Line 91 - 'AtomDataPager.js' */                        AtomBinder.setValue(this, "total", v[this._totalPath]);
/*Line 92 - 'AtomDataPager.js' */                        AtomBinder.setValue(this, "value", val);
/*Line 93 - 'AtomDataPager.js' */                    } else {
/*Line 94 - 'AtomDataPager.js' */                        if (v.total) {
/*Line 95 - 'AtomDataPager.js' */                            AtomBinder.setValue(this, "total", v.total);
/*Line 96 - 'AtomDataPager.js' */                        } else {
/*Line 97 - 'AtomDataPager.js' */                            AtomBinder.setValue(this, "pages", []);
/*Line 98 - 'AtomDataPager.js' */                        }
/*Line 99 - 'AtomDataPager.js' */                        AtomBinder.setValue(this, "value", v);
/*Line 100 - 'AtomDataPager.js' */                    }

/*Line 102 - 'AtomDataPager.js' */                    this.preparePages();
/*Line 103 - 'AtomDataPager.js' */                },

/*Line 105 - 'AtomDataPager.js' */                onCreated: function () {
/*Line 106 - 'AtomDataPager.js' */                    if (this._items) {
/*Line 107 - 'AtomDataPager.js' */                        this.bindEvent(this._items, "CollectionChanged", "onCollectionChangedInternal");
/*Line 108 - 'AtomDataPager.js' */                        this.onCollectionChangedInternal("refresh", -1, null);
/*Line 109 - 'AtomDataPager.js' */                    }
/*Line 110 - 'AtomDataPager.js' */                },


/*Line 113 - 'AtomDataPager.js' */                set_currentPage: function (v) {
/*Line 114 - 'AtomDataPager.js' */                    this._currentPage = v;
/*Line 115 - 'AtomDataPager.js' */                    AtomBinder.refreshValue(this, "pageStart");
/*Line 116 - 'AtomDataPager.js' */                },

/*Line 118 - 'AtomDataPager.js' */                get_pageStart: function () {
/*Line 119 - 'AtomDataPager.js' */                    return this._currentPage * this._pageSize;
/*Line 120 - 'AtomDataPager.js' */                },

/*Line 122 - 'AtomDataPager.js' */                set_pageSize: function (v) {
/*Line 123 - 'AtomDataPager.js' */                    this._pageSize = v;
/*Line 124 - 'AtomDataPager.js' */                    this.preparePages();
/*Line 125 - 'AtomDataPager.js' */                },
/*Line 126 - 'AtomDataPager.js' */                set_total: function (v) {
/*Line 127 - 'AtomDataPager.js' */                    if (this._total == v)
/*Line 128 - 'AtomDataPager.js' */                        return;
/*Line 129 - 'AtomDataPager.js' */                    this._total = v;
/*Line 130 - 'AtomDataPager.js' */                },
/*Line 131 - 'AtomDataPager.js' */                init: function () {

/*Line 133 - 'AtomDataPager.js' */                    $(this._element).addClass("atom-data-pager");

/*Line 135 - 'AtomDataPager.js' */                    base.init.apply(this, arguments);
/*Line 136 - 'AtomDataPager.js' */                }
/*Line 137 - 'AtomDataPager.js' */            }

/*Line 139 - 'AtomDataPager.js' */    }
/*Line 140 - 'AtomDataPager.js' */);

/*Line 142 - 'AtomDataPager.js' */})(window, "WebAtoms.AtomDataPager", WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomDateControl.js' */

/*Line 2 - 'AtomDateControl.js' */// Date Month Year

/*Line 4 - 'AtomDateControl.js' */(function (window, base) {
/*Line 5 - 'AtomDateControl.js' */    return classCreatorEx({
/*Line 6 - 'AtomDateControl.js' */        name: "WebAtoms.AtomDateControl",
/*Line 7 - 'AtomDateControl.js' */        base: base,
/*Line 8 - 'AtomDateControl.js' */        start: function () {
/*Line 9 - 'AtomDateControl.js' */        },
/*Line 10 - 'AtomDateControl.js' */        properties: {
/*Line 11 - 'AtomDateControl.js' */            startYear: -1,
/*Line 12 - 'AtomDateControl.js' */            endYear: +10
/*Line 13 - 'AtomDateControl.js' */        },
/*Line 14 - 'AtomDateControl.js' */        methods: {
/*Line 15 - 'AtomDateControl.js' */            resetYears: function () {
/*Line 16 - 'AtomDateControl.js' */                var years = this._year;
/*Line 17 - 'AtomDateControl.js' */                var dt = new Date();
/*Line 18 - 'AtomDateControl.js' */                var start = dt.getFullYear();
/*Line 19 - 'AtomDateControl.js' */                start += this._startYear;
/*Line 20 - 'AtomDateControl.js' */                var end = dt.getFullYear() + this._endYear;
/*Line 21 - 'AtomDateControl.js' */                var val = this._value;
/*Line 22 - 'AtomDateControl.js' */                if (!val)
/*Line 23 - 'AtomDateControl.js' */                    val = dt;
/*Line 24 - 'AtomDateControl.js' */                years.options.length = 0;
/*Line 25 - 'AtomDateControl.js' */                var j = 1;
/*Line 26 - 'AtomDateControl.js' */                years.options[0] = new Option("Select", "", false, false);
/*Line 27 - 'AtomDateControl.js' */                var dt = (this._value || new Date()).getFullYear();
/*Line 28 - 'AtomDateControl.js' */                for (var i = start; i <= end; i++) {
/*Line 29 - 'AtomDateControl.js' */                    years.options[j] = new Option(i, i, false, dt == i);
/*Line 30 - 'AtomDateControl.js' */                    j++;
/*Line 31 - 'AtomDateControl.js' */                }
/*Line 32 - 'AtomDateControl.js' */            },
/*Line 33 - 'AtomDateControl.js' */            set_value: function (v) {
/*Line 34 - 'AtomDateControl.js' */                if (v && v.constructor == String) {
/*Line 35 - 'AtomDateControl.js' */                    // date format??
/*Line 36 - 'AtomDateControl.js' */                    v = new Date(parseInt(v.substr(6)));
/*Line 37 - 'AtomDateControl.js' */                }
/*Line 38 - 'AtomDateControl.js' */                this._value = v;
/*Line 39 - 'AtomDateControl.js' */                this.setDate();
/*Line 40 - 'AtomDateControl.js' */            },
/*Line 41 - 'AtomDateControl.js' */            setDate: function () {
/*Line 42 - 'AtomDateControl.js' */                if (!this._value)
/*Line 43 - 'AtomDateControl.js' */                    return;
/*Line 44 - 'AtomDateControl.js' */                var dt = this._value;
/*Line 45 - 'AtomDateControl.js' */                var m = dt.getMonth() + 1;
/*Line 46 - 'AtomDateControl.js' */                var d = dt.getDate();
/*Line 47 - 'AtomDateControl.js' */                var y = dt.getFullYear();

/*Line 49 - 'AtomDateControl.js' */                this.setComboValue(this._month, m);
/*Line 50 - 'AtomDateControl.js' */                this.setComboValue(this._year, y);
/*Line 51 - 'AtomDateControl.js' */                this.setComboValue(this._date, d);

/*Line 53 - 'AtomDateControl.js' */            },

/*Line 55 - 'AtomDateControl.js' */            setComboValue: function (cb, v) {
/*Line 56 - 'AtomDateControl.js' */                var ae = new AtomEnumerator(cb.options);
/*Line 57 - 'AtomDateControl.js' */                while (ae.next()) {
/*Line 58 - 'AtomDateControl.js' */                    if (ae.current().value == v) {
/*Line 59 - 'AtomDateControl.js' */                        cb.selectedIndex = ae.currentIndex();
/*Line 60 - 'AtomDateControl.js' */                        break;
/*Line 61 - 'AtomDateControl.js' */                    }
/*Line 62 - 'AtomDateControl.js' */                }
/*Line 63 - 'AtomDateControl.js' */            },

/*Line 65 - 'AtomDateControl.js' */            set_startYear: function (v) {
/*Line 66 - 'AtomDateControl.js' */                this._startYear = v;
/*Line 67 - 'AtomDateControl.js' */                this.resetYears();
/*Line 68 - 'AtomDateControl.js' */            },
/*Line 69 - 'AtomDateControl.js' */            set_endYear: function (v) {
/*Line 70 - 'AtomDateControl.js' */                this._endYear = v;
/*Line 71 - 'AtomDateControl.js' */                this.resetYears();
/*Line 72 - 'AtomDateControl.js' */            },
/*Line 73 - 'AtomDateControl.js' */            onDataChange: function () {
/*Line 74 - 'AtomDateControl.js' */                var year = $(this._year).val();
/*Line 75 - 'AtomDateControl.js' */                var month = $(this._month).val();
/*Line 76 - 'AtomDateControl.js' */                var date = $(this._date).val();
/*Line 77 - 'AtomDateControl.js' */                try {
/*Line 78 - 'AtomDateControl.js' */                    if (year && month && date) {
/*Line 79 - 'AtomDateControl.js' */                        var dt = new Date(year, month - 1, date, 9, 0, 0);
/*Line 80 - 'AtomDateControl.js' */                        this._value = dt;
/*Line 81 - 'AtomDateControl.js' */                    } else {
/*Line 82 - 'AtomDateControl.js' */                        this._value = null;
/*Line 83 - 'AtomDateControl.js' */                    }
/*Line 84 - 'AtomDateControl.js' */                } catch (error) {
/*Line 85 - 'AtomDateControl.js' */                    Atom.alert(error);
/*Line 86 - 'AtomDateControl.js' */                }
/*Line 87 - 'AtomDateControl.js' */                AtomBinder.refreshValue(this, "value");
/*Line 88 - 'AtomDateControl.js' */            },

/*Line 90 - 'AtomDateControl.js' */            setMonths: function () {

/*Line 92 - 'AtomDateControl.js' */                var r = AtomDate.monthList;

/*Line 94 - 'AtomDateControl.js' */                var options = this._month.options;
/*Line 95 - 'AtomDateControl.js' */                options.length = 0;
/*Line 96 - 'AtomDateControl.js' */                var ae = new AtomEnumerator(r);
/*Line 97 - 'AtomDateControl.js' */                options[0] = new Option("Select", "", false, false);
/*Line 98 - 'AtomDateControl.js' */                while (ae.next()) {
/*Line 99 - 'AtomDateControl.js' */                    var item = ae.current();
/*Line 100 - 'AtomDateControl.js' */                    options[ae.currentIndex() + 1] = new Option(item.label, item.value, false, false);
/*Line 101 - 'AtomDateControl.js' */                }
/*Line 102 - 'AtomDateControl.js' */                this.setDate();
/*Line 103 - 'AtomDateControl.js' */                AtomBinder.refreshValue(this, "value");
/*Line 104 - 'AtomDateControl.js' */            },
/*Line 105 - 'AtomDateControl.js' */            init: function () {

/*Line 107 - 'AtomDateControl.js' */                var element = this._element;

/*Line 109 - 'AtomDateControl.js' */                this._date = document.createElement("SELECT");
/*Line 110 - 'AtomDateControl.js' */                this._month = document.createElement("SELECT");
/*Line 111 - 'AtomDateControl.js' */                this._year = document.createElement("SELECT");

/*Line 113 - 'AtomDateControl.js' */                element.style.height = "25px";

/*Line 115 - 'AtomDateControl.js' */                element.appendChild(this._date);
/*Line 116 - 'AtomDateControl.js' */                element.appendChild(this._month);
/*Line 117 - 'AtomDateControl.js' */                element.appendChild(this._year);

/*Line 119 - 'AtomDateControl.js' */                // add days...
/*Line 120 - 'AtomDateControl.js' */                var options = this._date.options;
/*Line 121 - 'AtomDateControl.js' */                var i;
/*Line 122 - 'AtomDateControl.js' */                options[0] = new Option("Select", "", false, false);
/*Line 123 - 'AtomDateControl.js' */                for (i = 1; i < 32; i++) {
/*Line 124 - 'AtomDateControl.js' */                    options[i] = new Option(i, i, false, false);
/*Line 125 - 'AtomDateControl.js' */                }



/*Line 129 - 'AtomDateControl.js' */                this.resetYears();

/*Line 131 - 'AtomDateControl.js' */                this.bindEvent(this._date, "change", "onDataChange");
/*Line 132 - 'AtomDateControl.js' */                this.bindEvent(this._month, "change", "onDataChange");
/*Line 133 - 'AtomDateControl.js' */                this.bindEvent(this._year, "change", "onDataChange");

/*Line 135 - 'AtomDateControl.js' */                this.setMonths();


/*Line 138 - 'AtomDateControl.js' */                base.init.apply(this, arguments);


/*Line 141 - 'AtomDateControl.js' */            }
/*Line 142 - 'AtomDateControl.js' */        }
/*Line 143 - 'AtomDateControl.js' */    });
/*Line 144 - 'AtomDateControl.js' */})(window, WebAtoms.AtomControl.prototype);

/*Line 0 - 'AtomDateField.js' */
/*Line 1 - 'AtomDateField.js' */

/*Line 3 - 'AtomDateField.js' */(function (window, base) {
/*Line 4 - 'AtomDateField.js' */    return classCreatorEx({
/*Line 5 - 'AtomDateField.js' */        name: "WebAtoms.AtomDateField",
/*Line 6 - 'AtomDateField.js' */        base: base,
/*Line 7 - 'AtomDateField.js' */        start: function (e) {
/*Line 8 - 'AtomDateField.js' */            this._presenters = ["calendarPresenter", "itemsPresenter"];
/*Line 9 - 'AtomDateField.js' */            $(e).addClass("atom-date-field");
/*Line 10 - 'AtomDateField.js' */        },
/*Line 11 - 'AtomDateField.js' */        properties: {
/*Line 12 - 'AtomDateField.js' */            isOpen: false
/*Line 13 - 'AtomDateField.js' */        },
/*Line 14 - 'AtomDateField.js' */        methods: {
/*Line 15 - 'AtomDateField.js' */            get_offsetLeft: function () {
/*Line 16 - 'AtomDateField.js' */                //return $(this._element).offset().left - parseInt( $(atomApplication._element).css("left") , 10);
/*Line 17 - 'AtomDateField.js' */                return $(this._element).offset().left;
/*Line 18 - 'AtomDateField.js' */            },
/*Line 19 - 'AtomDateField.js' */            get_offsetTop: function () {
/*Line 20 - 'AtomDateField.js' */                return $(this._element).offset().top;
/*Line 21 - 'AtomDateField.js' */            },

/*Line 23 - 'AtomDateField.js' */            onPopupRemoved: function (e) {
/*Line 24 - 'AtomDateField.js' */                AtomBinder.setValue(this, "isOpen", false);
/*Line 25 - 'AtomDateField.js' */            },

/*Line 27 - 'AtomDateField.js' */            set_isOpen: function (v) {
/*Line 28 - 'AtomDateField.js' */                this._isOpen = v;
/*Line 29 - 'AtomDateField.js' */                if (v) {
/*Line 30 - 'AtomDateField.js' */                    this.getTemplate("popupTemplate");

/*Line 32 - 'AtomDateField.js' */                    this.popup = AtomUI.cloneNode(this._popupTemplate);
/*Line 33 - 'AtomDateField.js' */                    this.popup._logicalParent = this._element;
/*Line 34 - 'AtomDateField.js' */                    this.popup._templateParent = this;
/*Line 35 - 'AtomDateField.js' */                    //this.popup.style.visibility = "hidden";
/*Line 36 - 'AtomDateField.js' */                    document.body.appendChild(this.popup);
/*Line 37 - 'AtomDateField.js' */                    this.onCreateChildren(this.popup);
/*Line 38 - 'AtomDateField.js' */                    this.setProperties(this.popup);
/*Line 39 - 'AtomDateField.js' */                    this.initChildren(this.popup);

/*Line 41 - 'AtomDateField.js' */                    var _this = this;
/*Line 42 - 'AtomDateField.js' */                    this._refreshInterval = setInterval(function () {
/*Line 43 - 'AtomDateField.js' */                        AtomBinder.refreshValue(_this, "offsetLeft");
/*Line 44 - 'AtomDateField.js' */                        AtomBinder.refreshValue(_this, "offsetTop");
/*Line 45 - 'AtomDateField.js' */                    });

/*Line 47 - 'AtomDateField.js' */                    //var _this = this;
/*Line 48 - 'AtomDateField.js' */                    //WebAtoms.dispatcher.callLater(function () {
/*Line 49 - 'AtomDateField.js' */                    //    AtomPopup.show(_this._element, _this.popup, 0, function () {
/*Line 50 - 'AtomDateField.js' */                    //        _this.onPopupRemoved(_this.popup);
/*Line 51 - 'AtomDateField.js' */                    //    });
/*Line 52 - 'AtomDateField.js' */                    //});
/*Line 53 - 'AtomDateField.js' */                } else {
/*Line 54 - 'AtomDateField.js' */                    //AtomPopup.hide(this.popup);
/*Line 55 - 'AtomDateField.js' */                    if (this._refreshInterval) {
/*Line 56 - 'AtomDateField.js' */                        clearInterval(this._refreshInterval);
/*Line 57 - 'AtomDateField.js' */                    }
/*Line 58 - 'AtomDateField.js' */                    this.disposeChildren(this.popup);
/*Line 59 - 'AtomDateField.js' */                    $(this.popup).remove();
/*Line 60 - 'AtomDateField.js' */                }
/*Line 61 - 'AtomDateField.js' */            },

/*Line 63 - 'AtomDateField.js' */            dispose: function () {
/*Line 64 - 'AtomDateField.js' */                this.set_isOpen(false);
/*Line 65 - 'AtomDateField.js' */                base.dispose.call(this);
/*Line 66 - 'AtomDateField.js' */            },
/*Line 67 - 'AtomDateField.js' */            get_isOpen: function () {
/*Line 68 - 'AtomDateField.js' */                return this._isOpen;
/*Line 69 - 'AtomDateField.js' */            },

/*Line 71 - 'AtomDateField.js' */            get_selectedItem: function () {
/*Line 72 - 'AtomDateField.js' */                if (this._selectedItems.length)
/*Line 73 - 'AtomDateField.js' */                    return this._selectedItems[0];
/*Line 74 - 'AtomDateField.js' */                return null;
/*Line 75 - 'AtomDateField.js' */            },

/*Line 77 - 'AtomDateField.js' */            set_value: function (v) {
/*Line 78 - 'AtomDateField.js' */                v = AtomDate.parse(v);
/*Line 79 - 'AtomDateField.js' */                this._value = v;
/*Line 80 - 'AtomDateField.js' */                this._selectedItems.length = 0;
/*Line 81 - 'AtomDateField.js' */                if (v) {

/*Line 83 - 'AtomDateField.js' */                    this._selectedItems.push({ date: v, dateLabel: AtomDate.toShortDateString(v), value: AtomDate.toMMDDYY(v), label: v.getDate() });
/*Line 84 - 'AtomDateField.js' */                    this.set_visibleDate(v);
/*Line 85 - 'AtomDateField.js' */                }
/*Line 86 - 'AtomDateField.js' */                if (this._created) {
/*Line 87 - 'AtomDateField.js' */                    AtomBinder.refreshItems(this._selectedItems);
/*Line 88 - 'AtomDateField.js' */                    AtomBinder.refreshValue(this, "value");
/*Line 89 - 'AtomDateField.js' */                    AtomBinder.refreshValue(this, "selectedItem");
/*Line 90 - 'AtomDateField.js' */                    AtomBinder.refreshValue(this, "selectedItems");
/*Line 91 - 'AtomDateField.js' */                }
/*Line 92 - 'AtomDateField.js' */            },
/*Line 93 - 'AtomDateField.js' */            get_value: function (v) {
/*Line 94 - 'AtomDateField.js' */                if (this._selectedItems.length)
/*Line 95 - 'AtomDateField.js' */                    return this._selectedItems[0].date;
/*Line 96 - 'AtomDateField.js' */                return this._value;
/*Line 97 - 'AtomDateField.js' */            },

/*Line 99 - 'AtomDateField.js' */            toggleDate: function (scope, sender) {
/*Line 100 - 'AtomDateField.js' */                var item = sender.get_data();
/*Line 101 - 'AtomDateField.js' */                this._selectedItems.length = 0;
/*Line 102 - 'AtomDateField.js' */                AtomBinder.addItem(this._selectedItems, item);
/*Line 103 - 'AtomDateField.js' */                AtomBinder.refreshValue(this, "value");
/*Line 104 - 'AtomDateField.js' */                AtomBinder.refreshValue(this, "selectedItem");
/*Line 105 - 'AtomDateField.js' */                AtomBinder.refreshValue(this, "selectedItems");
/*Line 106 - 'AtomDateField.js' */                AtomBinder.setValue(this, "isOpen", false);
/*Line 107 - 'AtomDateField.js' */            }


/*Line 110 - 'AtomDateField.js' */        }
/*Line 111 - 'AtomDateField.js' */    });
/*Line 112 - 'AtomDateField.js' */})(window, WebAtoms.AtomDateListBox.prototype);
/*Line 0 - 'AtomDeleteButton.js' */

/*Line 2 - 'AtomDeleteButton.js' */(function (window, base) {
/*Line 3 - 'AtomDeleteButton.js' */    return classCreatorEx({
/*Line 4 - 'AtomDeleteButton.js' */        name: "WebAtoms.AtomDeleteButton",
/*Line 5 - 'AtomDeleteButton.js' */        base: base,
/*Line 6 - 'AtomDeleteButton.js' */        start: function () {
/*Line 7 - 'AtomDeleteButton.js' */            this._confirm = true;
/*Line 8 - 'AtomDeleteButton.js' */            this._confirmMessage = "Are you sure you want to delete this item?";
/*Line 9 - 'AtomDeleteButton.js' */        },
/*Line 10 - 'AtomDeleteButton.js' */        methods: {

/*Line 12 - 'AtomDeleteButton.js' */        },
/*Line 13 - 'AtomDeleteButton.js' */        properties: {

/*Line 15 - 'AtomDeleteButton.js' */        }
/*Line 16 - 'AtomDeleteButton.js' */    });
/*Line 17 - 'AtomDeleteButton.js' */})(window, WebAtoms.AtomPostButton.prototype);

/*Line 0 - 'AtomLinkBar.js' */

/*Line 2 - 'AtomLinkBar.js' */(function (window, base) {
/*Line 3 - 'AtomLinkBar.js' */    return classCreatorEx({
/*Line 4 - 'AtomLinkBar.js' */        name: "WebAtoms.AtomLinkBar",
/*Line 5 - 'AtomLinkBar.js' */        base: base,
/*Line 6 - 'AtomLinkBar.js' */        start: function () {
/*Line 7 - 'AtomLinkBar.js' */            this._allowSelectFirst = false;

/*Line 9 - 'AtomLinkBar.js' */            var _this = this;
/*Line 10 - 'AtomLinkBar.js' */            this.openMenuCommand = function () {
/*Line 11 - 'AtomLinkBar.js' */                _this.openMenu.apply(_this, arguments);
/*Line 12 - 'AtomLinkBar.js' */            };

/*Line 14 - 'AtomLinkBar.js' */        },
/*Line 15 - 'AtomLinkBar.js' */        properties: {
/*Line 16 - 'AtomLinkBar.js' */            itemsPath: "items",
/*Line 17 - 'AtomLinkBar.js' */            selectCurrent: true,
/*Line 18 - 'AtomLinkBar.js' */            targetPath: "",
/*Line 19 - 'AtomLinkBar.js' */            menuTemplate: null,
/*Line 20 - 'AtomLinkBar.js' */            menuDirection: "horizontal"
/*Line 21 - 'AtomLinkBar.js' */        },
/*Line 22 - 'AtomLinkBar.js' */        methods: {

/*Line 24 - 'AtomLinkBar.js' */            onClick: function () {
/*Line 25 - 'AtomLinkBar.js' */            },



/*Line 29 - 'AtomLinkBar.js' */            openMenu: function (e) {

/*Line 31 - 'AtomLinkBar.js' */                var target = e.target;

/*Line 33 - 'AtomLinkBar.js' */                var ap = this.get_atomParent(target);

/*Line 35 - 'AtomLinkBar.js' */                if (ap == null)
/*Line 36 - 'AtomLinkBar.js' */                    return;

/*Line 38 - 'AtomLinkBar.js' */                var data = ap.get_data();

/*Line 40 - 'AtomLinkBar.js' */                if (!data[this._itemsPath])
/*Line 41 - 'AtomLinkBar.js' */                    return;

/*Line 43 - 'AtomLinkBar.js' */                var menu = this._subMenu;

/*Line 45 - 'AtomLinkBar.js' */                if (menu) {
/*Line 46 - 'AtomLinkBar.js' */                    AtomPopup.hide(menu._element);
/*Line 47 - 'AtomLinkBar.js' */                }
/*Line 48 - 'AtomLinkBar.js' */                else {

/*Line 50 - 'AtomLinkBar.js' */                    var mt = this.getTemplate("menuTemplate");

/*Line 52 - 'AtomLinkBar.js' */                    menu = AtomUI.cloneNode(mt);
/*Line 53 - 'AtomLinkBar.js' */                    menu._templateParent = this;
/*Line 54 - 'AtomLinkBar.js' */                    menu.style.position = "absolute";
/*Line 55 - 'AtomLinkBar.js' */                    //menu.style.zOrder = 
/*Line 56 - 'AtomLinkBar.js' */                    document.body.appendChild(menu);

/*Line 58 - 'AtomLinkBar.js' */                    var mt = $(menu).attr("atom-type") || WebAtoms.AtomControl;

/*Line 60 - 'AtomLinkBar.js' */                    menu = AtomUI.createControl(menu, mt, data);

/*Line 62 - 'AtomLinkBar.js' */                    this._subMenu = menu;
/*Line 63 - 'AtomLinkBar.js' */                }

/*Line 65 - 'AtomLinkBar.js' */                AtomBinder.setValue(menu, "data", data);

/*Line 67 - 'AtomLinkBar.js' */                AtomPopup.show(ap._element, menu._element, 0);

/*Line 69 - 'AtomLinkBar.js' */                AtomUI.cancelEvent(e);
/*Line 70 - 'AtomLinkBar.js' */            },


/*Line 73 - 'AtomLinkBar.js' */            selectDefault: function () {
/*Line 74 - 'AtomLinkBar.js' */                if (!this._items)
/*Line 75 - 'AtomLinkBar.js' */                    return;

/*Line 77 - 'AtomLinkBar.js' */                if (!this._selectCurrent)
/*Line 78 - 'AtomLinkBar.js' */                    return;

/*Line 80 - 'AtomLinkBar.js' */                if (this._value) {
/*Line 81 - 'AtomLinkBar.js' */                    return;
/*Line 82 - 'AtomLinkBar.js' */                }
/*Line 83 - 'AtomLinkBar.js' */                AtomBinder.setValue(this, "value", location.pathname);

/*Line 85 - 'AtomLinkBar.js' */                if (this.get_selectedIndex() == -1) {
/*Line 86 - 'AtomLinkBar.js' */                    this.selectItem(this._items);
/*Line 87 - 'AtomLinkBar.js' */                }

/*Line 89 - 'AtomLinkBar.js' */                this.updateSelectionBindings();
/*Line 90 - 'AtomLinkBar.js' */            },

/*Line 92 - 'AtomLinkBar.js' */            selectItem: function (a, t) {
/*Line 93 - 'AtomLinkBar.js' */                var ae = new AtomEnumerator(a);
/*Line 94 - 'AtomLinkBar.js' */                var vp = this._valuePath;
/*Line 95 - 'AtomLinkBar.js' */                var lp = location.pathname.toLowerCase();
/*Line 96 - 'AtomLinkBar.js' */                while (ae.next()) {
/*Line 97 - 'AtomLinkBar.js' */                    var item = ae.current();
/*Line 98 - 'AtomLinkBar.js' */                    var l = item;
/*Line 99 - 'AtomLinkBar.js' */                    if (vp)
/*Line 100 - 'AtomLinkBar.js' */                        l = l[vp];
/*Line 101 - 'AtomLinkBar.js' */                    if (!l)
/*Line 102 - 'AtomLinkBar.js' */                        continue;
/*Line 103 - 'AtomLinkBar.js' */                    if (lp == l.toLowerCase()) {
/*Line 104 - 'AtomLinkBar.js' */                        if (!t) {
/*Line 105 - 'AtomLinkBar.js' */                            AtomBinder.setValue(this, "selectedItem", item);
/*Line 106 - 'AtomLinkBar.js' */                        }
/*Line 107 - 'AtomLinkBar.js' */                        return true;
/*Line 108 - 'AtomLinkBar.js' */                    }

/*Line 110 - 'AtomLinkBar.js' */                    if (item.links) {
/*Line 111 - 'AtomLinkBar.js' */                        if (this.selectItem(item.links, true)) {
/*Line 112 - 'AtomLinkBar.js' */                            AtomBinder.setValue(this, "selectedItem", item);
/*Line 113 - 'AtomLinkBar.js' */                            return true;
/*Line 114 - 'AtomLinkBar.js' */                        }
/*Line 115 - 'AtomLinkBar.js' */                    }
/*Line 116 - 'AtomLinkBar.js' */                }
/*Line 117 - 'AtomLinkBar.js' */                return false;
/*Line 118 - 'AtomLinkBar.js' */            },

/*Line 120 - 'AtomLinkBar.js' */            dispose: function () {

/*Line 122 - 'AtomLinkBar.js' */                if (this._subMenu) {
/*Line 123 - 'AtomLinkBar.js' */                    this._subMenu.dispose();
/*Line 124 - 'AtomLinkBar.js' */                    this._subMenu = null;
/*Line 125 - 'AtomLinkBar.js' */                }
/*Line 126 - 'AtomLinkBar.js' */                base.dispose.apply(this, arguments);
/*Line 127 - 'AtomLinkBar.js' */            },

/*Line 129 - 'AtomLinkBar.js' */            init: function () {
/*Line 130 - 'AtomLinkBar.js' */                base.init.apply(this, arguments);

/*Line 132 - 'AtomLinkBar.js' */                //this.bindEvent(this._element, "mouseover", "openMenuCommand");
/*Line 133 - 'AtomLinkBar.js' */                this.bindEvent(this._element, "click", "openMenuCommand");
/*Line 134 - 'AtomLinkBar.js' */                this.setValue("class", "[$owner.showTabs ? 'atom-tab-button-bar' : 'atom-link-bar']", true, this._element);
/*Line 135 - 'AtomLinkBar.js' */            }

/*Line 137 - 'AtomLinkBar.js' */        }
/*Line 138 - 'AtomLinkBar.js' */    });
/*Line 139 - 'AtomLinkBar.js' */})(window, WebAtoms.AtomToggleButtonBar.prototype);

/*Line 0 - 'AtomMultiButtonList.js' */

/*Line 2 - 'AtomMultiButtonList.js' */(function (window, base) {
/*Line 3 - 'AtomMultiButtonList.js' */    return classCreatorEx({
/*Line 4 - 'AtomMultiButtonList.js' */        name: "WebAtoms.AtomMultiButtonList",
/*Line 5 - 'AtomMultiButtonList.js' */        base: base,
/*Line 6 - 'AtomMultiButtonList.js' */        start: function () {
/*Line 7 - 'AtomMultiButtonList.js' */            this._dataElements = [];
/*Line 8 - 'AtomMultiButtonList.js' */        },
/*Line 9 - 'AtomMultiButtonList.js' */        properties: {
/*Line 10 - 'AtomMultiButtonList.js' */            labelPath: "label",
/*Line 11 - 'AtomMultiButtonList.js' */            valuePath: "value",
/*Line 12 - 'AtomMultiButtonList.js' */            options: null,
/*Line 13 - 'AtomMultiButtonList.js' */            isRadio: false,
/*Line 14 - 'AtomMultiButtonList.js' */            items:null
/*Line 15 - 'AtomMultiButtonList.js' */        },
/*Line 16 - 'AtomMultiButtonList.js' */        methods: {
/*Line 17 - 'AtomMultiButtonList.js' */            set_options: function (v) {
/*Line 18 - 'AtomMultiButtonList.js' */                this._options = v;
/*Line 19 - 'AtomMultiButtonList.js' */                if (v) {
/*Line 20 - 'AtomMultiButtonList.js' */                    this.onCollectionChangedInternal("refresh", -1, null);
/*Line 21 - 'AtomMultiButtonList.js' */                }
/*Line 22 - 'AtomMultiButtonList.js' */            },
/*Line 23 - 'AtomMultiButtonList.js' */            set_value: function (v) {
/*Line 24 - 'AtomMultiButtonList.js' */                this._value = v;
/*Line 25 - 'AtomMultiButtonList.js' */                this.updateSelections();
/*Line 26 - 'AtomMultiButtonList.js' */            },
/*Line 27 - 'AtomMultiButtonList.js' */            set_items: function (v) {
/*Line 28 - 'AtomMultiButtonList.js' */                if (this._items) {
/*Line 29 - 'AtomMultiButtonList.js' */                    this.unbindEvent(this._items, "CollectionChanged", "onCollectionChangedInternal");
/*Line 30 - 'AtomMultiButtonList.js' */                }
/*Line 31 - 'AtomMultiButtonList.js' */                this._items = v;

/*Line 33 - 'AtomMultiButtonList.js' */                // try starting observing....
/*Line 34 - 'AtomMultiButtonList.js' */                if (v != null) {
/*Line 35 - 'AtomMultiButtonList.js' */                    this.bindEvent(this._items, "CollectionChanged", "onCollectionChangedInternal");
/*Line 36 - 'AtomMultiButtonList.js' */                    this.onCollectionChangedInternal("refresh", -1, null);
/*Line 37 - 'AtomMultiButtonList.js' */                }
/*Line 38 - 'AtomMultiButtonList.js' */            },

/*Line 40 - 'AtomMultiButtonList.js' */            onCollectionChangedInternal: function (mode, index, item) {
/*Line 41 - 'AtomMultiButtonList.js' */                var value = this.get_value();

/*Line 43 - 'AtomMultiButtonList.js' */                this.onCollectionChanged(mode, index, item);

/*Line 45 - 'AtomMultiButtonList.js' */                // update selections !!!
/*Line 46 - 'AtomMultiButtonList.js' */                this.set_value(value);
/*Line 47 - 'AtomMultiButtonList.js' */            },
/*Line 48 - 'AtomMultiButtonList.js' */            onCollectionChanged: function (mode, index, item) {
/*Line 49 - 'AtomMultiButtonList.js' */                if (!this._items || !this._options)
/*Line 50 - 'AtomMultiButtonList.js' */                    return;
/*Line 51 - 'AtomMultiButtonList.js' */                this._dataElements = [];
/*Line 52 - 'AtomMultiButtonList.js' */                this.unbindEvent(null, "change", "onDataChange");
/*Line 53 - 'AtomMultiButtonList.js' */                var ae = new AtomEnumerator(this._items);
/*Line 54 - 'AtomMultiButtonList.js' */                var parentScope = this.get_scope();
/*Line 55 - 'AtomMultiButtonList.js' */                while (ae.next()) {
/*Line 56 - 'AtomMultiButtonList.js' */                    var data = ae.current();
/*Line 57 - 'AtomMultiButtonList.js' */                    this.createChildElement(parentScope, this._element, data);
/*Line 58 - 'AtomMultiButtonList.js' */                }

/*Line 60 - 'AtomMultiButtonList.js' */                this.updateUI();
/*Line 61 - 'AtomMultiButtonList.js' */            },

/*Line 63 - 'AtomMultiButtonList.js' */            updateSelections: function () {

/*Line 65 - 'AtomMultiButtonList.js' */                if (!this._dataElements || this._dataElements.length == 0)
/*Line 66 - 'AtomMultiButtonList.js' */                    return;

/*Line 68 - 'AtomMultiButtonList.js' */                ace = new AtomEnumerator(this._dataElements);
/*Line 69 - 'AtomMultiButtonList.js' */                while (ace.next()) {
/*Line 70 - 'AtomMultiButtonList.js' */                    $(ace.current()).attr("checked", false);
/*Line 71 - 'AtomMultiButtonList.js' */                }

/*Line 73 - 'AtomMultiButtonList.js' */                if (!this._value)
/*Line 74 - 'AtomMultiButtonList.js' */                    return;

/*Line 76 - 'AtomMultiButtonList.js' */                var ae;
/*Line 77 - 'AtomMultiButtonList.js' */                var ace;
/*Line 78 - 'AtomMultiButtonList.js' */                var item;
/*Line 79 - 'AtomMultiButtonList.js' */                var selections = this._value.split(",");

/*Line 81 - 'AtomMultiButtonList.js' */                ace.reset();

/*Line 83 - 'AtomMultiButtonList.js' */                var cb;
/*Line 84 - 'AtomMultiButtonList.js' */                while (ace.next()) {
/*Line 85 - 'AtomMultiButtonList.js' */                    cb = ace.current();
/*Line 86 - 'AtomMultiButtonList.js' */                    ae = new AtomEnumerator(selections);
/*Line 87 - 'AtomMultiButtonList.js' */                    while (ae.next()) {
/*Line 88 - 'AtomMultiButtonList.js' */                        item = ae.current();
/*Line 89 - 'AtomMultiButtonList.js' */                        item = $.trim(item);
/*Line 90 - 'AtomMultiButtonList.js' */                        if ($(cb).val() == item) {
/*Line 91 - 'AtomMultiButtonList.js' */                            $(cb).attr("checked", "true");
/*Line 92 - 'AtomMultiButtonList.js' */                        }
/*Line 93 - 'AtomMultiButtonList.js' */                    }
/*Line 94 - 'AtomMultiButtonList.js' */                }
/*Line 95 - 'AtomMultiButtonList.js' */            },

/*Line 97 - 'AtomMultiButtonList.js' */            onDataChange: function () {
/*Line 98 - 'AtomMultiButtonList.js' */                var ae = new AtomEnumerator(this._dataElements);
/*Line 99 - 'AtomMultiButtonList.js' */                var add = [];
/*Line 100 - 'AtomMultiButtonList.js' */                while (ae.next()) {
/*Line 101 - 'AtomMultiButtonList.js' */                    var item = ae.current();
/*Line 102 - 'AtomMultiButtonList.js' */                    var dataItem = $(item).val();
/*Line 103 - 'AtomMultiButtonList.js' */                    var checked = $(item).attr("checked");
/*Line 104 - 'AtomMultiButtonList.js' */                    if (checked) {
/*Line 105 - 'AtomMultiButtonList.js' */                        add.push(dataItem);
/*Line 106 - 'AtomMultiButtonList.js' */                    }
/*Line 107 - 'AtomMultiButtonList.js' */                }
/*Line 108 - 'AtomMultiButtonList.js' */                this._value = add.join(", ");
/*Line 109 - 'AtomMultiButtonList.js' */                AtomBinder.refreshValue(this, "value");
/*Line 110 - 'AtomMultiButtonList.js' */            },

/*Line 112 - 'AtomMultiButtonList.js' */            createChildElement: function (parentScope, parentElement, data) {
/*Line 113 - 'AtomMultiButtonList.js' */                var span = document.createElement("SPAN");
/*Line 114 - 'AtomMultiButtonList.js' */                parentElement.appendChild(span);

/*Line 116 - 'AtomMultiButtonList.js' */                parentElement = span;
/*Line 117 - 'AtomMultiButtonList.js' */                span = document.createElement("SPAN");
/*Line 118 - 'AtomMultiButtonList.js' */                var lp = this.get_labelPath();
/*Line 119 - 'AtomMultiButtonList.js' */                var vp = this.get_valuePath();
/*Line 120 - 'AtomMultiButtonList.js' */                l = data;
/*Line 121 - 'AtomMultiButtonList.js' */                v = data;
/*Line 122 - 'AtomMultiButtonList.js' */                if (lp)
/*Line 123 - 'AtomMultiButtonList.js' */                    l = data[lp];
/*Line 124 - 'AtomMultiButtonList.js' */                if (vp)
/*Line 125 - 'AtomMultiButtonList.js' */                    v = data[vp];


/*Line 128 - 'AtomMultiButtonList.js' */                var gpName = null;
/*Line 129 - 'AtomMultiButtonList.js' */                if (this._isRadio) {
/*Line 130 - 'AtomMultiButtonList.js' */                    gpName = "_g" + AtomUI.getNewIndex();
/*Line 131 - 'AtomMultiButtonList.js' */                }

/*Line 133 - 'AtomMultiButtonList.js' */                parentElement.appendChild(span);

/*Line 135 - 'AtomMultiButtonList.js' */                var options = new AtomEnumerator(this._options);
/*Line 136 - 'AtomMultiButtonList.js' */                while (options.next()) {
/*Line 137 - 'AtomMultiButtonList.js' */                    var op = options.current();
/*Line 138 - 'AtomMultiButtonList.js' */                    if (vp) {
/*Line 139 - 'AtomMultiButtonList.js' */                        op = op[vp];
/*Line 140 - 'AtomMultiButtonList.js' */                    }

/*Line 142 - 'AtomMultiButtonList.js' */                    var val = v + "." + op;

/*Line 144 - 'AtomMultiButtonList.js' */                    var cb = document.createElement("INPUT");
/*Line 145 - 'AtomMultiButtonList.js' */                    if (this._isRadio) {
/*Line 146 - 'AtomMultiButtonList.js' */                        $(cb).attr("type", "radio");
/*Line 147 - 'AtomMultiButtonList.js' */                        $(cb).attr("name", gpName);
/*Line 148 - 'AtomMultiButtonList.js' */                    } else {
/*Line 149 - 'AtomMultiButtonList.js' */                        $(cb).attr("type", "checkbox");
/*Line 150 - 'AtomMultiButtonList.js' */                    }
/*Line 151 - 'AtomMultiButtonList.js' */                    $(cb).val(val);
/*Line 152 - 'AtomMultiButtonList.js' */                    span.appendChild(cb);
/*Line 153 - 'AtomMultiButtonList.js' */                    this.bindEvent(cb, "change", "onDataChange");
/*Line 154 - 'AtomMultiButtonList.js' */                    this._dataElements.push(cb);
/*Line 155 - 'AtomMultiButtonList.js' */                }

/*Line 157 - 'AtomMultiButtonList.js' */                span = document.createElement("SPAN");
/*Line 158 - 'AtomMultiButtonList.js' */                parentElement.appendChild(span);
/*Line 159 - 'AtomMultiButtonList.js' */                // Create Label First..
/*Line 160 - 'AtomMultiButtonList.js' */                var txt = document.createTextNode(l);
/*Line 161 - 'AtomMultiButtonList.js' */                span.appendChild(txt);
/*Line 162 - 'AtomMultiButtonList.js' */                //span.style.float = "left";

/*Line 164 - 'AtomMultiButtonList.js' */            }
/*Line 165 - 'AtomMultiButtonList.js' */        }
/*Line 166 - 'AtomMultiButtonList.js' */    });
/*Line 167 - 'AtomMultiButtonList.js' */})(window, WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomNavigatorList.js' */

/*Line 2 - 'AtomNavigatorList.js' */(function (window, base) {
/*Line 3 - 'AtomNavigatorList.js' */    return classCreatorEx({
/*Line 4 - 'AtomNavigatorList.js' */        name: "WebAtoms.AtomNavigatorList",
/*Line 5 - 'AtomNavigatorList.js' */        base: base,
/*Line 6 - 'AtomNavigatorList.js' */        start: function () {
/*Line 7 - 'AtomNavigatorList.js' */            // 0 = items, 1 = selection, 2 = new item..
/*Line 8 - 'AtomNavigatorList.js' */            this._displayMode = 0;

/*Line 10 - 'AtomNavigatorList.js' */            this._presenters =
/*Line 11 - 'AtomNavigatorList.js' */                [
/*Line 12 - 'AtomNavigatorList.js' */                    "gridPanel",
/*Line 13 - 'AtomNavigatorList.js' */                    "gridPresenter",
/*Line 14 - 'AtomNavigatorList.js' */                    "itemsPresenter",
/*Line 15 - 'AtomNavigatorList.js' */                    "detailHeaderPresenter",
/*Line 16 - 'AtomNavigatorList.js' */                    "newHeaderPresenter",
/*Line 17 - 'AtomNavigatorList.js' */                    "detailPresenter",
/*Line 18 - 'AtomNavigatorList.js' */                    "newPresenter",
/*Line 19 - 'AtomNavigatorList.js' */                    "newView",
/*Line 20 - 'AtomNavigatorList.js' */                    "detailView",
/*Line 21 - 'AtomNavigatorList.js' */                    "newHeaderToolbar",
/*Line 22 - 'AtomNavigatorList.js' */                    "detailHeaderToolbar"];

/*Line 24 - 'AtomNavigatorList.js' */            this._layout = new WebAtoms.AtomViewBoxLayout();

/*Line 26 - 'AtomNavigatorList.js' */            this._newItem = {};

/*Line 28 - 'AtomNavigatorList.js' */        },
/*Line 29 - 'AtomNavigatorList.js' */        properties: {
/*Line 30 - 'AtomNavigatorList.js' */            autoShowDetail: true,
/*Line 31 - 'AtomNavigatorList.js' */            currentPage: null,
/*Line 32 - 'AtomNavigatorList.js' */            pageSize: undefined,
/*Line 33 - 'AtomNavigatorList.js' */            newItem: null,
/*Line 34 - 'AtomNavigatorList.js' */            newUrl: null,
/*Line 35 - 'AtomNavigatorList.js' */            detailUrl: null,
/*Line 36 - 'AtomNavigatorList.js' */            displayMode: null
/*Line 37 - 'AtomNavigatorList.js' */        },
/*Line 38 - 'AtomNavigatorList.js' */        methods: {
/*Line 39 - 'AtomNavigatorList.js' */            get_newItemCopy: function () {
/*Line 40 - 'AtomNavigatorList.js' */                return this._newItemCopy;
/*Line 41 - 'AtomNavigatorList.js' */            },


/*Line 44 - 'AtomNavigatorList.js' */            onBackCommand: function () {
/*Line 45 - 'AtomNavigatorList.js' */                AtomBinder.setValue(this, "displayMode", 0);
/*Line 46 - 'AtomNavigatorList.js' */                this.updateDisplayMode();
/*Line 47 - 'AtomNavigatorList.js' */                AtomBinder.setValue(this, "selectedIndex", -1);
/*Line 48 - 'AtomNavigatorList.js' */            },

/*Line 50 - 'AtomNavigatorList.js' */            onCancelAddNewCommand: function () {
/*Line 51 - 'AtomNavigatorList.js' */                this.onBackCommand();
/*Line 52 - 'AtomNavigatorList.js' */                AtomBinder.refreshValue(this, "newItemCopy");
/*Line 53 - 'AtomNavigatorList.js' */                this.refresh();
/*Line 54 - 'AtomNavigatorList.js' */            },

/*Line 56 - 'AtomNavigatorList.js' */            onAddCommand: function () {
/*Line 57 - 'AtomNavigatorList.js' */                AtomBinder.setValue(this, "selectedIndex", -1);
/*Line 58 - 'AtomNavigatorList.js' */                AtomBinder.setValue(this, "displayMode", 2);
/*Line 59 - 'AtomNavigatorList.js' */                var item = this._newItem || {};
/*Line 60 - 'AtomNavigatorList.js' */                this._newItemCopy = AtomBinder.getClone(item);
/*Line 61 - 'AtomNavigatorList.js' */                AtomBinder.refreshValue(this, "newItemCopy");
/*Line 62 - 'AtomNavigatorList.js' */                this.updateDisplayMode();
/*Line 63 - 'AtomNavigatorList.js' */            },

/*Line 65 - 'AtomNavigatorList.js' */            onSelectedItemsChanged: function () {
/*Line 66 - 'AtomNavigatorList.js' */                base.onSelectedItemsChanged.apply(this, arguments);

/*Line 68 - 'AtomNavigatorList.js' */                if (this._autoShowDetail) {
/*Line 69 - 'AtomNavigatorList.js' */                    this.showDetailCommand();
/*Line 70 - 'AtomNavigatorList.js' */                }
/*Line 71 - 'AtomNavigatorList.js' */            },

/*Line 73 - 'AtomNavigatorList.js' */            addTemplate: function (p, e, inite) {
/*Line 74 - 'AtomNavigatorList.js' */                if (inite) {
/*Line 75 - 'AtomNavigatorList.js' */                    p.appendChild(e);
/*Line 76 - 'AtomNavigatorList.js' */                    e._templateParent = this;
/*Line 77 - 'AtomNavigatorList.js' */                    this.onCreateChildren(p);
/*Line 78 - 'AtomNavigatorList.js' */                    //this.setProperties(e);
/*Line 79 - 'AtomNavigatorList.js' */                    this.initChildren(p);
/*Line 80 - 'AtomNavigatorList.js' */                } else {
/*Line 81 - 'AtomNavigatorList.js' */                    p.appendChild(e);
/*Line 82 - 'AtomNavigatorList.js' */                    e._templateParent = this;
/*Line 83 - 'AtomNavigatorList.js' */                    this.onCreateChildren(p);
/*Line 84 - 'AtomNavigatorList.js' */                }
/*Line 85 - 'AtomNavigatorList.js' */            },

/*Line 87 - 'AtomNavigatorList.js' */            updateDisplayMode: function () {
/*Line 88 - 'AtomNavigatorList.js' */                var v = this._displayMode;
/*Line 89 - 'AtomNavigatorList.js' */                if (v == 0) {

/*Line 91 - 'AtomNavigatorList.js' */                    if (this._detailPresenter) {
/*Line 92 - 'AtomNavigatorList.js' */                        this._detailView.atomControl.dispose(this._detailPresenter);
/*Line 93 - 'AtomNavigatorList.js' */                        this._detailPresenter = null;
/*Line 94 - 'AtomNavigatorList.js' */                    }
/*Line 95 - 'AtomNavigatorList.js' */                    if (this._newPresenter) {
/*Line 96 - 'AtomNavigatorList.js' */                        this._newView.atomControl.dispose(this._newPresenter);
/*Line 97 - 'AtomNavigatorList.js' */                        this._newPresenter = null;
/*Line 98 - 'AtomNavigatorList.js' */                    }
/*Line 99 - 'AtomNavigatorList.js' */                    if (this._detailHeaderPresenter) {
/*Line 100 - 'AtomNavigatorList.js' */                        this._detailView.atomControl.dispose(this._detailHeaderPresenter);
/*Line 101 - 'AtomNavigatorList.js' */                        this._detailHeaderPresenter = null;
/*Line 102 - 'AtomNavigatorList.js' */                    }
/*Line 103 - 'AtomNavigatorList.js' */                    if (this._newHeaderPresenter) {
/*Line 104 - 'AtomNavigatorList.js' */                        this._newView.atomControl.dispose(this._newHeaderPresenter);
/*Line 105 - 'AtomNavigatorList.js' */                        this._newHeaderPresenter = null;
/*Line 106 - 'AtomNavigatorList.js' */                    }

/*Line 108 - 'AtomNavigatorList.js' */                    return;
/*Line 109 - 'AtomNavigatorList.js' */                }

/*Line 111 - 'AtomNavigatorList.js' */                var c = null;
/*Line 112 - 'AtomNavigatorList.js' */                var ct = this.getTemplate("detailTemplate");;
/*Line 113 - 'AtomNavigatorList.js' */                var ch = null;
/*Line 114 - 'AtomNavigatorList.js' */                var cht;
/*Line 115 - 'AtomNavigatorList.js' */                var key = "";

/*Line 117 - 'AtomNavigatorList.js' */                if (v == 1) {
/*Line 118 - 'AtomNavigatorList.js' */                    c = this._detailView;
/*Line 119 - 'AtomNavigatorList.js' */                    ch = this._detailHeaderToolbar;
/*Line 120 - 'AtomNavigatorList.js' */                    cht = this.getTemplate("detailHeaderTemplate");
/*Line 121 - 'AtomNavigatorList.js' */                    key = "_detail";
/*Line 122 - 'AtomNavigatorList.js' */                } else {
/*Line 123 - 'AtomNavigatorList.js' */                    c = this._newView;
/*Line 124 - 'AtomNavigatorList.js' */                    ch = this._newHeaderToolbar;
/*Line 125 - 'AtomNavigatorList.js' */                    cht = this.getTemplate("newHeaderTemplate");
/*Line 126 - 'AtomNavigatorList.js' */                    key = "_new";
/*Line 127 - 'AtomNavigatorList.js' */                }

/*Line 129 - 'AtomNavigatorList.js' */                if (ch && cht) {
/*Line 130 - 'AtomNavigatorList.js' */                    cht = AtomUI.cloneNode(cht);
/*Line 131 - 'AtomNavigatorList.js' */                    this.addTemplate(ch, cht, true);
/*Line 132 - 'AtomNavigatorList.js' */                    this[key + "HeaderPresenter"] = cht;
/*Line 133 - 'AtomNavigatorList.js' */                }

/*Line 135 - 'AtomNavigatorList.js' */                if (c && ct) {
/*Line 136 - 'AtomNavigatorList.js' */                    ct = AtomUI.cloneNode(ct);
/*Line 137 - 'AtomNavigatorList.js' */                    this.addTemplate(c, ct, true);
/*Line 138 - 'AtomNavigatorList.js' */                    this[key + "Presenter"] = ct;
/*Line 139 - 'AtomNavigatorList.js' */                }
/*Line 140 - 'AtomNavigatorList.js' */            },

/*Line 142 - 'AtomNavigatorList.js' */            createChildren: function () {
/*Line 143 - 'AtomNavigatorList.js' */                base.createChildren.call(this);

/*Line 145 - 'AtomNavigatorList.js' */                this.getTemplate("gridTemplate");
/*Line 146 - 'AtomNavigatorList.js' */                this.getTemplate("detailTemplate");
/*Line 147 - 'AtomNavigatorList.js' */                this.getTemplate("searchTemplate");
/*Line 148 - 'AtomNavigatorList.js' */                this.getTemplate("detailHeaderTemplate");
/*Line 149 - 'AtomNavigatorList.js' */                this.getTemplate("newHeaderTemplate");
/*Line 150 - 'AtomNavigatorList.js' */                this.getTemplate("headerTemplate");
/*Line 151 - 'AtomNavigatorList.js' */                this.getTemplate("footerTemplate");

/*Line 153 - 'AtomNavigatorList.js' */                var p = this.get_scope();

/*Line 155 - 'AtomNavigatorList.js' */                this._newView.atomControl._scope = new AtomScope(this, p);
/*Line 156 - 'AtomNavigatorList.js' */                this._detailView.atomControl._scope = new AtomScope(this, p);

/*Line 158 - 'AtomNavigatorList.js' */                var g = AtomUI.cloneNode(this._gridTemplate);
/*Line 159 - 'AtomNavigatorList.js' */                this.addTemplate(this._gridPresenter, g);

/*Line 161 - 'AtomNavigatorList.js' */                if (!($(this._detailTemplate).attr("atom-dock"))) {
/*Line 162 - 'AtomNavigatorList.js' */                    $(this._detailTemplate).attr("atom-dock", "Fill");
/*Line 163 - 'AtomNavigatorList.js' */                }

/*Line 165 - 'AtomNavigatorList.js' */                if (this._headerTemplate) {
/*Line 166 - 'AtomNavigatorList.js' */                    var hd = AtomUI.cloneNode(this._headerTemplate);
/*Line 167 - 'AtomNavigatorList.js' */                    hd.setAttribute("atom-dock", "Top");
/*Line 168 - 'AtomNavigatorList.js' */                    $(hd).addClass("atom-navigator-list-header");
/*Line 169 - 'AtomNavigatorList.js' */                    hd._templateParent = this;
/*Line 170 - 'AtomNavigatorList.js' */                    this.addTemplate(this._gridPanel, hd);
/*Line 171 - 'AtomNavigatorList.js' */                }

/*Line 173 - 'AtomNavigatorList.js' */                if (this._footerTemplate) {
/*Line 174 - 'AtomNavigatorList.js' */                    var fd = AtomUI.cloneNode(this._footerTemplate);
/*Line 175 - 'AtomNavigatorList.js' */                    fd.setAttribute("atom-dock", "Bottom");
/*Line 176 - 'AtomNavigatorList.js' */                    $(hd).addClass("atom-navigator-list-footer");
/*Line 177 - 'AtomNavigatorList.js' */                    this.addTemplate(this._gridPanel, fd);
/*Line 178 - 'AtomNavigatorList.js' */                }
/*Line 179 - 'AtomNavigatorList.js' */            },

/*Line 181 - 'AtomNavigatorList.js' */            init: function () {
/*Line 182 - 'AtomNavigatorList.js' */                base.init.call(this);

/*Line 184 - 'AtomNavigatorList.js' */                var _this = this;

/*Line 186 - 'AtomNavigatorList.js' */                this.backCommand = function () {
/*Line 187 - 'AtomNavigatorList.js' */                    _this.onBackCommand.apply(_this, arguments);
/*Line 188 - 'AtomNavigatorList.js' */                };

/*Line 190 - 'AtomNavigatorList.js' */                this.addCommand = function () {
/*Line 191 - 'AtomNavigatorList.js' */                    _this.onAddCommand.apply(_this, arguments);
/*Line 192 - 'AtomNavigatorList.js' */                };

/*Line 194 - 'AtomNavigatorList.js' */                this.cancelAddCommand = function () {
/*Line 195 - 'AtomNavigatorList.js' */                    _this.onCancelAddNewCommand.apply(_this, arguments);
/*Line 196 - 'AtomNavigatorList.js' */                };

/*Line 198 - 'AtomNavigatorList.js' */                this.showDetailCommand = function () {
/*Line 199 - 'AtomNavigatorList.js' */                    var s = _this.get_selectedItem();
/*Line 200 - 'AtomNavigatorList.js' */                    if (s) {
/*Line 201 - 'AtomNavigatorList.js' */                        AtomBinder.setValue(_this, "displayMode", 1);
/*Line 202 - 'AtomNavigatorList.js' */                        _this.updateDisplayMode();
/*Line 203 - 'AtomNavigatorList.js' */                    }
/*Line 204 - 'AtomNavigatorList.js' */                };
/*Line 205 - 'AtomNavigatorList.js' */            }
/*Line 206 - 'AtomNavigatorList.js' */        }
/*Line 207 - 'AtomNavigatorList.js' */    });
/*Line 208 - 'AtomNavigatorList.js' */})(window, WebAtoms.AtomListBox.prototype);

/*Line 0 - 'AtomNumberComboBox.js' */

/*Line 2 - 'AtomNumberComboBox.js' */(function (window, base) {

/*Line 4 - 'AtomNumberComboBox.js' */    var AtomUI = window.AtomUI;

/*Line 6 - 'AtomNumberComboBox.js' */    return classCreatorEx({
/*Line 7 - 'AtomNumberComboBox.js' */        name: "WebAtoms.AtomNumberComboBox",
/*Line 8 - 'AtomNumberComboBox.js' */        base: base,
/*Line 9 - 'AtomNumberComboBox.js' */        start: function () { },
/*Line 10 - 'AtomNumberComboBox.js' */        properties: {
/*Line 11 - 'AtomNumberComboBox.js' */            showPrompt: false,
/*Line 12 - 'AtomNumberComboBox.js' */            startNumber: undefined,
/*Line 13 - 'AtomNumberComboBox.js' */            endNumber: undefined,
/*Line 14 - 'AtomNumberComboBox.js' */            step:1
/*Line 15 - 'AtomNumberComboBox.js' */        },
/*Line 16 - 'AtomNumberComboBox.js' */        methods: {
/*Line 17 - 'AtomNumberComboBox.js' */            set_startNumber: function (v) {
/*Line 18 - 'AtomNumberComboBox.js' */                this._startNumber = v;
/*Line 19 - 'AtomNumberComboBox.js' */                this.resetNumbers();
/*Line 20 - 'AtomNumberComboBox.js' */            },

/*Line 22 - 'AtomNumberComboBox.js' */            set_endNumber: function (v) {
/*Line 23 - 'AtomNumberComboBox.js' */                this._endNumber = v;
/*Line 24 - 'AtomNumberComboBox.js' */                this.resetNumbers();
/*Line 25 - 'AtomNumberComboBox.js' */            },

/*Line 27 - 'AtomNumberComboBox.js' */            set_step: function (v) {
/*Line 28 - 'AtomNumberComboBox.js' */                if (!v)
/*Line 29 - 'AtomNumberComboBox.js' */                    return;
/*Line 30 - 'AtomNumberComboBox.js' */                this._step = v;
/*Line 31 - 'AtomNumberComboBox.js' */                this.resetNumbers();
/*Line 32 - 'AtomNumberComboBox.js' */            },

/*Line 34 - 'AtomNumberComboBox.js' */            onLoaded: function () {
/*Line 35 - 'AtomNumberComboBox.js' */                this.resetNumbers();
/*Line 36 - 'AtomNumberComboBox.js' */            },

/*Line 38 - 'AtomNumberComboBox.js' */            resetNumbers: function () {
/*Line 39 - 'AtomNumberComboBox.js' */                if (!this._created)
/*Line 40 - 'AtomNumberComboBox.js' */                    return;
/*Line 41 - 'AtomNumberComboBox.js' */                if ((this._startNumber === undefined) || (this._endNumber === undefined))
/*Line 42 - 'AtomNumberComboBox.js' */                    return;
/*Line 43 - 'AtomNumberComboBox.js' */                var sn = AtomUI.toNumber(this._startNumber);
/*Line 44 - 'AtomNumberComboBox.js' */                var en = AtomUI.toNumber(this._endNumber);
/*Line 45 - 'AtomNumberComboBox.js' */                var step = AtomUI.toNumber(this._step);
/*Line 46 - 'AtomNumberComboBox.js' */                var numbers = [];
/*Line 47 - 'AtomNumberComboBox.js' */                if (this._showPrompt) {
/*Line 48 - 'AtomNumberComboBox.js' */                    numbers.push({ label: "Select", value: 0 });
/*Line 49 - 'AtomNumberComboBox.js' */                }
/*Line 50 - 'AtomNumberComboBox.js' */                for (; sn <= en; sn += step) {
/*Line 51 - 'AtomNumberComboBox.js' */                    numbers.push({ label: sn, value: sn });
/*Line 52 - 'AtomNumberComboBox.js' */                }

/*Line 54 - 'AtomNumberComboBox.js' */                this.set_items(numbers);
/*Line 55 - 'AtomNumberComboBox.js' */            }
/*Line 56 - 'AtomNumberComboBox.js' */        }
/*Line 57 - 'AtomNumberComboBox.js' */    });
/*Line 58 - 'AtomNumberComboBox.js' */})(window, WebAtoms.AtomComboBox.prototype);

/*Line 0 - 'AtomPhoneControl.js' */

/*Line 2 - 'AtomPhoneControl.js' */(function (window, base) {

/*Line 4 - 'AtomPhoneControl.js' */    var document = window.document;
/*Line 5 - 'AtomPhoneControl.js' */    var $ = window.$;

/*Line 7 - 'AtomPhoneControl.js' */    return classCreatorEx({
/*Line 8 - 'AtomPhoneControl.js' */        name: "WebAtoms.AtomPhoneControl",
/*Line 9 - 'AtomPhoneControl.js' */        base: base,
/*Line 10 - 'AtomPhoneControl.js' */        start: function () {
/*Line 11 - 'AtomPhoneControl.js' */            this._value = "";
/*Line 12 - 'AtomPhoneControl.js' */        },
/*Line 13 - 'AtomPhoneControl.js' */        properties: {

/*Line 15 - 'AtomPhoneControl.js' */        },
/*Line 16 - 'AtomPhoneControl.js' */        methods: {
/*Line 17 - 'AtomPhoneControl.js' */            set_value: function (v) {
/*Line 18 - 'AtomPhoneControl.js' */                this._value = v;
/*Line 19 - 'AtomPhoneControl.js' */                if (this._countries) {
/*Line 20 - 'AtomPhoneControl.js' */                    this.setupValues();
/*Line 21 - 'AtomPhoneControl.js' */                }
/*Line 22 - 'AtomPhoneControl.js' */            },

/*Line 24 - 'AtomPhoneControl.js' */            setupValues: function () {
/*Line 25 - 'AtomPhoneControl.js' */                if (!this._value) {
/*Line 26 - 'AtomPhoneControl.js' */                    $(this.num).val("");
/*Line 27 - 'AtomPhoneControl.js' */                    $(this.ext).val("");
/*Line 28 - 'AtomPhoneControl.js' */                    $(this.msg).val("");
/*Line 29 - 'AtomPhoneControl.js' */                    return;
/*Line 30 - 'AtomPhoneControl.js' */                }
/*Line 31 - 'AtomPhoneControl.js' */                var tokens = this._value.split(":", 6);

/*Line 33 - 'AtomPhoneControl.js' */                var cc = tokens[1];

/*Line 35 - 'AtomPhoneControl.js' */                var ae = new AtomEnumerator(this._countries);
/*Line 36 - 'AtomPhoneControl.js' */                while (ae.next()) {
/*Line 37 - 'AtomPhoneControl.js' */                    var ci = ae.current();
/*Line 38 - 'AtomPhoneControl.js' */                    if (ci.country == cc) {
/*Line 39 - 'AtomPhoneControl.js' */                        this.cs.selectedIndex = ae.currentIndex();
/*Line 40 - 'AtomPhoneControl.js' */                        break;
/*Line 41 - 'AtomPhoneControl.js' */                    }
/*Line 42 - 'AtomPhoneControl.js' */                }

/*Line 44 - 'AtomPhoneControl.js' */                var num = (tokens[3] || "").split(".").join("-");
/*Line 45 - 'AtomPhoneControl.js' */                if (num == "--")
/*Line 46 - 'AtomPhoneControl.js' */                    num = "";
/*Line 47 - 'AtomPhoneControl.js' */                $(this.num).val(num);
/*Line 48 - 'AtomPhoneControl.js' */                $(this.ext).val(tokens[4]);
/*Line 49 - 'AtomPhoneControl.js' */                $(this.msg).val(tokens[5]);
/*Line 50 - 'AtomPhoneControl.js' */                this.onFormat();
/*Line 51 - 'AtomPhoneControl.js' */            },

/*Line 53 - 'AtomPhoneControl.js' */            onDataChange: function () {
/*Line 54 - 'AtomPhoneControl.js' */                var value = "v2:";
/*Line 55 - 'AtomPhoneControl.js' */                var si = this.cs.selectedIndex;
/*Line 56 - 'AtomPhoneControl.js' */                var ci = this._countries[si];
/*Line 57 - 'AtomPhoneControl.js' */                value += ci.country + ":" + ci.code;
/*Line 58 - 'AtomPhoneControl.js' */                var num = (($(this.num).val()).split("-").join("."));
/*Line 59 - 'AtomPhoneControl.js' */                value += ":" + num;
/*Line 60 - 'AtomPhoneControl.js' */                value += ":" + $(this.ext).val();
/*Line 61 - 'AtomPhoneControl.js' */                value += ":" + $(this.msg).val();

/*Line 63 - 'AtomPhoneControl.js' */                if (num) {
/*Line 64 - 'AtomPhoneControl.js' */                    this._value = value;
/*Line 65 - 'AtomPhoneControl.js' */                } else {
/*Line 66 - 'AtomPhoneControl.js' */                    this._value = "";
/*Line 67 - 'AtomPhoneControl.js' */                }

/*Line 69 - 'AtomPhoneControl.js' */                AtomBinder.refreshValue(this, "value");
/*Line 70 - 'AtomPhoneControl.js' */            },

/*Line 72 - 'AtomPhoneControl.js' */            setCountries: function (r) {
/*Line 73 - 'AtomPhoneControl.js' */                this._countries = r;
/*Line 74 - 'AtomPhoneControl.js' */                var options = this.cs.options;
/*Line 75 - 'AtomPhoneControl.js' */                options.length = 0;
/*Line 76 - 'AtomPhoneControl.js' */                var ae = new AtomEnumerator(r);
/*Line 77 - 'AtomPhoneControl.js' */                while (ae.next()) {
/*Line 78 - 'AtomPhoneControl.js' */                    var ci = ae.current();
/*Line 79 - 'AtomPhoneControl.js' */                    if (!ci.valueIndex) {
/*Line 80 - 'AtomPhoneControl.js' */                        ci.label = ci.label;
/*Line 81 - 'AtomPhoneControl.js' */                        ci.valueIndex = ae.currentIndex();
/*Line 82 - 'AtomPhoneControl.js' */                        var obj = eval("(" + ci.value + ")");
/*Line 83 - 'AtomPhoneControl.js' */                        ci.country = obj.country;
/*Line 84 - 'AtomPhoneControl.js' */                        ci.code = obj.code;
/*Line 85 - 'AtomPhoneControl.js' */                        ci.format = obj.format;
/*Line 86 - 'AtomPhoneControl.js' */                    }
/*Line 87 - 'AtomPhoneControl.js' */                    options[ae.currentIndex()] = new Option(ci.label, ci.valueIndex, false, false);
/*Line 88 - 'AtomPhoneControl.js' */                }

/*Line 90 - 'AtomPhoneControl.js' */                this.setupValues();
/*Line 91 - 'AtomPhoneControl.js' */                this.onFormat();
/*Line 92 - 'AtomPhoneControl.js' */            },


/*Line 95 - 'AtomPhoneControl.js' */            onCountryChange: function () {
/*Line 96 - 'AtomPhoneControl.js' */                this.onDataChange();
/*Line 97 - 'AtomPhoneControl.js' */                this.onFormat();
/*Line 98 - 'AtomPhoneControl.js' */            },

/*Line 100 - 'AtomPhoneControl.js' */            onFormat: function () {
/*Line 101 - 'AtomPhoneControl.js' */                var cs = this.cs;
/*Line 102 - 'AtomPhoneControl.js' */                if (cs.selectedIndex == -1)
/*Line 103 - 'AtomPhoneControl.js' */                    return;
/*Line 104 - 'AtomPhoneControl.js' */                var ci = this._countries[cs.selectedIndex];

/*Line 106 - 'AtomPhoneControl.js' */                if (ci.format && ci.format.length && ci.format.length > 0) {
/*Line 107 - 'AtomPhoneControl.js' */                    this._currentFormat = [];
/*Line 108 - 'AtomPhoneControl.js' */                    var last = 0;
/*Line 109 - 'AtomPhoneControl.js' */                    var ae = new AtomEnumerator(ci.format);
/*Line 110 - 'AtomPhoneControl.js' */                    while (ae.next()) {
/*Line 111 - 'AtomPhoneControl.js' */                        last += ae.current();
/*Line 112 - 'AtomPhoneControl.js' */                        this._currentFormat.push(last);
/*Line 113 - 'AtomPhoneControl.js' */                    }
/*Line 114 - 'AtomPhoneControl.js' */                }
/*Line 115 - 'AtomPhoneControl.js' */            },

/*Line 117 - 'AtomPhoneControl.js' */            onKeyUp: function (eventObject) {
/*Line 118 - 'AtomPhoneControl.js' */                if (!this._currentFormat)
/*Line 119 - 'AtomPhoneControl.js' */                    return;
/*Line 120 - 'AtomPhoneControl.js' */                var s = this.num.value;
/*Line 121 - 'AtomPhoneControl.js' */                s = s.replace(/\D/g, '');
/*Line 122 - 'AtomPhoneControl.js' */                var ns = "";
/*Line 123 - 'AtomPhoneControl.js' */                for (var i = 0; i < s.length; i++) {
/*Line 124 - 'AtomPhoneControl.js' */                    ns += s[i];
/*Line 125 - 'AtomPhoneControl.js' */                    if (i < s.length - 1 && ($.inArray(i + 1, this._currentFormat) != -1)) {
/*Line 126 - 'AtomPhoneControl.js' */                        ns += "-";
/*Line 127 - 'AtomPhoneControl.js' */                    }
/*Line 128 - 'AtomPhoneControl.js' */                }
/*Line 129 - 'AtomPhoneControl.js' */                this.num.value = ns;
/*Line 130 - 'AtomPhoneControl.js' */            },

/*Line 132 - 'AtomPhoneControl.js' */            init: function () {
/*Line 133 - 'AtomPhoneControl.js' */                this.cs = document.createElement("SELECT");
/*Line 134 - 'AtomPhoneControl.js' */                //this.cs.style['float'] = "left";
/*Line 135 - 'AtomPhoneControl.js' */                this.num = document.createElement("INPUT");
/*Line 136 - 'AtomPhoneControl.js' */                this.num.type = "text";
/*Line 137 - 'AtomPhoneControl.js' */                //this.num.style.width = "150px";
/*Line 138 - 'AtomPhoneControl.js' */                //this.num.style['float'] = "left";
/*Line 139 - 'AtomPhoneControl.js' */                //this.num.style.marginLeft = "2px";
/*Line 140 - 'AtomPhoneControl.js' */                this.ext = document.createElement("INPUT");
/*Line 141 - 'AtomPhoneControl.js' */                //this.num = [this.num1, this.num2, this.num3, this.ext];
/*Line 142 - 'AtomPhoneControl.js' */                this.ext.type = "text";
/*Line 143 - 'AtomPhoneControl.js' */                //this.ext.style.width = "30px";
/*Line 144 - 'AtomPhoneControl.js' */                //this.ext.style['float'] = "left";
/*Line 145 - 'AtomPhoneControl.js' */                //this.ext.style.marginLeft = "2px";
/*Line 146 - 'AtomPhoneControl.js' */                $(this.ext).attr("placeholder", "Ext.");
/*Line 147 - 'AtomPhoneControl.js' */                this.msg = document.createElement("INPUT");
/*Line 148 - 'AtomPhoneControl.js' */                this.msg.type = "text";
/*Line 149 - 'AtomPhoneControl.js' */                //this.msg.style.width = "100px";
/*Line 150 - 'AtomPhoneControl.js' */                //this.msg.style['float'] = "left";
/*Line 151 - 'AtomPhoneControl.js' */                //this.msg.style.marginLeft = "2px";
/*Line 152 - 'AtomPhoneControl.js' */                $(this.msg).attr("placeholder", "Message");

/*Line 154 - 'AtomPhoneControl.js' */                var element = this.get_element();
/*Line 155 - 'AtomPhoneControl.js' */                //element.style.width = "450px";
/*Line 156 - 'AtomPhoneControl.js' */                element.appendChild(this.cs);
/*Line 157 - 'AtomPhoneControl.js' */                element.appendChild(this.num);
/*Line 158 - 'AtomPhoneControl.js' */                element.appendChild(this.ext);
/*Line 159 - 'AtomPhoneControl.js' */                element.appendChild(this.msg);

/*Line 161 - 'AtomPhoneControl.js' */                var caller = this;

/*Line 163 - 'AtomPhoneControl.js' */                this.onKeyUpLater = function (e) {
/*Line 164 - 'AtomPhoneControl.js' */                    var evt = e;
/*Line 165 - 'AtomPhoneControl.js' */                    caller.onKeyUp(evt);
/*Line 166 - 'AtomPhoneControl.js' */                    caller.onDataChange(evt);
/*Line 167 - 'AtomPhoneControl.js' */                };

/*Line 169 - 'AtomPhoneControl.js' */                this.bindEvent(this.cs, "change", "onCountryChange");
/*Line 170 - 'AtomPhoneControl.js' */                this.bindEvent(this.num, "change", "onDataChange");
/*Line 171 - 'AtomPhoneControl.js' */                this.bindEvent(this.num, "keyup", "onKeyUpLater");
/*Line 172 - 'AtomPhoneControl.js' */                this.bindEvent(this.num, "keypress", "onKeyUpLater");
/*Line 173 - 'AtomPhoneControl.js' */                this.bindEvent(this.ext, "change", "onDataChange");
/*Line 174 - 'AtomPhoneControl.js' */                this.bindEvent(this.msg, "change", "onDataChange");

/*Line 176 - 'AtomPhoneControl.js' */                $(this._element).addClass("atom-phone-control");
/*Line 177 - 'AtomPhoneControl.js' */                $(this.num).addClass("atom-pc-num");
/*Line 178 - 'AtomPhoneControl.js' */                $(this.msg).addClass("atom-pc-msg");
/*Line 179 - 'AtomPhoneControl.js' */                $(this.cs).addClass("atom-pc-cs");
/*Line 180 - 'AtomPhoneControl.js' */                $(this.ext).addClass("atom-pc-ext");


/*Line 183 - 'AtomPhoneControl.js' */                var phone = this;

/*Line 185 - 'AtomPhoneControl.js' */                AtomPromise.cachedJson("/config/phonecountries").then(function (r) {
/*Line 186 - 'AtomPhoneControl.js' */                    phone.setCountries(r.value());
/*Line 187 - 'AtomPhoneControl.js' */                }).invoke();


/*Line 190 - 'AtomPhoneControl.js' */                base.init.call(this);
/*Line 191 - 'AtomPhoneControl.js' */            }
/*Line 192 - 'AtomPhoneControl.js' */        }
/*Line 193 - 'AtomPhoneControl.js' */    });
/*Line 194 - 'AtomPhoneControl.js' */})(window, WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomRadioButtonList.js' */

/*Line 2 - 'AtomRadioButtonList.js' */(function (window, baseType) {
/*Line 3 - 'AtomRadioButtonList.js' */    return classCreatorEx({
/*Line 4 - 'AtomRadioButtonList.js' */        name: "WebAtoms.AtomRadioButtonList",
/*Line 5 - 'AtomRadioButtonList.js' */        base: baseType,
/*Line 6 - 'AtomRadioButtonList.js' */        start: function () {
/*Line 7 - 'AtomRadioButtonList.js' */            this._allowMultipleSelection = false;
/*Line 8 - 'AtomRadioButtonList.js' */        },
/*Line 9 - 'AtomRadioButtonList.js' */        properties: {

/*Line 11 - 'AtomRadioButtonList.js' */        },
/*Line 12 - 'AtomRadioButtonList.js' */        methods: {
/*Line 13 - 'AtomRadioButtonList.js' */            updateChildSelections: function () {
/*Line 14 - 'AtomRadioButtonList.js' */                var dataItems = this.get_dataItems();
/*Line 15 - 'AtomRadioButtonList.js' */                var ae = new AtomEnumerator(dataItems);
/*Line 16 - 'AtomRadioButtonList.js' */                var children = this._dataElements;
/*Line 17 - 'AtomRadioButtonList.js' */                while (ae.next()) {
/*Line 18 - 'AtomRadioButtonList.js' */                    var dataItem = ae.current();
/*Line 19 - 'AtomRadioButtonList.js' */                    var item = children[ae.currentIndex()];
/*Line 20 - 'AtomRadioButtonList.js' */                    if (this.isSelected(dataItem)) {
/*Line 21 - 'AtomRadioButtonList.js' */                        $(item).attr("checked", "true");
/*Line 22 - 'AtomRadioButtonList.js' */                    } else {
/*Line 23 - 'AtomRadioButtonList.js' */                        $(item).removeAttr("checked");
/*Line 24 - 'AtomRadioButtonList.js' */                    }
/*Line 25 - 'AtomRadioButtonList.js' */                }
/*Line 26 - 'AtomRadioButtonList.js' */            },


/*Line 29 - 'AtomRadioButtonList.js' */            onDataChange: function (event) {
/*Line 30 - 'AtomRadioButtonList.js' */                this._onUIChanged = true;

/*Line 32 - 'AtomRadioButtonList.js' */                var item = event.target;
/*Line 33 - 'AtomRadioButtonList.js' */                var dataItem = item;
/*Line 34 - 'AtomRadioButtonList.js' */                if (this.hasItems())
/*Line 35 - 'AtomRadioButtonList.js' */                    dataItem = $(item).data("atom-data-item");
/*Line 36 - 'AtomRadioButtonList.js' */                var checked = $(item).attr("checked");

/*Line 38 - 'AtomRadioButtonList.js' */                AtomBinder.clear(this._selectedItems);

/*Line 40 - 'AtomRadioButtonList.js' */                if (this.isSelected(dataItem)) {
/*Line 41 - 'AtomRadioButtonList.js' */                    if (!checked) {
/*Line 42 - 'AtomRadioButtonList.js' */                        AtomBinder.removeItem(this._selectedItems, dataItem);
/*Line 43 - 'AtomRadioButtonList.js' */                    }
/*Line 44 - 'AtomRadioButtonList.js' */                }
/*Line 45 - 'AtomRadioButtonList.js' */                else {
/*Line 46 - 'AtomRadioButtonList.js' */                    if (checked) {
/*Line 47 - 'AtomRadioButtonList.js' */                        AtomBinder.addItem(this._selectedItems, dataItem);
/*Line 48 - 'AtomRadioButtonList.js' */                    }
/*Line 49 - 'AtomRadioButtonList.js' */                }

/*Line 51 - 'AtomRadioButtonList.js' */                this._onUIChanged = false;

/*Line 53 - 'AtomRadioButtonList.js' */            },

/*Line 55 - 'AtomRadioButtonList.js' */            createChildElement: function (parentScope, parentElement, data) {
/*Line 56 - 'AtomRadioButtonList.js' */                var span = document.createElement("SPAN");
/*Line 57 - 'AtomRadioButtonList.js' */                var cb = document.createElement("INPUT");
/*Line 58 - 'AtomRadioButtonList.js' */                $(cb).attr("type", "radio");
/*Line 59 - 'AtomRadioButtonList.js' */                $(cb).attr("name", this._groupName);
/*Line 60 - 'AtomRadioButtonList.js' */                var lp = this.get_labelPath();
/*Line 61 - 'AtomRadioButtonList.js' */                var vp = this.get_valuePath();
/*Line 62 - 'AtomRadioButtonList.js' */                l = data;
/*Line 63 - 'AtomRadioButtonList.js' */                v = data;
/*Line 64 - 'AtomRadioButtonList.js' */                if (lp)
/*Line 65 - 'AtomRadioButtonList.js' */                    l = data[lp];
/*Line 66 - 'AtomRadioButtonList.js' */                if (vp)
/*Line 67 - 'AtomRadioButtonList.js' */                    v = data[vp];
/*Line 68 - 'AtomRadioButtonList.js' */                $(cb).data("atom-data", v);
/*Line 69 - 'AtomRadioButtonList.js' */                $(cb).data("atom-data-item", data);
/*Line 70 - 'AtomRadioButtonList.js' */                $(cb).val(l);
/*Line 71 - 'AtomRadioButtonList.js' */                span.appendChild(cb);
/*Line 72 - 'AtomRadioButtonList.js' */                var txt = document.createTextNode(l);
/*Line 73 - 'AtomRadioButtonList.js' */                span.appendChild(txt);
/*Line 74 - 'AtomRadioButtonList.js' */                parentElement.appendChild(span);
/*Line 75 - 'AtomRadioButtonList.js' */                this.bindEvent(cb, "change", "onDataChange");
/*Line 76 - 'AtomRadioButtonList.js' */                return cb;
/*Line 77 - 'AtomRadioButtonList.js' */            },

/*Line 79 - 'AtomRadioButtonList.js' */            init: function () {
/*Line 80 - 'AtomRadioButtonList.js' */                this._groupName = "__g" + AtomUI.getNewIndex();
/*Line 81 - 'AtomRadioButtonList.js' */                baseType.init.call(this);
/*Line 82 - 'AtomRadioButtonList.js' */            }
/*Line 83 - 'AtomRadioButtonList.js' */        }
/*Line 84 - 'AtomRadioButtonList.js' */    });
/*Line 85 - 'AtomRadioButtonList.js' */})(window, WebAtoms.AtomCheckBoxList.prototype);

/*Line 0 - 'AtomSortableColumn.js' */

/*Line 2 - 'AtomSortableColumn.js' */(function (window, baseType) {
/*Line 3 - 'AtomSortableColumn.js' */    return classCreatorEx({
/*Line 4 - 'AtomSortableColumn.js' */        name: "WebAtoms.AtomSortableColumn",
/*Line 5 - 'AtomSortableColumn.js' */        base: baseType,
/*Line 6 - 'AtomSortableColumn.js' */        start: function () {
/*Line 7 - 'AtomSortableColumn.js' */        },
/*Line 8 - 'AtomSortableColumn.js' */        properties: {
/*Line 9 - 'AtomSortableColumn.js' */            direction: "",
/*Line 10 - 'AtomSortableColumn.js' */            defaultDirection: "",
/*Line 11 - 'AtomSortableColumn.js' */            label: "",
/*Line 12 - 'AtomSortableColumn.js' */            sortField: null
/*Line 13 - 'AtomSortableColumn.js' */        },
/*Line 14 - 'AtomSortableColumn.js' */        methods: {
/*Line 15 - 'AtomSortableColumn.js' */            set_direction: function (v) {
/*Line 16 - 'AtomSortableColumn.js' */                this._direction = v;
/*Line 17 - 'AtomSortableColumn.js' */                $(this._element).removeClass("atom-sort-asc");
/*Line 18 - 'AtomSortableColumn.js' */                $(this._element).removeClass("atom-sort-desc");
/*Line 19 - 'AtomSortableColumn.js' */                if (v) {
/*Line 20 - 'AtomSortableColumn.js' */                    $(this._element).addClass("atom-sort-" + v.toLowerCase());
/*Line 21 - 'AtomSortableColumn.js' */                }
/*Line 22 - 'AtomSortableColumn.js' */            },

/*Line 24 - 'AtomSortableColumn.js' */            set_value: function (v) {
/*Line 25 - 'AtomSortableColumn.js' */                this._value = v;
/*Line 26 - 'AtomSortableColumn.js' */                this.refreshUI();
/*Line 27 - 'AtomSortableColumn.js' */            },

/*Line 29 - 'AtomSortableColumn.js' */            refreshUI: function () {
/*Line 30 - 'AtomSortableColumn.js' */                if (!this._value)
/*Line 31 - 'AtomSortableColumn.js' */                    return;
/*Line 32 - 'AtomSortableColumn.js' */                if (this._value.indexOf(this._sortField) == -1) {
/*Line 33 - 'AtomSortableColumn.js' */                    AtomBinder.setValue(this, "direction", "");
/*Line 34 - 'AtomSortableColumn.js' */                    return;
/*Line 35 - 'AtomSortableColumn.js' */                }

/*Line 37 - 'AtomSortableColumn.js' */                if (this._value.lastIndexOf("desc") != this._value.length - 4) {
/*Line 38 - 'AtomSortableColumn.js' */                    AtomBinder.setValue(this, "direction", "asc");
/*Line 39 - 'AtomSortableColumn.js' */                } else {
/*Line 40 - 'AtomSortableColumn.js' */                    AtomBinder.setValue(this, "direction", "desc");
/*Line 41 - 'AtomSortableColumn.js' */                }
/*Line 42 - 'AtomSortableColumn.js' */            },

/*Line 44 - 'AtomSortableColumn.js' */            onClick: function (e) {
/*Line 45 - 'AtomSortableColumn.js' */                if (!this._direction) {
/*Line 46 - 'AtomSortableColumn.js' */                    AtomBinder.setValue(this, "direction", this._defaultDirection);
/*Line 47 - 'AtomSortableColumn.js' */                } else {
/*Line 48 - 'AtomSortableColumn.js' */                    if (this._direction == "asc") {
/*Line 49 - 'AtomSortableColumn.js' */                        AtomBinder.setValue(this, "direction", "desc");
/*Line 50 - 'AtomSortableColumn.js' */                    } else {
/*Line 51 - 'AtomSortableColumn.js' */                        AtomBinder.setValue(this, "direction", "asc");
/*Line 52 - 'AtomSortableColumn.js' */                    }
/*Line 53 - 'AtomSortableColumn.js' */                }
/*Line 54 - 'AtomSortableColumn.js' */                AtomBinder.setValue(this, "value", this._sortField + " " + this._direction);
/*Line 55 - 'AtomSortableColumn.js' */            },

/*Line 57 - 'AtomSortableColumn.js' */            init: function () {
/*Line 58 - 'AtomSortableColumn.js' */                baseType.init.call(this);

/*Line 60 - 'AtomSortableColumn.js' */                this.bindEvent(this._element, "click", "onClick");
/*Line 61 - 'AtomSortableColumn.js' */                $(this._element).addClass("atom-column");

/*Line 63 - 'AtomSortableColumn.js' */            },

/*Line 65 - 'AtomSortableColumn.js' */            onUpdateUI: function () {
/*Line 66 - 'AtomSortableColumn.js' */                this.refreshUI();
/*Line 67 - 'AtomSortableColumn.js' */            }
/*Line 68 - 'AtomSortableColumn.js' */        }
/*Line 69 - 'AtomSortableColumn.js' */    });
/*Line 70 - 'AtomSortableColumn.js' */})(window, WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomTabButtonBar.js' */

/*Line 2 - 'AtomTabButtonBar.js' */(function (baseType) {
/*Line 3 - 'AtomTabButtonBar.js' */    return classCreatorEx({
/*Line 4 - 'AtomTabButtonBar.js' */        name: "WebAtoms.AtomTabButtonBar",
/*Line 5 - 'AtomTabButtonBar.js' */        base: baseType,
/*Line 6 - 'AtomTabButtonBar.js' */        start: function () {
/*Line 7 - 'AtomTabButtonBar.js' */            this._allowMultipleSelection = false;
/*Line 8 - 'AtomTabButtonBar.js' */            this._showTabs = true;
/*Line 9 - 'AtomTabButtonBar.js' */        },
/*Line 10 - 'AtomTabButtonBar.js' */        methods: {

/*Line 12 - 'AtomTabButtonBar.js' */        }
/*Line 13 - 'AtomTabButtonBar.js' */    });
/*Line 14 - 'AtomTabButtonBar.js' */})(WebAtoms.AtomLinkBar.prototype);
/*Line 0 - 'AtomTabControl.js' */

/*Line 2 - 'AtomTabControl.js' */(function (window, baseType) {
/*Line 3 - 'AtomTabControl.js' */    return classCreatorEx({
/*Line 4 - 'AtomTabControl.js' */        name: "WebAtoms.AtomTabControl",
/*Line 5 - 'AtomTabControl.js' */        base: baseType,
/*Line 6 - 'AtomTabControl.js' */        start: function () {
/*Line 7 - 'AtomTabControl.js' */            this._presenters = ["itemsPresenter"];

/*Line 9 - 'AtomTabControl.js' */            this._layout = WebAtoms.AtomViewBoxLayout.defaultInstance;

/*Line 11 - 'AtomTabControl.js' */            this.selectedIndex = 0;
/*Line 12 - 'AtomTabControl.js' */            this.labelPath = "label";

/*Line 14 - 'AtomTabControl.js' */        },
/*Line 15 - 'AtomTabControl.js' */        properties: {
/*Line 16 - 'AtomTabControl.js' */            items: null
/*Line 17 - 'AtomTabControl.js' */        },
/*Line 18 - 'AtomTabControl.js' */        methods: {
/*Line 19 - 'AtomTabControl.js' */            createChildren: function () {
/*Line 20 - 'AtomTabControl.js' */               baseType.createChildren.call(this);

/*Line 22 - 'AtomTabControl.js' */                if (this._itemsPresenter != this._element) {


/*Line 25 - 'AtomTabControl.js' */                    var children = [];

/*Line 27 - 'AtomTabControl.js' */                    var ae = new ChildEnumerator(this._element);
/*Line 28 - 'AtomTabControl.js' */                    while (ae.next()) {
/*Line 29 - 'AtomTabControl.js' */                        var c = ae.current();
/*Line 30 - 'AtomTabControl.js' */                        this._element.removeChild(c);
/*Line 31 - 'AtomTabControl.js' */                        children.push(c);
/*Line 32 - 'AtomTabControl.js' */                    }

/*Line 34 - 'AtomTabControl.js' */                    if (this._template) {
/*Line 35 - 'AtomTabControl.js' */                        var t = AtomUI.cloneNode(this._template);
/*Line 36 - 'AtomTabControl.js' */                        t._templateParent = this;
/*Line 37 - 'AtomTabControl.js' */                        this._element.appendChild(t);
/*Line 38 - 'AtomTabControl.js' */                        this.onCreateChildren(this._element);
/*Line 39 - 'AtomTabControl.js' */                    }

/*Line 41 - 'AtomTabControl.js' */                    ae = new AtomEnumerator(children);
/*Line 42 - 'AtomTabControl.js' */                    while (ae.next()) {
/*Line 43 - 'AtomTabControl.js' */                        this._itemsPresenter.appendChild(ae.current());
/*Line 44 - 'AtomTabControl.js' */                    }
/*Line 45 - 'AtomTabControl.js' */                    if (this._template) {
/*Line 46 - 'AtomTabControl.js' */                        this.onCreateChildren(this._itemsPresenter);
/*Line 47 - 'AtomTabControl.js' */                    }

/*Line 49 - 'AtomTabControl.js' */                }

/*Line 51 - 'AtomTabControl.js' */            }
/*Line 52 - 'AtomTabControl.js' */        }
/*Line 53 - 'AtomTabControl.js' */    });
/*Line 54 - 'AtomTabControl.js' */})(window, WebAtoms.AtomControl.prototype);

/*Line 0 - 'AtomTimePicker.js' */

/*Line 2 - 'AtomTimePicker.js' */(function (window, baseType) {
/*Line 3 - 'AtomTimePicker.js' */    return classCreatorEx({
/*Line 4 - 'AtomTimePicker.js' */        name: "WebAtoms.AtomTimePicker",
/*Line 5 - 'AtomTimePicker.js' */        base: baseType,
/*Line 6 - 'AtomTimePicker.js' */        properties: {
/*Line 7 - 'AtomTimePicker.js' */            displayLabel: "9:00 AM"
/*Line 8 - 'AtomTimePicker.js' */        },
/*Line 9 - 'AtomTimePicker.js' */        methods: {
/*Line 10 - 'AtomTimePicker.js' */            init: function () {
/*Line 11 - 'AtomTimePicker.js' */                this._autoOpen = true;
/*Line 12 - 'AtomTimePicker.js' */                var items = [];
/*Line 13 - 'AtomTimePicker.js' */                for (var i = 0; i <= 23; i++) {
/*Line 14 - 'AtomTimePicker.js' */                    var a = "AM";
/*Line 15 - 'AtomTimePicker.js' */                    var n = i;
/*Line 16 - 'AtomTimePicker.js' */                    if (i > 11) {
/*Line 17 - 'AtomTimePicker.js' */                        a = "PM";
/*Line 18 - 'AtomTimePicker.js' */                        if (i > 12) {
/*Line 19 - 'AtomTimePicker.js' */                            n = i - 12;
/*Line 20 - 'AtomTimePicker.js' */                        }
/*Line 21 - 'AtomTimePicker.js' */                    }
/*Line 22 - 'AtomTimePicker.js' */                    var item = n + ":00 " + a;
/*Line 23 - 'AtomTimePicker.js' */                    items.push({ label: item, value: item });
/*Line 24 - 'AtomTimePicker.js' */                    item = n + ":30 " + a;
/*Line 25 - 'AtomTimePicker.js' */                    items.push({ label: item, value: item });
/*Line 26 - 'AtomTimePicker.js' */                }
/*Line 27 - 'AtomTimePicker.js' */                this._items = items;
/*Line 28 - 'AtomTimePicker.js' */                baseType.init.call(this);
/*Line 29 - 'AtomTimePicker.js' */            }
/*Line 30 - 'AtomTimePicker.js' */        }
/*Line 31 - 'AtomTimePicker.js' */    });
/*Line 32 - 'AtomTimePicker.js' */})(window, WebAtoms.AtomAutoCompleteBox.prototype);
/*Line 0 - 'AtomUploadButton.js' */

/*Line 2 - 'AtomUploadButton.js' */(function (baseType) {
/*Line 3 - 'AtomUploadButton.js' */    return classCreatorEx({
/*Line 4 - 'AtomUploadButton.js' */        name: "WebAtoms.AtomUploadButton",
/*Line 5 - 'AtomUploadButton.js' */        base: baseType,
/*Line 6 - 'AtomUploadButton.js' */        start: function (e) {
/*Line 7 - 'AtomUploadButton.js' */            if (/input/gi.test(e.nodeName) && /file/gi.test($(e).attr("type"))) {
/*Line 8 - 'AtomUploadButton.js' */                this._filePresenter = e;
/*Line 9 - 'AtomUploadButton.js' */                return;
/*Line 10 - 'AtomUploadButton.js' */            }

/*Line 12 - 'AtomUploadButton.js' */            this._filePresenter = document.createElement("input");
/*Line 13 - 'AtomUploadButton.js' */            $(this._filePresenter).attr("type", "file");
/*Line 14 - 'AtomUploadButton.js' */            $(this._filePresenter).css("left", "-500px");
/*Line 15 - 'AtomUploadButton.js' */            $(this._filePresenter).css("position", "absolute");
/*Line 16 - 'AtomUploadButton.js' */            $(this._filePresenter).css("top", "-0px");
/*Line 17 - 'AtomUploadButton.js' */            document.body.appendChild(this._filePresenter);
/*Line 18 - 'AtomUploadButton.js' */        },
/*Line 19 - 'AtomUploadButton.js' */        properties: {
/*Line 20 - 'AtomUploadButton.js' */            fileTypes: undefined,
/*Line 21 - 'AtomUploadButton.js' */            accept: "*/*",
/*Line 22 - 'AtomUploadButton.js' */            capture: "",
/*Line 23 - 'AtomUploadButton.js' */            progress: 0
/*Line 24 - 'AtomUploadButton.js' */        },
/*Line 25 - 'AtomUploadButton.js' */        methods: {
/*Line 26 - 'AtomUploadButton.js' */            set_accept: function (v) {
/*Line 27 - 'AtomUploadButton.js' */                this._accept = v;
/*Line 28 - 'AtomUploadButton.js' */                if (v) {
/*Line 29 - 'AtomUploadButton.js' */                    if (this._filePresenter) {
/*Line 30 - 'AtomUploadButton.js' */                        $(this._filePresenter).attr("accept", v);
/*Line 31 - 'AtomUploadButton.js' */                    }
/*Line 32 - 'AtomUploadButton.js' */                }
/*Line 33 - 'AtomUploadButton.js' */            },

/*Line 35 - 'AtomUploadButton.js' */            set_capture: function (v) {
/*Line 36 - 'AtomUploadButton.js' */                this._capture = v;
/*Line 37 - 'AtomUploadButton.js' */                if (v) {
/*Line 38 - 'AtomUploadButton.js' */                    if (this._filePresenter) {
/*Line 39 - 'AtomUploadButton.js' */                        $(this._filePresenter).attr("capture", v);
/*Line 40 - 'AtomUploadButton.js' */                    }
/*Line 41 - 'AtomUploadButton.js' */                }
/*Line 42 - 'AtomUploadButton.js' */            },
/*Line 43 - 'AtomUploadButton.js' */            onClickHandler: function (e) {

/*Line 45 - 'AtomUploadButton.js' */                if (this._confirm) {
/*Line 46 - 'AtomUploadButton.js' */                    if (!confirm(this._confirmMessage))
/*Line 47 - 'AtomUploadButton.js' */                        return;
/*Line 48 - 'AtomUploadButton.js' */                }

/*Line 50 - 'AtomUploadButton.js' */                if (!this._postUrl) {
/*Line 51 - 'AtomUploadButton.js' */                    //WebAtoms.AtomUploadButton.callBaseMethod(this, "onClickHandler", [e]);
/*Line 52 - 'AtomUploadButton.js' */                    return;
/*Line 53 - 'AtomUploadButton.js' */                }

/*Line 55 - 'AtomUploadButton.js' */                if (this._filePresenter == this._element) {
/*Line 56 - 'AtomUploadButton.js' */                    return;
/*Line 57 - 'AtomUploadButton.js' */                }

/*Line 59 - 'AtomUploadButton.js' */                $(this._filePresenter).trigger("click");
/*Line 60 - 'AtomUploadButton.js' */                AtomUI.cancelEvent(e);
/*Line 61 - 'AtomUploadButton.js' */            },

/*Line 63 - 'AtomUploadButton.js' */            onFileSelected: function () {
/*Line 64 - 'AtomUploadButton.js' */                var data = this.get_postData();

/*Line 66 - 'AtomUploadButton.js' */                if (data === null || data === undefined)
/*Line 67 - 'AtomUploadButton.js' */                    return;

/*Line 69 - 'AtomUploadButton.js' */                var m = this._mergeData;
/*Line 70 - 'AtomUploadButton.js' */                if (m) {
/*Line 71 - 'AtomUploadButton.js' */                    for (var i in m) {
/*Line 72 - 'AtomUploadButton.js' */                        data[i] = m[i];
/*Line 73 - 'AtomUploadButton.js' */                    }
/*Line 74 - 'AtomUploadButton.js' */                }
/*Line 75 - 'AtomUploadButton.js' */                var xhr = this._xhr;
/*Line 76 - 'AtomUploadButton.js' */                if (!xhr) {
/*Line 77 - 'AtomUploadButton.js' */                    xhr = new XMLHttpRequest();
/*Line 78 - 'AtomUploadButton.js' */                    var upload = xhr.upload;
/*Line 79 - 'AtomUploadButton.js' */                    try {
/*Line 80 - 'AtomUploadButton.js' */                        xhr.timeout = 3600000;
/*Line 81 - 'AtomUploadButton.js' */                    } catch (e) {
/*Line 82 - 'AtomUploadButton.js' */                        // IE 10 has some issue with this code..
/*Line 83 - 'AtomUploadButton.js' */                    }

/*Line 85 - 'AtomUploadButton.js' */                    this.bindEvent(upload, "progress", "onProgress");
/*Line 86 - 'AtomUploadButton.js' */                    this.bindEvent(upload, "timeout", "onError");
/*Line 87 - 'AtomUploadButton.js' */                    this.bindEvent(upload, "error", "onError");
/*Line 88 - 'AtomUploadButton.js' */                    this.bindEvent(xhr, "load", "onComplete");
/*Line 89 - 'AtomUploadButton.js' */                    this.bindEvent(xhr, "error", "onError");
/*Line 90 - 'AtomUploadButton.js' */                    this.bindEvent(xhr, "timeout", "onError");
/*Line 91 - 'AtomUploadButton.js' */                    this._xhr = xhr;
/*Line 92 - 'AtomUploadButton.js' */                }

/*Line 94 - 'AtomUploadButton.js' */                var fd = new FormData();

/*Line 96 - 'AtomUploadButton.js' */                var ae = new AtomEnumerator(this._filePresenter.files);
/*Line 97 - 'AtomUploadButton.js' */                while (ae.next()) {
/*Line 98 - 'AtomUploadButton.js' */                    fd.append("file" + ae.currentIndex(), ae.current());
/*Line 99 - 'AtomUploadButton.js' */                }

/*Line 101 - 'AtomUploadButton.js' */                fd.append("formModel", JSON.stringify(AtomBinder.getClone(data)));

/*Line 103 - 'AtomUploadButton.js' */                xhr.open("POST", this._postUrl);
/*Line 104 - 'AtomUploadButton.js' */                xhr.send(fd);

/*Line 106 - 'AtomUploadButton.js' */                atomApplication.setBusy(true, "Uploading...");
/*Line 107 - 'AtomUploadButton.js' */            },

/*Line 109 - 'AtomUploadButton.js' */            set_progress: function (v) {
/*Line 110 - 'AtomUploadButton.js' */                this._progress = v;
/*Line 111 - 'AtomUploadButton.js' */                if (v) {
/*Line 112 - 'AtomUploadButton.js' */                    AtomBinder.setValue(atomApplication, "progress", v);
/*Line 113 - 'AtomUploadButton.js' */                }
/*Line 114 - 'AtomUploadButton.js' */            },

/*Line 116 - 'AtomUploadButton.js' */            onError: function (evt) {
/*Line 117 - 'AtomUploadButton.js' */                atomApplication.setBusy(false, "Uploading...");
/*Line 118 - 'AtomUploadButton.js' */                this.unbindEvent(this._xhr);
/*Line 119 - 'AtomUploadButton.js' */                this._xhr = null;
/*Line 120 - 'AtomUploadButton.js' */                this._lastError = evt;
/*Line 121 - 'AtomUploadButton.js' */                Atom.alert('Upload failed');
/*Line 122 - 'AtomUploadButton.js' */            },
/*Line 123 - 'AtomUploadButton.js' */            onProgress: function (evt) {
/*Line 124 - 'AtomUploadButton.js' */                //evt = evt.originalEvent;
/*Line 125 - 'AtomUploadButton.js' */                if (evt.lengthComputable) {
/*Line 126 - 'AtomUploadButton.js' */                    var percentComplete = Math.round(evt.loaded * 100 / evt.total);
/*Line 127 - 'AtomUploadButton.js' */                    AtomBinder.setValue(this, "progress", percentComplete);
/*Line 128 - 'AtomUploadButton.js' */                }
/*Line 129 - 'AtomUploadButton.js' */            },
/*Line 130 - 'AtomUploadButton.js' */            onComplete: function (evt) {
/*Line 131 - 'AtomUploadButton.js' */                atomApplication.setBusy(false, "Uploading...");
/*Line 132 - 'AtomUploadButton.js' */                var result = null;
/*Line 133 - 'AtomUploadButton.js' */                if (evt.target) {
/*Line 134 - 'AtomUploadButton.js' */                    if (evt.target.status == 200) {
/*Line 135 - 'AtomUploadButton.js' */                        this._value = evt.target.responseText;
/*Line 136 - 'AtomUploadButton.js' */                    } else {
/*Line 137 - 'AtomUploadButton.js' */                        Atom.alert(evt.target.statusText);
/*Line 138 - 'AtomUploadButton.js' */                        return;
/*Line 139 - 'AtomUploadButton.js' */                    }
/*Line 140 - 'AtomUploadButton.js' */                } else {
/*Line 141 - 'AtomUploadButton.js' */                    this._value = evt.result;
/*Line 142 - 'AtomUploadButton.js' */                }

/*Line 144 - 'AtomUploadButton.js' */                this.unbindEvent(this._xhr);
/*Line 145 - 'AtomUploadButton.js' */                this._xhr = null;

/*Line 147 - 'AtomUploadButton.js' */                AtomBinder.refreshValue(this, "value");

/*Line 149 - 'AtomUploadButton.js' */                this.invokeAction(this._next, evt);
/*Line 150 - 'AtomUploadButton.js' */            },

/*Line 152 - 'AtomUploadButton.js' */            init: function () {
/*Line 153 - 'AtomUploadButton.js' */                baseType.init.call(this);

/*Line 155 - 'AtomUploadButton.js' */                var f = this._filePresenter;

/*Line 157 - 'AtomUploadButton.js' */                this.bindEvent(f, "change", "onFileSelected");

/*Line 159 - 'AtomUploadButton.js' */            }
/*Line 160 - 'AtomUploadButton.js' */        }
/*Line 161 - 'AtomUploadButton.js' */    });
/*Line 162 - 'AtomUploadButton.js' */})(WebAtoms.AtomPostButton.prototype);
/*Line 0 - 'AtomViewBox.js' */

/*Line 2 - 'AtomViewBox.js' */(function (WebAtoms, baseType) {
/*Line 3 - 'AtomViewBox.js' */    return classCreatorEx({
/*Line 4 - 'AtomViewBox.js' */        name: "WebAtoms.AtomViewBox",
/*Line 5 - 'AtomViewBox.js' */        base: baseType,
/*Line 6 - 'AtomViewBox.js' */        start: function () {
/*Line 7 - 'AtomViewBox.js' */            this._layout = WebAtoms.AtomViewBoxLayout.defaultInstance;
/*Line 8 - 'AtomViewBox.js' */        },
/*Line 9 - 'AtomViewBox.js' */        methods: {

/*Line 11 - 'AtomViewBox.js' */        }
/*Line 12 - 'AtomViewBox.js' */    });
/*Line 13 - 'AtomViewBox.js' */})(WebAtoms, WebAtoms.AtomControl.prototype);

/*Line 0 - 'AtomViewStack.js' */

/*Line 2 - 'AtomViewStack.js' */var AtomAnimations = {
/*Line 3 - 'AtomViewStack.js' */    swapLeft: function (elements, width, caller, queue) {
/*Line 4 - 'AtomViewStack.js' */        var first = elements[0];
/*Line 5 - 'AtomViewStack.js' */        var last = elements[1];
/*Line 6 - 'AtomViewStack.js' */        last.style.left = width + "px";
/*Line 7 - 'AtomViewStack.js' */        last.style.visibility = 'inherit';
/*Line 8 - 'AtomViewStack.js' */        last.style.zIndex = 0;
/*Line 9 - 'AtomViewStack.js' */        if (caller) {
/*Line 10 - 'AtomViewStack.js' */            caller._animating = true;
/*Line 11 - 'AtomViewStack.js' */        }
/*Line 12 - 'AtomViewStack.js' */        $(elements).animate(
/*Line 13 - 'AtomViewStack.js' */            {
/*Line 14 - 'AtomViewStack.js' */                left: '-=' + width
/*Line 15 - 'AtomViewStack.js' */            },
/*Line 16 - 'AtomViewStack.js' */            {
/*Line 17 - 'AtomViewStack.js' */                easing: 'swing',
/*Line 18 - 'AtomViewStack.js' */                queue: false,
/*Line 19 - 'AtomViewStack.js' */                complete: function () {
/*Line 20 - 'AtomViewStack.js' */                    first.style.visibility = 'hidden';
/*Line 21 - 'AtomViewStack.js' */                    first.style.zIndex = -5;
/*Line 22 - 'AtomViewStack.js' */                    if (caller) {
/*Line 23 - 'AtomViewStack.js' */                        caller._animating = false;
/*Line 24 - 'AtomViewStack.js' */                    }
/*Line 25 - 'AtomViewStack.js' */                    if (queue) {
/*Line 26 - 'AtomViewStack.js' */                        queue.start();
/*Line 27 - 'AtomViewStack.js' */                    }
/*Line 28 - 'AtomViewStack.js' */                }
/*Line 29 - 'AtomViewStack.js' */            }
/*Line 30 - 'AtomViewStack.js' */        );
/*Line 31 - 'AtomViewStack.js' */    },
/*Line 32 - 'AtomViewStack.js' */    swapRight: function (elements, width, caller, queue) {
/*Line 33 - 'AtomViewStack.js' */        var first = elements[0];
/*Line 34 - 'AtomViewStack.js' */        var last = elements[1];
/*Line 35 - 'AtomViewStack.js' */        last.style.left = (-width) + "px";
/*Line 36 - 'AtomViewStack.js' */        last.style.visibility = 'inherit';
/*Line 37 - 'AtomViewStack.js' */        last.style.zIndex = 0;
/*Line 38 - 'AtomViewStack.js' */        if (caller) {
/*Line 39 - 'AtomViewStack.js' */            caller._animating = true;
/*Line 40 - 'AtomViewStack.js' */        }
/*Line 41 - 'AtomViewStack.js' */        $(elements).animate(
/*Line 42 - 'AtomViewStack.js' */        {
/*Line 43 - 'AtomViewStack.js' */            left: '+=' + width
/*Line 44 - 'AtomViewStack.js' */        },
/*Line 45 - 'AtomViewStack.js' */        {
/*Line 46 - 'AtomViewStack.js' */            easing: 'swing',
/*Line 47 - 'AtomViewStack.js' */            queue: false,
/*Line 48 - 'AtomViewStack.js' */            complete: function () {
/*Line 49 - 'AtomViewStack.js' */                first.style.visibility = 'hidden';
/*Line 50 - 'AtomViewStack.js' */                first.style.zIndex = -5;
/*Line 51 - 'AtomViewStack.js' */                if (caller) {
/*Line 52 - 'AtomViewStack.js' */                    caller._animating = false;
/*Line 53 - 'AtomViewStack.js' */                }
/*Line 54 - 'AtomViewStack.js' */                if (queue) {
/*Line 55 - 'AtomViewStack.js' */                    queue.start();
/*Line 56 - 'AtomViewStack.js' */                }
/*Line 57 - 'AtomViewStack.js' */            }
/*Line 58 - 'AtomViewStack.js' */        }
/*Line 59 - 'AtomViewStack.js' */        );
/*Line 60 - 'AtomViewStack.js' */    },
/*Line 61 - 'AtomViewStack.js' */    swapUp: function (elements, width, caller, queue) {
/*Line 62 - 'AtomViewStack.js' */        var first = elements[0];
/*Line 63 - 'AtomViewStack.js' */        var last = elements[1];
/*Line 64 - 'AtomViewStack.js' */        last.style.top = width + "px";
/*Line 65 - 'AtomViewStack.js' */        last.style.visibility = 'inherit';
/*Line 66 - 'AtomViewStack.js' */        last.style.zIndex = 0;
/*Line 67 - 'AtomViewStack.js' */        if (caller) {
/*Line 68 - 'AtomViewStack.js' */            caller._animating = true;
/*Line 69 - 'AtomViewStack.js' */        }
/*Line 70 - 'AtomViewStack.js' */        $(elements).animate(
/*Line 71 - 'AtomViewStack.js' */                {
/*Line 72 - 'AtomViewStack.js' */                    top: '-=' + width
/*Line 73 - 'AtomViewStack.js' */                },
/*Line 74 - 'AtomViewStack.js' */                {
/*Line 75 - 'AtomViewStack.js' */                    easing: 'swing',
/*Line 76 - 'AtomViewStack.js' */                    queue: false,
/*Line 77 - 'AtomViewStack.js' */                    complete: function () {
/*Line 78 - 'AtomViewStack.js' */                        first.style.visibility = 'hidden';
/*Line 79 - 'AtomViewStack.js' */                        first.style.zIndex = -5;
/*Line 80 - 'AtomViewStack.js' */                        if (caller) {
/*Line 81 - 'AtomViewStack.js' */                            caller._animating = false;
/*Line 82 - 'AtomViewStack.js' */                        }
/*Line 83 - 'AtomViewStack.js' */                        if (queue) {
/*Line 84 - 'AtomViewStack.js' */                            queue.start();
/*Line 85 - 'AtomViewStack.js' */                        }
/*Line 86 - 'AtomViewStack.js' */                    }
/*Line 87 - 'AtomViewStack.js' */                }
/*Line 88 - 'AtomViewStack.js' */            );
/*Line 89 - 'AtomViewStack.js' */    },
/*Line 90 - 'AtomViewStack.js' */    swapDown: function (elements, width, caller, queue) {
/*Line 91 - 'AtomViewStack.js' */        var first = elements[0];
/*Line 92 - 'AtomViewStack.js' */        var last = elements[1];
/*Line 93 - 'AtomViewStack.js' */        last.style.top = (-width) + "px";
/*Line 94 - 'AtomViewStack.js' */        last.style.visibility = 'inherit';
/*Line 95 - 'AtomViewStack.js' */        last.style.zIndex = 0;
/*Line 96 - 'AtomViewStack.js' */        if (caller) {
/*Line 97 - 'AtomViewStack.js' */            caller._animating = true;
/*Line 98 - 'AtomViewStack.js' */        }
/*Line 99 - 'AtomViewStack.js' */        $(elements).animate(
/*Line 100 - 'AtomViewStack.js' */            {
/*Line 101 - 'AtomViewStack.js' */                top: '+=' + width
/*Line 102 - 'AtomViewStack.js' */            },
/*Line 103 - 'AtomViewStack.js' */            {
/*Line 104 - 'AtomViewStack.js' */                easing: 'swing',
/*Line 105 - 'AtomViewStack.js' */                queue: false,
/*Line 106 - 'AtomViewStack.js' */                complete: function () {
/*Line 107 - 'AtomViewStack.js' */                    first.style.visibility = 'hidden';
/*Line 108 - 'AtomViewStack.js' */                    first.style.zIndex = -5;
/*Line 109 - 'AtomViewStack.js' */                    if (caller) {
/*Line 110 - 'AtomViewStack.js' */                        caller._animating = false;
/*Line 111 - 'AtomViewStack.js' */                    }
/*Line 112 - 'AtomViewStack.js' */                    if (queue) {
/*Line 113 - 'AtomViewStack.js' */                        queue.start();
/*Line 114 - 'AtomViewStack.js' */                    }
/*Line 115 - 'AtomViewStack.js' */                }
/*Line 116 - 'AtomViewStack.js' */            }
/*Line 117 - 'AtomViewStack.js' */            );
/*Line 118 - 'AtomViewStack.js' */    }
/*Line 119 - 'AtomViewStack.js' */};

/*Line 121 - 'AtomViewStack.js' */window.AtomAnimations = AtomAnimations;

/*Line 123 - 'AtomViewStack.js' */(function (window, baseType) {

/*Line 125 - 'AtomViewStack.js' */    return classCreatorEx({
/*Line 126 - 'AtomViewStack.js' */        name: "WebAtoms.AtomViewStack",
/*Line 127 - 'AtomViewStack.js' */        base: baseType,
/*Line 128 - 'AtomViewStack.js' */        start: function () {
/*Line 129 - 'AtomViewStack.js' */            this._source = null;
/*Line 130 - 'AtomViewStack.js' */            this._indexChangedHandler = null;
/*Line 131 - 'AtomViewStack.js' */            this._swipeDirection = 'left-right';
/*Line 132 - 'AtomViewStack.js' */        },
/*Line 133 - 'AtomViewStack.js' */        properties: {
/*Line 134 - 'AtomViewStack.js' */            swipeDirection: 'left-right'
/*Line 135 - 'AtomViewStack.js' */        },
/*Line 136 - 'AtomViewStack.js' */        methods: {
/*Line 137 - 'AtomViewStack.js' */            bringSelectionIntoView: function () {
/*Line 138 - 'AtomViewStack.js' */            },
/*Line 139 - 'AtomViewStack.js' */            onUpdateUI: function () {
/*Line 140 - 'AtomViewStack.js' */                var element = this.get_element();

/*Line 142 - 'AtomViewStack.js' */                if (!element.parentNode.atomControl) {
/*Line 143 - 'AtomViewStack.js' */                    // try occupying full height...
/*Line 144 - 'AtomViewStack.js' */                    var height = $(element.parentNode).height();
/*Line 145 - 'AtomViewStack.js' */                    var width = $(element.parentNode).width();
/*Line 146 - 'AtomViewStack.js' */                    element.style.width = width + "px";
/*Line 147 - 'AtomViewStack.js' */                    element.style.height = height + "px";
/*Line 148 - 'AtomViewStack.js' */                }

/*Line 150 - 'AtomViewStack.js' */                var childEn = new ChildEnumerator(this._element);

/*Line 152 - 'AtomViewStack.js' */                var selectedChild = this.get_selectedChild();

/*Line 154 - 'AtomViewStack.js' */                var oldElement;
/*Line 155 - 'AtomViewStack.js' */                var oldIndex = -1;
/*Line 156 - 'AtomViewStack.js' */                var newElement;
/*Line 157 - 'AtomViewStack.js' */                var newIndex = -1;

/*Line 159 - 'AtomViewStack.js' */                var animate = this._swipeDirection != "none" && this._lastSelectedChild && selectedChild != this._lastSelectedChild;

/*Line 161 - 'AtomViewStack.js' */                var s = $(element).css("visibility");
/*Line 162 - 'AtomViewStack.js' */                animate = animate && s == "visible";

/*Line 164 - 'AtomViewStack.js' */                var queue = new WebAtoms.AtomDispatcher();
/*Line 165 - 'AtomViewStack.js' */                queue.pause();

/*Line 167 - 'AtomViewStack.js' */                var i = -1;

/*Line 169 - 'AtomViewStack.js' */                while (childEn.next()) {
/*Line 170 - 'AtomViewStack.js' */                    i = i + 1;
/*Line 171 - 'AtomViewStack.js' */                    var item = childEn.current();


/*Line 174 - 'AtomViewStack.js' */                    if (item == selectedChild) {

/*Line 176 - 'AtomViewStack.js' */                        AtomUI.setItemRect(item, { width: $(element).width(), height: $(element).height() });

/*Line 178 - 'AtomViewStack.js' */                        if (animate) {
/*Line 179 - 'AtomViewStack.js' */                            newElement = item;
/*Line 180 - 'AtomViewStack.js' */                            newIndex = i;
/*Line 181 - 'AtomViewStack.js' */                        } else {
/*Line 182 - 'AtomViewStack.js' */                            if (!this._animating) {
/*Line 183 - 'AtomViewStack.js' */                                item.style.visibility = "inherit";
/*Line 184 - 'AtomViewStack.js' */                                item.style.left = "0px";
/*Line 185 - 'AtomViewStack.js' */                                item.style.top = "0px";
/*Line 186 - 'AtomViewStack.js' */                                item.style.zIndex = 0;
/*Line 187 - 'AtomViewStack.js' */                            }
/*Line 188 - 'AtomViewStack.js' */                        }

/*Line 190 - 'AtomViewStack.js' */                        this._lastSelectedChild = item;

/*Line 192 - 'AtomViewStack.js' */                        //item.style.width = element.style.width;
/*Line 193 - 'AtomViewStack.js' */                        //item.style.height = element.style.height;

/*Line 195 - 'AtomViewStack.js' */                        //AtomUI.setItemRect(item, { width: parseInt(element.style.width), height: parseInt(element.style.height) });

/*Line 197 - 'AtomViewStack.js' */                        {
/*Line 198 - 'AtomViewStack.js' */                            var x = item;
/*Line 199 - 'AtomViewStack.js' */                            queue.callLater(function () {

/*Line 201 - 'AtomViewStack.js' */                                if (x.atomControl) {
/*Line 202 - 'AtomViewStack.js' */                                    x.atomControl.updateUI();
/*Line 203 - 'AtomViewStack.js' */                                }
/*Line 204 - 'AtomViewStack.js' */                            });
/*Line 205 - 'AtomViewStack.js' */                        }

/*Line 207 - 'AtomViewStack.js' */                    } else {


/*Line 210 - 'AtomViewStack.js' */                        if (item.style.visibility != "hidden") {
/*Line 211 - 'AtomViewStack.js' */                            if (animate) {
/*Line 212 - 'AtomViewStack.js' */                                oldElement = item;
/*Line 213 - 'AtomViewStack.js' */                                oldIndex = i;
/*Line 214 - 'AtomViewStack.js' */                            } else {
/*Line 215 - 'AtomViewStack.js' */                                if (!this._animating) {
/*Line 216 - 'AtomViewStack.js' */                                    item.style.visibility = "hidden";
/*Line 217 - 'AtomViewStack.js' */                                    item.style.zIndex = -5;
/*Line 218 - 'AtomViewStack.js' */                                }
/*Line 219 - 'AtomViewStack.js' */                            }
/*Line 220 - 'AtomViewStack.js' */                        }
/*Line 221 - 'AtomViewStack.js' */                    }
/*Line 222 - 'AtomViewStack.js' */                }

/*Line 224 - 'AtomViewStack.js' */                if (animate) {
/*Line 225 - 'AtomViewStack.js' */                    //var width = parseInt(element.style.width, 10);
/*Line 226 - 'AtomViewStack.js' */                    //var height = parseInt(element.style.width, 10);
/*Line 227 - 'AtomViewStack.js' */                    var width = $(element).width();
/*Line 228 - 'AtomViewStack.js' */                    var height = $(element).height();
/*Line 229 - 'AtomViewStack.js' */                    if (this._swipeDirection == 'up-down') {
/*Line 230 - 'AtomViewStack.js' */                        if (newIndex > oldIndex) {
/*Line 231 - 'AtomViewStack.js' */                            AtomAnimations.swapUp([oldElement, newElement], height, this, queue);
/*Line 232 - 'AtomViewStack.js' */                        } else {
/*Line 233 - 'AtomViewStack.js' */                            AtomAnimations.swapDown([oldElement, newElement], height, this, queue);
/*Line 234 - 'AtomViewStack.js' */                        }
/*Line 235 - 'AtomViewStack.js' */                    } else {
/*Line 236 - 'AtomViewStack.js' */                        if (newIndex > oldIndex) {
/*Line 237 - 'AtomViewStack.js' */                            AtomAnimations.swapLeft([oldElement, newElement], width, this, queue);
/*Line 238 - 'AtomViewStack.js' */                        } else {
/*Line 239 - 'AtomViewStack.js' */                            AtomAnimations.swapRight([oldElement, newElement], width, this, queue);
/*Line 240 - 'AtomViewStack.js' */                        }
/*Line 241 - 'AtomViewStack.js' */                    }
/*Line 242 - 'AtomViewStack.js' */                } else {
/*Line 243 - 'AtomViewStack.js' */                    queue.start();
/*Line 244 - 'AtomViewStack.js' */                }

/*Line 246 - 'AtomViewStack.js' */            },
/*Line 247 - 'AtomViewStack.js' */            init: function () {
/*Line 248 - 'AtomViewStack.js' */                var element = this.get_element();
/*Line 249 - 'AtomViewStack.js' */                $(element).addClass("atom-view-stack");
/*Line 250 - 'AtomViewStack.js' */                baseType.init.call(this);
/*Line 251 - 'AtomViewStack.js' */                //this.updateUI();
/*Line 252 - 'AtomViewStack.js' */            }
/*Line 253 - 'AtomViewStack.js' */        }
/*Line 254 - 'AtomViewStack.js' */    });
/*Line 255 - 'AtomViewStack.js' */})(window, WebAtoms.AtomItemsControl.prototype);

/*Line 0 - 'AtomWizard.js' */

/*Line 2 - 'AtomWizard.js' */(function (window, baseType) {
/*Line 3 - 'AtomWizard.js' */    return classCreatorEx({
/*Line 4 - 'AtomWizard.js' */        name: "WebAtoms.AtomWizard",
/*Line 5 - 'AtomWizard.js' */        base: baseType,
/*Line 6 - 'AtomWizard.js' */        start: function () {
/*Line 7 - 'AtomWizard.js' */            this._presenters = ["viewPresenter"];
/*Line 8 - 'AtomWizard.js' */        },
/*Line 9 - 'AtomWizard.js' */        properties: {
/*Line 10 - 'AtomWizard.js' */            currentStep: 0,
/*Line 11 - 'AtomWizard.js' */            nextLabel: "Next",
/*Line 12 - 'AtomWizard.js' */            nextClass: "",
/*Line 13 - 'AtomWizard.js' */            buttons: null,
/*Line 14 - 'AtomWizard.js' */            prevLabel: "Back",
/*Line 15 - 'AtomWizard.js' */            finishLabel: "Finish",
/*Line 16 - 'AtomWizard.js' */            canMoveBack: true,
/*Line 17 - 'AtomWizard.js' */            canMoveNext: true,
/*Line 18 - 'AtomWizard.js' */            steps: 0,
/*Line 19 - 'AtomWizard.js' */            currentStep: null,
/*Line 20 - 'AtomWizard.js' */            isLastStep: false
/*Line 21 - 'AtomWizard.js' */        },
/*Line 22 - 'AtomWizard.js' */        methods: {
/*Line 23 - 'AtomWizard.js' */            set_currentStep: function (v) {
/*Line 24 - 'AtomWizard.js' */                this._currentStep = v;
/*Line 25 - 'AtomWizard.js' */                var a = this._buttons;
/*Line 26 - 'AtomWizard.js' */                if (a && a.length) {
/*Line 27 - 'AtomWizard.js' */                    var item = a[v];
/*Line 28 - 'AtomWizard.js' */                    AtomBinder.setValue(this, "nextLabel", item.label);
/*Line 29 - 'AtomWizard.js' */                    AtomBinder.setValue(this, "nextClass", item.styleClass);
/*Line 30 - 'AtomWizard.js' */                }
/*Line 31 - 'AtomWizard.js' */                AtomBinder.refreshValue(this, "isLastStep");
/*Line 32 - 'AtomWizard.js' */            },

/*Line 34 - 'AtomWizard.js' */            get_isLastStep: function () {
/*Line 35 - 'AtomWizard.js' */                return this._currentStep == (this._steps - 1);
/*Line 36 - 'AtomWizard.js' */            },



/*Line 40 - 'AtomWizard.js' */            init: function () {
/*Line 41 - 'AtomWizard.js' */                $(this._element).addClass('atom-wizard');

/*Line 43 - 'AtomWizard.js' */                baseType.init.call(this);

/*Line 45 - 'AtomWizard.js' */                var _this = this;


/*Line 48 - 'AtomWizard.js' */                this.goNextCommand = function (scope, sender, evt) {
/*Line 49 - 'AtomWizard.js' */                    if (_this.get_isLastStep()) {
/*Line 50 - 'AtomWizard.js' */                        _this.invokeAction(_this._next, evt);
/*Line 51 - 'AtomWizard.js' */                        AtomBinder.setValue(_this, "canMoveBack", false);
/*Line 52 - 'AtomWizard.js' */                    } else {
/*Line 53 - 'AtomWizard.js' */                        AtomBinder.setValue(_this, "currentStep", _this._currentStep + 1);
/*Line 54 - 'AtomWizard.js' */                    }
/*Line 55 - 'AtomWizard.js' */                };

/*Line 57 - 'AtomWizard.js' */                this.goPrevCommand = function () {
/*Line 58 - 'AtomWizard.js' */                    AtomBinder.setValue(_this, "currentStep", _this._currentStep - 1);
/*Line 59 - 'AtomWizard.js' */                };

/*Line 61 - 'AtomWizard.js' */                this.resetCommand = function () {
/*Line 62 - 'AtomWizard.js' */                    AtomBinder.setValue(_this, "currentStep", 0);
/*Line 63 - 'AtomWizard.js' */                    AtomBinder.setValue(_this, "canMoveBack", true);
/*Line 64 - 'AtomWizard.js' */                };

/*Line 66 - 'AtomWizard.js' */                // create children...

/*Line 68 - 'AtomWizard.js' */                var vs = this._viewPresenter;

/*Line 70 - 'AtomWizard.js' */                var vt = this._viewTemplate;

/*Line 72 - 'AtomWizard.js' */                var i = 0;

/*Line 74 - 'AtomWizard.js' */                var ae = new ChildEnumerator(vt);
/*Line 75 - 'AtomWizard.js' */                while (ae.next()) {
/*Line 76 - 'AtomWizard.js' */                    i++;
/*Line 77 - 'AtomWizard.js' */                    var item = ae.current();
/*Line 78 - 'AtomWizard.js' */                    //$(vs).append(item);
/*Line 79 - 'AtomWizard.js' */                    vs.appendChild(item);
/*Line 80 - 'AtomWizard.js' */                    var type = $(item).attr("atom-type");
/*Line 81 - 'AtomWizard.js' */                    if (!type) {
/*Line 82 - 'AtomWizard.js' */                        type = "AtomViewBox";
/*Line 83 - 'AtomWizard.js' */                        $(item).attr("atom-type", type);
/*Line 84 - 'AtomWizard.js' */                    }

/*Line 86 - 'AtomWizard.js' */                    //var s = new AtomScope(this, this.get_scope(), atomApplication);

/*Line 88 - 'AtomWizard.js' */                    var ct = $(item).attr("atom-type") || WebAtoms.AtomControl;
/*Line 89 - 'AtomWizard.js' */                    var cc = AtomUI.createControl(item, ct);
/*Line 90 - 'AtomWizard.js' */                    cc.init();
/*Line 91 - 'AtomWizard.js' */                }
/*Line 92 - 'AtomWizard.js' */                AtomBinder.setValue(this, "steps", i);

/*Line 94 - 'AtomWizard.js' */                if (i) {
/*Line 95 - 'AtomWizard.js' */                    AtomBinder.setValue(this, "currentStep", 0);
/*Line 96 - 'AtomWizard.js' */                }

/*Line 98 - 'AtomWizard.js' */                this.nextCommand = function (scope, sender, evt) {
/*Line 99 - 'AtomWizard.js' */                    var child = vs.atomControl.get_selectedChild().atomControl;
/*Line 100 - 'AtomWizard.js' */                    if (child._next) {
/*Line 101 - 'AtomWizard.js' */                        child.invokeAction(child._next);
/*Line 102 - 'AtomWizard.js' */                        return;
/*Line 103 - 'AtomWizard.js' */                    } else {
/*Line 104 - 'AtomWizard.js' */                        _this.goNextCommand(scope, sender, evt);
/*Line 105 - 'AtomWizard.js' */                    }
/*Line 106 - 'AtomWizard.js' */                };

/*Line 108 - 'AtomWizard.js' */            }
/*Line 109 - 'AtomWizard.js' */        }
/*Line 110 - 'AtomWizard.js' */    });
/*Line 111 - 'AtomWizard.js' */})(window, WebAtoms.AtomDockPanel.prototype);

/*Line 0 - 'AtomYesNoControl.js' */

/*Line 2 - 'AtomYesNoControl.js' */(function (baseType) {
/*Line 3 - 'AtomYesNoControl.js' */    return classCreatorEx({
/*Line 4 - 'AtomYesNoControl.js' */        name: "WebAtoms.AtomYesNoControl",
/*Line 5 - 'AtomYesNoControl.js' */        base: baseType,
/*Line 6 - 'AtomYesNoControl.js' */        start: function () {
/*Line 7 - 'AtomYesNoControl.js' */            this._allowSelectFirst = false;
/*Line 8 - 'AtomYesNoControl.js' */            this._items = [
/*Line 9 - 'AtomYesNoControl.js' */                { label: "Yes", value: true },
/*Line 10 - 'AtomYesNoControl.js' */                { label: "No", value: false }
/*Line 11 - 'AtomYesNoControl.js' */            ];
/*Line 12 - 'AtomYesNoControl.js' */        },
/*Line 13 - 'AtomYesNoControl.js' */        methods: {
/*Line 14 - 'AtomYesNoControl.js' */            init: function () {
/*Line 15 - 'AtomYesNoControl.js' */                this._element.style.height = "26px";
/*Line 16 - 'AtomYesNoControl.js' */                baseType.init.call(this);
/*Line 17 - 'AtomYesNoControl.js' */            }
/*Line 18 - 'AtomYesNoControl.js' */        }
/*Line 19 - 'AtomYesNoControl.js' */    });
/*Line 20 - 'AtomYesNoControl.js' */})(WebAtoms.AtomToggleButtonBar.prototype);
/*Line 0 - 'AtomYesNoCustom.js' */

/*Line 2 - 'AtomYesNoCustom.js' */(function (window, baseType) {
/*Line 3 - 'AtomYesNoCustom.js' */    return classCreatorEx({
/*Line 4 - 'AtomYesNoCustom.js' */        name: "WebAtoms.AtomYesNoCustom",
/*Line 5 - 'AtomYesNoCustom.js' */        base: baseType,
/*Line 6 - 'AtomYesNoCustom.js' */        start: function () {
/*Line 7 - 'AtomYesNoCustom.js' */            this._presenters = ["yesNo", "input"];
/*Line 8 - 'AtomYesNoCustom.js' */            this._hasValue = false;
/*Line 9 - 'AtomYesNoCustom.js' */        },
/*Line 10 - 'AtomYesNoCustom.js' */        properties:{
/*Line 11 - 'AtomYesNoCustom.js' */            hasValue: false,
/*Line 12 - 'AtomYesNoCustom.js' */            placeholder: null
/*Line 13 - 'AtomYesNoCustom.js' */        },
/*Line 14 - 'AtomYesNoCustom.js' */        methods: {
/*Line 15 - 'AtomYesNoCustom.js' */            set_hasValue: function (v) {
/*Line 16 - 'AtomYesNoCustom.js' */                this._hasValue = v;
/*Line 17 - 'AtomYesNoCustom.js' */                if (!v) {
/*Line 18 - 'AtomYesNoCustom.js' */                    AtomBinder.setValue(this, "value", "");
/*Line 19 - 'AtomYesNoCustom.js' */                }
/*Line 20 - 'AtomYesNoCustom.js' */            },

/*Line 22 - 'AtomYesNoCustom.js' */            set_value: function (v) {
/*Line 23 - 'AtomYesNoCustom.js' */                this._value = v;
/*Line 24 - 'AtomYesNoCustom.js' */                AtomBinder.setValue(this, "hasValue", v ? true : false);
/*Line 25 - 'AtomYesNoCustom.js' */                if (!this._onUIChanged) {
/*Line 26 - 'AtomYesNoCustom.js' */                    $(this._input).val(v);
/*Line 27 - 'AtomYesNoCustom.js' */                }
/*Line 28 - 'AtomYesNoCustom.js' */            },
/*Line 29 - 'AtomYesNoCustom.js' */            onValueChange: function () {
/*Line 30 - 'AtomYesNoCustom.js' */                this._onUIChanged = true;
/*Line 31 - 'AtomYesNoCustom.js' */                var val = $(this._input).val();
/*Line 32 - 'AtomYesNoCustom.js' */                AtomBinder.setValue(this, "value", val);
/*Line 33 - 'AtomYesNoCustom.js' */                this._onUIChanged = false;
/*Line 34 - 'AtomYesNoCustom.js' */            },

/*Line 36 - 'AtomYesNoCustom.js' */            onUpdateUI: function () {
/*Line 37 - 'AtomYesNoCustom.js' */                $(this._input).addClass("atom-yes-no-custom-input");
/*Line 38 - 'AtomYesNoCustom.js' */                if (this._placeholder) {
/*Line 39 - 'AtomYesNoCustom.js' */                    $(this._input).attr(this._placeholder);
/*Line 40 - 'AtomYesNoCustom.js' */                    placeHolderFixer.refresh();
/*Line 41 - 'AtomYesNoCustom.js' */                }
/*Line 42 - 'AtomYesNoCustom.js' */            },

/*Line 44 - 'AtomYesNoCustom.js' */            init: function () {

/*Line 46 - 'AtomYesNoCustom.js' */                baseType.init.call(this);

/*Line 48 - 'AtomYesNoCustom.js' */                this._yesNo = this._yesNo.atomControl;

/*Line 50 - 'AtomYesNoCustom.js' */                var input = this._input;
/*Line 51 - 'AtomYesNoCustom.js' */                this.bindEvent(input, "change", "onValueChange");
/*Line 52 - 'AtomYesNoCustom.js' */                //this.bindEvent(this._yesNo, "selectionChanged", "onSelectionChanged");
/*Line 53 - 'AtomYesNoCustom.js' */            }
/*Line 54 - 'AtomYesNoCustom.js' */        }
/*Line 55 - 'AtomYesNoCustom.js' */    });
/*Line 56 - 'AtomYesNoCustom.js' */})(window, WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomSkinnedApplication.js' */

/*Line 2 - 'AtomSkinnedApplication.js' */(function (window, name, baseType) {
/*Line 3 - 'AtomSkinnedApplication.js' */    return classCreatorEx({
/*Line 4 - 'AtomSkinnedApplication.js' */        name: "WebAtoms.AtomSkinnedApplication",
/*Line 5 - 'AtomSkinnedApplication.js' */        base: baseType,
/*Line 6 - 'AtomSkinnedApplication.js' */        start:function () {
/*Line 7 - 'AtomSkinnedApplication.js' */            this._presenters = ["appPresenter"];
/*Line 8 - 'AtomSkinnedApplication.js' */        },
/*Line 9 - 'AtomSkinnedApplication.js' */        methods: {
/*Line 10 - 'AtomSkinnedApplication.js' */            setup: function () {

/*Line 12 - 'AtomSkinnedApplication.js' */                var e = this._element;

/*Line 14 - 'AtomSkinnedApplication.js' */                var skin = $(e).attr("atom-skin");
/*Line 15 - 'AtomSkinnedApplication.js' */                if (!skin)
/*Line 16 - 'AtomSkinnedApplication.js' */                    throw new Error("Skin is missing");

/*Line 18 - 'AtomSkinnedApplication.js' */                this._skinTemplate = e.innerHTML;
/*Line 19 - 'AtomSkinnedApplication.js' */                e.innerHTML = "";

/*Line 21 - 'AtomSkinnedApplication.js' */                var _this = this;

/*Line 23 - 'AtomSkinnedApplication.js' */                var a = AtomPromise.get(skin).then(
/*Line 24 - 'AtomSkinnedApplication.js' */                    function () {
/*Line 25 - 'AtomSkinnedApplication.js' */                        _this.skinLoaded(a);
/*Line 26 - 'AtomSkinnedApplication.js' */                    }
/*Line 27 - 'AtomSkinnedApplication.js' */                );
/*Line 28 - 'AtomSkinnedApplication.js' */                a.invoke();
/*Line 29 - 'AtomSkinnedApplication.js' */            },

/*Line 31 - 'AtomSkinnedApplication.js' */            skinLoaded: function (p) {
/*Line 32 - 'AtomSkinnedApplication.js' */                this._element.innerHTML = p.value();
/*Line 33 - 'AtomSkinnedApplication.js' */                baseType.setup.call(this);
/*Line 34 - 'AtomSkinnedApplication.js' */            },

/*Line 36 - 'AtomSkinnedApplication.js' */            createChildren: function () {

/*Line 38 - 'AtomSkinnedApplication.js' */                var s = this._skinTemplate;

/*Line 40 - 'AtomSkinnedApplication.js' */                this._appPresenter = $(this._element).find("[atom-presenter=appPresenter]").first()[0];

/*Line 42 - 'AtomSkinnedApplication.js' */                //$(this._appPresenter).replaceWith(s);

/*Line 44 - 'AtomSkinnedApplication.js' */                var t = this._element.innerHTML;

/*Line 46 - 'AtomSkinnedApplication.js' */                t = t.replace(this._appPresenter.innerHTML, s);

/*Line 48 - 'AtomSkinnedApplication.js' */                this._element.innerHTML = t;

/*Line 50 - 'AtomSkinnedApplication.js' */                base.createChildren.call(this);
/*Line 51 - 'AtomSkinnedApplication.js' */            }
/*Line 52 - 'AtomSkinnedApplication.js' */        }

/*Line 54 - 'AtomSkinnedApplication.js' */    });
/*Line 55 - 'AtomSkinnedApplication.js' */})(window, "WebAtoms.AtomSkinnedApplication", WebAtoms.AtomApplication.prototype);

/*Line 0 - 'AtomAutoPostForm.js' */

/*Line 2 - 'AtomAutoPostForm.js' */(function (window, baseType) {
/*Line 3 - 'AtomAutoPostForm.js' */    return classCreatorEx({
/*Line 4 - 'AtomAutoPostForm.js' */        name: "WebAtoms.AtomAutoPostForm",
/*Line 5 - 'AtomAutoPostForm.js' */        base: baseType,
/*Line 6 - 'AtomAutoPostForm.js' */        start: function () {
/*Line 7 - 'AtomAutoPostForm.js' */        },
/*Line 8 - 'AtomAutoPostForm.js' */        properties: {
/*Line 9 - 'AtomAutoPostForm.js' */            isBusy: false,
/*Line 10 - 'AtomAutoPostForm.js' */            postError: null
/*Line 11 - 'AtomAutoPostForm.js' */        },
/*Line 12 - 'AtomAutoPostForm.js' */        methods: {
/*Line 13 - 'AtomAutoPostForm.js' */            pushPost: function (n) {
/*Line 14 - 'AtomAutoPostForm.js' */                if (this._isBusy)
/*Line 15 - 'AtomAutoPostForm.js' */                    return;
/*Line 16 - 'AtomAutoPostForm.js' */                if (this._pushPostTimeout) {
/*Line 17 - 'AtomAutoPostForm.js' */                    clearTimeout(this._pushPostTimeout);
/*Line 18 - 'AtomAutoPostForm.js' */                }
/*Line 19 - 'AtomAutoPostForm.js' */                if (!n)
/*Line 20 - 'AtomAutoPostForm.js' */                    n = 1000;
/*Line 21 - 'AtomAutoPostForm.js' */                var _this = this;
/*Line 22 - 'AtomAutoPostForm.js' */                this._pushPostTimeout = setTimeout(function () {
/*Line 23 - 'AtomAutoPostForm.js' */                    WebAtoms.dispatcher.callLater(function () {
/*Line 24 - 'AtomAutoPostForm.js' */                        _this.onSubmit();
/*Line 25 - 'AtomAutoPostForm.js' */                    });
/*Line 26 - 'AtomAutoPostForm.js' */                }, n);
/*Line 27 - 'AtomAutoPostForm.js' */            },

/*Line 29 - 'AtomAutoPostForm.js' */            onSubmit: function () {

/*Line 31 - 'AtomAutoPostForm.js' */                this._pushPostTimeout = 0;

/*Line 33 - 'AtomAutoPostForm.js' */                // already submitted?
/*Line 34 - 'AtomAutoPostForm.js' */                if (this._isBusy)
/*Line 35 - 'AtomAutoPostForm.js' */                    return;

/*Line 37 - 'AtomAutoPostForm.js' */                // for all nested children...
/*Line 38 - 'AtomAutoPostForm.js' */                if (!this.isValid()) {
/*Line 39 - 'AtomAutoPostForm.js' */                    //alert("Invalid Form");
/*Line 40 - 'AtomAutoPostForm.js' */                    return;
/*Line 41 - 'AtomAutoPostForm.js' */                }

/*Line 43 - 'AtomAutoPostForm.js' */                var data = this.preparePostData();
/*Line 44 - 'AtomAutoPostForm.js' */                if (!data)
/*Line 45 - 'AtomAutoPostForm.js' */                    return;

/*Line 47 - 'AtomAutoPostForm.js' */                var str = JSON.stringify(AtomBinder.getClone(data));
/*Line 48 - 'AtomAutoPostForm.js' */                if (this._cachedData) {
/*Line 49 - 'AtomAutoPostForm.js' */                    if (str == this._cachedData)
/*Line 50 - 'AtomAutoPostForm.js' */                        return;
/*Line 51 - 'AtomAutoPostForm.js' */                }
/*Line 52 - 'AtomAutoPostForm.js' */                this._cachedData = str;

/*Line 54 - 'AtomAutoPostForm.js' */                var self = this;

/*Line 56 - 'AtomAutoPostForm.js' */                var url = AtomPromise.getUrl(this._postUrl);

/*Line 58 - 'AtomAutoPostForm.js' */                //data = AtomBinder.getClone(data);

/*Line 60 - 'AtomAutoPostForm.js' */                //this.invokeAjax(url, { type: "POST", data: data, success: self._success });
/*Line 61 - 'AtomAutoPostForm.js' */                var ap = AtomPromise.json(url, null, { type: "POST", data: data }).then(self._success);
/*Line 62 - 'AtomAutoPostForm.js' */                ap.failed(function () {
/*Line 63 - 'AtomAutoPostForm.js' */                    self._isBusy = false;
/*Line 64 - 'AtomAutoPostForm.js' */                    self._postError = ap.error.msg;
/*Line 65 - 'AtomAutoPostForm.js' */                    AtomBinder.refreshValue(self, "isBusy");
/*Line 66 - 'AtomAutoPostForm.js' */                    AtomBinder.refreshValue(self, "postError");
/*Line 67 - 'AtomAutoPostForm.js' */                });
/*Line 68 - 'AtomAutoPostForm.js' */                ap.showProgress(false);
/*Line 69 - 'AtomAutoPostForm.js' */                ap.showError(false);
/*Line 70 - 'AtomAutoPostForm.js' */                ap.invoke();
/*Line 71 - 'AtomAutoPostForm.js' */            },

/*Line 73 - 'AtomAutoPostForm.js' */            onCreated: function () {
/*Line 74 - 'AtomAutoPostForm.js' */                baseType.onCreated.apply(this, arguments);
/*Line 75 - 'AtomAutoPostForm.js' */                var data = this.preparePostData();
/*Line 76 - 'AtomAutoPostForm.js' */                if (!data)
/*Line 77 - 'AtomAutoPostForm.js' */                    return;
/*Line 78 - 'AtomAutoPostForm.js' */                this._cachedData = JSON.stringify(AtomBinder.getClone(data));
/*Line 79 - 'AtomAutoPostForm.js' */            },

/*Line 81 - 'AtomAutoPostForm.js' */            onSuccess: function (p) {

/*Line 83 - 'AtomAutoPostForm.js' */                baseType.onSuccess.apply(this, arguments);

/*Line 85 - 'AtomAutoPostForm.js' */                this._isBusy = false;
/*Line 86 - 'AtomAutoPostForm.js' */                AtomBinder.refreshValue(this, "isBusy");
/*Line 87 - 'AtomAutoPostForm.js' */            },

/*Line 89 - 'AtomAutoPostForm.js' */            onKeyUp: function (e) {

/*Line 91 - 'AtomAutoPostForm.js' */                this.pushPost();

/*Line 93 - 'AtomAutoPostForm.js' */                if (e.target && e.target.nodeName && /textarea/gi.test(e.target.nodeName))
/*Line 94 - 'AtomAutoPostForm.js' */                    return;
/*Line 95 - 'AtomAutoPostForm.js' */                if (e.keyCode == 13) {
/*Line 96 - 'AtomAutoPostForm.js' */                    this.onSubmit();
/*Line 97 - 'AtomAutoPostForm.js' */                }
/*Line 98 - 'AtomAutoPostForm.js' */            },

/*Line 100 - 'AtomAutoPostForm.js' */            init: function () {
/*Line 101 - 'AtomAutoPostForm.js' */                baseType.init.call(this);

/*Line 103 - 'AtomAutoPostForm.js' */                var _this = this;
/*Line 104 - 'AtomAutoPostForm.js' */                this.pushPostHandler = function () {
/*Line 105 - 'AtomAutoPostForm.js' */                    _this.pushPost(1000);
/*Line 106 - 'AtomAutoPostForm.js' */                };
/*Line 107 - 'AtomAutoPostForm.js' */                this.bindEvent(this._element, 'click', this.pushPostHandler);

/*Line 109 - 'AtomAutoPostForm.js' */                $(this._element).find('input,select,textarea').bind('change', null, this.pushPostHandler)
/*Line 110 - 'AtomAutoPostForm.js' */            }
/*Line 111 - 'AtomAutoPostForm.js' */        }
/*Line 112 - 'AtomAutoPostForm.js' */    });
/*Line 113 - 'AtomAutoPostForm.js' */})(window, WebAtoms.AtomForm.prototype);


/*Line 0 - 'AtomDataGrid.js' *////// <reference path="../controls/AtomListBox.js" />

/*Line 2 - 'AtomDataGrid.js' *///WebAtoms.AtomDataGridColumn = function (e) {
/*Line 3 - 'AtomDataGrid.js' *///    WebAtoms.AtomDataGridColumn.initBase(this, arguments);
/*Line 4 - 'AtomDataGrid.js' *///};

/*Line 6 - 'AtomDataGrid.js' *///WebAtoms.AtomDataGridColumn.prototype = {

/*Line 8 - 'AtomDataGrid.js' *///};

/*Line 10 - 'AtomDataGrid.js' *///WebAtoms.AtomDataGridColumn.registerClass("WebAtoms.AtomDataGridColumn", WebAtoms.AtomControl);

/*Line 12 - 'AtomDataGrid.js' *///WebAtoms.AtomDataGrid = function (e) {
/*Line 13 - 'AtomDataGrid.js' *///    WebAtoms.AtomDataGrid.initBase(this, arguments);

/*Line 15 - 'AtomDataGrid.js' *///};

/*Line 17 - 'AtomDataGrid.js' *///WebAtoms.AtomDataGrid.prototype = {



/*Line 21 - 'AtomDataGrid.js' *///};

/*Line 23 - 'AtomDataGrid.js' *///WebAtoms.AtomDataGrid.registerClass("WebAtoms.DataGrid", WebAtoms.AtomListBox);
/*Line 0 - 'AtomFormField.js' */

/*Line 2 - 'AtomFormField.js' */(function (window, baseType) {
/*Line 3 - 'AtomFormField.js' */    return classCreatorEx({
/*Line 4 - 'AtomFormField.js' */        name: "WebAtoms.AtomFormField",
/*Line 5 - 'AtomFormField.js' */        base: baseType,
/*Line 6 - 'AtomFormField.js' */        start: function () {
/*Line 7 - 'AtomFormField.js' */            this._presenters = ["contentPresenter"];
/*Line 8 - 'AtomFormField.js' */        },
/*Line 9 - 'AtomFormField.js' */        properties: {
/*Line 10 - 'AtomFormField.js' */            error: undefined,
/*Line 11 - 'AtomFormField.js' */            dataType: null,
/*Line 12 - 'AtomFormField.js' */            label: undefined,
/*Line 13 - 'AtomFormField.js' */            fieldClass: undefined,
/*Line 14 - 'AtomFormField.js' */            required: false,
/*Line 15 - 'AtomFormField.js' */            isValid: undefined,
/*Line 16 - 'AtomFormField.js' */            regex: null,
/*Line 17 - 'AtomFormField.js' */            fieldValue: undefined,
/*Line 18 - 'AtomFormField.js' */            field: null,
/*Line 19 - 'AtomFormField.js' */            requiredMessage: "Required",
/*Line 20 - 'AtomFormField.js' */            invalidMessage: "Invalid",
/*Line 21 - 'AtomFormField.js' */            fieldVisible: true,
/*Line 22 - 'AtomFormField.js' */            validate: false,
/*Line 23 - 'AtomFormField.js' */            isValidSet: false
/*Line 24 - 'AtomFormField.js' */        },
/*Line 25 - 'AtomFormField.js' */        methods: {
/*Line 26 - 'AtomFormField.js' */            set_dataType: function (v) {
/*Line 27 - 'AtomFormField.js' */                this._dataType = v;
/*Line 28 - 'AtomFormField.js' */                this.setup();
/*Line 29 - 'AtomFormField.js' */            },

/*Line 31 - 'AtomFormField.js' */            set_fieldValue: function (v) {
/*Line 32 - 'AtomFormField.js' */                this._fieldValue = v;
/*Line 33 - 'AtomFormField.js' */                if (!this._validate)
/*Line 34 - 'AtomFormField.js' */                    return;
/*Line 35 - 'AtomFormField.js' */                this.validate();
/*Line 36 - 'AtomFormField.js' */            },
/*Line 37 - 'AtomFormField.js' */            set_isValid: function (v) {
/*Line 38 - 'AtomFormField.js' */                this._isValid = v;
/*Line 39 - 'AtomFormField.js' */                this._isValidSet = true;
/*Line 40 - 'AtomFormField.js' */                if (!this._validate)
/*Line 41 - 'AtomFormField.js' */                    return;
/*Line 42 - 'AtomFormField.js' */                this.validate();
/*Line 43 - 'AtomFormField.js' */            },
/*Line 44 - 'AtomFormField.js' */            set_regex: function (v) {
/*Line 45 - 'AtomFormField.js' */                this._regex = v;
/*Line 46 - 'AtomFormField.js' */                this.setup();
/*Line 47 - 'AtomFormField.js' */            },
/*Line 48 - 'AtomFormField.js' */            set_required: function (v) {
/*Line 49 - 'AtomFormField.js' */                this._required = v;
/*Line 50 - 'AtomFormField.js' */                this.setup();
/*Line 51 - 'AtomFormField.js' */            },
/*Line 52 - 'AtomFormField.js' */            validateChildren: function (e) {
/*Line 53 - 'AtomFormField.js' */                var ae = new ChildEnumerator(e);
/*Line 54 - 'AtomFormField.js' */                while (ae.next()) {
/*Line 55 - 'AtomFormField.js' */                    var child = ae.current();

/*Line 57 - 'AtomFormField.js' */                    if (child.atomControl) {
/*Line 58 - 'AtomFormField.js' */                        this.validateValue(AtomBinder.getValue(child.atomControl, "value"));
/*Line 59 - 'AtomFormField.js' */                    } else {
/*Line 60 - 'AtomFormField.js' */                        if (/input|select|textarea/gi.test(child.nodeName)) {
/*Line 61 - 'AtomFormField.js' */                            this.validateValue($(child).val());
/*Line 62 - 'AtomFormField.js' */                        } else {
/*Line 63 - 'AtomFormField.js' */                            this.validateChildren(child);
/*Line 64 - 'AtomFormField.js' */                        }
/*Line 65 - 'AtomFormField.js' */                    }
/*Line 66 - 'AtomFormField.js' */                }
/*Line 67 - 'AtomFormField.js' */            },
/*Line 68 - 'AtomFormField.js' */            validateValue: function (v) {
/*Line 69 - 'AtomFormField.js' */                if (this._required) {
/*Line 70 - 'AtomFormField.js' */                    if (!v) {
/*Line 71 - 'AtomFormField.js' */                        AtomBinder.setValue(this, "error", this._requiredMessage);
/*Line 72 - 'AtomFormField.js' */                        this._isValid = false;
/*Line 73 - 'AtomFormField.js' */                        return;
/*Line 74 - 'AtomFormField.js' */                    }
/*Line 75 - 'AtomFormField.js' */                } else {
/*Line 76 - 'AtomFormField.js' */                    // if value is not required
/*Line 77 - 'AtomFormField.js' */                    // and if value is empty
/*Line 78 - 'AtomFormField.js' */                    // it is a valid value
/*Line 79 - 'AtomFormField.js' */                    if (!v) {
/*Line 80 - 'AtomFormField.js' */                        this._isValid = true;
/*Line 81 - 'AtomFormField.js' */                        return;
/*Line 82 - 'AtomFormField.js' */                    }
/*Line 83 - 'AtomFormField.js' */                }

/*Line 85 - 'AtomFormField.js' */                var re = null;

/*Line 87 - 'AtomFormField.js' */                if (/email/gi.test(this._dataType)) {
/*Line 88 - 'AtomFormField.js' */                    re = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
/*Line 89 - 'AtomFormField.js' */                } else {
/*Line 90 - 'AtomFormField.js' */                    if (this._regex) {
/*Line 91 - 'AtomFormField.js' */                        re = eval("(" + this._regex + ")");
/*Line 92 - 'AtomFormField.js' */                    }
/*Line 93 - 'AtomFormField.js' */                }

/*Line 95 - 'AtomFormField.js' */                if (re) {
/*Line 96 - 'AtomFormField.js' */                    if (!re.test(v)) {
/*Line 97 - 'AtomFormField.js' */                        AtomBinder.setValue(this, "error", this._invalidMessage);
/*Line 98 - 'AtomFormField.js' */                        this._isValid = false;
/*Line 99 - 'AtomFormField.js' */                        return;
/*Line 100 - 'AtomFormField.js' */                    }
/*Line 101 - 'AtomFormField.js' */                }
/*Line 102 - 'AtomFormField.js' */            },
/*Line 103 - 'AtomFormField.js' */            validate: function () {
/*Line 104 - 'AtomFormField.js' */                this._validate = true;
/*Line 105 - 'AtomFormField.js' */                if (!(this._required || this._regex || this._dataType))
/*Line 106 - 'AtomFormField.js' */                    return this._isValid === undefined ? true : this._isValid;



/*Line 110 - 'AtomFormField.js' */                if (this._isValid) {
/*Line 111 - 'AtomFormField.js' */                    AtomBinder.setValue(this, "error", "");
/*Line 112 - 'AtomFormField.js' */                    if (this._isValidSet) {
/*Line 113 - 'AtomFormField.js' */                        return true;
/*Line 114 - 'AtomFormField.js' */                    }
/*Line 115 - 'AtomFormField.js' */                }

/*Line 117 - 'AtomFormField.js' */                this._isValid = true;

/*Line 119 - 'AtomFormField.js' */                if (this._fieldValue !== undefined) {
/*Line 120 - 'AtomFormField.js' */                    this.validateValue(this._fieldValue);
/*Line 121 - 'AtomFormField.js' */                } else {
/*Line 122 - 'AtomFormField.js' */                    // check validity..
/*Line 123 - 'AtomFormField.js' */                    this.validateChildren(this._element);
/*Line 124 - 'AtomFormField.js' */                }
/*Line 125 - 'AtomFormField.js' */                if (this._isValid) {
/*Line 126 - 'AtomFormField.js' */                    AtomBinder.setValue(this, "error", "");
/*Line 127 - 'AtomFormField.js' */                }
/*Line 128 - 'AtomFormField.js' */                return this._isValid;
/*Line 129 - 'AtomFormField.js' */            },
/*Line 130 - 'AtomFormField.js' */            onCreated: function () {
/*Line 131 - 'AtomFormField.js' */                this.setup();
/*Line 132 - 'AtomFormField.js' */            },
/*Line 133 - 'AtomFormField.js' */            onFocusOut: function () {
/*Line 134 - 'AtomFormField.js' */                this._validate = true;
/*Line 135 - 'AtomFormField.js' */                this.validate();
/*Line 136 - 'AtomFormField.js' */            },
/*Line 137 - 'AtomFormField.js' */            setup: function () {
/*Line 138 - 'AtomFormField.js' */                if (!this._created)
/*Line 139 - 'AtomFormField.js' */                    return;

/*Line 141 - 'AtomFormField.js' */                // find two way bindings...
/*Line 142 - 'AtomFormField.js' */                var e = this._element;

/*Line 144 - 'AtomFormField.js' */                if (this._contentPresenter) {
/*Line 145 - 'AtomFormField.js' */                    this._contentPresenter.appendChild(this._element.contentElement);
/*Line 146 - 'AtomFormField.js' */                }

/*Line 148 - 'AtomFormField.js' */                var ae = new AtomEnumerator($(e).find("input,select,textarea"));
/*Line 149 - 'AtomFormField.js' */                while (ae.next()) {
/*Line 150 - 'AtomFormField.js' */                    var item = ae.current();
/*Line 151 - 'AtomFormField.js' */                    this.bindEvent(item, "blur", "onFocusOut");
/*Line 152 - 'AtomFormField.js' */                    this.bindEvent(item, "change", "onFocusOut");
/*Line 153 - 'AtomFormField.js' */                }

/*Line 155 - 'AtomFormField.js' */                AtomBinder.refreshValue(this, "fieldClass");
/*Line 156 - 'AtomFormField.js' */            }
/*Line 157 - 'AtomFormField.js' */        }
/*Line 158 - 'AtomFormField.js' */    });
/*Line 159 - 'AtomFormField.js' */})(window, WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomFormGrid.js' */

/*Line 2 - 'AtomFormGrid.js' */// http://jsfiddle.net/2yqQF/

/*Line 4 - 'AtomFormGrid.js' */(function (window, baseType) {
/*Line 5 - 'AtomFormGrid.js' */    return classCreatorEx({
/*Line 6 - 'AtomFormGrid.js' */        name: "WebAtoms.AtomFormGridLayout",
/*Line 7 - 'AtomFormGrid.js' */        base: baseType,
/*Line 8 - 'AtomFormGrid.js' */        start: function () { },
/*Line 9 - 'AtomFormGrid.js' */        properties: {
/*Line 10 - 'AtomFormGrid.js' */            minLabelWidth: 100,
/*Line 11 - 'AtomFormGrid.js' */            cellSpacing: 5,
/*Line 12 - 'AtomFormGrid.js' */            label: ""
/*Line 13 - 'AtomFormGrid.js' */        },
/*Line 14 - 'AtomFormGrid.js' */        methods: {
/*Line 15 - 'AtomFormGrid.js' */            onUpdateUI: function () {
/*Line 16 - 'AtomFormGrid.js' */                AtomBinder.refreshValue(this, "controlWidth");
/*Line 17 - 'AtomFormGrid.js' */                AtomBinder.refreshValue(this, "controlHeight");
/*Line 18 - 'AtomFormGrid.js' */                baseType.onUpdateUI.apply(this, arguments);
/*Line 19 - 'AtomFormGrid.js' */            },

/*Line 21 - 'AtomFormGrid.js' */            get_controlWidth: function () {
/*Line 22 - 'AtomFormGrid.js' */                return $(this._element.parentNode).innerWidth();
/*Line 23 - 'AtomFormGrid.js' */            },

/*Line 25 - 'AtomFormGrid.js' */            get_controlHeight: function () {
/*Line 26 - 'AtomFormGrid.js' */                return $(this._element.parentNode).innerHeight();
/*Line 27 - 'AtomFormGrid.js' */            },

/*Line 29 - 'AtomFormGrid.js' */            createChildren: function () {
/*Line 30 - 'AtomFormGrid.js' */                var element = this._element;
/*Line 31 - 'AtomFormGrid.js' */                $(element).addClass("atom-form-grid");

/*Line 33 - 'AtomFormGrid.js' */                var children = $(element).children();

/*Line 35 - 'AtomFormGrid.js' */                var ae = new AtomEnumerator(children);

/*Line 37 - 'AtomFormGrid.js' */                AtomUI.removeAllChildren(element);

/*Line 39 - 'AtomFormGrid.js' */                var container = document.createElement("DIV");
/*Line 40 - 'AtomFormGrid.js' */                //container.setAttribute("style-width", "[$owner.controlWidth]");
/*Line 41 - 'AtomFormGrid.js' */                $(container).addClass("atom-form-grid-container");

/*Line 43 - 'AtomFormGrid.js' */                element.appendChild(container);

/*Line 45 - 'AtomFormGrid.js' */                var minLabelWidth = $(this._element).attr("atom-min-label-width");

/*Line 47 - 'AtomFormGrid.js' */                this.getTemplate("fieldTemplate");

/*Line 49 - 'AtomFormGrid.js' */                while (ae.next()) {
/*Line 50 - 'AtomFormGrid.js' */                    var item = ae.current();

/*Line 52 - 'AtomFormGrid.js' */                    var at = AtomUI.attributeMap(item, /^(atom\-type)$/gi)["atom-type"];
/*Line 53 - 'AtomFormGrid.js' */                    if (at && at.value == "AtomFormRow") {
/*Line 54 - 'AtomFormGrid.js' */                        var table = document.createElement("TABLE");
/*Line 55 - 'AtomFormGrid.js' */                        container.appendChild(table);
/*Line 56 - 'AtomFormGrid.js' */                        $(table).addClass("atom-form-grid-row");
/*Line 57 - 'AtomFormGrid.js' */                        var tbody = document.createElement("TBODY");
/*Line 58 - 'AtomFormGrid.js' */                        table.appendChild(tbody);

/*Line 60 - 'AtomFormGrid.js' */                        var tr = document.createElement("TR");
/*Line 61 - 'AtomFormGrid.js' */                        tbody.appendChild(tr);

/*Line 63 - 'AtomFormGrid.js' */                        var children = $(item).children();
/*Line 64 - 'AtomFormGrid.js' */                        var ce = new AtomEnumerator(children);
/*Line 65 - 'AtomFormGrid.js' */                        while (ce.next()) {
/*Line 66 - 'AtomFormGrid.js' */                            var td = document.createElement("TD");
/*Line 67 - 'AtomFormGrid.js' */                            tr.appendChild(td);
/*Line 68 - 'AtomFormGrid.js' */                            this.createField(td, ce.current());
/*Line 69 - 'AtomFormGrid.js' */                        }

/*Line 71 - 'AtomFormGrid.js' */                        continue;
/*Line 72 - 'AtomFormGrid.js' */                    }
/*Line 73 - 'AtomFormGrid.js' */                    if (at && (at.value == "AtomFormTabControl" || at.value == "AtomTabControl")) {


/*Line 76 - 'AtomFormGrid.js' */                        var tabBar = document.createElement("DIV");
/*Line 77 - 'AtomFormGrid.js' */                        tabBar.setAttribute("atom-type", "AtomToggleButtonBar");
/*Line 78 - 'AtomFormGrid.js' */                        var tabBarID = AtomUI.assignID(tabBar);
/*Line 79 - 'AtomFormGrid.js' */                        tabBar.setAttribute("atom-name", tabBarID);
/*Line 80 - 'AtomFormGrid.js' */                        tabBar.setAttribute("atom-show-tabs", "true");
/*Line 81 - 'AtomFormGrid.js' */                        var te = document.createElement("SPAN");
/*Line 82 - 'AtomFormGrid.js' */                        tabBar.appendChild(te);
/*Line 83 - 'AtomFormGrid.js' */                        te.setAttribute("atom-text", "{$data.label}");
/*Line 84 - 'AtomFormGrid.js' */                        te.setAttribute("atom-template", "itemTemplate");
/*Line 85 - 'AtomFormGrid.js' */                        //td.appendChild(tabBar);
/*Line 86 - 'AtomFormGrid.js' */                        this.createField(container, tabBar);

/*Line 88 - 'AtomFormGrid.js' */                        var tbc = allControls[tabBarID];

/*Line 90 - 'AtomFormGrid.js' */                        var ce = new ChildEnumerator(item);
/*Line 91 - 'AtomFormGrid.js' */                        var list = [];
/*Line 92 - 'AtomFormGrid.js' */                        var index = 0;
/*Line 93 - 'AtomFormGrid.js' */                        while (ce.next()) {
/*Line 94 - 'AtomFormGrid.js' */                            var child = ce.current();
/*Line 95 - 'AtomFormGrid.js' */                            $(child).remove();
/*Line 96 - 'AtomFormGrid.js' */                            child.setAttribute("style-display", "[$scope." + tabBarID + ".selectedIndex == " + index + " ? '' : 'none']");
/*Line 97 - 'AtomFormGrid.js' */                            var cf = this.createField(container, child);
/*Line 98 - 'AtomFormGrid.js' */                            list.push(cf);
/*Line 99 - 'AtomFormGrid.js' */                            //if (cf.constructor == WebAtoms.AtomFormGridLayout) {

/*Line 101 - 'AtomFormGrid.js' */                            //}
/*Line 102 - 'AtomFormGrid.js' */                            index++;
/*Line 103 - 'AtomFormGrid.js' */                        }

/*Line 105 - 'AtomFormGrid.js' */                        tbc.set_items(list);
/*Line 106 - 'AtomFormGrid.js' */                        continue;
/*Line 107 - 'AtomFormGrid.js' */                    }
/*Line 108 - 'AtomFormGrid.js' */                    this.createField(container, item);

/*Line 110 - 'AtomFormGrid.js' */                }

/*Line 112 - 'AtomFormGrid.js' */            }
/*Line 113 - 'AtomFormGrid.js' */        }
/*Line 114 - 'AtomFormGrid.js' */    });
/*Line 115 - 'AtomFormGrid.js' */})(window, WebAtoms.AtomFormLayout.prototype);


/*Line 118 - 'AtomFormGrid.js' */(function (baseType) {
/*Line 119 - 'AtomFormGrid.js' */    return classCreatorEx({
/*Line 120 - 'AtomFormGrid.js' */        name: "WebAtoms.AtomFormTab",
/*Line 121 - 'AtomFormGrid.js' */        base: baseType,
/*Line 122 - 'AtomFormGrid.js' */        start: function () {
/*Line 123 - 'AtomFormGrid.js' */        },
/*Line 124 - 'AtomFormGrid.js' */        methods: {

/*Line 126 - 'AtomFormGrid.js' */        }
/*Line 127 - 'AtomFormGrid.js' */    });
/*Line 128 - 'AtomFormGrid.js' */})(WebAtoms.AtomFormGridLayout.prototype);
/*Line 0 - 'AtomFormNoLayout.js' */

/*Line 2 - 'AtomFormNoLayout.js' */(function (baseType) {
/*Line 3 - 'AtomFormNoLayout.js' */    return classCreatorEx({
/*Line 4 - 'AtomFormNoLayout.js' */        name: "WebAtoms.AtomFormNoLayout",
/*Line 5 - 'AtomFormNoLayout.js' */        base: baseType,
/*Line 6 - 'AtomFormNoLayout.js' */        start: function () { },
/*Line 7 - 'AtomFormNoLayout.js' */        methods: {

/*Line 9 - 'AtomFormNoLayout.js' */        }
/*Line 10 - 'AtomFormNoLayout.js' */    });
/*Line 11 - 'AtomFormNoLayout.js' */})(WebAtoms.AtomForm.prototype);

/*Line 0 - 'AtomFormVerticalLayout.js' */

/*Line 2 - 'AtomFormVerticalLayout.js' */(function (baseType) {
/*Line 3 - 'AtomFormVerticalLayout.js' */    return classCreatorEx({
/*Line 4 - 'AtomFormVerticalLayout.js' */        name: "WebAtoms.AtomFormVerticalLayout",
/*Line 5 - 'AtomFormVerticalLayout.js' */        base: baseType,
/*Line 6 - 'AtomFormVerticalLayout.js' */        start: function () { },
/*Line 7 - 'AtomFormVerticalLayout.js' */        methods: {}
/*Line 8 - 'AtomFormVerticalLayout.js' */    });
/*Line 9 - 'AtomFormVerticalLayout.js' */})(WebAtoms.AtomFormLayout.prototype);

/*Line 0 - 'AtomTableLayout.js' */

/*Line 2 - 'AtomTableLayout.js' */(function (baseType) {
/*Line 3 - 'AtomTableLayout.js' */    return classCreatorEx({
/*Line 4 - 'AtomTableLayout.js' */        name: "WebAtoms.AtomTableLayout",
/*Line 5 - 'AtomTableLayout.js' */        base: baseType,
/*Line 6 - 'AtomTableLayout.js' */        start: function (columns, cellWidth, cellHeight) {
/*Line 7 - 'AtomTableLayout.js' */            this._cellWidth = cellWidth;
/*Line 8 - 'AtomTableLayout.js' */            this._cellHeight = cellHeight;
/*Line 9 - 'AtomTableLayout.js' */            this._columns = columns;
/*Line 10 - 'AtomTableLayout.js' */        },
/*Line 11 - 'AtomTableLayout.js' */        methods: {
/*Line 12 - 'AtomTableLayout.js' */            doLayout: function (element) {
/*Line 13 - 'AtomTableLayout.js' */                var ae = new AtomEnumerator($(element).children());
/*Line 14 - 'AtomTableLayout.js' */                var item;

/*Line 16 - 'AtomTableLayout.js' */                var left = 0;
/*Line 17 - 'AtomTableLayout.js' */                var top = 0;

/*Line 19 - 'AtomTableLayout.js' */                var maxRows = Math.ceil(ae._array.length / this._columns) - 1;
/*Line 20 - 'AtomTableLayout.js' */                var rows = maxRows;

/*Line 22 - 'AtomTableLayout.js' */                var width = this._columns * this._cellWidth;
/*Line 23 - 'AtomTableLayout.js' */                var height = this._cellHeight * (maxRows + 1);

/*Line 25 - 'AtomTableLayout.js' */                element.style.position = "relative";
/*Line 26 - 'AtomTableLayout.js' */                element.style.width = width + "px";
/*Line 27 - 'AtomTableLayout.js' */                element.style.height = height + "px";

/*Line 29 - 'AtomTableLayout.js' */                element.maxRows = maxRows;

/*Line 31 - 'AtomTableLayout.js' */                while (ae.next()) {
/*Line 32 - 'AtomTableLayout.js' */                    item = ae.current();

/*Line 34 - 'AtomTableLayout.js' */                    item.style.position = "absolute";
/*Line 35 - 'AtomTableLayout.js' */                    item.style.left = left + "px";
/*Line 36 - 'AtomTableLayout.js' */                    item.style.top = top + "px";

/*Line 38 - 'AtomTableLayout.js' */                    item.style.width = this._cellWidth + "px";

/*Line 40 - 'AtomTableLayout.js' */                    if (rows <= 0) {
/*Line 41 - 'AtomTableLayout.js' */                        rows = maxRows;
/*Line 42 - 'AtomTableLayout.js' */                        left += this._cellWidth + 10;
/*Line 43 - 'AtomTableLayout.js' */                        top = 0;
/*Line 44 - 'AtomTableLayout.js' */                    } else {
/*Line 45 - 'AtomTableLayout.js' */                        rows--;
/*Line 46 - 'AtomTableLayout.js' */                        top += this._cellHeight;
/*Line 47 - 'AtomTableLayout.js' */                    }
/*Line 48 - 'AtomTableLayout.js' */                }
/*Line 49 - 'AtomTableLayout.js' */            }
/*Line 50 - 'AtomTableLayout.js' */        }
/*Line 51 - 'AtomTableLayout.js' */    });
/*Line 52 - 'AtomTableLayout.js' */})(WebAtoms.AtomLayout.prototype);
/*Line 0 - 'AtomViewBoxLayout.js' */

/*Line 2 - 'AtomViewBoxLayout.js' */var AtomViewBoxLayout = (function (baseType) {
/*Line 3 - 'AtomViewBoxLayout.js' */    return classCreatorEx({
/*Line 4 - 'AtomViewBoxLayout.js' */        name: "WebAtoms.AtomViewBoxLayout",
/*Line 5 - 'AtomViewBoxLayout.js' */        base: baseType,
/*Line 6 - 'AtomViewBoxLayout.js' */        start: function () { },
/*Line 7 - 'AtomViewBoxLayout.js' */        methods: {
/*Line 8 - 'AtomViewBoxLayout.js' */            doLayout: function (element) {
/*Line 9 - 'AtomViewBoxLayout.js' */                var style = { width: $(element).innerWidth() + 'px', height: $(element).innerHeight() + 'px' };
/*Line 10 - 'AtomViewBoxLayout.js' */                var ae = new ChildEnumerator(element);
/*Line 11 - 'AtomViewBoxLayout.js' */                var item;
/*Line 12 - 'AtomViewBoxLayout.js' */                while (ae.next()) {
/*Line 13 - 'AtomViewBoxLayout.js' */                    item = ae.current();
/*Line 14 - 'AtomViewBoxLayout.js' */                    item.style.width = style.width;
/*Line 15 - 'AtomViewBoxLayout.js' */                    item.style.height = style.height;
/*Line 16 - 'AtomViewBoxLayout.js' */                    if (item.atomControl) {
/*Line 17 - 'AtomViewBoxLayout.js' */                        item.atomControl.updateUI();
/*Line 18 - 'AtomViewBoxLayout.js' */                    }
/*Line 19 - 'AtomViewBoxLayout.js' */                }
/*Line 20 - 'AtomViewBoxLayout.js' */            }
/*Line 21 - 'AtomViewBoxLayout.js' */        }
/*Line 22 - 'AtomViewBoxLayout.js' */    });
/*Line 23 - 'AtomViewBoxLayout.js' */})(WebAtoms.AtomLayout.prototype);

/*Line 25 - 'AtomViewBoxLayout.js' */AtomViewBoxLayout.defaultInstance = new AtomViewBoxLayout();
/*Line 0 - 'AtomAlert.js' */

/*Line 2 - 'AtomAlert.js' */Atom.confirm = function (msg, f) {

/*Line 4 - 'AtomAlert.js' */    var d = { Message: msg, ConfirmValue: false, Confirm: f ? true : false };

/*Line 6 - 'AtomAlert.js' */    var e = document.createElement("DIV");
/*Line 7 - 'AtomAlert.js' */    document.body.appendChild(e);
/*Line 8 - 'AtomAlert.js' */    var w = AtomUI.createControl(e, WebAtoms.AtomWindow, d);

/*Line 10 - 'AtomAlert.js' */    w.set_windowWidth(380);
/*Line 11 - 'AtomAlert.js' */    w.set_windowHeight(120);
/*Line 12 - 'AtomAlert.js' */    w.set_windowTemplate(w.getTemplate("alertTemplate"));
/*Line 13 - 'AtomAlert.js' */    w.set_title( f ? "Message" : "Confirm" );

/*Line 15 - 'AtomAlert.js' */    w.set_next(function () {

/*Line 17 - 'AtomAlert.js' */        w.dispose();
/*Line 18 - 'AtomAlert.js' */        $(e).remove();

/*Line 20 - 'AtomAlert.js' */        if (d.ConfirmValue) {
/*Line 21 - 'AtomAlert.js' */            if (f) {
/*Line 22 - 'AtomAlert.js' */                f();
/*Line 23 - 'AtomAlert.js' */            }
/*Line 24 - 'AtomAlert.js' */        }
/*Line 25 - 'AtomAlert.js' */    });

/*Line 27 - 'AtomAlert.js' */    w.refresh();

/*Line 29 - 'AtomAlert.js' */};

/*Line 31 - 'AtomAlert.js' */if (window.__chromeCSP) {

/*Line 33 - 'AtomAlert.js' */    Atom.alert = function (msg) {
/*Line 34 - 'AtomAlert.js' */        Atom.confirm(msg, null);
/*Line 35 - 'AtomAlert.js' */    };
/*Line 36 - 'AtomAlert.js' */} else {
/*Line 37 - 'AtomAlert.js' */    Atom.alert = function (msg) {
/*Line 38 - 'AtomAlert.js' */        alert(msg);
/*Line 39 - 'AtomAlert.js' */    }
/*Line 40 - 'AtomAlert.js' */}
/*Line 0 - 'ZZZZZInitializer.js' */

/*Line 2 - 'ZZZZZInitializer.js' */// http://jsfiddle.net/bZcth/33/#update


/*Line 5 - 'ZZZZZInitializer.js' */$(window.document).ready(function () {

/*Line 7 - 'ZZZZZInitializer.js' */    // commencing Web Atoms...

/*Line 9 - 'ZZZZZInitializer.js' */    WebAtoms.dispatcher.setupControls();
/*Line 10 - 'ZZZZZInitializer.js' */    WebAtoms.dispatcher.start();
/*Line 11 - 'ZZZZZInitializer.js' */});


	}).apply(window, [WebAtoms]);
