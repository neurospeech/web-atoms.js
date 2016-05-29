
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
                for (var k in cp) {
                    this["_" + k] = cp[k];
                }
                baseClass.apply(this, arguments);
                this.__typeName = name;
                //var cp = Atom.clone(classProperties);
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

window.createClass = classCreatorEx;
window.classCreatorEx = classCreatorEx;
(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// Node/CommonJS
		factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

	var ua = navigator.userAgent,
		iPhone = /iphone/i.test(ua),
		chrome = /chrome/i.test(ua),
		android = /android/i.test(ua),
		caretTimeoutId;

	$.mask = {
		//Predefined character definitions
		definitions: {
			'9': "[0-9]",
			'a': "[A-Za-z]",
			'*': "[A-Za-z0-9]"
		},
		autoclear: true,
		dataName: "rawMaskFn",
		placeholder: '_'
	};

	$.fn.extend({
		//Helper Function for Caret positioning
		caret: function (begin, end) {
			var range;

			if (this.length === 0 || this.is(":hidden")) {
				return;
			}

			if (typeof begin == 'number') {
				end = (typeof end === 'number') ? end : begin;
				return this.each(function () {
					if (this.setSelectionRange) {
						this.setSelectionRange(begin, end);
					} else if (this.createTextRange) {
						range = this.createTextRange();
						range.collapse(true);
						range.moveEnd('character', end);
						range.moveStart('character', begin);
						range.select();
					}
				});
			} else {
				if (this[0].setSelectionRange) {
					begin = this[0].selectionStart;
					end = this[0].selectionEnd;
				} else if (document.selection && document.selection.createRange) {
					range = document.selection.createRange();
					begin = 0 - range.duplicate().moveStart('character', -100000);
					end = begin + range.text.length;
				}
				return { begin: begin, end: end };
			}
		},
		unmask: function () {
			return this.trigger("unmask");
		},
		mask: function (mask, settings) {
			var input,
				defs,
				tests,
				partialPosition,
				firstNonMaskPos,
				lastRequiredNonMaskPos,
				len,
				oldVal;

			if (!mask && this.length > 0) {
				input = $(this[0]);
				var fn = input.data($.mask.dataName)
				return fn ? fn() : undefined;
			}

			settings = $.extend({
				autoclear: $.mask.autoclear,
				placeholder: $.mask.placeholder, // Load default placeholder
				completed: null
			}, settings);


			defs = $.mask.definitions;
			tests = [];
			partialPosition = len = mask.length;
			firstNonMaskPos = null;

			$.each(mask.split(""), function (i, c) {
				if (c == '?') {
					len--;
					partialPosition = i;
				} else if (defs[c]) {
					tests.push(new RegExp(defs[c]));
					if (firstNonMaskPos === null) {
						firstNonMaskPos = tests.length - 1;
					}
					if (i < partialPosition) {
						lastRequiredNonMaskPos = tests.length - 1;
					}
				} else {
					tests.push(null);
				}
			});

			return this.trigger("unmask").each(function () {
				var input = $(this),
					buffer = $.map(
						mask.split(""),
						function (c, i) {
							if (c != '?') {
								return defs[c] ? getPlaceholder(i) : c;
							}
						}),
					defaultBuffer = buffer.join(''),
					focusText = input.val();

				function tryFireCompleted() {
					if (!settings.completed) {
						return;
					}

					for (var i = firstNonMaskPos; i <= lastRequiredNonMaskPos; i++) {
						if (tests[i] && buffer[i] === getPlaceholder(i)) {
							return;
						}
					}
					settings.completed.call(input);
				}

				function getPlaceholder(i) {
					if (i < settings.placeholder.length)
						return settings.placeholder.charAt(i);
					return settings.placeholder.charAt(0);
				}

				function seekNext(pos) {
					while (++pos < len && !tests[pos]);
					return pos;
				}

				function seekPrev(pos) {
					while (--pos >= 0 && !tests[pos]);
					return pos;
				}

				function shiftL(begin, end) {
					var i,
						j;

					if (begin < 0) {
						return;
					}

					for (i = begin, j = seekNext(end) ; i < len; i++) {
						if (tests[i]) {
							if (j < len && tests[i].test(buffer[j])) {
								buffer[i] = buffer[j];
								buffer[j] = getPlaceholder(j);
							} else {
								break;
							}

							j = seekNext(j);
						}
					}
					writeBuffer();
					input.caret(Math.max(firstNonMaskPos, begin));
				}

				function shiftR(pos) {
					var i,
						c,
						j,
						t;

					for (i = pos, c = getPlaceholder(pos) ; i < len; i++) {
						if (tests[i]) {
							j = seekNext(i);
							t = buffer[i];
							buffer[i] = c;
							if (j < len && tests[j].test(t)) {
								c = t;
							} else {
								break;
							}
						}
					}
				}

				function androidInputEvent(e) {
					var curVal = input.val();
					var pos = input.caret();
					if (curVal.length < oldVal.length) {
						// a deletion or backspace happened
						checkVal(true);
						while (pos.begin > 0 && !tests[pos.begin - 1])
							pos.begin--;
						if (pos.begin === 0) {
							while (pos.begin < firstNonMaskPos && !tests[pos.begin])
								pos.begin++;
						}
						input.caret(pos.begin, pos.begin);
					} else {
						var pos2 = checkVal(true);
						while (pos.begin < len && !tests[pos.begin])
							pos.begin++;

						input.caret(pos.begin, pos.begin);
					}

					tryFireCompleted();
				}

				function blurEvent(e) {
					checkVal();

					if (input.val() != focusText)
						input.change();
				}

				function keydownEvent(e) {
					if (input.prop("readonly")) {
						return;
					}

					var k = e.which || e.keyCode,
						pos,
						begin,
						end;
					oldVal = input.val();
					//backspace, delete, and escape get special treatment
					if (k === 8 || k === 46 || (iPhone && k === 127)) {
						pos = input.caret();
						begin = pos.begin;
						end = pos.end;

						if (end - begin === 0) {
							begin = k !== 46 ? seekPrev(begin) : (end = seekNext(begin - 1));
							end = k === 46 ? seekNext(end) : end;
						}
						clearBuffer(begin, end);
						shiftL(begin, end - 1);

						e.preventDefault();
					} else if (k === 13) { // enter
						blurEvent.call(this, e);
					} else if (k === 27) { // escape
						input.val(focusText);
						input.caret(0, checkVal());
						e.preventDefault();
					}
				}

				function keypressEvent(e) {
					if (input.prop("readonly")) {
						return;
					}

					var k = e.which || e.keyCode,
						pos = input.caret(),
						p,
						c,
						next;

					if (e.ctrlKey || e.altKey || e.metaKey || k < 32) {//Ignore
						return;
					} else if (k && k !== 13) {
						if (pos.end - pos.begin !== 0) {
							clearBuffer(pos.begin, pos.end);
							shiftL(pos.begin, pos.end - 1);
						}

						p = seekNext(pos.begin - 1);
						if (p < len) {
							c = String.fromCharCode(k);
							if (tests[p].test(c)) {
								shiftR(p);

								buffer[p] = c;
								writeBuffer();
								next = seekNext(p);

								if (android) {
									//Path for CSP Violation on FireFox OS 1.1
									var proxy = function () {
										$.proxy($.fn.caret, input, next)();
									};

									setTimeout(proxy, 0);
								} else {
									input.caret(next);
								}
								if (pos.begin <= lastRequiredNonMaskPos) {
									tryFireCompleted();
								}
							}
						}
						e.preventDefault();
					}
				}

				function clearBuffer(start, end) {
					var i;
					for (i = start; i < end && i < len; i++) {
						if (tests[i]) {
							buffer[i] = getPlaceholder(i);
						}
					}
				}

				function writeBuffer() { input.val(buffer.join('')); }

				function checkVal(allow) {
					//try to place characters where they belong
					var test = input.val(),
						lastMatch = -1,
						i,
						c,
						pos;

					for (i = 0, pos = 0; i < len; i++) {
						if (tests[i]) {
							buffer[i] = getPlaceholder(i);
							while (pos++ < test.length) {
								c = test.charAt(pos - 1);
								if (tests[i].test(c)) {
									buffer[i] = c;
									lastMatch = i;
									break;
								}
							}
							if (pos > test.length) {
								clearBuffer(i + 1, len);
								break;
							}
						} else {
							if (buffer[i] === test.charAt(pos)) {
								pos++;
							}
							if (i < partialPosition) {
								lastMatch = i;
							}
						}
					}
					if (allow) {
						writeBuffer();
					} else if (lastMatch + 1 < partialPosition) {
						if (settings.autoclear || buffer.join('') === defaultBuffer) {
							// Invalid value. Remove it and replace it with the
							// mask, which is the default behavior.
							if (input.val()) input.val("");
							clearBuffer(0, len);
						} else {
							// Invalid value, but we opt to show the value to the
							// user and allow them to correct their mistake.
							writeBuffer();
						}
					} else {
						writeBuffer();
						input.val(input.val().substring(0, lastMatch + 1));
					}
					return (partialPosition ? i : firstNonMaskPos);
				}

				input.data($.mask.dataName, function () {
					return $.map(buffer, function (c, i) {
						return tests[i] && c != getPlaceholder(i) ? c : null;
					}).join('');
				});


				input
					.one("unmask", function () {
						input
							.off(".mask")
							.removeData($.mask.dataName);
					})
					.on("focus.mask", function () {
						if (input.prop("readonly")) {
							return;
						}

						clearTimeout(caretTimeoutId);
						var pos;

						focusText = input.val();

						pos = checkVal();

						caretTimeoutId = setTimeout(function () {
							if (input.get(0) !== document.activeElement) {
								return;
							}
							writeBuffer();
							if (pos == mask.replace("?", "").length) {
								input.caret(0, pos);
							} else {
								input.caret(pos);
							}
						}, 10);
					})
					.on("blur.mask", blurEvent)
					.on("keydown.mask", keydownEvent)
					.on("keypress.mask", keypressEvent)
					.on("input.mask paste.mask", function () {
						if (input.prop("readonly")) {
							return;
						}

						setTimeout(function () {
							var pos = checkVal(true);
							input.caret(pos);
							tryFireCompleted();
						}, 0);
					});
				if (chrome && android) {
					input
						.off('input.mask')
						.on('input.mask', androidInputEvent);
				}
				checkVal(); //Perform initial check for existing values
			});
		}
	});
}));


(function(window){

	//var $old = window.$;
//
    //var $ = function(o){
        //if(typeof HTMLElement === "object" ? o instanceof HTMLElement : o 
            //&& typeof o === "object" 
            //&& o !== null 
            //&& o.nodeType === 1 
            //&& typeof o.nodeName==="string"){
            //o.__$ = o.__$ || $old(o);
            //return o.__$;
        //}
        //return $old(o);
    //};
//
    //$.prototype = $old;

    var $ = window.$;

	var document = window.document;
	var Templates = { jsonML: {} };

    var WebAtoms = {};
    window.WebAtoms = WebAtoms;

	window.Templates = Templates;

    var jsonML = Templates.jsonML;

jsonML["WebAtoms.AtomAutoCompleteBox.template"] = 
[["input",
{ "data-atom-presenter": "selectionBox", "disabled": "disabled", "type": "text", "data-atom-init": "t1" }
], ["input",
{ "data-atom-presenter": "inputBox", "type": "text", "autocomplete": "off", "autocorrect": "off", "data-atom-init": "t2" }
], ["div",
{ "data-atom-presenter": "itemsPresenter", "class": "atom-list-box", "style": "position: absolute; z-index: 100;", "data-atom-init": "t3" }
,["div",
{ "data-atom-template": "itemTemplate", "style": "min-width:100px;", "data-atom-init": "t4" }
]]]
;
jsonML["WebAtoms.AtomCalendar.itemTemplate"] = 
[["div",
{ "data-atom-template": "itemTemplate", "data-atom-init": "t5" }
,["span",
{ "data-atom-init": "t6" }
]]]
;
jsonML["WebAtoms.AtomCalendar.template"] = 
[["section",
{ "class": "calendar" }
,["header",
{  }
,["button",
{ "class": "prev", "data-atom-init": "t7" }
], ["select",
{ "data-atom-type": "AtomComboBox", "class": "month", "data-atom-init": "t8" }
], ["select",
{ "data-atom-type": "AtomComboBox", "class": "year", "data-atom-init": "t9" }
], ["button",
{ "class": "next", "data-atom-init": "t10" }
]], ["ul",
{ "class": "days" }
,["li",
{ "class": "weekend" }
,"S"], ["li",
{  }
,"M"], ["li",
{  }
,"T"], ["li",
{  }
,"W"], ["li",
{  }
,"T"], ["li",
{  }
,"F"], ["li",
{ "class": "weekend" }
,"S"]], ["section",
{ "class": "day-list", "data-atom-presenter": "itemsPresenter" }
,]]]
;
jsonML["WebAtoms.AtomCheckBoxList.itemTemplate"] = 
[["div",
{ "data-atom-template": "itemTemplate" }
,["input",
{ "type": "checkbox", "data-atom-init": "t13" }
], ["span",
{ "data-atom-init": "t14" }
]]]
;
jsonML["WebAtoms.AtomDataPager.template"] = 
[["button",
{ "class": "atom-pager-first-button", "style": "float:left", "data-atom-init": "t15" }
,"First"], ["span",
{ "style": "text-align:left" }
,["button",
{ "class": "atom-pager-prev-button", "data-atom-init": "t16" }
,"Prev"], ["span",
{  }
,"Goto: Page"], ["select",
{ "data-atom-type": "AtomComboBox", "data-atom-init": "t17" }
,], ["button",
{ "class": "atom-pager-next-button", "data-atom-init": "t18" }
,"Next"]], ["button",
{ "class": "atom-pager-last-button", "style": "float:right", "data-atom-init": "t19" }
,"Last"]]
;
jsonML["WebAtoms.AtomDateField.popupTemplate"] = 
[["div",
{ "class": "atom-date-popup", "data-atom-init": "t20" }
,["div",
{ "class": "atom-date-list-box" }
,["div",
{ "class": "calendar", "data-atom-presenter": "calendarPresenter" }
,["select",
{ "data-atom-type": "AtomComboBox", "class": "month", "data-atom-init": "t22" }
], ["select",
{ "data-atom-type": "AtomNumberComboBox", "class": "year", "data-atom-init": "t23" }
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
{ "class": "day-list", "data-atom-type": "AtomItemsControl", "data-atom-presenter": "itemsPresenter", "data-atom-init": "t24" }
,["div",
{ "data-atom-template": "itemTemplate", "data-atom-init": "t25" }
,["span",
{ "data-atom-init": "t26" }
]]]]]]]
;
jsonML["WebAtoms.AtomDateField.template"] = 
[["div",
{ "class": "date-label", "data-atom-init": "t27" }
]]
;
jsonML["WebAtoms.AtomDateListBox.template"] = 
[["div",
{ "class": "atom-date-list-box" }
,["div",
{ "class": "calendar" }
,["select",
{ "data-atom-type": "AtomComboBox", "class": "month", "data-atom-init": "t28" }
], ["select",
{ "data-atom-type": "AtomComboBox", "class": "year", "data-atom-init": "t29" }
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
{ "class": "day-list", "data-atom-presenter": "itemsPresenter" }
,["div",
{ "data-atom-template": "itemTemplate", "data-atom-init": "t31" }
,["span",
{ "data-atom-init": "t32" }
]]]], ["div",
{ "class": "list", "data-atom-type": "AtomListBox", "data-atom-init": "t33" }
,["div",
{ "data-atom-template": "itemTemplate", "data-atom-init": "t34" }
,]]]]
;
jsonML["WebAtoms.AtomItemsControl.itemTemplate"] = 
[["span",
{ "data-atom-init": "t35" }
,"Item"]]
;
jsonML["WebAtoms.AtomLinkBar.itemTemplate"] = 
[["li",
{ "data-atom-init": "t36" }
,["a",
{ "data-atom-init": "t37" }
,]]]
;
jsonML["WebAtoms.AtomLinkBar.menuTemplate"] = 
[["ul",
{ "class": "menu", "data-atom-type": "AtomLinkBar", "data-atom-init": "t38" }
,["li",
{ "data-atom-template": "itemTemplate" }
,["a",
{ "data-atom-init": "t40" }
]]]]
;
jsonML["WebAtoms.AtomNavigatorList.detailTemplate"] = 
[["iframe",
{ "class": "atom-navigator-list-iframe", "data-atom-template": "detailTemplate", "data-atom-init": "t41" }
]]
;
jsonML["WebAtoms.AtomNavigatorList.template"] = 
[["div",
{ "data-atom-type": "AtomViewStack", "data-atom-init": "t42" }
,["div",
{ "data-atom-type": "AtomDockPanel", "data-atom-presenter": "gridPanel" }
,["div",
{ "data-atom-dock": "Fill", "data-atom-presenter": "gridPresenter", "class": "atom-navigator-list-grid" }
,]], ["div",
{ "data-atom-presenter": "detailView", "data-atom-type": "AtomDockPanel", "data-atom-init": "t45" }
,["div",
{ "data-atom-dock": "Top", "data-atom-presenter": "detailHeaderToolbar" }
,["input",
{ "type": "button", "value": "Back", "style": "float: left", "data-atom-init": "t47" }
]]], ["div",
{ "data-atom-presenter": "newView", "data-atom-type": "AtomDockPanel", "data-atom-init": "t48" }
,["div",
{ "data-atom-dock": "Top", "data-atom-presenter": "newHeaderToolbar" }
,["input",
{ "type": "button", "value": "Back", "style": "float: left", "data-atom-init": "t50" }
]]]]]
;
jsonML["WebAtoms.AtomRadioButtonList.itemTemplate"] = 
[["span",
{  }
,["input",
{ "type": "radio", "data-atom-name": "{$owner.groupName}", "data-atom-init": "t51" }
], ["span",
{ "data-atom-init": "t52" }
]]]
;
jsonML["WebAtoms.AtomSortableColumn.template"] = 
[["span",
{ "data-atom-init": "t53" }
]]
;
jsonML["WebAtoms.AtomTabControl.template"] = 
[["div",
{ "data-atom-type": "AtomDockPanel" }
,["ul",
{ "data-atom-dock": "Top", "data-atom-type": "AtomToggleButtonBar", "data-atom-init": "t55" }
,["li",
{ "data-atom-template": "itemTemplate", "data-atom-init": "t56" }
]], ["div",
{ "data-atom-dock": "Fill", "data-atom-type": "AtomViewStack", "data-atom-presenter": "itemsPresenter", "data-atom-init": "t57" }
,]]]
;
jsonML["WebAtoms.AtomTimeEditor.template"] = 
[["span",
{  }
,"Hour:"], ["input",
{ "type": "number", "min": "0", "max": "12", "data-atom-init": "t58" }
], ["span",
{  }
,"Minute:"], ["input",
{ "type": "number", "min": "0", "max": "59", "data-atom-init": "t59" }
], ["ul",
{ "data-atom-type": "AtomToggleButtonBar", "data-atom-init": "t60" }
,["li",
{ "data-atom-template": "itemTemplate", "data-atom-init": "t61" }
]]]
;
jsonML["WebAtoms.AtomToggleButtonBar.itemTemplate"] = 
[["li",
{ "data-atom-init": "t62" }
,]]
;
jsonML["WebAtoms.AtomWizard.template"] = 
[["div",
{ "data-atom-dock": "Fill", "data-atom-type": "AtomViewStack", "data-atom-presenter": "viewPresenter", "data-atom-init": "t63" }
,], ["div",
{ "data-atom-dock": "Bottom", "class": "atom-wizard-command-bar" }
,["button",
{ "class": "atom-wizard-back-button", "data-atom-init": "t65" }
,["span",
{ "data-atom-init": "t66" }
]], ["button",
{ "class": "atom-wizard-next-button", "data-atom-init": "t67" }
,["span",
{ "data-atom-init": "t68" }
]]]]
;
jsonML["WebAtoms.AtomYesNoCustom.template"] = 
[["ul",
{ "data-atom-type": "AtomYesNoControl", "data-atom-presenter": "yesNo", "data-atom-init": "t69" }
], ["input",
{ "style": "vertical-align:top", "type": "text", "data-atom-presenter": "input", "data-atom-init": "t70" }
]]
;
jsonML["WebAtoms.AtomApplication.busyTemplate"] = 
[["div",
{ "style": "position:absolute;left:0px;top:0px;z-index:10000; display:none", "data-atom-init": "t71" }
,["div",
{ "class": "atom-busy-window", "style": "position:absolute", "data-atom-init": "t72" }
,["div",
{ "class": "atom-busy-image", "data-atom-init": "t73" }
], ["div",
{ "data-atom-init": "t74" }
], ["div",
{ "style": "height:3px; background-color:green", "data-atom-init": "t75" }
]]]]
;
jsonML["WebAtoms.AtomForm.errorTemplate"] = 
[["section",
{ "data-atom-type": "AtomItemsControl", "style": "overflow:auto", "data-atom-init": "t76" }
,["div",
{ "data-atom-template": "itemTemplate" }
,["span",
{ "data-atom-init": "t78" }
]]]]
;
jsonML["WebAtoms.AtomFormGridLayout.fieldTemplate"] = 
[["table",
{ "class": "atom-form-grid-row", "data-atom-type": "AtomFormField", "data-atom-init": "t79" }
,["tbody",
{  }
,["tr",
{  }
,["td",
{ "class": "atom-form-grid-label", "data-atom-init": "t80" }
], ["td",
{ "class": "atom-form-grid-required", "data-atom-init": "t81" }
,"*"], ["td",
{ "class": "atom-form-grid-content", "data-atom-presenter": "contentPresenter", "data-atom-init": "t82" }
,], ["td",
{ "data-atom-init": "t83" }
,]]]]]
;
jsonML["WebAtoms.AtomFormLayout.fieldTemplate"] = 
[["tr",
{ "data-atom-type": "AtomFormField" }
,["td",
{ "class": "atom-form-label", "data-atom-init": "t85" }
,["label",
{ "data-atom-init": "t86" }
]], ["td",
{ "class": "atom-form-required", "data-atom-init": "t87" }
,], ["td",
{ "class": "atom-form-content", "data-atom-presenter": "contentPresenter" }
,["span",
{ "style": "background-color:red;color:white; display:inline-block;float:right", "data-atom-init": "t89" }
]]]]
;
jsonML["WebAtoms.AtomFormVerticalLayout.fieldTemplate"] = 
[["tr",
{ "data-atom-type": "AtomFormField" }
,["td",
{  }
,["div",
{  }
,["span",
{ "class": "atom-form-label", "data-atom-init": "t91" }
], ["span",
{ "class": "atom-form-required", "data-atom-init": "t92" }
]], ["div",
{ "class": "atom-form-content", "data-atom-presenter": "contentPresenter", "data-atom-init": "t93" }
], ["div",
{ "class": "atom-form-error", "data-atom-init": "t94" }
]]]]
;
jsonML["WebAtoms.AtomWindow.alertTemplate"] = 
[["div",
{ "class": "atom-alert", "data-atom-dock": "Fill" }
,["pre",
{ "data-atom-init": "t96" }
,], ["div",
{ "class": "buttons", "data-atom-init": "t97" }
,["button",
{ "class": "ok", "data-atom-init": "t98" }
,"Ok"], ["button",
{ "class": "yes", "data-atom-init": "t99" }
,"Yes"], ["button",
{ "class": "no", "data-atom-init": "t100" }
,"No"]]]]
;
jsonML["WebAtoms.AtomWindow.frameTemplate"] = 
[["div",
{ "class": "atom-window-background", "data-atom-init": "t101" }
,["div",
{ "class": "atom-window", "data-atom-presenter": "windowDiv", "style": "position:absolute", "data-atom-type": "AtomDockPanel", "data-atom-init": "t102" }
,["div",
{ "class": "atom-window-title", "data-atom-dock": "Top", "data-atom-presenter": "windowTitleDiv", "data-atom-init": "t103" }
], ["div",
{ "class": "atom-window-close-button", "data-atom-presenter": "windowCloseButton", "data-atom-init": "t104" }
]]]]
;
jsonML["WebAtoms.AtomWindow.windowTemplate"] = 
[["iframe",
{ "class": "atom-window-frame", "data-atom-presenter": "iframe", "data-atom-init": "t105" }
,]]
;

        WebAtoms.PageSetup = WebAtoms.PageSetup || {};

    (function(window,WebAtoms){

        /* WebAtoms.AtomAutoCompleteBox.template */
this.t1= function(e){
this.bind(e,'styleDisplay',[
	['isPopupOpen']],
			0, function(v1){
				 return v1 ? '' : 'none'; 
			});
	this.bind(e,'value',
	['selectedText']);
};

this.t2= function(e){
this.bind(e,'placeholder',
	['placeholder']);
	this.bind(e,'value',['displayLabel'],true,null,'keyup')
};

this.t3= function(e){
this.bind(e,'styleLeft',[
	['offsetLeft']],
			0, function(v1){
				 return (v1 + 2) + 'px'; 
			});
	this.bind(e,'styleTop',[
	['offsetTop']],
			0, function(v1){
				 return (v1 + 24) + 'px'; 
			});
	this.bind(e,'styleDisplay',[
	['isPopupOpen']],
			0, function(v1){
				 return v1 ? 'block' : 'none'; 
			});
};

this.t4= function(e){
this.setLocalValue('text',  Atom.get(this,'data')[Atom.get(this,'templateParent.labelPath')] , e);
};

/* WebAtoms.AtomCalendar.itemTemplate */
this.t5= function(e){
this.bind(e,'class',[
	['data', 'isWeekEnd'],
	['data', 'isOtherMonth'],
	['data', 'isToday'],
	['scope', 'itemSelected']],
			0, function(v1,v2,v3,v4){
				 return  {
'weekend': v1,
other: v2,
today: v3,
'selected': v4 } ; 
			});
};

this.t6= function(e){
this.bind(e,'text',
	['data', 'label']);
};

/* WebAtoms.AtomCalendar.template */
this.t7= function(e){
this.setLocalValue('eventClick', Atom.get(this,'prevMonthCommand'), e);
	AtomProperties.text(e,"\u003c");
};

this.t8= function(e){
this.setLocalValue('items', AtomDate.monthList, e);
	this.bind(e,'value',['templateParent', 'month'],true)
};

this.t9= function(e){
this.bind(e,'items',[
	['value'],
	['templateParent', 'startYear'],
	['value'],
	['templateParent', 'endYear']],
			0, function(v1,v2,v3,v4){
				 return  Atom.range( v1 + v2, v3 + v4) ; 
			});
	this.bind(e,'value',['templateParent', 'year'],true)
};

this.t10= function(e){
this.setLocalValue('eventClick', Atom.get(this,'nextMonthCommand'), e);
	AtomProperties.text(e,"\u003e");
};

/* WebAtoms.AtomCheckBoxList.itemTemplate */
this.t13= function(e){
this.bind(e,'checked',['scope', 'itemSelected'],true)
};

this.t14= function(e){
this.setLocalValue('text', Atom.get(this,'data')[Atom.get(this,'templateParent.labelPath')], e);
};

/* WebAtoms.AtomDataPager.template */
this.t15= function(e){
this.bind(e,'isEnabled',[
	['pages', 'length'],
	['currentPage']],
			0, function(v1,v2){
				 return v1 > 1 && v2; 
			});
	this.setLocalValue('eventClick', Atom.get(this,'goFirstCommand'), e);
};

this.t16= function(e){
this.setLocalValue('eventClick', Atom.get(this,'goPrevCommand'), e);
	this.bind(e,'isEnabled',
	['currentPage']);
};

this.t17= function(e){
this.bind(e,'items',
	['atomParent', 'pages']);
	this.bind(e,'value',['atomParent', 'currentPage'],true)
};

this.t18= function(e){
this.setLocalValue('eventClick', Atom.get(this,'goNextCommand'), e);
	this.bind(e,'isEnabled',[
	['currentPage'],
	['pages', 'length']],
			0, function(v1,v2){
				 return v1 < v2 -1 ; 
			});
};

this.t19= function(e){
this.setLocalValue('eventClick', Atom.get(this,'goLastCommand'), e);
	this.bind(e,'isEnabled',[
	['pages', 'length'],
	['currentPage'],
	['pages', 'length']],
			0, function(v1,v2,v3){
				 return v1 > 1 && v2 < v3 -1 ; 
			});
};

/* WebAtoms.AtomDateField.popupTemplate */
this.t20= function(e){
this.bind(e,'styleLeft',[
	['offsetLeft']],
			0, function(v1){
				 return (v1 ) + 'px'; 
			});
	this.bind(e,'styleTop',[
	['offsetTop']],
			0, function(v1){
				 return (v1 + 25) + 'px'; 
			});
	this.bind(e,'class',[
	['isOpen']],
			0, function(v1){
				 return v1 ? 'popup-open' : 'popup-closed' ; 
			});
};

this.t22= function(e){
this.setLocalValue('items', AtomDate.monthList, e);
	this.bind(e,'value',['templateParent', 'month'],true)
};

this.t23= function(e){
this.bind(e,'startNumber',[
	['templateParent', 'currentYear'],
	['templateParent', 'startYear']],
			0, function(v1,v2){
				 return  v1 + v2; 
			});
	this.bind(e,'endNumber',[
	['templateParent', 'currentYear'],
	['templateParent', 'endYear']],
			0, function(v1,v2){
				 return  v1 + v2; 
			});
	this.bind(e,'value',['templateParent', 'year'],true)
};

this.t24= function(e){
this.bind(e,'items',
	['templateParent', 'items']);
};

this.t25= function(e){
this.setLocalValue('eventClick',  Atom.get(this,'templateParent.templateParent.toggleDateCommand') , e);
	this.bind(e,'class',[
	['data', 'isWeekEnd'],
	['data', 'isOtherMonth'],
	['data', 'isToday'],
	['templateParent', 'templateParent', 'selectedItems'],
	['data', 'value']],
			0, function(v1,v2,v3,v4,v5){
				 return  {
'list-item':true,
'weekend': v1,
other: v2,
today: v3,
'selected': Atom.query(v4).any({ value: v5}) } ; 
			});
};

this.t26= function(e){
this.bind(e,'text',
	['data', 'label']);
};

/* WebAtoms.AtomDateField.template */
this.t27= function(e){
this.bind(e,'class',[
	['isOpen']],
			0, function(v1){
				 return v1 ? 'date-label-open' : 'date-label-closed'; 
			});
	this.bind(e,'eventClick',[
	['isOpen']],
			0, function(v1){
				 return  { owner: { isOpen: ! v1 } } ; 
			});
	this.bind(e,'text',[
	['selectedItem'],
	['selectedItem', 'dateLabel']],
			0, function(v1,v2){
				 return  v1 ? v2 : 'SELECT' ; 
			});
};

/* WebAtoms.AtomDateListBox.template */
this.t28= function(e){
this.setLocalValue('items', AtomDate.monthList, e);
	this.bind(e,'value',['templateParent', 'month'],true)
};

this.t29= function(e){
this.bind(e,'items',[
	['value'],
	['templateParent', 'startYear'],
	['value'],
	['templateParent', 'endYear']],
			0, function(v1,v2,v3,v4){
				 return  Atom.range( v1 + v2, v3 + v4) ; 
			});
	this.bind(e,'value',['templateParent', 'year'],true)
};

this.t31= function(e){
this.setLocalValue('eventClick',  Atom.get(this,'templateParent.toggleDateCommand') , e);
	this.bind(e,'data',[
	['templateParent', 'items'],
	['scope', 'itemIndex']],
			0, function(v1,v2){
				 return v1[v2]; 
			});
	this.bind(e,'class',[
	['data', 'isWeekEnd'],
	['data', 'isOtherMonth'],
	['data', 'isToday'],
	['templateParent', 'selectedItems'],
	['data', 'value']],
			0, function(v1,v2,v3,v4,v5){
				 return  {
'list-item':true,
'weekend': v1,
other: v2,
today: v3,
'selected': Atom.query(v4).any({ value: v5}) } ; 
			});
};

this.t32= function(e){
this.bind(e,'text',
	['data', 'label']);
};

this.t33= function(e){
this.bind(e,'items',
	['templateParent', 'selectedItems']);
	this.setLocalValue('labelPath', "dateLabel", e);
	this.setLocalValue('valuePath', "date", e);
	this.bind(e,'value',['templateParent', 'visibleDate'],true)
};

this.t34= function(e){
this.setLocalValue('text', Atom.get(this,'data.dateLabel'), e);
};

/* WebAtoms.AtomItemsControl.itemTemplate */
this.t35= function(e){
this.bind(e,'text',[
	['data'],
	['atomParent', 'labelPath']],
			0, function(v1,v2){
				 return v1[v2]; 
			});
};

/* WebAtoms.AtomLinkBar.itemTemplate */
this.t36= function(e){
this.setLocalValue('class', Atom.get(this,'data')[Atom.get(this,'templateParent.itemsPath')] ? ((Atom.get(this,'data')[Atom.get(this,'templateParent.itemsPath')]).length ? 'sub-menu' : '' ) : '' , e);
};

this.t37= function(e){
this.setLocalValue('href', Atom.get(this,'data')[Atom.get(this,'atomParent.valuePath')], e);
	this.setLocalValue('target', Atom.get(this,'data')[Atom.get(this,'atomParent.targetPath')], e);
	this.setLocalValue('text', Atom.get(this,'data')[Atom.get(this,'atomParent.labelPath')], e);
};

/* WebAtoms.AtomLinkBar.menuTemplate */
this.t38= function(e){
this.bind(e,'items',[
	['data'],
	['templateParent', 'itemsPath']],
			0, function(v1,v2){
				 return v1[v2]; 
			});
	this.setLocalValue('menuTemplate', Atom.get(this,'templateParent.menuTemplate'), e);
	this.setLocalValue('menuDirection', "vertical", e);
};

this.t40= function(e){
this.setLocalValue('href', Atom.get(this,'data')[Atom.get(this,'templateParent.valuePath')], e);
	this.setLocalValue('text', Atom.get(this,'data')[Atom.get(this,'templateParent.labelPath')], e);
	this.setLocalValue('target', Atom.get(this,'data.target'), e);
	this.setLocalValue('eventClick', Atom.get(this,'data.action'), e);
};

/* WebAtoms.AtomNavigatorList.detailTemplate */
this.t41= function(e){
this.bind(e,'src',[
	['templateParent', 'displayMode'],
	['templateParent', 'displayMode'],
	['templateParent', 'newUrl'],
	['templateParent', 'detailUrl']],
			0, function(v1,v2,v3,v4){
				 return v1 == 1 ?( v2 == 2 ? v3 : v4 ): 'about:none'; 
			});
};

/* WebAtoms.AtomNavigatorList.template */
this.t42= function(e){
this.bind(e,'selectedIndex',
	['atomParent', 'displayMode']);
};

this.t45= function(e){
this.bind(e,'data',
	['templateParent', 'selectedItem']);
};

this.t47= function(e){
this.bind(e,'eventClick',
	['templateParent', 'backCommand']);
};

this.t48= function(e){
this.bind(e,'data',
	['templateParent', 'newItemCopy']);
};

this.t50= function(e){
this.bind(e,'eventClick',
	['templateParent', 'cancelAddCommand']);
};

/* WebAtoms.AtomRadioButtonList.itemTemplate */
this.t51= function(e){
this.bind(e,'checked',['scope', 'itemSelected'],true)
};

this.t52= function(e){
this.setLocalValue('text', Atom.get(this,'data.label'), e);
};

/* WebAtoms.AtomSortableColumn.template */
this.t53= function(e){
this.bind(e,'text',
	['label']);
};

/* WebAtoms.AtomTabControl.template */
this.t55= function(e){
this.setLocalValue('showTabs', "true", e);
	this.bind(e,'labelPath',
	['templateParent', 'labelPath']);
	this.bind(e,'items',
	['templateParent', 'items']);
	this.bind(e,'selectedIndex',['templateParent', 'selectedIndex'],true)
};

this.t56= function(e){
this.bind(e,'text',
	['data']);
};

this.t57= function(e){
this.bind(e,'selectedIndex',
	['templateParent', 'selectedIndex']);
};

/* WebAtoms.AtomTimeEditor.template */
this.t58= function(e){
this.bind(e,'value',['hours'],true)
};

this.t59= function(e){
this.bind(e,'value',['minutes'],true)
};

this.t60= function(e){
this.setLocalValue('items',  [ { label:'AM', value:'AM'},{ label:'PM', value:'PM'}] , e);
	this.bind(e,'value',['templateParent', 'ap'],true)
};

this.t61= function(e){
this.setLocalValue('text', Atom.get(this,'data.label'), e);
};

/* WebAtoms.AtomToggleButtonBar.itemTemplate */
this.t62= function(e){
this.setLocalValue('text', Atom.get(this,'data')[Atom.get(this,'atomParent.labelPath')], e);
};

/* WebAtoms.AtomWizard.template */
this.t63= function(e){
this.bind(e,'selectedIndex',['templateParent', 'currentStep'],true)
};

this.t65= function(e){
this.bind(e,'isEnabled',
	['canMoveBack']);
	this.setLocalValue('eventClick', Atom.get(this,'goPrevCommand'), e);
	this.bind(e,'styleVisibility',[
	['currentStep']],
			0, function(v1){
				 return v1 ? 'visible' : 'hidden'; 
			});
};

this.t66= function(e){
this.bind(e,'text',
	['prevLabel']);
};

this.t67= function(e){
this.bind(e,'class',[
	['nextClass'],
	['isLastStep']],
			0, function(v1,v2){
				 return v1 || (v2 ? 'finish-button' : ''); 
			});
	this.setLocalValue('eventClick', Atom.get(this,'nextCommand'), e);
	this.bind(e,'isEnabled',
	['nextCommand']);
};

this.t68= function(e){
this.bind(e,'text',[
	['isLastStep'],
	['finishLabel'],
	['nextLabel']],
			0, function(v1,v2,v3){
				 return v1 ? v2 : v3; 
			});
};

/* WebAtoms.AtomYesNoCustom.template */
this.t69= function(e){
this.bind(e,'value',['templateParent', 'hasValue'],true)
};

this.t70= function(e){
this.bind(e,'isEnabled',
	['hasValue']);
	this.bind(e,'placeholder',
	['placeholder']);
};

/* WebAtoms.AtomApplication.busyTemplate */
this.t71= function(e){
this.bind(e,'styleWidth',[
	['appWidth']],
			0, function(v1){
				 return v1 + 'px'; 
			});
	this.bind(e,'styleHeight',[
	['appHeight']],
			0, function(v1){
				 return v1 + 'px'; 
			});
	this.bind(e,'styleDisplay',[
	['isBusy']],
			0, function(v1){
				 return v1 ? 'block' : 'none'; 
			});
};

this.t72= function(e){
this.bind(e,'styleLeft',[
	['appWidth']],
			0, function(v1){
				 return ((v1/2)-100) + 'px'; 
			});
	this.bind(e,'styleTop',[
	['appHeight']],
			0, function(v1){
				 return ((v1/2)-25) + 'px'; 
			});
};

this.t73= function(e){
AtomProperties.absPos(e,"12,12,36,36");
};

this.t74= function(e){
AtomProperties.absPos(e,"56,24,145,null");
	this.bind(e,'text',[
	['busyMessage']],
			0, function(v1){
				 return v1 || 'Loading...'; 
			});
};

this.t75= function(e){
AtomProperties.absPos(e,"0,48");
	this.bind(e,'styleDisplay',[
	['isBusy'],
	['progress']],
			0, function(v1,v2){
				 return v1 && v2 ? 'block' : 'none'; 
			});
	this.bind(e,'styleWidth',[
	['progress']],
			0, function(v1){
				 return v1 + '%'; 
			});
};

/* WebAtoms.AtomForm.errorTemplate */
this.t76= function(e){
this.setLocalValue('items', Atom.get(this,'data'), e);
};

this.t78= function(e){
this.setLocalValue('text', Atom.get(this,'data.label'), e);
};

/* WebAtoms.AtomFormGridLayout.fieldTemplate */
this.t79= function(e){
this.bind(e,'class',
	['fieldClass']);
	this.bind(e,'styleDisplay',[
	['fieldVisible']],
			0, function(v1){
				 return v1 ? '' : 'none'; 
			});
};

this.t80= function(e){
this.bind(e,'text',
	['label']);
	this.bind(e,'styleMinWidth',[
	['atomParent', 'minLabelWidth'],
	['atomParent', 'minLabelWidth']],
			0, function(v1,v2){
				 return v1 ? (v2 + 'px') : undefined; 
			});
};

this.t81= function(e){
this.bind(e,'class',[
	['required']],
			0, function(v1){
				 return v1 ? 'atom-form-grid-required' : 'atom-form-grid-not-required'; 
			});
};

this.t82= function(e){
this.bind(e,'class',[
	['error']],
			0, function(v1){
				 return v1 ? 'atom-data-error' : ''; 
			});
};

this.t83= function(e){
this.bind(e,'class',[
	['error']],
			0, function(v1){
				 return v1 ? 'atom-data-error' : ''; 
			});
	this.bind(e,'text',[
	['error']],
			0, function(v1){
				 return v1 || ''; 
			});
	this.bind(e,'styleDisplay',[
	['error']],
			0, function(v1){
				 return v1 ? '' : 'none'; 
			});
};

/* WebAtoms.AtomFormLayout.fieldTemplate */
this.t85= function(e){
this.bind(e,'styleMinWidth',[
	['atomParent', 'minLabelWidth']],
			0, function(v1){
				 return v1 || undefined; 
			});
};

this.t86= function(e){
this.setLocalValue('for', Atom.get(this,'fieldId'), e);
	this.bind(e,'text',
	['label']);
};

this.t87= function(e){
this.bind(e,'text',[
	['required']],
			0, function(v1){
				 return v1 ? '*' : ''; 
			});
};

this.t89= function(e){
this.bind(e,'text',[
	['errors']],
			0, function(v1){
				 return Atom.csv(v1,'label') || ''; 
			});
};

/* WebAtoms.AtomFormVerticalLayout.fieldTemplate */
this.t91= function(e){
this.bind(e,'text',
	['label']);
};

this.t92= function(e){
this.bind(e,'text',[
	['required']],
			0, function(v1){
				 return v1 ? '*' : ''; 
			});
};

this.t93= function(e){
this.bind(e,'class',[
	['error']],
			0, function(v1){
				 return v1 ? 'atom-data-error' : ''; 
			});
};

this.t94= function(e){
this.bind(e,'text',[
	['error']],
			0, function(v1){
				 return v1 || ''; 
			});
};

/* WebAtoms.AtomWindow.alertTemplate */
this.t96= function(e){
this.setLocalValue('text', Atom.get(this,'data.Message'), e);
};

this.t97= function(e){
this.setLocalValue('class',  Atom.get(this,'data.Confirm') ? 'confirm-buttons' : 'alert-buttons' , e);
};

this.t98= function(e){
this.setLocalValue('eventClick', Atom.get(this,'templateParent.closeCommand'), e);
};

this.t99= function(e){
this.setLocalValue('eventClick',  [ { data: { ConfirmValue: true } } , Atom.get(this,'templateParent.closeCommand') ] , e);
};

this.t100= function(e){
this.setLocalValue('eventClick', Atom.get(this,'templateParent.closeCommand'), e);
};

/* WebAtoms.AtomWindow.frameTemplate */
this.t101= function(e){
this.bind(e,'styleWidth',[
	['appScope', 'owner', 'bodyWidth']],
			0, function(v1){
				 return v1 + 'px'; 
			});
	this.bind(e,'styleHeight',[
	['appScope', 'owner', 'appHeight']],
			0, function(v1){
				 return v1 + 'px'; 
			});
	this.bind(e,'styleDisplay',[
	['isOpen']],
			0, function(v1){
				 return v1 ? 'block' : 'none'; 
			});
};

this.t102= function(e){
this.bind(e,'styleWidth',[
	['atomParent', 'windowWidth']],
			0, function(v1){
				 return v1 + 'px'; 
			});
	this.bind(e,'styleHeight',[
	['atomParent', 'windowHeight']],
			0, function(v1){
				 return v1 + 'px'; 
			});
	this.bind(e,'styleLeft',[
	['appScope', 'owner', 'bodyWidth'],
	['atomParent', 'windowWidth']],
			0, function(v1,v2){
				 return ((v1-v2)/2) + 'px'; 
			});
	this.bind(e,'styleTop',[
	['appScope', 'owner', 'bodyHeight'],
	['atomParent', 'windowHeight']],
			0, function(v1,v2){
				 return ((v1-v2)/2) + 'px'; 
			});
};

this.t103= function(e){
this.bind(e,'text',
	['atomParent', 'title']);
};

this.t104= function(e){
this.setLocalValue('eventClick', Atom.get(this,'atomParent.cancelCommand'), e);
};

/* WebAtoms.AtomWindow.windowTemplate */
this.t105= function(e){
this.setLocalValue('src', Atom.get(this,'templateParent.url'), e);
};

              


    }).call(WebAtoms.PageSetup,window,WebAtoms);

		/*Line 0 - 'Stop.js' */var $x = {};

/*Line 2 - 'Stop.js' */window.$x = $x;


/*Line 5 - 'Stop.js' */$x.stop = function stop(test, msg) {
/*Line 6 - 'Stop.js' */    return function () {
/*Line 7 - 'Stop.js' */        if (test)
/*Line 8 - 'Stop.js' */            throw new Error(msg);
/*Line 9 - 'Stop.js' */    }
/*Line 10 - 'Stop.js' */}

/*Line 12 - 'Stop.js' */$x.stopIf = window.stop;

/*Line 14 - 'Stop.js' */$x.timeout = function (i, actions) {
/*Line 15 - 'Stop.js' */    return function () {
/*Line 16 - 'Stop.js' */        var self = this;
/*Line 17 - 'Stop.js' */        setTimeout(function () {
/*Line 18 - 'Stop.js' */            self.invokeAction(actions);
/*Line 19 - 'Stop.js' */        }, i);
/*Line 20 - 'Stop.js' */    }
/*Line 21 - 'Stop.js' */}

/*Line 23 - 'Stop.js' */$x.invoke = function(i,d,v){
/*Line 24 - 'Stop.js' */    return function(){
/*Line 25 - 'Stop.js' */        var a = {};
/*Line 26 - 'Stop.js' */        if(v !== undefined){
/*Line 27 - 'Stop.js' */            var x = {};
/*Line 28 - 'Stop.js' */            x[d] = v;
/*Line 29 - 'Stop.js' */            a[i] = x;        
/*Line 30 - 'Stop.js' */        }else{
/*Line 31 - 'Stop.js' */            a[i] = d;
/*Line 32 - 'Stop.js' */        }
/*Line 33 - 'Stop.js' */        this.invokeAction(a);
/*Line 34 - 'Stop.js' */    }
/*Line 35 - 'Stop.js' */}

/*Line 37 - 'Stop.js' */$x.data = function (d, v) {
/*Line 38 - 'Stop.js' */    return $x.invoke("data", d, v);
/*Line 39 - 'Stop.js' */}

/*Line 41 - 'Stop.js' */$x.scope = function (d,v) {
/*Line 42 - 'Stop.js' */    return $x.invoke("scope", d, v);
/*Line 43 - 'Stop.js' */}

/*Line 45 - 'Stop.js' */$x.localScope = function (d,v) {
/*Line 46 - 'Stop.js' */    return $x.invoke("localScope", d, v);
/*Line 47 - 'Stop.js' */}

/*Line 49 - 'Stop.js' */$x.appScope = function (d,v) {
/*Line 50 - 'Stop.js' */    return $x.invoke("appScope", d, v);
/*Line 51 - 'Stop.js' */}

/*Line 53 - 'Stop.js' */$x.owner = function (d,v) {
/*Line 54 - 'Stop.js' */    return $x.invoke("owner", d, v);
/*Line 55 - 'Stop.js' */}

/*Line 57 - 'Stop.js' */$x.if = function (c, r) {
/*Line 58 - 'Stop.js' */    if (c) return r;
/*Line 59 - 'Stop.js' */    return null;
/*Line 60 - 'Stop.js' */}

/*Line 62 - 'Stop.js' */$x.isValid = function (a) {
/*Line 63 - 'Stop.js' */    return function () {
/*Line 64 - 'Stop.js' */        this.validate();
/*Line 65 - 'Stop.js' */        var e = this.get_errors();
/*Line 66 - 'Stop.js' */        if (e && e.length) {
/*Line 67 - 'Stop.js' */            var msg = e.map(function (m) {
/*Line 68 - 'Stop.js' */                return m.label;
/*Line 69 - 'Stop.js' */            }).join("\n");
/*Line 70 - 'Stop.js' */            alert(msg);
/*Line 71 - 'Stop.js' */            return;
/*Line 72 - 'Stop.js' */        }
/*Line 73 - 'Stop.js' */        this.invokeAction(a);
/*Line 74 - 'Stop.js' */    };
/*Line 75 - 'Stop.js' */}

/*Line 77 - 'Stop.js' */$x.alert = function (msg) {
/*Line 78 - 'Stop.js' */    return function () {
/*Line 79 - 'Stop.js' */        alert(msg);
/*Line 80 - 'Stop.js' */    };
/*Line 81 - 'Stop.js' */};

/*Line 83 - 'Stop.js' */$x.focus = function (e) {
/*Line 84 - 'Stop.js' */    return function () {
/*Line 85 - 'Stop.js' */        var el = e._element || e;
/*Line 86 - 'Stop.js' */        el.focus();
/*Line 87 - 'Stop.js' */    }
/*Line 88 - 'Stop.js' */};

/*Line 90 - 'Stop.js' */$x.clearErrors = function (e) {
/*Line 91 - 'Stop.js' */    return function () {
/*Line 92 - 'Stop.js' */        window.errors.clear(e._element || e, true);
/*Line 93 - 'Stop.js' */    }
/*Line 94 - 'Stop.js' */};

/*Line 96 - 'Stop.js' */$x.confirm = function (msg, actions) {
/*Line 97 - 'Stop.js' */    return function () {
/*Line 98 - 'Stop.js' */        var self = this;
/*Line 99 - 'Stop.js' */        return Atom.confirm(msg, function () {
/*Line 100 - 'Stop.js' */            self.invokeAction(actions);
/*Line 101 - 'Stop.js' */        });
/*Line 102 - 'Stop.js' */    }
/*Line 103 - 'Stop.js' */}

/*Line 105 - 'Stop.js' */$x.window = function (path, props, data, next) {
/*Line 106 - 'Stop.js' */    var a = path;
/*Line 107 - 'Stop.js' */    var self = this;
/*Line 108 - 'Stop.js' */    if (arguments.length > 1) {
/*Line 109 - 'Stop.js' */        a = {
/*Line 110 - 'Stop.js' */            path: path,
/*Line 111 - 'Stop.js' */            prop: props,
/*Line 112 - 'Stop.js' */            next: next
/*Line 113 - 'Stop.js' */        };
/*Line 114 - 'Stop.js' */        if (data) {
/*Line 115 - 'Stop.js' */            var p = a.prop || {};
/*Line 116 - 'Stop.js' */            p.data = data;
/*Line 117 - 'Stop.js' */            a.prop = p;
/*Line 118 - 'Stop.js' */        }
/*Line 119 - 'Stop.js' */    } else {
/*Line 120 - 'Stop.js' */        a = {
/*Line 121 - 'Stop.js' */            prop: a,
/*Line 122 - 'Stop.js' */            path: a.path,
/*Line 123 - 'Stop.js' */            next: a.next,
/*Line 124 - 'Stop.js' */            scope: a.scope

/*Line 126 - 'Stop.js' */        };
/*Line 127 - 'Stop.js' */    }
/*Line 128 - 'Stop.js' */    return function () {
/*Line 129 - 'Stop.js' */        WebAtoms.AtomWindow.openNewWindow({
/*Line 130 - 'Stop.js' */            url: a,
/*Line 131 - 'Stop.js' */            scope: this.get_scope(),
/*Line 132 - 'Stop.js' */            opener: this
/*Line 133 - 'Stop.js' */        });
/*Line 134 - 'Stop.js' */    }
/*Line 135 - 'Stop.js' */};


/*Line 138 - 'Stop.js' */$x.localWindow = function (path, props, scope, next) {
/*Line 139 - 'Stop.js' */    var a = path;
/*Line 140 - 'Stop.js' */    if (arguments.length > 1) {
/*Line 141 - 'Stop.js' */        a = {
/*Line 142 - 'Stop.js' */            path: path,
/*Line 143 - 'Stop.js' */            prop: props,
/*Line 144 - 'Stop.js' */            next: next,
/*Line 145 - 'Stop.js' */            scope: scope
/*Line 146 - 'Stop.js' */        };
/*Line 147 - 'Stop.js' */    }
/*Line 148 - 'Stop.js' */    return function () {
/*Line 149 - 'Stop.js' */        WebAtoms.AtomWindow.openNewWindow({
/*Line 150 - 'Stop.js' */            url: a,
/*Line 151 - 'Stop.js' */            scope: this.get_scope(),
/*Line 152 - 'Stop.js' */            localScope: true,
/*Line 153 - 'Stop.js' */            opener: this
/*Line 154 - 'Stop.js' */        });
/*Line 155 - 'Stop.js' */    }
/*Line 156 - 'Stop.js' */};

/*Line 158 - 'Stop.js' */$x.reveal = function (e) {
/*Line 159 - 'Stop.js' */    return function () {

/*Line 161 - 'Stop.js' */    }
/*Line 162 - 'Stop.js' */};
/*Line 0 - 'ActionSet.js' */



/*Line 4 - 'ActionSet.js' */function runAction(action,evt) {

/*Line 6 - 'ActionSet.js' */    if (!action)
/*Line 7 - 'ActionSet.js' */        return;
/*Line 8 - 'ActionSet.js' */    if (action.constructor == String) {
/*Line 9 - 'ActionSet.js' */        location.href = action;
/*Line 10 - 'ActionSet.js' */    }
/*Line 11 - 'ActionSet.js' */    else {

/*Line 13 - 'ActionSet.js' */        var f = action;

/*Line 15 - 'ActionSet.js' */        // is it atomControl?
/*Line 16 - 'ActionSet.js' */        if (f.atomControl) {
/*Line 17 - 'ActionSet.js' */            f = f.atomControl;
/*Line 18 - 'ActionSet.js' */            if (f.refresh) {
/*Line 19 - 'ActionSet.js' */                f.refresh(this.get_scope(), this);
/*Line 20 - 'ActionSet.js' */            } else {
/*Line 21 - 'ActionSet.js' */                Atom.alert("no default action defined");
/*Line 22 - 'ActionSet.js' */            }
/*Line 23 - 'ActionSet.js' */        } else {
/*Line 24 - 'ActionSet.js' */            if (f._element) {
/*Line 25 - 'ActionSet.js' */                f.refresh(this.get_scope(), this);
/*Line 26 - 'ActionSet.js' */            } else {

/*Line 28 - 'ActionSet.js' */                //is it function

/*Line 30 - 'ActionSet.js' */                if ((typeof f) == 'function') {

/*Line 32 - 'ActionSet.js' */                    // invoke method...
/*Line 33 - 'ActionSet.js' */                    f.call(this, this.get_scope(), this, evt);
/*Line 34 - 'ActionSet.js' */                } else {

/*Line 36 - 'ActionSet.js' */                    // it is an array...
/*Line 37 - 'ActionSet.js' */                    if (f.length) {

/*Line 39 - 'ActionSet.js' */                        ae = new AtomEnumerator(f);
/*Line 40 - 'ActionSet.js' */                        while (ae.next()) {
/*Line 41 - 'ActionSet.js' */                            this.invokeAction(ae.current(), evt);
/*Line 42 - 'ActionSet.js' */                        }
/*Line 43 - 'ActionSet.js' */                        return;
/*Line 44 - 'ActionSet.js' */                    }

/*Line 46 - 'ActionSet.js' */                    // identify scope and actions...
/*Line 47 - 'ActionSet.js' */                    var action = (f.timeOut || f.timeout);
/*Line 48 - 'ActionSet.js' */                    if (action) {
/*Line 49 - 'ActionSet.js' */                        var _this = this;
/*Line 50 - 'ActionSet.js' */                        var tm = 100;
/*Line 51 - 'ActionSet.js' */                        if (action.hasOwnProperty("length")) {
/*Line 52 - 'ActionSet.js' */                            if (action.length > 1) {
/*Line 53 - 'ActionSet.js' */                                tm = action[0];
/*Line 54 - 'ActionSet.js' */                                action = action[1];
/*Line 55 - 'ActionSet.js' */                            }
/*Line 56 - 'ActionSet.js' */                        }
/*Line 57 - 'ActionSet.js' */                        setTimeout(function () {
/*Line 58 - 'ActionSet.js' */                            _this.invokeAction(action);
/*Line 59 - 'ActionSet.js' */                        }, tm);
/*Line 60 - 'ActionSet.js' */                        return;
/*Line 61 - 'ActionSet.js' */                    }
/*Line 62 - 'ActionSet.js' */                    this.set_merge(f);
/*Line 63 - 'ActionSet.js' */                    action = f.confirm;
/*Line 64 - 'ActionSet.js' */                    if (action) {
/*Line 65 - 'ActionSet.js' */                        var msg = "Are you sure?";
/*Line 66 - 'ActionSet.js' */                        if (action.hasOwnProperty("length")) {
/*Line 67 - 'ActionSet.js' */                            if (action.length > 1) {
/*Line 68 - 'ActionSet.js' */                                msg = action[0];
/*Line 69 - 'ActionSet.js' */                                action = action[1];
/*Line 70 - 'ActionSet.js' */                            } else {
/*Line 71 - 'ActionSet.js' */                                action = action[0];
/*Line 72 - 'ActionSet.js' */                            }
/*Line 73 - 'ActionSet.js' */                        }
/*Line 74 - 'ActionSet.js' */                        var _this = this;
/*Line 75 - 'ActionSet.js' */                        var _action = action;
/*Line 76 - 'ActionSet.js' */                        var _evt = evt;
/*Line 77 - 'ActionSet.js' */                        Atom.confirm(msg, function () {
/*Line 78 - 'ActionSet.js' */                            _this.invokeAction(_action, _evt);
/*Line 79 - 'ActionSet.js' */                        });
/*Line 80 - 'ActionSet.js' */                    }
/*Line 81 - 'ActionSet.js' */                    action = f.alert;
/*Line 82 - 'ActionSet.js' */                    if (action) {
/*Line 83 - 'ActionSet.js' */                        Atom.alert(action);
/*Line 84 - 'ActionSet.js' */                    }
/*Line 85 - 'ActionSet.js' */                    action = f.next;
/*Line 86 - 'ActionSet.js' */                    if (action) {
/*Line 87 - 'ActionSet.js' */                        this.invokeAction(action, evt);
/*Line 88 - 'ActionSet.js' */                        return;
/*Line 89 - 'ActionSet.js' */                    }
/*Line 90 - 'ActionSet.js' */                    action = f.control;
/*Line 91 - 'ActionSet.js' */                    if (action) {
/*Line 92 - 'ActionSet.js' */                        allControls[action].refresh();
/*Line 93 - 'ActionSet.js' */                    }
/*Line 94 - 'ActionSet.js' */                    action = f.window;
/*Line 95 - 'ActionSet.js' */                    if (action) {
/*Line 96 - 'ActionSet.js' */                        WebAtoms.AtomWindow.openNewWindow({
/*Line 97 - 'ActionSet.js' */                            url: action,
/*Line 98 - 'ActionSet.js' */                            localScope: false,
/*Line 99 - 'ActionSet.js' */                            opener: this,
/*Line 100 - 'ActionSet.js' */                            scope: this.get_scope()
/*Line 101 - 'ActionSet.js' */                        });
/*Line 102 - 'ActionSet.js' */                    }
/*Line 103 - 'ActionSet.js' */                    action = f.localWindow;
/*Line 104 - 'ActionSet.js' */                    if (action) {
/*Line 105 - 'ActionSet.js' */                        WebAtoms.AtomWindow.openNewWindow({
/*Line 106 - 'ActionSet.js' */                            url: action,
/*Line 107 - 'ActionSet.js' */                            localScope: true,
/*Line 108 - 'ActionSet.js' */                            opener: this,
/*Line 109 - 'ActionSet.js' */                            scope: this.get_scope()
/*Line 110 - 'ActionSet.js' */                        });
/*Line 111 - 'ActionSet.js' */                    }

/*Line 113 - 'ActionSet.js' */                }
/*Line 114 - 'ActionSet.js' */            }
/*Line 115 - 'ActionSet.js' */        }
/*Line 116 - 'ActionSet.js' */    }
/*Line 117 - 'ActionSet.js' */}
/*Line 0 - 'atom-filter.js' */(function (window) {

/*Line 2 - 'atom-filter.js' */    var AtomEnumerator = function (a) {
/*Line 3 - 'atom-filter.js' */        this.a = a;
/*Line 4 - 'atom-filter.js' */        this.i = -1;
/*Line 5 - 'atom-filter.js' */    };
/*Line 6 - 'atom-filter.js' */    AtomEnumerator.prototype = {
/*Line 7 - 'atom-filter.js' */        next: function () {
/*Line 8 - 'atom-filter.js' */            this.i++;
/*Line 9 - 'atom-filter.js' */            return this.i < this.a.length;
/*Line 10 - 'atom-filter.js' */        },
/*Line 11 - 'atom-filter.js' */        current: function () {
/*Line 12 - 'atom-filter.js' */            return this.a[this.i];
/*Line 13 - 'atom-filter.js' */        }
/*Line 14 - 'atom-filter.js' */    };


/*Line 17 - 'atom-filter.js' */    var AtomFilter = {
/*Line 18 - 'atom-filter.js' */        truef: function () {
/*Line 19 - 'atom-filter.js' */            return true;
/*Line 20 - 'atom-filter.js' */        },
/*Line 21 - 'atom-filter.js' */        falsef: function () {
/*Line 22 - 'atom-filter.js' */            return false;
/*Line 23 - 'atom-filter.js' */        },

/*Line 25 - 'atom-filter.js' */        get: function (item, n) {
/*Line 26 - 'atom-filter.js' */            if (!item)
/*Line 27 - 'atom-filter.js' */                return;
/*Line 28 - 'atom-filter.js' */            var i = n.indexOf('.');
/*Line 29 - 'atom-filter.js' */            if (i === -1) {
/*Line 30 - 'atom-filter.js' */                return item[n];
/*Line 31 - 'atom-filter.js' */            }
/*Line 32 - 'atom-filter.js' */            var l = n.substr(0, i);
/*Line 33 - 'atom-filter.js' */            n = n.substr(i + 1);
/*Line 34 - 'atom-filter.js' */            return AtomFilter.get(item[l], n);
/*Line 35 - 'atom-filter.js' */        },

/*Line 37 - 'atom-filter.js' */        escapeRegex: function (b, value, a, f) {
/*Line 38 - 'atom-filter.js' */            if (!value)
/*Line 39 - 'atom-filter.js' */                return {
/*Line 40 - 'atom-filter.js' */                    test: AtomFilter.falsef
/*Line 41 - 'atom-filter.js' */                };
/*Line 42 - 'atom-filter.js' */            var r = value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
/*Line 43 - 'atom-filter.js' */            if (b) r = b + r;
/*Line 44 - 'atom-filter.js' */            if (a) r = r + a;
/*Line 45 - 'atom-filter.js' */            return new RegExp(r, f);
/*Line 46 - 'atom-filter.js' */        },

/*Line 48 - 'atom-filter.js' */        compare: function (cmp, r) {
/*Line 49 - 'atom-filter.js' */            switch (cmp) {
/*Line 50 - 'atom-filter.js' */                case "==":
/*Line 51 - 'atom-filter.js' */                case "=":
/*Line 52 - 'atom-filter.js' */                    return function (l) {
/*Line 53 - 'atom-filter.js' */                        return l == r;
/*Line 54 - 'atom-filter.js' */                    };
/*Line 55 - 'atom-filter.js' */                case "<=":
/*Line 56 - 'atom-filter.js' */                    return function (l) {
/*Line 57 - 'atom-filter.js' */                        return l <= r;
/*Line 58 - 'atom-filter.js' */                    };
/*Line 59 - 'atom-filter.js' */                case ">=":
/*Line 60 - 'atom-filter.js' */                    return function (l) {
/*Line 61 - 'atom-filter.js' */                        return l >= r;
/*Line 62 - 'atom-filter.js' */                    };
/*Line 63 - 'atom-filter.js' */                case "<":
/*Line 64 - 'atom-filter.js' */                    return function (l) {
/*Line 65 - 'atom-filter.js' */                        return l < r;
/*Line 66 - 'atom-filter.js' */                    };
/*Line 67 - 'atom-filter.js' */                case ">":
/*Line 68 - 'atom-filter.js' */                    return function (l) {
/*Line 69 - 'atom-filter.js' */                        return l > r;
/*Line 70 - 'atom-filter.js' */                    };
/*Line 71 - 'atom-filter.js' */                case "between":
/*Line 72 - 'atom-filter.js' */                    return function (l) {
/*Line 73 - 'atom-filter.js' */                        return l >= r[0] && l <= r[1];
/*Line 74 - 'atom-filter.js' */                    };
/*Line 75 - 'atom-filter.js' */                case "equals":
/*Line 76 - 'atom-filter.js' */                    r = AtomFilter.escapeRegex("^", r, "$", "i");
/*Line 77 - 'atom-filter.js' */                    return function (l) {
/*Line 78 - 'atom-filter.js' */                        if (!l)
/*Line 79 - 'atom-filter.js' */                            return !r;
/*Line 80 - 'atom-filter.js' */                        return r.test(l);
/*Line 81 - 'atom-filter.js' */                    };

/*Line 83 - 'atom-filter.js' */                case "contains":
/*Line 84 - 'atom-filter.js' */                    r = AtomFilter.escapeRegex("", r, "", "i");
/*Line 85 - 'atom-filter.js' */                    return function (l) {
/*Line 86 - 'atom-filter.js' */                        if (!l) return false;
/*Line 87 - 'atom-filter.js' */                        return r.test(l);
/*Line 88 - 'atom-filter.js' */                    };
/*Line 89 - 'atom-filter.js' */                case "startswith":
/*Line 90 - 'atom-filter.js' */                    r = AtomFilter.escapeRegex("^", r, "", "i");
/*Line 91 - 'atom-filter.js' */                    return function (l) {
/*Line 92 - 'atom-filter.js' */                        if (!l)
/*Line 93 - 'atom-filter.js' */                            return !r;
/*Line 94 - 'atom-filter.js' */                        return r.test(l);
/*Line 95 - 'atom-filter.js' */                    };
/*Line 96 - 'atom-filter.js' */                case "endswith":
/*Line 97 - 'atom-filter.js' */                    r = AtomFilter.escapeRegex("", r, "$", "i");
/*Line 98 - 'atom-filter.js' */                    return function (l) {
/*Line 99 - 'atom-filter.js' */                        if (!l)
/*Line 100 - 'atom-filter.js' */                            return !r;
/*Line 101 - 'atom-filter.js' */                        return r.test(l);
/*Line 102 - 'atom-filter.js' */                    };

/*Line 104 - 'atom-filter.js' */                case "equals":
/*Line 105 - 'atom-filter.js' */                    r = AtomFilter.escapeRegex("^", r, "$");
/*Line 106 - 'atom-filter.js' */                    return function (l) {
/*Line 107 - 'atom-filter.js' */                        if (!l)
/*Line 108 - 'atom-filter.js' */                            return !r;
/*Line 109 - 'atom-filter.js' */                        return r.test(l);
/*Line 110 - 'atom-filter.js' */                    };

/*Line 112 - 'atom-filter.js' */                case "containscs":
/*Line 113 - 'atom-filter.js' */                    r = AtomFilter.escapeRegex("", r, "");
/*Line 114 - 'atom-filter.js' */                    return function (l) {
/*Line 115 - 'atom-filter.js' */                        if (!l) return false;
/*Line 116 - 'atom-filter.js' */                        return r.test(l);
/*Line 117 - 'atom-filter.js' */                    };
/*Line 118 - 'atom-filter.js' */                case "startswithcs":
/*Line 119 - 'atom-filter.js' */                    r = AtomFilter.escapeRegex("^", r, "");
/*Line 120 - 'atom-filter.js' */                    return function (l) {
/*Line 121 - 'atom-filter.js' */                        if (!l)
/*Line 122 - 'atom-filter.js' */                            return !r;
/*Line 123 - 'atom-filter.js' */                        return r.test(l);
/*Line 124 - 'atom-filter.js' */                    };
/*Line 125 - 'atom-filter.js' */                case "endswithcs":
/*Line 126 - 'atom-filter.js' */                    r = AtomFilter.escapeRegex("", r, "$");
/*Line 127 - 'atom-filter.js' */                    return function (l) {
/*Line 128 - 'atom-filter.js' */                        if (!l)
/*Line 129 - 'atom-filter.js' */                            return !r;
/*Line 130 - 'atom-filter.js' */                        return r.test(l);
/*Line 131 - 'atom-filter.js' */                    };
/*Line 132 - 'atom-filter.js' */                case "~":
/*Line 133 - 'atom-filter.js' */                    return function (l) {
/*Line 134 - 'atom-filter.js' */                        return r.test(l);
/*Line 135 - 'atom-filter.js' */                    };

/*Line 137 - 'atom-filter.js' */                case "in":
/*Line 138 - 'atom-filter.js' */                    return function (l) {
/*Line 139 - 'atom-filter.js' */                        if (!l) return false;
/*Line 140 - 'atom-filter.js' */                        var ae = new AtomEnumerator(r);
/*Line 141 - 'atom-filter.js' */                        while (ae.next()) {
/*Line 142 - 'atom-filter.js' */                            var item = ae.current();
/*Line 143 - 'atom-filter.js' */                            if (item == l)
/*Line 144 - 'atom-filter.js' */                                return true;
/*Line 145 - 'atom-filter.js' */                        }
/*Line 146 - 'atom-filter.js' */                        return false;
/*Line 147 - 'atom-filter.js' */                    };
/*Line 148 - 'atom-filter.js' */                    // has a value in an array
/*Line 149 - 'atom-filter.js' */                case "has":
/*Line 150 - 'atom-filter.js' */                    return function (l) {
/*Line 151 - 'atom-filter.js' */                        if (!l) return false;
/*Line 152 - 'atom-filter.js' */                        var ae = new AtomEnumerator(l);
/*Line 153 - 'atom-filter.js' */                        while (ae.next()) {
/*Line 154 - 'atom-filter.js' */                            var item = ae.current();
/*Line 155 - 'atom-filter.js' */                            if (item == r)
/*Line 156 - 'atom-filter.js' */                                return true;
/*Line 157 - 'atom-filter.js' */                        }
/*Line 158 - 'atom-filter.js' */                        return false;
/*Line 159 - 'atom-filter.js' */                    }
/*Line 160 - 'atom-filter.js' */                case "any":
/*Line 161 - 'atom-filter.js' */                    var rf = AtomFilter.filter(r);
/*Line 162 - 'atom-filter.js' */                    return function (l) {
/*Line 163 - 'atom-filter.js' */                        if (!l) return false;
/*Line 164 - 'atom-filter.js' */                        var ae = new AtomEnumerator(l);
/*Line 165 - 'atom-filter.js' */                        while (ae.next()) {
/*Line 166 - 'atom-filter.js' */                            var item = ae.current();
/*Line 167 - 'atom-filter.js' */                            if (rf(item))
/*Line 168 - 'atom-filter.js' */                                return true;
/*Line 169 - 'atom-filter.js' */                        }
/*Line 170 - 'atom-filter.js' */                        return false;
/*Line 171 - 'atom-filter.js' */                    }
/*Line 172 - 'atom-filter.js' */                case "all":
/*Line 173 - 'atom-filter.js' */                    var rf = AtomFilter.filter(r);
/*Line 174 - 'atom-filter.js' */                    return function (l) {
/*Line 175 - 'atom-filter.js' */                        if (!l) return false;
/*Line 176 - 'atom-filter.js' */                        var ae = new AtomEnumerator(l);
/*Line 177 - 'atom-filter.js' */                        while (ae.next()) {
/*Line 178 - 'atom-filter.js' */                            if (!rf(item))
/*Line 179 - 'atom-filter.js' */                                return false;
/*Line 180 - 'atom-filter.js' */                        }
/*Line 181 - 'atom-filter.js' */                        return true;
/*Line 182 - 'atom-filter.js' */                    }
/*Line 183 - 'atom-filter.js' */                default:
/*Line 184 - 'atom-filter.js' */                    return function (l) {
/*Line 185 - 'atom-filter.js' */                        return false;
/*Line 186 - 'atom-filter.js' */                    };
/*Line 187 - 'atom-filter.js' */            }
/*Line 188 - 'atom-filter.js' */        },

/*Line 190 - 'atom-filter.js' */        isString: function (a) {
/*Line 191 - 'atom-filter.js' */            return typeof a == 'string' || a instanceof String;
/*Line 192 - 'atom-filter.js' */        },

/*Line 194 - 'atom-filter.js' */        sort: function (orderBy) {

/*Line 196 - 'atom-filter.js' */            if (!AtomFilter.isString(orderBy)) {
/*Line 197 - 'atom-filter.js' */                return orderBy;
/*Line 198 - 'atom-filter.js' */            }

/*Line 200 - 'atom-filter.js' */            var fields = orderBy.split(',');
/*Line 201 - 'atom-filter.js' */            fields = fields.map(function (item) {
/*Line 202 - 'atom-filter.js' */                var tokens = item.split(' ');
/*Line 203 - 'atom-filter.js' */                var desc = tokens[1] || 'asc';
/*Line 204 - 'atom-filter.js' */                return {
/*Line 205 - 'atom-filter.js' */                    field: tokens[0],
/*Line 206 - 'atom-filter.js' */                    desc: /desc/i.test(desc),
/*Line 207 - 'atom-filter.js' */                    cs: /^cs/i.test(desc)
/*Line 208 - 'atom-filter.js' */                }
/*Line 209 - 'atom-filter.js' */            });

/*Line 211 - 'atom-filter.js' */            return function (a, b) {

/*Line 213 - 'atom-filter.js' */                if (a == null || a == undefined) {
/*Line 214 - 'atom-filter.js' */                    return b == null || b == undefined ? 0 : 1;
/*Line 215 - 'atom-filter.js' */                }
/*Line 216 - 'atom-filter.js' */                if (b == null || b == undefined) {
/*Line 217 - 'atom-filter.js' */                    return 1;
/*Line 218 - 'atom-filter.js' */                }

/*Line 220 - 'atom-filter.js' */                for (var i = 0; i < fields.length; i++) {
/*Line 221 - 'atom-filter.js' */                    var f = fields[i];
/*Line 222 - 'atom-filter.js' */                    var field = f.field;
/*Line 223 - 'atom-filter.js' */                    var af = a[field];
/*Line 224 - 'atom-filter.js' */                    var bf = b[field];
/*Line 225 - 'atom-filter.js' */                    if (f.desc) {
/*Line 226 - 'atom-filter.js' */                        var t = af;
/*Line 227 - 'atom-filter.js' */                        af = bf;
/*Line 228 - 'atom-filter.js' */                        bf = t;
/*Line 229 - 'atom-filter.js' */                    }
/*Line 230 - 'atom-filter.js' */                    if (af == bf)
/*Line 231 - 'atom-filter.js' */                        continue;
/*Line 232 - 'atom-filter.js' */                    if (!af) {
/*Line 233 - 'atom-filter.js' */                        return !bf ? 0 : -1;
/*Line 234 - 'atom-filter.js' */                    }
/*Line 235 - 'atom-filter.js' */                    if (!bf) {
/*Line 236 - 'atom-filter.js' */                        return !af ? 0 : 1;
/*Line 237 - 'atom-filter.js' */                    }
/*Line 238 - 'atom-filter.js' */                    if (AtomFilter.isString(af)) {
/*Line 239 - 'atom-filter.js' */                        if (f.cs) {
/*Line 240 - 'atom-filter.js' */                            return af.localeCompare(bf);
/*Line 241 - 'atom-filter.js' */                        } else {
/*Line 242 - 'atom-filter.js' */                            af = af.toLowerCase();
/*Line 243 - 'atom-filter.js' */                            bf = bf.toLowerCase();
/*Line 244 - 'atom-filter.js' */                            if (af == bf)
/*Line 245 - 'atom-filter.js' */                                continue;
/*Line 246 - 'atom-filter.js' */                            return af.localeCompare(bf);
/*Line 247 - 'atom-filter.js' */                        }
/*Line 248 - 'atom-filter.js' */                    }

/*Line 250 - 'atom-filter.js' */                }
/*Line 251 - 'atom-filter.js' */                return 0;
/*Line 252 - 'atom-filter.js' */            }
/*Line 253 - 'atom-filter.js' */        },

/*Line 255 - 'atom-filter.js' */        build: function (ae, i, v, q, cor) {
/*Line 256 - 'atom-filter.js' */            if (i === '$or') {
/*Line 257 - 'atom-filter.js' */                var orf = AtomFilter.filter(v, true);
/*Line 258 - 'atom-filter.js' */                ae.push(function (item) {
/*Line 259 - 'atom-filter.js' */                    return orf(item);
/*Line 260 - 'atom-filter.js' */                });
/*Line 261 - 'atom-filter.js' */                return;
/*Line 262 - 'atom-filter.js' */            }
/*Line 263 - 'atom-filter.js' */            if (i === '$and') {
/*Line 264 - 'atom-filter.js' */                var orf = AtomFilter.filter(v, false);
/*Line 265 - 'atom-filter.js' */                ae.push(function (item) {
/*Line 266 - 'atom-filter.js' */                    return orf(item);
/*Line 267 - 'atom-filter.js' */                });
/*Line 268 - 'atom-filter.js' */                return;
/*Line 269 - 'atom-filter.js' */            }
/*Line 270 - 'atom-filter.js' */            if (i === '$not') {
/*Line 271 - 'atom-filter.js' */                var fn = AtomFilter.filter(v, cor);
/*Line 272 - 'atom-filter.js' */                ae.push(function (item) {
/*Line 273 - 'atom-filter.js' */                    return !fn(item);
/*Line 274 - 'atom-filter.js' */                });
/*Line 275 - 'atom-filter.js' */                return;
/*Line 276 - 'atom-filter.js' */            }
/*Line 277 - 'atom-filter.js' */            var args = i.split(' ');
/*Line 278 - 'atom-filter.js' */            if (args.length === 1) {
/*Line 279 - 'atom-filter.js' */                args = i.split(':');
/*Line 280 - 'atom-filter.js' */            }

/*Line 282 - 'atom-filter.js' */            var n = args[0];
/*Line 283 - 'atom-filter.js' */            var cond = "==";
/*Line 284 - 'atom-filter.js' */            if (args.length === 2) {
/*Line 285 - 'atom-filter.js' */                cond = args[1];
/*Line 286 - 'atom-filter.js' */            }

/*Line 288 - 'atom-filter.js' */            var left = function (item) {
/*Line 289 - 'atom-filter.js' */                return AtomFilter.get(item, n);
/*Line 290 - 'atom-filter.js' */            };
/*Line 291 - 'atom-filter.js' */            if (cond.indexOf('!') !== 0) {
/*Line 292 - 'atom-filter.js' */                var compF = AtomFilter.compare(cond, v);
/*Line 293 - 'atom-filter.js' */                var fx = function (item) {
/*Line 294 - 'atom-filter.js' */                    var l = left(item);
/*Line 295 - 'atom-filter.js' */                    return compF(l);
/*Line 296 - 'atom-filter.js' */                };
/*Line 297 - 'atom-filter.js' */                ae.push(fx);

/*Line 299 - 'atom-filter.js' */            } else {
/*Line 300 - 'atom-filter.js' */                cond = cond.substr(1);
/*Line 301 - 'atom-filter.js' */                var compF = AtomFilter.compare(cond, v);
/*Line 302 - 'atom-filter.js' */                var fx = function (item) {
/*Line 303 - 'atom-filter.js' */                    var l = left(item);
/*Line 304 - 'atom-filter.js' */                    return !compF(l);
/*Line 305 - 'atom-filter.js' */                };
/*Line 306 - 'atom-filter.js' */                ae.push(fx);
/*Line 307 - 'atom-filter.js' */            }
/*Line 308 - 'atom-filter.js' */        },

/*Line 310 - 'atom-filter.js' */        filter: function (q, cor) {
/*Line 311 - 'atom-filter.js' */            // compiles json object into function
/*Line 312 - 'atom-filter.js' */            // that accepts object and returns true/false

/*Line 314 - 'atom-filter.js' */            if (q === false)
/*Line 315 - 'atom-filter.js' */                return AtomFilter.falsef;
/*Line 316 - 'atom-filter.js' */            if (!q)
/*Line 317 - 'atom-filter.js' */                return AtomFilter.truef;

/*Line 319 - 'atom-filter.js' */            var ae = [];

/*Line 321 - 'atom-filter.js' */            for (var i in q) {
/*Line 322 - 'atom-filter.js' */                if (!q.hasOwnProperty(i))
/*Line 323 - 'atom-filter.js' */                    continue;
/*Line 324 - 'atom-filter.js' */                var v = q[i];
/*Line 325 - 'atom-filter.js' */                AtomFilter.build(ae, i, v, q, cor);
/*Line 326 - 'atom-filter.js' */            }

/*Line 328 - 'atom-filter.js' */            return function (item) {

/*Line 330 - 'atom-filter.js' */                var e = new AtomEnumerator(ae);
/*Line 331 - 'atom-filter.js' */                var a = [];
/*Line 332 - 'atom-filter.js' */                while (e.next()) {
/*Line 333 - 'atom-filter.js' */                    var ec = e.current();
/*Line 334 - 'atom-filter.js' */                    var r = ec(item);
/*Line 335 - 'atom-filter.js' */                    a.push(r);
/*Line 336 - 'atom-filter.js' */                    if (r) {
/*Line 337 - 'atom-filter.js' */                        if (cor) {
/*Line 338 - 'atom-filter.js' */                            return true;
/*Line 339 - 'atom-filter.js' */                        }
/*Line 340 - 'atom-filter.js' */                    } else {
/*Line 341 - 'atom-filter.js' */                        if (!cor)
/*Line 342 - 'atom-filter.js' */                            return false;
/*Line 343 - 'atom-filter.js' */                    }
/*Line 344 - 'atom-filter.js' */                }

/*Line 346 - 'atom-filter.js' */                e = new AtomEnumerator(a);
/*Line 347 - 'atom-filter.js' */                while (e.next()) {
/*Line 348 - 'atom-filter.js' */                    if (!e.current())
/*Line 349 - 'atom-filter.js' */                        return false;
/*Line 350 - 'atom-filter.js' */                }

/*Line 352 - 'atom-filter.js' */                return true;
/*Line 353 - 'atom-filter.js' */            };

/*Line 355 - 'atom-filter.js' */        }

/*Line 357 - 'atom-filter.js' */    };

/*Line 359 - 'atom-filter.js' */    window.$f = AtomFilter.filter;

/*Line 361 - 'atom-filter.js' */    if (!Array.prototype.filter) {
/*Line 362 - 'atom-filter.js' */        Array.prototype.filter = function (f) {
/*Line 363 - 'atom-filter.js' */            var r = [];
/*Line 364 - 'atom-filter.js' */            for (var i = 0; i < this.length; i++) {
/*Line 365 - 'atom-filter.js' */                var v = this[i];
/*Line 366 - 'atom-filter.js' */                if (f(v, i)) r.push(v);
/*Line 367 - 'atom-filter.js' */            }
/*Line 368 - 'atom-filter.js' */            return r;
/*Line 369 - 'atom-filter.js' */        };
/*Line 370 - 'atom-filter.js' */    }

/*Line 372 - 'atom-filter.js' */    var af = Array.prototype.filter;

/*Line 374 - 'atom-filter.js' */    Array.prototype.filter = function (i) {
/*Line 375 - 'atom-filter.js' */        if (i instanceof Function || typeof i == 'function') {
/*Line 376 - 'atom-filter.js' */            return af.call(this, i);
/*Line 377 - 'atom-filter.js' */        }
/*Line 378 - 'atom-filter.js' */        return af.call(this, $f(i));
/*Line 379 - 'atom-filter.js' */    };

/*Line 381 - 'atom-filter.js' */    var aps = Array.prototype.sort;

/*Line 383 - 'atom-filter.js' */    Array.prototype.sort = function (s) {
/*Line 384 - 'atom-filter.js' */        var f = AtomFilter.sort(s);
/*Line 385 - 'atom-filter.js' */        return aps.call(this, f);
/*Line 386 - 'atom-filter.js' */    };

/*Line 388 - 'atom-filter.js' */})(window);
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

/*Line 18 - 'AtomEvaluator.js' */        var regex = /(?:(\$)(window|appScope|scope|data|owner|localScope|templateParent))(?:\.[a-zA-Z_][a-zA-Z_0-9]*)*/gi;

/*Line 20 - 'AtomEvaluator.js' */        var keywords = /(window|appScope|scope|data|owner|localScope|templateParent)/gi;

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
/*Line 68 - 'AtomEvaluator.js' */        vars.push("$x");

/*Line 70 - 'AtomEvaluator.js' */        e = new Function(vars,method);
/*Line 71 - 'AtomEvaluator.js' */        this.ecache[k] = e;
/*Line 72 - 'AtomEvaluator.js' */        return e;
/*Line 73 - 'AtomEvaluator.js' */    }
/*Line 74 - 'AtomEvaluator.js' */};

/*Line 76 - 'AtomEvaluator.js' */window.AtomEvaluator = AtomEvaluator;
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



/*Line 0 - 'Atom.js' */
/*Line 1 - 'Atom.js' */
/*Line 2 - 'Atom.js' */
/*Line 3 - 'Atom.js' */

/*Line 5 - 'Atom.js' */var AtomEnumerator = (function () {
/*Line 6 - 'Atom.js' */    return classCreator("AtomEnumerator",null,
/*Line 7 - 'Atom.js' */    function (array) {
/*Line 8 - 'Atom.js' */        this._array = array;
/*Line 9 - 'Atom.js' */        this.i = -1;
/*Line 10 - 'Atom.js' */    },
/*Line 11 - 'Atom.js' */    {
/*Line 12 - 'Atom.js' */        next: function () {
/*Line 13 - 'Atom.js' */            this.i = this.i + 1;
/*Line 14 - 'Atom.js' */            return this.i < this._array.length;
/*Line 15 - 'Atom.js' */        },
/*Line 16 - 'Atom.js' */        current: function () {
/*Line 17 - 'Atom.js' */            return this._array[this.i];
/*Line 18 - 'Atom.js' */        },
/*Line 19 - 'Atom.js' */        currentIndex: function () {
/*Line 20 - 'Atom.js' */            return this.i;
/*Line 21 - 'Atom.js' */        },
/*Line 22 - 'Atom.js' */        isFirst: function () {
/*Line 23 - 'Atom.js' */            return this.i == 0;
/*Line 24 - 'Atom.js' */        },
/*Line 25 - 'Atom.js' */        isLast: function () {
/*Line 26 - 'Atom.js' */            return this.i == this._array.length - 1;
/*Line 27 - 'Atom.js' */        },
/*Line 28 - 'Atom.js' */        reset: function () {
/*Line 29 - 'Atom.js' */            this.i = -1;
/*Line 30 - 'Atom.js' */        }
/*Line 31 - 'Atom.js' */    });
/*Line 32 - 'Atom.js' */})();

/*Line 34 - 'Atom.js' */window.AtomEnumerator = AtomEnumerator;
    

/*Line 37 - 'Atom.js' */var Atom = {

/*Line 39 - 'Atom.js' */    refreshWindowCommand: function () {
/*Line 40 - 'Atom.js' */        location.reload(true);
/*Line 41 - 'Atom.js' */        //var q = location.search || "?";
/*Line 42 - 'Atom.js' */        //var tq = q.split('&').filter(function (p) {
/*Line 43 - 'Atom.js' */        //    return !(/^\_v\=/i.test(p));
/*Line 44 - 'Atom.js' */        //}).join("&");
/*Line 45 - 'Atom.js' */        //var url = location.pathname + tq + "_v=" + (new Date()).getTime() + location.hash;
/*Line 46 - 'Atom.js' */        //if (window.console) window.console.log("Refreshing: " + url);
/*Line 47 - 'Atom.js' */        //location.href = url;
/*Line 48 - 'Atom.js' */    },

/*Line 50 - 'Atom.js' */    time: function () {
/*Line 51 - 'Atom.js' */        return (new Date()).getTime();
/*Line 52 - 'Atom.js' */    },

/*Line 54 - 'Atom.js' */    get: function (obj, path) {
/*Line 55 - 'Atom.js' */        var index = path.indexOf('.');
/*Line 56 - 'Atom.js' */        if (index != -1) {
/*Line 57 - 'Atom.js' */            var f = path.substr(0, index);
/*Line 58 - 'Atom.js' */            obj = AtomBinder.getValue(obj, f);
/*Line 59 - 'Atom.js' */            path = path.substr(index + 1);
/*Line 60 - 'Atom.js' */            return Atom.get(obj, path);
/*Line 61 - 'Atom.js' */        }
/*Line 62 - 'Atom.js' */        return AtomBinder.getValue(obj, path);
/*Line 63 - 'Atom.js' */    },

/*Line 65 - 'Atom.js' */    set: function (obj, path, val) {
/*Line 66 - 'Atom.js' */        if (!obj) return;
/*Line 67 - 'Atom.js' */        var index = path.indexOf('.');
/*Line 68 - 'Atom.js' */        if (index != -1) {
/*Line 69 - 'Atom.js' */            var f = path.substr(0, index);
/*Line 70 - 'Atom.js' */            obj = AtomBinder.getValue(obj, f);
/*Line 71 - 'Atom.js' */            path = path.substr(index + 1);
/*Line 72 - 'Atom.js' */            return Atom.set(obj, path,val);
/*Line 73 - 'Atom.js' */        }
/*Line 74 - 'Atom.js' */        AtomBinder.setValue(obj, path, val);
/*Line 75 - 'Atom.js' */    },

/*Line 77 - 'Atom.js' */    csv: function (a, path, s) {
/*Line 78 - 'Atom.js' */        if (!s) {
/*Line 79 - 'Atom.js' */            s = ", ";
/*Line 80 - 'Atom.js' */        }
/*Line 81 - 'Atom.js' */        var l = [];
/*Line 82 - 'Atom.js' */        var ae = new AtomEnumerator(a);
/*Line 83 - 'Atom.js' */        while (ae.next()) {
/*Line 84 - 'Atom.js' */            var item = ae.current();
/*Line 85 - 'Atom.js' */            l.push(Atom.get(item,path));
/*Line 86 - 'Atom.js' */        }
/*Line 87 - 'Atom.js' */        return l.join(s);
/*Line 88 - 'Atom.js' */    },

/*Line 90 - 'Atom.js' */    range: function (start, end, step) {
/*Line 91 - 'Atom.js' */        var a = [];
/*Line 92 - 'Atom.js' */        step = step || 1;
/*Line 93 - 'Atom.js' */        for (var i = start; i <= end; i+=step) {
/*Line 94 - 'Atom.js' */            a.push({ label: i, value: i });
/*Line 95 - 'Atom.js' */        }
/*Line 96 - 'Atom.js' */        return a;
/*Line 97 - 'Atom.js' */    },

/*Line 99 - 'Atom.js' */    merge: function (x, y, update, clone) {
/*Line 100 - 'Atom.js' */        //var c = AtomBinder.getClone(y);
/*Line 101 - 'Atom.js' */        if (!x)
/*Line 102 - 'Atom.js' */            return;
/*Line 103 - 'Atom.js' */        var c = clone ? AtomBinder.getClone(y) : y;
/*Line 104 - 'Atom.js' */        if (update) {
/*Line 105 - 'Atom.js' */            for (var k in c) {
/*Line 106 - 'Atom.js' */                //x[k] = c[k];
/*Line 107 - 'Atom.js' */                Atom.set(x, k, AtomBinder.getValue(c, k));
/*Line 108 - 'Atom.js' */            }
/*Line 109 - 'Atom.js' */        } else {
/*Line 110 - 'Atom.js' */            for (var k in c) {
/*Line 111 - 'Atom.js' */                x[k] = c[k];
/*Line 112 - 'Atom.js' */            }
/*Line 113 - 'Atom.js' */        }
/*Line 114 - 'Atom.js' */        return x;
/*Line 115 - 'Atom.js' */    },

/*Line 117 - 'Atom.js' */    url: function (url, q, lq) {
/*Line 118 - 'Atom.js' */        var finalUrl = url;
/*Line 119 - 'Atom.js' */        var plist = [];
/*Line 120 - 'Atom.js' */        if (q) {
/*Line 121 - 'Atom.js' */            for (var i in q) {
/*Line 122 - 'Atom.js' */                if (q.hasOwnProperty(i)) {
/*Line 123 - 'Atom.js' */                    var val = q[i];
/*Line 124 - 'Atom.js' */                    if (val === undefined)
/*Line 125 - 'Atom.js' */                        continue;
/*Line 126 - 'Atom.js' */                    if (val === null)
/*Line 127 - 'Atom.js' */                        continue;
/*Line 128 - 'Atom.js' */                    if (val && (val.constructor != String) && (typeof val) == 'object') {
/*Line 129 - 'Atom.js' */                        val = JSON.stringify(val);
/*Line 130 - 'Atom.js' */                    }
/*Line 131 - 'Atom.js' */                    plist.push(i + '=' + encodeURIComponent(val));
/*Line 132 - 'Atom.js' */                }
/*Line 133 - 'Atom.js' */            }

/*Line 135 - 'Atom.js' */            if (plist.length) {
/*Line 136 - 'Atom.js' */                var index = finalUrl.indexOf('?');
/*Line 137 - 'Atom.js' */                if (index == -1) {
/*Line 138 - 'Atom.js' */                    finalUrl += "?";
/*Line 139 - 'Atom.js' */                } else {
/*Line 140 - 'Atom.js' */                    finalUrl += '&';
/*Line 141 - 'Atom.js' */                }
/*Line 142 - 'Atom.js' */            }

/*Line 144 - 'Atom.js' */            finalUrl += plist.join('&');
/*Line 145 - 'Atom.js' */        }

/*Line 147 - 'Atom.js' */        if (lq) {
/*Line 148 - 'Atom.js' */            plist = [];
/*Line 149 - 'Atom.js' */            for (var i in lq) {
/*Line 150 - 'Atom.js' */                if (lq.hasOwnProperty(i)) {
/*Line 151 - 'Atom.js' */                    var val = lq[i];
/*Line 152 - 'Atom.js' */                    if (val === undefined || val === null)
/*Line 153 - 'Atom.js' */                        continue;
/*Line 154 - 'Atom.js' */                    plist.push(i + '=' + encodeURIComponent(val));
/*Line 155 - 'Atom.js' */                }
/*Line 156 - 'Atom.js' */            }
/*Line 157 - 'Atom.js' */            if (plist.length) {
/*Line 158 - 'Atom.js' */                finalUrl += '#' + plist.join("&");
/*Line 159 - 'Atom.js' */            }
/*Line 160 - 'Atom.js' */        }

/*Line 162 - 'Atom.js' */        return finalUrl;
/*Line 163 - 'Atom.js' */    },

/*Line 165 - 'Atom.js' */    encodeParameters: function (q) {
/*Line 166 - 'Atom.js' */        var plist = [];
/*Line 167 - 'Atom.js' */        for (var i in q) {
/*Line 168 - 'Atom.js' */            if (i.indexOf('_') == 0)
/*Line 169 - 'Atom.js' */                continue;
/*Line 170 - 'Atom.js' */            var val = q[i];
/*Line 171 - 'Atom.js' */            if (val === undefined)
/*Line 172 - 'Atom.js' */                continue;
/*Line 173 - 'Atom.js' */            if (val === null)
/*Line 174 - 'Atom.js' */                continue;
/*Line 175 - 'Atom.js' */            var t = typeof(val);
/*Line 176 - 'Atom.js' */            if (t != 'string' && t != 'number' && t != 'boolean') {
/*Line 177 - 'Atom.js' */                continue;
/*Line 178 - 'Atom.js' */            }
/*Line 179 - 'Atom.js' */            plist.push(i + '=' + encodeURIComponent(val));
/*Line 180 - 'Atom.js' */        }
/*Line 181 - 'Atom.js' */        return plist.join('&');
/*Line 182 - 'Atom.js' */    },

/*Line 184 - 'Atom.js' */    tableLayout: function (columns, cellWidth, cellHeight) {
/*Line 185 - 'Atom.js' */        return new WebAtoms.AtomTableLayout(columns, cellWidth, cellHeight);
/*Line 186 - 'Atom.js' */    },

/*Line 188 - 'Atom.js' */    toDash: function(text){
/*Line 189 - 'Atom.js' */        return text.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
/*Line 190 - 'Atom.js' */    },

/*Line 192 - 'Atom.js' */    secureUrl: function () {
/*Line 193 - 'Atom.js' */        var u = "";
/*Line 194 - 'Atom.js' */        for (var i = 0; i < arguments.length; i++) {
/*Line 195 - 'Atom.js' */            var ui = arguments[i];
/*Line 196 - 'Atom.js' */            if (ui === null || ui === undefined) {
/*Line 197 - 'Atom.js' */                return undefined;
/*Line 198 - 'Atom.js' */            }
/*Line 199 - 'Atom.js' */            u += ui;
/*Line 200 - 'Atom.js' */        }
/*Line 201 - 'Atom.js' */        if (/^\/\//.test(u)) {
/*Line 202 - 'Atom.js' */            return document.location.protocol + u;
/*Line 203 - 'Atom.js' */        }
/*Line 204 - 'Atom.js' */        if ('https:' == document.location.protocol) {
/*Line 205 - 'Atom.js' */            u = u.replace(/http\:\/\//, "https://");
/*Line 206 - 'Atom.js' */        }
/*Line 207 - 'Atom.js' */        return u;
/*Line 208 - 'Atom.js' */    }
/*Line 209 - 'Atom.js' */};

/*Line 211 - 'Atom.js' */Atom.resolve = function (obj, ap) {

/*Line 213 - 'Atom.js' */    var start = !ap;

/*Line 215 - 'Atom.js' */    if (!obj)
/*Line 216 - 'Atom.js' */        return obj;

/*Line 218 - 'Atom.js' */    if (start) {

/*Line 220 - 'Atom.js' */        ap = new AtomPromise();
/*Line 221 - 'Atom.js' */        ap.list = [];
/*Line 222 - 'Atom.js' */        ap.done = function (v) {
/*Line 223 - 'Atom.js' */            Atom.remove(ap.list, v);
/*Line 224 - 'Atom.js' */            if (ap.list.length == 0) {
/*Line 225 - 'Atom.js' */                ap.pushValue(obj);
/*Line 226 - 'Atom.js' */            }
/*Line 227 - 'Atom.js' */        };
/*Line 228 - 'Atom.js' */    }


/*Line 231 - 'Atom.js' */    var type = typeof (obj);

/*Line 233 - 'Atom.js' */    if (type == 'object') {
/*Line 234 - 'Atom.js' */        if (typeof (obj.length) != 'undefined') {
/*Line 235 - 'Atom.js' */            //this is an array
/*Line 236 - 'Atom.js' */            for (var i = 0; i < obj.length; i++) {
/*Line 237 - 'Atom.js' */                var v = obj[i];
/*Line 238 - 'Atom.js' */                if (!v)
/*Line 239 - 'Atom.js' */                    continue;
/*Line 240 - 'Atom.js' */                var item = obj;
/*Line 241 - 'Atom.js' */                var key = i;
/*Line 242 - 'Atom.js' */                if (v instanceof AtomPromise || v.constructor == AtomPromise) {
/*Line 243 - 'Atom.js' */                    ap.list.push(v);
/*Line 244 - 'Atom.js' */                    v.failed(function (a) {
/*Line 245 - 'Atom.js' */                        ap.done(a);
/*Line 246 - 'Atom.js' */                    });
/*Line 247 - 'Atom.js' */                    v.then(function (a) {
/*Line 248 - 'Atom.js' */                        item[key] = a.value();
/*Line 249 - 'Atom.js' */                        ap.done(a);
/*Line 250 - 'Atom.js' */                    });
/*Line 251 - 'Atom.js' */                    continue;
/*Line 252 - 'Atom.js' */                }
/*Line 253 - 'Atom.js' */                Atom.resolve(v, ap);
/*Line 254 - 'Atom.js' */            }
/*Line 255 - 'Atom.js' */        } else {
/*Line 256 - 'Atom.js' */            for (var i in obj) {
/*Line 257 - 'Atom.js' */                var v = obj[i];
/*Line 258 - 'Atom.js' */                if (!v)
/*Line 259 - 'Atom.js' */                    continue;
/*Line 260 - 'Atom.js' */                if (v instanceof AtomPromise || v.constructor == AtomPromise) {
/*Line 261 - 'Atom.js' */                    ap.list.push(v);
/*Line 262 - 'Atom.js' */                    v.failed(function (a) {
/*Line 263 - 'Atom.js' */                        ap.done(a);
/*Line 264 - 'Atom.js' */                    });
/*Line 265 - 'Atom.js' */                    var item = obj;
/*Line 266 - 'Atom.js' */                    var key = i;
/*Line 267 - 'Atom.js' */                    v.then(function (a) {
/*Line 268 - 'Atom.js' */                        item[key] = a.value();
/*Line 269 - 'Atom.js' */                        ap.done(a);
/*Line 270 - 'Atom.js' */                    });
/*Line 271 - 'Atom.js' */                    continue;
/*Line 272 - 'Atom.js' */                }
/*Line 273 - 'Atom.js' */                Atom.resolve(v, ap);
/*Line 274 - 'Atom.js' */            }
/*Line 275 - 'Atom.js' */        }
/*Line 276 - 'Atom.js' */    }

/*Line 278 - 'Atom.js' */    if (ap.list.length) {
/*Line 279 - 'Atom.js' */        if (start) {
/*Line 280 - 'Atom.js' */            ap.onInvoke(function () {
/*Line 281 - 'Atom.js' */                var ae = new AtomEnumerator(ap.list);
/*Line 282 - 'Atom.js' */                while (ae.next()) {
/*Line 283 - 'Atom.js' */                    ae.current().invoke(ap._invoker);
/*Line 284 - 'Atom.js' */                }
/*Line 285 - 'Atom.js' */            });
/*Line 286 - 'Atom.js' */        }
/*Line 287 - 'Atom.js' */        return ap;
/*Line 288 - 'Atom.js' */    }
/*Line 289 - 'Atom.js' */    return obj;

/*Line 291 - 'Atom.js' */};

/*Line 293 - 'Atom.js' */window.Atom = Atom;

/*Line 295 - 'Atom.js' */(function () {
/*Line 296 - 'Atom.js' */    var e,
/*Line 297 - 'Atom.js' */        a = /\+/g,  
/*Line 298 - 'Atom.js' */        r = /([^&=]+)=?([^&]*)/g,
/*Line 299 - 'Atom.js' */        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
/*Line 300 - 'Atom.js' */        q = window.location.search.substring(1);

/*Line 302 - 'Atom.js' */    var urlParams = {};
/*Line 303 - 'Atom.js' */    while (e = r.exec(q))
/*Line 304 - 'Atom.js' */        urlParams[d(e[1])] = d(e[2]);
/*Line 305 - 'Atom.js' */    Atom.pageQuery = urlParams;
/*Line 306 - 'Atom.js' */})();

/*Line 308 - 'Atom.js' */var AtomDate = {
/*Line 309 - 'Atom.js' */    zoneOffsetMinutes: (new Date()).getTimezoneOffset(),
/*Line 310 - 'Atom.js' */    zoneOffset: (new Date()).getTimezoneOffset() * 60 * 1000,

/*Line 312 - 'Atom.js' */    toLocalTime: function (d) {
/*Line 313 - 'Atom.js' */        return d.toJSON();
/*Line 314 - 'Atom.js' */    },

/*Line 316 - 'Atom.js' */    m_names: ["Jan", "Feb", "Mar", 
/*Line 317 - 'Atom.js' */"Apr", "May", "Jun", "Jul", "Aug", "Sep", 
/*Line 318 - 'Atom.js' */"Oct", "Nov", "Dec"],

/*Line 320 - 'Atom.js' */    setTime: function (dt, time) {
/*Line 321 - 'Atom.js' */        if (!dt || !time)
/*Line 322 - 'Atom.js' */            return dt;
/*Line 323 - 'Atom.js' */        var tokens = time.split(':');
/*Line 324 - 'Atom.js' */        var h = parseInt(tokens[0]);
/*Line 325 - 'Atom.js' */        tokens = tokens[1].split(' ');
/*Line 326 - 'Atom.js' */        var m = parseInt(tokens[0]);
/*Line 327 - 'Atom.js' */        if (tokens[1] == "PM") {
/*Line 328 - 'Atom.js' */            if (h != 12) {
/*Line 329 - 'Atom.js' */                h += 12;
/*Line 330 - 'Atom.js' */            }
/*Line 331 - 'Atom.js' */        }
/*Line 332 - 'Atom.js' */        var d = new Date(dt.getFullYear(),dt.getMonth(),dt.getDate());
/*Line 333 - 'Atom.js' */        d.setHours(h);
/*Line 334 - 'Atom.js' */        d.setMinutes(m);
/*Line 335 - 'Atom.js' */        return d;
/*Line 336 - 'Atom.js' */    },

/*Line 338 - 'Atom.js' */    toMMDDYY: function (dt) {
/*Line 339 - 'Atom.js' */        var m = dt.getMonth() + 1;
/*Line 340 - 'Atom.js' */        var y = dt.getFullYear();
/*Line 341 - 'Atom.js' */        var d = dt.getDate();

/*Line 343 - 'Atom.js' */        var str = "";
/*Line 344 - 'Atom.js' */        str +=  ((m > 9) ? m : ("0" + m));
/*Line 345 - 'Atom.js' */        str += "/" + ((d > 9) ? d : ("0" + d));
/*Line 346 - 'Atom.js' */        str += "/" + y;
/*Line 347 - 'Atom.js' */        return str;
/*Line 348 - 'Atom.js' */    },

/*Line 350 - 'Atom.js' */    toShortDateString: function (val) {
/*Line 351 - 'Atom.js' */        if (!val)
/*Line 352 - 'Atom.js' */            return "";
/*Line 353 - 'Atom.js' */        if (val.constructor == String) {
/*Line 354 - 'Atom.js' */            if (/^\/date\(/gi.test(val)) {
/*Line 355 - 'Atom.js' */                val = val.substr(6);
/*Line 356 - 'Atom.js' */                val = new Date(parseInt(val,10));
/*Line 357 - 'Atom.js' */            } else {
/*Line 358 - 'Atom.js' */                throw new Error("Invalid date format " + val);
/*Line 359 - 'Atom.js' */            }
/*Line 360 - 'Atom.js' */        }
/*Line 361 - 'Atom.js' */        //var dt = new Date();
        
/*Line 363 - 'Atom.js' */        return this.m_names[val.getMonth()] + " " + val.getDate() + ", " + val.getFullYear();
/*Line 364 - 'Atom.js' */    },
/*Line 365 - 'Atom.js' */    toDateTimeString: function (val) {
/*Line 366 - 'Atom.js' */        if (!val)
/*Line 367 - 'Atom.js' */            return "";
/*Line 368 - 'Atom.js' */        if (val.constructor == String) {
/*Line 369 - 'Atom.js' */            val = val.substr(6);
/*Line 370 - 'Atom.js' */            val = new Date(parseInt(val,10));
/*Line 371 - 'Atom.js' */        }
/*Line 372 - 'Atom.js' */        var dt = AtomDate.toShortDateString(val);
/*Line 373 - 'Atom.js' */        return dt + " - " + AtomDate.toTimeString(val);
/*Line 374 - 'Atom.js' */    },

/*Line 376 - 'Atom.js' */    toTimeString: function (d) {
/*Line 377 - 'Atom.js' */        d = AtomDate.parse(d);
/*Line 378 - 'Atom.js' */        if (!d)
/*Line 379 - 'Atom.js' */            return "";
/*Line 380 - 'Atom.js' */        var h = d.getHours();
/*Line 381 - 'Atom.js' */        var s = "AM";
/*Line 382 - 'Atom.js' */        if (h == 12) {
/*Line 383 - 'Atom.js' */            s = "PM";
/*Line 384 - 'Atom.js' */        } else {
/*Line 385 - 'Atom.js' */            if (h > 12) {
/*Line 386 - 'Atom.js' */                h = h - 12;
/*Line 387 - 'Atom.js' */                s = "PM";
/*Line 388 - 'Atom.js' */            }
/*Line 389 - 'Atom.js' */        }
/*Line 390 - 'Atom.js' */        var m = d.getMinutes();
/*Line 391 - 'Atom.js' */        if (m < 10) {
/*Line 392 - 'Atom.js' */            m = "0" + m;
/*Line 393 - 'Atom.js' */        } else {
/*Line 394 - 'Atom.js' */            m = m + "";
/*Line 395 - 'Atom.js' */            if (m.length == 1) {
/*Line 396 - 'Atom.js' */                m = m + "0";
/*Line 397 - 'Atom.js' */            }
/*Line 398 - 'Atom.js' */        }
/*Line 399 - 'Atom.js' */        return h + ":" + m + " " + s;
/*Line 400 - 'Atom.js' */    },

/*Line 402 - 'Atom.js' */    smartDate: function (v) {
/*Line 403 - 'Atom.js' */        if (!v)
/*Line 404 - 'Atom.js' */            return null;
/*Line 405 - 'Atom.js' */        var d = AtomDate.parse(v);
/*Line 406 - 'Atom.js' */        var now = new Date();

/*Line 408 - 'Atom.js' */        if (now.getFullYear() === d.getFullYear()
/*Line 409 - 'Atom.js' */            && now.getMonth() === d.getMonth()) {
/*Line 410 - 'Atom.js' */            var diff = now.getDate() - d.getDate();
/*Line 411 - 'Atom.js' */            switch(diff){
/*Line 412 - 'Atom.js' */                case -1:
/*Line 413 - 'Atom.js' */                    return "Tomorrow (" + AtomDate.toTimeString(d) + ")";
/*Line 414 - 'Atom.js' */                case 0:
/*Line 415 - 'Atom.js' */                    return "Today (" + AtomDate.toTimeString(d) + ")";
/*Line 416 - 'Atom.js' */                case 1:
/*Line 417 - 'Atom.js' */                    return "Yesterday (" + AtomDate.toTimeString(d) + ")";
/*Line 418 - 'Atom.js' */            }
/*Line 419 - 'Atom.js' */        }
/*Line 420 - 'Atom.js' */        return AtomDate.toDateTimeString(d);
/*Line 421 - 'Atom.js' */    },

/*Line 423 - 'Atom.js' */    smartDateUTC: function (v) {
/*Line 424 - 'Atom.js' */        return AtomDate.smartDate(v);
/*Line 425 - 'Atom.js' */    },

/*Line 427 - 'Atom.js' */    jsonDate: function (v) {
/*Line 428 - 'Atom.js' */        var d = AtomDate.parse(v);
/*Line 429 - 'Atom.js' */        return {
/*Line 430 - 'Atom.js' */            Year: d.getFullYear(),
/*Line 431 - 'Atom.js' */            Month: d.getMonth() + 1,
/*Line 432 - 'Atom.js' */            Date: d.getDate(),
/*Line 433 - 'Atom.js' */            Hours: d.getHours(),
/*Line 434 - 'Atom.js' */            Minutes: d.getMinutes(),
/*Line 435 - 'Atom.js' */            Seconds: d.getSeconds(),
/*Line 436 - 'Atom.js' */            Offset: AtomDate.zoneOffsetMinutes
/*Line 437 - 'Atom.js' */        };
/*Line 438 - 'Atom.js' */    },

/*Line 440 - 'Atom.js' */    toUTC: function (v) {
/*Line 441 - 'Atom.js' */        if (!v)
/*Line 442 - 'Atom.js' */            return "";
/*Line 443 - 'Atom.js' */        v = AtomDate.parse(v);
/*Line 444 - 'Atom.js' */        var d = new Date(v.getTime() + AtomDate.zoneOffset);
/*Line 445 - 'Atom.js' */        return d;
/*Line 446 - 'Atom.js' */    },

/*Line 448 - 'Atom.js' */    parse: function (v) {
/*Line 449 - 'Atom.js' */        if (!v)
/*Line 450 - 'Atom.js' */            return null;
/*Line 451 - 'Atom.js' */        if (v.constructor !== String)
/*Line 452 - 'Atom.js' */            return v;
/*Line 453 - 'Atom.js' */        if (/^\/date\([\-0-9]+\)\//gi.test(v)) {
/*Line 454 - 'Atom.js' */            v = new Date(parseInt(v.substr(6),10));
/*Line 455 - 'Atom.js' */        } else {
/*Line 456 - 'Atom.js' */            if (/^\/dateiso/gi.test(v)) {
/*Line 457 - 'Atom.js' */                v = v.substr(9);
/*Line 458 - 'Atom.js' */                v = v.substr(0, v.length - 1);
/*Line 459 - 'Atom.js' */                var tokens = v.split('T');
/*Line 460 - 'Atom.js' */                var date = tokens[0];
/*Line 461 - 'Atom.js' */                var time = tokens[1];
/*Line 462 - 'Atom.js' */                date = date.split('-');
/*Line 463 - 'Atom.js' */                time = time.split(':');
/*Line 464 - 'Atom.js' */                var d = new Date(date[0], parseInt(date[1]) - 1, date[2], time[0], time[1], parseFloat(time[2]));
/*Line 465 - 'Atom.js' */                d = new Date(d.getTime() + AtomDate.zoneOffset);
/*Line 466 - 'Atom.js' */                return d;
/*Line 467 - 'Atom.js' */            } else {
/*Line 468 - 'Atom.js' */                v = Date.parse(v);
/*Line 469 - 'Atom.js' */            }
/*Line 470 - 'Atom.js' */        }
/*Line 471 - 'Atom.js' */        return v;
/*Line 472 - 'Atom.js' */        //var i = v.getTime();
/*Line 473 - 'Atom.js' */        //var z = v.getTimezoneOffset() * 60 * 1000;
/*Line 474 - 'Atom.js' */        //i = i - z;
/*Line 475 - 'Atom.js' */        //return new Date(i);
/*Line 476 - 'Atom.js' */    }
/*Line 477 - 'Atom.js' */};

/*Line 479 - 'Atom.js' */window.AtomDate = AtomDate;

/*Line 481 - 'Atom.js' */AtomDate.monthList = [
/*Line 482 - 'Atom.js' */    { label: "January", value: 1 },
/*Line 483 - 'Atom.js' */    { label: "February", value: 2 },
/*Line 484 - 'Atom.js' */    { label: "March", value: 3 },
/*Line 485 - 'Atom.js' */    { label: "April", value: 4 },
/*Line 486 - 'Atom.js' */    { label: "May", value: 5 },
/*Line 487 - 'Atom.js' */    { label: "June", value: 6 },
/*Line 488 - 'Atom.js' */    { label: "July", value: 7 },
/*Line 489 - 'Atom.js' */    { label: "August", value: 8 },
/*Line 490 - 'Atom.js' */    { label: "September", value: 9 },
/*Line 491 - 'Atom.js' */    { label: "October", value: 10 },
/*Line 492 - 'Atom.js' */    { label: "November", value: 11 },
/*Line 493 - 'Atom.js' */    { label: "December", value: 12 }
/*Line 494 - 'Atom.js' */];


/*Line 497 - 'Atom.js' */var AtomFileSize = {
/*Line 498 - 'Atom.js' */    toFileSize: function (val) {
/*Line 499 - 'Atom.js' */        if (!val)
/*Line 500 - 'Atom.js' */            return "";
/*Line 501 - 'Atom.js' */        if (val.constructor == String)
/*Line 502 - 'Atom.js' */            val = parseInt(val, 10);
/*Line 503 - 'Atom.js' */        if (val > 1073741824) {
/*Line 504 - 'Atom.js' */            return Math.round(val / 1073741824) + " GB";
/*Line 505 - 'Atom.js' */        }
/*Line 506 - 'Atom.js' */        if (val > 1048576) {
/*Line 507 - 'Atom.js' */            return Math.round(val / 1048576) + " MB";
/*Line 508 - 'Atom.js' */        }
/*Line 509 - 'Atom.js' */        if (val > 1024) {
/*Line 510 - 'Atom.js' */            return Math.round(val / 1024) + " KB";
/*Line 511 - 'Atom.js' */        }
/*Line 512 - 'Atom.js' */        return val + " B";
/*Line 513 - 'Atom.js' */    }
/*Line 514 - 'Atom.js' */};

/*Line 516 - 'Atom.js' */window.AtomFileSize = AtomFileSize;

/*Line 518 - 'Atom.js' */var AtomPhone = {
/*Line 519 - 'Atom.js' */    toSmallPhoneString: function (val) {
/*Line 520 - 'Atom.js' */        if (!val)
/*Line 521 - 'Atom.js' */            return "";
/*Line 522 - 'Atom.js' */        var tokens = val.split(":", 6);
/*Line 523 - 'Atom.js' */        var cc = tokens[2];
/*Line 524 - 'Atom.js' */        cc = "(" + (/^\+/.test(cc) ? '' : '+') + tokens[2] + ") ";
/*Line 525 - 'Atom.js' */        var phone = tokens[3];
/*Line 526 - 'Atom.js' */        var ext = tokens[4];
/*Line 527 - 'Atom.js' */        var msg = tokens[5];
/*Line 528 - 'Atom.js' */        if (!phone)
/*Line 529 - 'Atom.js' */            return "";
/*Line 530 - 'Atom.js' */        return cc + phone;
/*Line 531 - 'Atom.js' */    },
/*Line 532 - 'Atom.js' */    toPhoneString: function (val) {
/*Line 533 - 'Atom.js' */        if (!val)
/*Line 534 - 'Atom.js' */            return "";
/*Line 535 - 'Atom.js' */        var tokens = val.split(":", 6);
/*Line 536 - 'Atom.js' */        var cc = "(+" + tokens[2] + ") ";
/*Line 537 - 'Atom.js' */        var phone = tokens[3];
/*Line 538 - 'Atom.js' */        var ext = tokens[4];
/*Line 539 - 'Atom.js' */        var msg = tokens[5];
/*Line 540 - 'Atom.js' */        if (!phone)
/*Line 541 - 'Atom.js' */            return "";
/*Line 542 - 'Atom.js' */        var txt = cc + phone;
/*Line 543 - 'Atom.js' */        if (ext)
/*Line 544 - 'Atom.js' */            txt += " (ext: " + ext + ")";
/*Line 545 - 'Atom.js' */        if (msg)
/*Line 546 - 'Atom.js' */            txt += " (" + msg + ")";
/*Line 547 - 'Atom.js' */        return txt;
/*Line 548 - 'Atom.js' */    }
/*Line 549 - 'Atom.js' */};

/*Line 551 - 'Atom.js' */window.AtomPhone = AtomPhone;
/*Line 0 - 'AtomQuery.js' */
/*Line 1 - 'AtomQuery.js' */

/*Line 3 - 'AtomQuery.js' */// rewire get...
/*Line 4 - 'AtomQuery.js' */$f.get = Atom.get;

/*Line 6 - 'AtomQuery.js' */$f.compileSelect = function (s) {
/*Line 7 - 'AtomQuery.js' */    if (!s) {
/*Line 8 - 'AtomQuery.js' */        return function (item) {
/*Line 9 - 'AtomQuery.js' */            return item;
/*Line 10 - 'AtomQuery.js' */        };
/*Line 11 - 'AtomQuery.js' */    }

/*Line 13 - 'AtomQuery.js' */    if (s.constructor == String) {
/*Line 14 - 'AtomQuery.js' */        return function (item) {
/*Line 15 - 'AtomQuery.js' */            return Atom.get(item, s);
/*Line 16 - 'AtomQuery.js' */        };
/*Line 17 - 'AtomQuery.js' */    }

/*Line 19 - 'AtomQuery.js' */    return function (item) {

/*Line 21 - 'AtomQuery.js' */        var r = {};
/*Line 22 - 'AtomQuery.js' */        for (var i in s) {
/*Line 23 - 'AtomQuery.js' */            var v = s[i];
/*Line 24 - 'AtomQuery.js' */            i = JSON.stringify(i);
/*Line 25 - 'AtomQuery.js' */            if (!v) {
/*Line 26 - 'AtomQuery.js' */                r[i] = Atom.get(item, i);
/*Line 27 - 'AtomQuery.js' */            } else {
/*Line 28 - 'AtomQuery.js' */                r[i] = Atom.get(item, v);
/*Line 29 - 'AtomQuery.js' */            }
/*Line 30 - 'AtomQuery.js' */        }
/*Line 31 - 'AtomQuery.js' */        return r;
/*Line 32 - 'AtomQuery.js' */    };
/*Line 33 - 'AtomQuery.js' */};


/*Line 36 - 'AtomQuery.js' */var AtomQuery = {

/*Line 38 - 'AtomQuery.js' */    firstOrDefault:function (q) {
/*Line 39 - 'AtomQuery.js' */        var f = $f(q);
/*Line 40 - 'AtomQuery.js' */        while (this.next()) {
/*Line 41 - 'AtomQuery.js' */            var item = this.current();
/*Line 42 - 'AtomQuery.js' */            if (f(item)) {
/*Line 43 - 'AtomQuery.js' */                return item;
/*Line 44 - 'AtomQuery.js' */            }
/*Line 45 - 'AtomQuery.js' */        }
/*Line 46 - 'AtomQuery.js' */        return null;
/*Line 47 - 'AtomQuery.js' */    },

/*Line 49 - 'AtomQuery.js' */    first: function (q) {
/*Line 50 - 'AtomQuery.js' */        var f = $f(q);
/*Line 51 - 'AtomQuery.js' */        while (this.next()) {
/*Line 52 - 'AtomQuery.js' */            var item = this.current();
/*Line 53 - 'AtomQuery.js' */            if (f(item)) {
/*Line 54 - 'AtomQuery.js' */                return item;
/*Line 55 - 'AtomQuery.js' */            }
/*Line 56 - 'AtomQuery.js' */        }
/*Line 57 - 'AtomQuery.js' */        throw new Error("Item not found in collection");
/*Line 58 - 'AtomQuery.js' */    },

/*Line 60 - 'AtomQuery.js' */    where: function (q) {
/*Line 61 - 'AtomQuery.js' */        var f = $f(q);
/*Line 62 - 'AtomQuery.js' */        var r = [];
/*Line 63 - 'AtomQuery.js' */        while (this.next()) {
/*Line 64 - 'AtomQuery.js' */            var item = this.current();
/*Line 65 - 'AtomQuery.js' */            if (f(item)) {
/*Line 66 - 'AtomQuery.js' */                r.push(item);
/*Line 67 - 'AtomQuery.js' */            }
/*Line 68 - 'AtomQuery.js' */        }
/*Line 69 - 'AtomQuery.js' */        return new AtomEnumerator(r);
/*Line 70 - 'AtomQuery.js' */    },

/*Line 72 - 'AtomQuery.js' */    toArray: function(){
/*Line 73 - 'AtomQuery.js' */        var r = [];
/*Line 74 - 'AtomQuery.js' */        while (this.next()) {
/*Line 75 - 'AtomQuery.js' */            r.push(this.current());
/*Line 76 - 'AtomQuery.js' */        }
/*Line 77 - 'AtomQuery.js' */        return r;
/*Line 78 - 'AtomQuery.js' */    },

/*Line 80 - 'AtomQuery.js' */    any: function(q){
/*Line 81 - 'AtomQuery.js' */        if (this.firstOrDefault(q))
/*Line 82 - 'AtomQuery.js' */            return true;
/*Line 83 - 'AtomQuery.js' */        return false;
/*Line 84 - 'AtomQuery.js' */    },

/*Line 86 - 'AtomQuery.js' */    select: function (q) {

/*Line 88 - 'AtomQuery.js' */        var f = $f.compileSelect(q);
/*Line 89 - 'AtomQuery.js' */        var r = [];
/*Line 90 - 'AtomQuery.js' */        while (this.next()) {
/*Line 91 - 'AtomQuery.js' */            var item = this.current();
/*Line 92 - 'AtomQuery.js' */            r.push(f(item));
/*Line 93 - 'AtomQuery.js' */        }
/*Line 94 - 'AtomQuery.js' */        return new AtomEnumerator(r);
/*Line 95 - 'AtomQuery.js' */    },

/*Line 97 - 'AtomQuery.js' */    join: function (s) {
/*Line 98 - 'AtomQuery.js' */        var r = [];
/*Line 99 - 'AtomQuery.js' */        while (this.next()) {
/*Line 100 - 'AtomQuery.js' */            r.push(this.current());
/*Line 101 - 'AtomQuery.js' */        }
/*Line 102 - 'AtomQuery.js' */        return r.join(s);
/*Line 103 - 'AtomQuery.js' */    },

/*Line 105 - 'AtomQuery.js' */    count: function(s){
/*Line 106 - 'AtomQuery.js' */        if (s) {
/*Line 107 - 'AtomQuery.js' */            return this.where(s).count();
/*Line 108 - 'AtomQuery.js' */        }
/*Line 109 - 'AtomQuery.js' */        var n = 0;
/*Line 110 - 'AtomQuery.js' */        while (this.next()) n++;
/*Line 111 - 'AtomQuery.js' */        return n;
/*Line 112 - 'AtomQuery.js' */    },

/*Line 114 - 'AtomQuery.js' */    sum: function (s) {
/*Line 115 - 'AtomQuery.js' */        var n = 0;
/*Line 116 - 'AtomQuery.js' */        var ae = this;
/*Line 117 - 'AtomQuery.js' */        while (ae.next()) {
/*Line 118 - 'AtomQuery.js' */            var item = ae.current();
/*Line 119 - 'AtomQuery.js' */            if (s) {
/*Line 120 - 'AtomQuery.js' */                item = Atom.get(item,s);
/*Line 121 - 'AtomQuery.js' */            }
/*Line 122 - 'AtomQuery.js' */            n += +(item || 0);
/*Line 123 - 'AtomQuery.js' */        }
/*Line 124 - 'AtomQuery.js' */        return n;
/*Line 125 - 'AtomQuery.js' */    },

/*Line 127 - 'AtomQuery.js' */    groupBy: function (s) {
/*Line 128 - 'AtomQuery.js' */        var fs = $f.compileSelect(s);
/*Line 129 - 'AtomQuery.js' */        var ae = this;
/*Line 130 - 'AtomQuery.js' */        var g = {};
/*Line 131 - 'AtomQuery.js' */        var r = [];
/*Line 132 - 'AtomQuery.js' */        while (ae.next()) {
/*Line 133 - 'AtomQuery.js' */            var item = ae.current();
/*Line 134 - 'AtomQuery.js' */            var si = fs(item);
/*Line 135 - 'AtomQuery.js' */            var rl = g[si];
/*Line 136 - 'AtomQuery.js' */            if (!rl) {
/*Line 137 - 'AtomQuery.js' */                rl = [];
/*Line 138 - 'AtomQuery.js' */                g[si] = rl;
/*Line 139 - 'AtomQuery.js' */                r.push({ key: si, items: rl });
/*Line 140 - 'AtomQuery.js' */            }
/*Line 141 - 'AtomQuery.js' */            rl.push(item);
/*Line 142 - 'AtomQuery.js' */        }
/*Line 143 - 'AtomQuery.js' */        return Atom.query(r);
/*Line 144 - 'AtomQuery.js' */    }

/*Line 146 - 'AtomQuery.js' */};

/*Line 148 - 'AtomQuery.js' */window.AtomQuery = AtomQuery;


/*Line 151 - 'AtomQuery.js' */for (var i in AtomQuery) {
/*Line 152 - 'AtomQuery.js' */    AtomEnumerator.prototype[i] = AtomQuery[i];
/*Line 153 - 'AtomQuery.js' */}


/*Line 156 - 'AtomQuery.js' */Atom.query = function (a) {
/*Line 157 - 'AtomQuery.js' */    if (a.length !== undefined) {
/*Line 158 - 'AtomQuery.js' */        return new AtomEnumerator(a);
/*Line 159 - 'AtomQuery.js' */    }
/*Line 160 - 'AtomQuery.js' */    return a;
/*Line 161 - 'AtomQuery.js' */};

/*Line 0 - 'AtomUI.js' */
/*Line 1 - 'AtomUI.js' */
/*Line 2 - 'AtomUI.js' */
/*Line 3 - 'AtomUI.js' */


/*Line 6 - 'AtomUI.js' */var AtomUI =
/*Line 7 - 'AtomUI.js' */{
/*Line 8 - 'AtomUI.js' */    nodeValue: (AtomBrowser.isIE && AtomBrowser.majorVersion < 9) ? "nodeValue" : "value",

/*Line 10 - 'AtomUI.js' */    attributeMap: function (e, r) {
/*Line 11 - 'AtomUI.js' */        var item;
/*Line 12 - 'AtomUI.js' */        var name;
/*Line 13 - 'AtomUI.js' */        var map = {};
/*Line 14 - 'AtomUI.js' */        var ae = new AtomEnumerator(e.attributes);
/*Line 15 - 'AtomUI.js' */        if (r) {
/*Line 16 - 'AtomUI.js' */            while (ae.next()) {
/*Line 17 - 'AtomUI.js' */                item = ae.current();
/*Line 18 - 'AtomUI.js' */                name = item.nodeName;
/*Line 19 - 'AtomUI.js' */                if (/^data\-/i.test(name)) {
/*Line 20 - 'AtomUI.js' */                    name = name.substr(5);
/*Line 21 - 'AtomUI.js' */                }
/*Line 22 - 'AtomUI.js' */                if (r.test(name)) {
/*Line 23 - 'AtomUI.js' */                    r.lastIndex = 0;
/*Line 24 - 'AtomUI.js' */                    map[name] = { value: item[AtomUI.nodeValue], node: item };
/*Line 25 - 'AtomUI.js' */                }
/*Line 26 - 'AtomUI.js' */            }
/*Line 27 - 'AtomUI.js' */            return map;
/*Line 28 - 'AtomUI.js' */        }

/*Line 30 - 'AtomUI.js' */        while (ae.next()) {
/*Line 31 - 'AtomUI.js' */            item = ae.current();
/*Line 32 - 'AtomUI.js' */            name = item.nodeName;
/*Line 33 - 'AtomUI.js' */            if (/^data\-/i.test(name)) {
/*Line 34 - 'AtomUI.js' */                name = name.substr(5);
/*Line 35 - 'AtomUI.js' */            }
/*Line 36 - 'AtomUI.js' */            map[name] = { value: item[AtomUI.nodeValue], node: item };
/*Line 37 - 'AtomUI.js' */        }
/*Line 38 - 'AtomUI.js' */        return map;
/*Line 39 - 'AtomUI.js' */    },

/*Line 41 - 'AtomUI.js' */    attr: function (e, n, sv) {
/*Line 42 - 'AtomUI.js' */        if (sv !== undefined) {
/*Line 43 - 'AtomUI.js' */            if (/^(atom|style)\-/.test(n)) {
/*Line 44 - 'AtomUI.js' */                n = "data-" + n;
/*Line 45 - 'AtomUI.js' */            }
/*Line 46 - 'AtomUI.js' */            //e[n] = sv;
/*Line 47 - 'AtomUI.js' */            e.setAttribute(n, sv);
/*Line 48 - 'AtomUI.js' */            return sv;
/*Line 49 - 'AtomUI.js' */        }
/*Line 50 - 'AtomUI.js' */        var v = e.getAttribute("data-" + n) || e.getAttribute(n);
/*Line 51 - 'AtomUI.js' */        return v;
/*Line 52 - 'AtomUI.js' */    },
/*Line 53 - 'AtomUI.js' */    removeAttr: function (e, n) {
/*Line 54 - 'AtomUI.js' */        e.removeAttribute(n);
/*Line 55 - 'AtomUI.js' */        e.removeAttribute("data-" + n);
/*Line 56 - 'AtomUI.js' */    },

/*Line 58 - 'AtomUI.js' */    getAtomType: function (e) {
/*Line 59 - 'AtomUI.js' */        return AtomUI.attr(e,"atom-type");
/*Line 60 - 'AtomUI.js' */    },

/*Line 62 - 'AtomUI.js' */    cloneNode: ((AtomBrowser.isIE && AtomBrowser.majorVersion < 8) ? (function (e) {

/*Line 64 - 'AtomUI.js' */        var document = window.document;

/*Line 66 - 'AtomUI.js' */        var r = document.createElement(e.nodeName);
/*Line 67 - 'AtomUI.js' */        var ae = new AtomEnumerator(e.attributes);
/*Line 68 - 'AtomUI.js' */        while (ae.next()) {
/*Line 69 - 'AtomUI.js' */            var a = ae.current();
/*Line 70 - 'AtomUI.js' */            try{
/*Line 71 - 'AtomUI.js' */                var name = a.nodeName;
/*Line 72 - 'AtomUI.js' */                var v = a[AtomUI.nodeValue];
/*Line 73 - 'AtomUI.js' */                if (!v)
/*Line 74 - 'AtomUI.js' */                    continue;
/*Line 75 - 'AtomUI.js' */                r.setAttribute(name, v);
/*Line 76 - 'AtomUI.js' */            }catch(ex){}
/*Line 77 - 'AtomUI.js' */        }

/*Line 79 - 'AtomUI.js' */        var firstChild = e.firstChild;
/*Line 80 - 'AtomUI.js' */        while (firstChild) {

/*Line 82 - 'AtomUI.js' */            if (firstChild.nodeType == 3) {
/*Line 83 - 'AtomUI.js' */                var n = document.createTextNode(firstChild.nodeValue);
/*Line 84 - 'AtomUI.js' */                r.appendChild(n);
/*Line 85 - 'AtomUI.js' */            } else if (firstChild.nodeType == 1) {
/*Line 86 - 'AtomUI.js' */                r.appendChild(AtomUI.cloneNode(firstChild));
/*Line 87 - 'AtomUI.js' */            }
/*Line 88 - 'AtomUI.js' */            firstChild = firstChild.nextSibling;
/*Line 89 - 'AtomUI.js' */        }

/*Line 91 - 'AtomUI.js' */        return r;
/*Line 92 - 'AtomUI.js' */    }) : function (e) {
/*Line 93 - 'AtomUI.js' */        return e.cloneNode(true);
/*Line 94 - 'AtomUI.js' */    }),

/*Line 96 - 'AtomUI.js' */    findPresenter: function (e) {
/*Line 97 - 'AtomUI.js' */        //if (!(AtomBrowser.isIE && AtomBrowser.majorVersion < 8)) {
/*Line 98 - 'AtomUI.js' */        //    return $(e).find("[atom-presenter]").get(0);
/*Line 99 - 'AtomUI.js' */        //}
/*Line 100 - 'AtomUI.js' */        var ae = new ChildEnumerator(e);
/*Line 101 - 'AtomUI.js' */        while (ae.next()) {
/*Line 102 - 'AtomUI.js' */            var item = ae.current();
/*Line 103 - 'AtomUI.js' */            var ap = AtomUI.attr(item,"atom-presenter");
/*Line 104 - 'AtomUI.js' */            if (ap)
/*Line 105 - 'AtomUI.js' */                return item;
/*Line 106 - 'AtomUI.js' */            var c = AtomUI.findPresenter(item);
/*Line 107 - 'AtomUI.js' */            if (c)
/*Line 108 - 'AtomUI.js' */                return c;
/*Line 109 - 'AtomUI.js' */        }
/*Line 110 - 'AtomUI.js' */        return null;
/*Line 111 - 'AtomUI.js' */    },

/*Line 113 - 'AtomUI.js' */    parseUrl: function (url) {
/*Line 114 - 'AtomUI.js' */        var r = {};

/*Line 116 - 'AtomUI.js' */        var plist = url.split('&');

/*Line 118 - 'AtomUI.js' */        var ae = new AtomEnumerator(plist);
/*Line 119 - 'AtomUI.js' */        while (ae.next()) {
/*Line 120 - 'AtomUI.js' */            var p = ae.current().split('=');
/*Line 121 - 'AtomUI.js' */            var key = p[0];
/*Line 122 - 'AtomUI.js' */            var val = p[1];
/*Line 123 - 'AtomUI.js' */            if (val) {
/*Line 124 - 'AtomUI.js' */                val = decodeURIComponent(val);
/*Line 125 - 'AtomUI.js' */            }
/*Line 126 - 'AtomUI.js' */            val = AtomUI.parseValue(val);
/*Line 127 - 'AtomUI.js' */            r[key] = val;
/*Line 128 - 'AtomUI.js' */        }
/*Line 129 - 'AtomUI.js' */        return r;
/*Line 130 - 'AtomUI.js' */    },

/*Line 132 - 'AtomUI.js' */    parseValue: function (val) {
/*Line 133 - 'AtomUI.js' */        var n;
/*Line 134 - 'AtomUI.js' */        if (/^[0-9]+$/.test(val)) {
/*Line 135 - 'AtomUI.js' */            n = parseInt(val, 10);
/*Line 136 - 'AtomUI.js' */            if (!isNaN(n)) {
/*Line 137 - 'AtomUI.js' */                val = n;
/*Line 138 - 'AtomUI.js' */            }
/*Line 139 - 'AtomUI.js' */            return val;
/*Line 140 - 'AtomUI.js' */        }
/*Line 141 - 'AtomUI.js' */        if (/^[0-9]+\.[0-9]+/gi.test(val)) {
/*Line 142 - 'AtomUI.js' */            n = parseFloat(val);
/*Line 143 - 'AtomUI.js' */            if (!isNaN(n)) {
/*Line 144 - 'AtomUI.js' */                val = n;
/*Line 145 - 'AtomUI.js' */            }
/*Line 146 - 'AtomUI.js' */            return val;
/*Line 147 - 'AtomUI.js' */        }

/*Line 149 - 'AtomUI.js' */        if (/true/.test(val)) {
/*Line 150 - 'AtomUI.js' */            val = true;
/*Line 151 - 'AtomUI.js' */            return val;
/*Line 152 - 'AtomUI.js' */        }
/*Line 153 - 'AtomUI.js' */        if (/false/.test(val)) {
/*Line 154 - 'AtomUI.js' */            val = false;
/*Line 155 - 'AtomUI.js' */            return val;
/*Line 156 - 'AtomUI.js' */        }
/*Line 157 - 'AtomUI.js' */        return val;
/*Line 158 - 'AtomUI.js' */    },

/*Line 160 - 'AtomUI.js' */    cancelEvent: function (e) {

/*Line 162 - 'AtomUI.js' */        var t = e.target;
/*Line 163 - 'AtomUI.js' */        if (t && /input/gi.test(t.nodeName) && /checkbox/gi.test(t.type))
/*Line 164 - 'AtomUI.js' */            return;

/*Line 166 - 'AtomUI.js' */        if (e.preventDefault) { e.preventDefault(); }
/*Line 167 - 'AtomUI.js' */        else { e.stop(); }

/*Line 169 - 'AtomUI.js' */        e.returnValue = false;
/*Line 170 - 'AtomUI.js' */        e.stopPropagation();
/*Line 171 - 'AtomUI.js' */        return false;
/*Line 172 - 'AtomUI.js' */    },

/*Line 174 - 'AtomUI.js' */    assignID: function (element) {
/*Line 175 - 'AtomUI.js' */        if (!element.id) {
/*Line 176 - 'AtomUI.js' */            element.id = "__waID" + AtomUI.getNewIndex();
/*Line 177 - 'AtomUI.js' */        }
/*Line 178 - 'AtomUI.js' */        return element.id;
/*Line 179 - 'AtomUI.js' */    },

/*Line 181 - 'AtomUI.js' */    atomParent: function (element) {
/*Line 182 - 'AtomUI.js' */        if (element.atomControl) {
/*Line 183 - 'AtomUI.js' */            return element.atomControl;
/*Line 184 - 'AtomUI.js' */        }
/*Line 185 - 'AtomUI.js' */        if (element === document || element === window || !element.parentNode)
/*Line 186 - 'AtomUI.js' */            return null;
/*Line 187 - 'AtomUI.js' */        return AtomUI.atomParent(element._logicalParent || element.parentNode);
/*Line 188 - 'AtomUI.js' */    },
/*Line 189 - 'AtomUI.js' */    //startsWith: function (text, part) {
/*Line 190 - 'AtomUI.js' */    //    if (!text || text.constructor != String)
/*Line 191 - 'AtomUI.js' */    //        return false;
/*Line 192 - 'AtomUI.js' */    //    return text.indexOf(part) == 0;
/*Line 193 - 'AtomUI.js' */    //},
/*Line 194 - 'AtomUI.js' */    //endsWith: function (text, part) {
/*Line 195 - 'AtomUI.js' */    //    if (!text || text.constructor != String)
/*Line 196 - 'AtomUI.js' */    //        return false;
/*Line 197 - 'AtomUI.js' */    //    return text.lastIndexOf(part) == (text.length - part.length);
/*Line 198 - 'AtomUI.js' */    //},

/*Line 200 - 'AtomUI.js' */    toNumber: function (text) {
/*Line 201 - 'AtomUI.js' */        if (!text)
/*Line 202 - 'AtomUI.js' */            return 0;
/*Line 203 - 'AtomUI.js' */        if (text.constructor == String)
/*Line 204 - 'AtomUI.js' */            return parseFloat(text);
/*Line 205 - 'AtomUI.js' */        return text;
/*Line 206 - 'AtomUI.js' */    },

/*Line 208 - 'AtomUI.js' */    isNode: function (o) {
/*Line 209 - 'AtomUI.js' */        try {
/*Line 210 - 'AtomUI.js' */            if (window.XMLHttpRequest && o instanceof XMLHttpRequest)
/*Line 211 - 'AtomUI.js' */                return true;
/*Line 212 - 'AtomUI.js' */        } catch (ex) {
/*Line 213 - 'AtomUI.js' */        }
/*Line 214 - 'AtomUI.js' */        //if (o.addEventListener)
/*Line 215 - 'AtomUI.js' */        //    return true;

/*Line 217 - 'AtomUI.js' */        if (o === window || o === document)
/*Line 218 - 'AtomUI.js' */            return true;
/*Line 219 - 'AtomUI.js' */        return (
/*Line 220 - 'AtomUI.js' */        typeof Node === "object" ? o instanceof Node :
/*Line 221 - 'AtomUI.js' */        typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string"
/*Line 222 - 'AtomUI.js' */      );
/*Line 223 - 'AtomUI.js' */    },

/*Line 225 - 'AtomUI.js' */    createDelegate: function (instance, methodName) {
/*Line 226 - 'AtomUI.js' */        return this.getDelegate(instance, methodName, true);
/*Line 227 - 'AtomUI.js' */    },
/*Line 228 - 'AtomUI.js' */    getDelegate: function (instance, methodName, create) {
/*Line 229 - 'AtomUI.js' */        if (methodName && methodName.constructor != String)
/*Line 230 - 'AtomUI.js' */            throw new Error("methodName has to be string");
/*Line 231 - 'AtomUI.js' */        var d = instance.__delegates;
/*Line 232 - 'AtomUI.js' */        if (!d) {
/*Line 233 - 'AtomUI.js' */            if (!create)
/*Line 234 - 'AtomUI.js' */                return null;
/*Line 235 - 'AtomUI.js' */            d = {};
/*Line 236 - 'AtomUI.js' */            instance.__delegates = d;
/*Line 237 - 'AtomUI.js' */        }
/*Line 238 - 'AtomUI.js' */        var m = d[methodName];
/*Line 239 - 'AtomUI.js' */        if (!m) {
/*Line 240 - 'AtomUI.js' */            if (!create)
/*Line 241 - 'AtomUI.js' */                return null;
/*Line 242 - 'AtomUI.js' */            var f = instance[methodName];
/*Line 243 - 'AtomUI.js' */            if (!f) {
/*Line 244 - 'AtomUI.js' */                throw new Error("method " + methodName + " not found");
/*Line 245 - 'AtomUI.js' */            }
/*Line 246 - 'AtomUI.js' */            m = function () {
/*Line 247 - 'AtomUI.js' */                return f.apply(instance, arguments);
/*Line 248 - 'AtomUI.js' */            };
/*Line 249 - 'AtomUI.js' */            d[methodName] = m;
/*Line 250 - 'AtomUI.js' */        }
/*Line 251 - 'AtomUI.js' */        return m;
/*Line 252 - 'AtomUI.js' */    },

/*Line 254 - 'AtomUI.js' */    __index: 1000,
/*Line 255 - 'AtomUI.js' */    getNewIndex: function () {
/*Line 256 - 'AtomUI.js' */        this.__index = this.__index + 1;
/*Line 257 - 'AtomUI.js' */        return this.__index;
/*Line 258 - 'AtomUI.js' */    },

/*Line 260 - 'AtomUI.js' */    contains: function (array, item) {
/*Line 261 - 'AtomUI.js' */        var n = array.length;
/*Line 262 - 'AtomUI.js' */        var i = 0;
/*Line 263 - 'AtomUI.js' */        for (i = 0; i < n; i++) {
/*Line 264 - 'AtomUI.js' */            if (array[i] == item)
/*Line 265 - 'AtomUI.js' */                return true;
/*Line 266 - 'AtomUI.js' */        }
/*Line 267 - 'AtomUI.js' */        return false;
/*Line 268 - 'AtomUI.js' */    },

/*Line 270 - 'AtomUI.js' */    removeAllChildren: function (element) {
/*Line 271 - 'AtomUI.js' */        while (element.hasChildNodes()) {
/*Line 272 - 'AtomUI.js' */            var lc = element.lastChild;
/*Line 273 - 'AtomUI.js' */            if (!lc)
/*Line 274 - 'AtomUI.js' */                break;
/*Line 275 - 'AtomUI.js' */            //element.removeChild(lc);
/*Line 276 - 'AtomUI.js' */            if (lc.atomControl) {
/*Line 277 - 'AtomUI.js' */                lc.atomControl.dispose();
/*Line 278 - 'AtomUI.js' */                delete lc.atomControl;
/*Line 279 - 'AtomUI.js' */            }
/*Line 280 - 'AtomUI.js' */            $(lc).remove();
/*Line 281 - 'AtomUI.js' */            //delete lc;
/*Line 282 - 'AtomUI.js' */        }
/*Line 283 - 'AtomUI.js' */    },

/*Line 285 - 'AtomUI.js' */    isWebkit: function () {
/*Line 286 - 'AtomUI.js' */        if (window.navigator.userAgent.toLowerCase().indexOf("webkit") == -1)
/*Line 287 - 'AtomUI.js' */            return false;
/*Line 288 - 'AtomUI.js' */        return true;
/*Line 289 - 'AtomUI.js' */    },

/*Line 291 - 'AtomUI.js' */    isWeirdControl: function (e) {
/*Line 292 - 'AtomUI.js' */        return e.nodeName == "BUTTON" || e.nodeName == "SELECT" || (e.nodeName == "INPUT" && e.getAttribute('type') == "submit");
/*Line 293 - 'AtomUI.js' */    },

/*Line 295 - 'AtomUI.js' */    parseCSS: function ($e, a) {
/*Line 296 - 'AtomUI.js' */        var p = parseInt($e.css(a), 10);
/*Line 297 - 'AtomUI.js' */        if (isNaN(p))
/*Line 298 - 'AtomUI.js' */            return 0;
/*Line 299 - 'AtomUI.js' */        return p;
/*Line 300 - 'AtomUI.js' */    },

/*Line 302 - 'AtomUI.js' */    setItemRect: function ($e, e, r) {

/*Line 304 - 'AtomUI.js' */        var isBoxSizing = $e.css("box-sizing") == "border-box";

/*Line 306 - 'AtomUI.js' */        var marginLeft = this.parseCSS($e,"marginLeft");
/*Line 307 - 'AtomUI.js' */        var marginRight = this.parseCSS($e,"marginRight");
/*Line 308 - 'AtomUI.js' */        var marginTop = this.parseCSS($e, "marginTop");
/*Line 309 - 'AtomUI.js' */        var marginBottom = this.parseCSS($e, "marginBottom");

/*Line 311 - 'AtomUI.js' */        var isButton = this.isWeirdControl(e);

/*Line 313 - 'AtomUI.js' */        if (r.width) {
/*Line 314 - 'AtomUI.js' */            r.width -= marginLeft + marginRight;
/*Line 315 - 'AtomUI.js' */            if (!isBoxSizing) {
/*Line 316 - 'AtomUI.js' */                if (!isButton) {
/*Line 317 - 'AtomUI.js' */                    r.width -= this.parseCSS($e, "borderLeftWidth") + this.parseCSS($e, "borderRightWidth");
/*Line 318 - 'AtomUI.js' */                    r.width -= this.parseCSS($e, "paddingLeft") + this.parseCSS($e, "paddingRight");
/*Line 319 - 'AtomUI.js' */                }
/*Line 320 - 'AtomUI.js' */            }
/*Line 321 - 'AtomUI.js' */            if (r.width < 0)
/*Line 322 - 'AtomUI.js' */                r.width = 0;
/*Line 323 - 'AtomUI.js' */            e.style.width = r.width + "px";
/*Line 324 - 'AtomUI.js' */        }
/*Line 325 - 'AtomUI.js' */        if (r.height) {
/*Line 326 - 'AtomUI.js' */            //r.height -= $(e).outerWidth(true) - $(e).width();
/*Line 327 - 'AtomUI.js' */            r.height -= marginTop + marginBottom;
/*Line 328 - 'AtomUI.js' */            if (!isBoxSizing) {
/*Line 329 - 'AtomUI.js' */                if (!isButton) {
/*Line 330 - 'AtomUI.js' */                    r.height -= this.parseCSS($e, "borderTopWidth") + this.parseCSS($e, "borderBottomWidth");
/*Line 331 - 'AtomUI.js' */                    r.height -= this.parseCSS($e, "paddingTop") + this.parseCSS($e, "paddingBottom");
/*Line 332 - 'AtomUI.js' */                }
/*Line 333 - 'AtomUI.js' */            }
/*Line 334 - 'AtomUI.js' */            if (r.height < 0)
/*Line 335 - 'AtomUI.js' */                r.height = 0;
/*Line 336 - 'AtomUI.js' */            e.style.height = r.height + "px";
/*Line 337 - 'AtomUI.js' */        }
/*Line 338 - 'AtomUI.js' */        if (r.left) {
/*Line 339 - 'AtomUI.js' */            r.left += marginLeft;
/*Line 340 - 'AtomUI.js' */            e.style.left = r.left + "px";
/*Line 341 - 'AtomUI.js' */        }
/*Line 342 - 'AtomUI.js' */        if (r.top) {
/*Line 343 - 'AtomUI.js' */            r.top += marginTop;
/*Line 344 - 'AtomUI.js' */            e.style.top = r.top + "px";
/*Line 345 - 'AtomUI.js' */        }
/*Line 346 - 'AtomUI.js' */    },

/*Line 348 - 'AtomUI.js' */    getPresenterOwner: function (ctrl, p) {
/*Line 349 - 'AtomUI.js' */        if (ctrl._presenters) {
/*Line 350 - 'AtomUI.js' */            var ae = new AtomEnumerator(ctrl._presenters);
/*Line 351 - 'AtomUI.js' */            while (ae.next()) {
/*Line 352 - 'AtomUI.js' */                var c = ae.current();
/*Line 353 - 'AtomUI.js' */                if (c == p)
/*Line 354 - 'AtomUI.js' */                    return ctrl;
/*Line 355 - 'AtomUI.js' */            }
/*Line 356 - 'AtomUI.js' */        }
/*Line 357 - 'AtomUI.js' */        return this.getPresenterOwner(ctrl.get_atomParent(), p);
/*Line 358 - 'AtomUI.js' */    },

/*Line 360 - 'AtomUI.js' */    createCss: function (o) {
/*Line 361 - 'AtomUI.js' */        if (!o)
/*Line 362 - 'AtomUI.js' */            return "";
/*Line 363 - 'AtomUI.js' */        if (o.constructor == String)
/*Line 364 - 'AtomUI.js' */            return o;
/*Line 365 - 'AtomUI.js' */        var list = [];
/*Line 366 - 'AtomUI.js' */        for (var k in o) {
/*Line 367 - 'AtomUI.js' */            var v = o[k];
/*Line 368 - 'AtomUI.js' */            if (!v)
/*Line 369 - 'AtomUI.js' */                continue;
/*Line 370 - 'AtomUI.js' */            list.push(k);
/*Line 371 - 'AtomUI.js' */        }
/*Line 372 - 'AtomUI.js' */        return list.join(" ");
/*Line 373 - 'AtomUI.js' */    },

/*Line 375 - 'AtomUI.js' */    createControl: function (element, type, data, newScope) {
/*Line 376 - 'AtomUI.js' */        if (element.atomControl)
/*Line 377 - 'AtomUI.js' */            return;
/*Line 378 - 'AtomUI.js' */        if (!type) {
/*Line 379 - 'AtomUI.js' */            type = AtomUI.getAtomType(element);
/*Line 380 - 'AtomUI.js' */            type = WebAtoms[type];
/*Line 381 - 'AtomUI.js' */        } else {
/*Line 382 - 'AtomUI.js' */            if (type.constructor == String) {
/*Line 383 - 'AtomUI.js' */                type = WebAtoms[type];
/*Line 384 - 'AtomUI.js' */            }
/*Line 385 - 'AtomUI.js' */        }
/*Line 386 - 'AtomUI.js' */        if (type) {
/*Line 387 - 'AtomUI.js' */            var ctrl = new type(element);
/*Line 388 - 'AtomUI.js' */            if (data) {
/*Line 389 - 'AtomUI.js' */                ctrl._data = data;
/*Line 390 - 'AtomUI.js' */            }
/*Line 391 - 'AtomUI.js' */            if (newScope) {
/*Line 392 - 'AtomUI.js' */                ctrl._scope = newScope;
/*Line 393 - 'AtomUI.js' */            }

/*Line 395 - 'AtomUI.js' */            //inits templates..
/*Line 396 - 'AtomUI.js' */            //ctrl.prepareControl();

/*Line 398 - 'AtomUI.js' */            //init templates and creates controls...
/*Line 399 - 'AtomUI.js' */            ctrl.createChildren();

/*Line 401 - 'AtomUI.js' */            if (data) {
/*Line 402 - 'AtomUI.js' */                ctrl.init();
/*Line 403 - 'AtomUI.js' */            }
/*Line 404 - 'AtomUI.js' */            //$(element).removeAttr("atom-type");
/*Line 405 - 'AtomUI.js' */            return ctrl;
/*Line 406 - 'AtomUI.js' */        }
/*Line 407 - 'AtomUI.js' */        return null;
/*Line 408 - 'AtomUI.js' */    }

/*Line 410 - 'AtomUI.js' */};

/*Line 412 - 'AtomUI.js' */window.AtomUI = AtomUI;

/*Line 414 - 'AtomUI.js' */AtomUI.isIE7 = window.navigator.userAgent.indexOf("MSIE 7.0") != -1;
/*Line 415 - 'AtomUI.js' */AtomUI.isIE8 = window.navigator.userAgent.indexOf("MSIE 8.0") != -1;

/*Line 417 - 'AtomUI.js' */window.AtomUri = function (url) {
/*Line 418 - 'AtomUI.js' */    var path;
/*Line 419 - 'AtomUI.js' */    var query = "";
/*Line 420 - 'AtomUI.js' */    var hash = "";
/*Line 421 - 'AtomUI.js' */    var t = url.split('?');
/*Line 422 - 'AtomUI.js' */    path = t[0];
/*Line 423 - 'AtomUI.js' */    if (t.length == 2) {
/*Line 424 - 'AtomUI.js' */        query = t[1] || "";

/*Line 426 - 'AtomUI.js' */        t = query.split('#');
/*Line 427 - 'AtomUI.js' */        query = t[0];
/*Line 428 - 'AtomUI.js' */        hash = t[1] || "";
/*Line 429 - 'AtomUI.js' */    } else {
/*Line 430 - 'AtomUI.js' */        t = path.split('#');
/*Line 431 - 'AtomUI.js' */        path = t[0];
/*Line 432 - 'AtomUI.js' */        hash = t[1] || "";
/*Line 433 - 'AtomUI.js' */    }

/*Line 435 - 'AtomUI.js' */    // extract protocol and domain...

/*Line 437 - 'AtomUI.js' */    var scheme = location.protocol;
/*Line 438 - 'AtomUI.js' */    var host = location.host;
/*Line 439 - 'AtomUI.js' */    var port = location.port;

/*Line 441 - 'AtomUI.js' */    var i = path.indexOf('//');
/*Line 442 - 'AtomUI.js' */    if (i !== -1) {
/*Line 443 - 'AtomUI.js' */        scheme = path.substr(0, i);
/*Line 444 - 'AtomUI.js' */        path = path.substr(i + 2);


/*Line 447 - 'AtomUI.js' */        i = path.indexOf('/');
/*Line 448 - 'AtomUI.js' */        if (i !== -1) {
/*Line 449 - 'AtomUI.js' */            host = path.substr(0, i);
/*Line 450 - 'AtomUI.js' */            path = path.substr(i + 1);
/*Line 451 - 'AtomUI.js' */            t = host.split(':');
/*Line 452 - 'AtomUI.js' */            if (t.length > 1) {
/*Line 453 - 'AtomUI.js' */                host = t[0];
/*Line 454 - 'AtomUI.js' */                port = t[1];
/*Line 455 - 'AtomUI.js' */            }
/*Line 456 - 'AtomUI.js' */        }
/*Line 457 - 'AtomUI.js' */    }
/*Line 458 - 'AtomUI.js' */    this.host = host;
/*Line 459 - 'AtomUI.js' */    this.protocol = scheme;
/*Line 460 - 'AtomUI.js' */    this.port = port;
/*Line 461 - 'AtomUI.js' */    this.path = path;



/*Line 465 - 'AtomUI.js' */    this.query = AtomUI.parseUrl(query);
/*Line 466 - 'AtomUI.js' */    this.hash = AtomUI.parseUrl(hash);
/*Line 467 - 'AtomUI.js' */}
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


/*Line 79 - 'AtomPopup.js' */    }


/*Line 82 - 'AtomPopup.js' */};

/*Line 84 - 'AtomPopup.js' */window.AtomPopup = AtomPopup;

/*Line 86 - 'AtomPopup.js' */window.simulateParentClick = function () {

/*Line 88 - 'AtomPopup.js' */    var p = null;
/*Line 89 - 'AtomPopup.js' */    try {
/*Line 90 - 'AtomPopup.js' */        p = frameElement;
/*Line 91 - 'AtomPopup.js' */    } catch (e) {
/*Line 92 - 'AtomPopup.js' */        //log(e);
/*Line 93 - 'AtomPopup.js' */        return;
/*Line 94 - 'AtomPopup.js' */    }
/*Line 95 - 'AtomPopup.js' */    if (!p)
/*Line 96 - 'AtomPopup.js' */        return;
/*Line 97 - 'AtomPopup.js' */    if (!parent)
/*Line 98 - 'AtomPopup.js' */        return;

/*Line 100 - 'AtomPopup.js' */    var $ = parent.$;

/*Line 102 - 'AtomPopup.js' */    $(frameElement).click();

/*Line 104 - 'AtomPopup.js' */    if (p.simulateParentClick) {
/*Line 105 - 'AtomPopup.js' */        p.simulateParentClick();
/*Line 106 - 'AtomPopup.js' */    }
/*Line 107 - 'AtomPopup.js' */}


/*Line 110 - 'AtomPopup.js' */$(window).click(function (e) {
/*Line 111 - 'AtomPopup.js' */    AtomPopup.clicked(e);

/*Line 113 - 'AtomPopup.js' */    window.simulateParentClick();

/*Line 115 - 'AtomPopup.js' */});
/*Line 0 - 'WebAtoms.Core.js' */
/*Line 1 - 'WebAtoms.Core.js' */
/*Line 2 - 'WebAtoms.Core.js' */
/*Line 3 - 'WebAtoms.Core.js' */
/*Line 4 - 'WebAtoms.Core.js' */
/*Line 5 - 'WebAtoms.Core.js' */
/*Line 6 - 'WebAtoms.Core.js' */
/*Line 7 - 'WebAtoms.Core.js' */

/*Line 9 - 'WebAtoms.Core.js' */Array.prototype.enumerator = function () {
/*Line 10 - 'WebAtoms.Core.js' */    return new AtomEnumerator(this);
/*Line 11 - 'WebAtoms.Core.js' */};

/*Line 13 - 'WebAtoms.Core.js' */if (!Array.prototype.indexOf) {
/*Line 14 - 'WebAtoms.Core.js' */    Array.prototype.indexOf = function (item) {
/*Line 15 - 'WebAtoms.Core.js' */        var i = 0;
/*Line 16 - 'WebAtoms.Core.js' */        for (i = 0; i < this.length; i++) {
/*Line 17 - 'WebAtoms.Core.js' */            if (item == this[i])
/*Line 18 - 'WebAtoms.Core.js' */                return i;
/*Line 19 - 'WebAtoms.Core.js' */        }
/*Line 20 - 'WebAtoms.Core.js' */        return -1;
/*Line 21 - 'WebAtoms.Core.js' */    };
/*Line 22 - 'WebAtoms.Core.js' */}

/*Line 24 - 'WebAtoms.Core.js' */var AtomArray = {

/*Line 26 - 'WebAtoms.Core.js' */    split: function (text, sep) {
/*Line 27 - 'WebAtoms.Core.js' */        if (sep && sep.constructor == String) {
/*Line 28 - 'WebAtoms.Core.js' */            sep = $.trim(sep);
/*Line 29 - 'WebAtoms.Core.js' */        }
/*Line 30 - 'WebAtoms.Core.js' */        var ar = text.split(sep);
/*Line 31 - 'WebAtoms.Core.js' */        var r = [];
/*Line 32 - 'WebAtoms.Core.js' */        var ae = new AtomEnumerator(ar);
/*Line 33 - 'WebAtoms.Core.js' */        var item;
/*Line 34 - 'WebAtoms.Core.js' */        while (ae.next()) {
/*Line 35 - 'WebAtoms.Core.js' */            item = ae.current();
/*Line 36 - 'WebAtoms.Core.js' */            if (item && item.constructor == String) {
/*Line 37 - 'WebAtoms.Core.js' */                item = $.trim(item);
/*Line 38 - 'WebAtoms.Core.js' */            }
/*Line 39 - 'WebAtoms.Core.js' */            r.push(item);
/*Line 40 - 'WebAtoms.Core.js' */        }
/*Line 41 - 'WebAtoms.Core.js' */        return r;
/*Line 42 - 'WebAtoms.Core.js' */    },

/*Line 44 - 'WebAtoms.Core.js' */    getValues: function (array, path) {
/*Line 45 - 'WebAtoms.Core.js' */        var item;
/*Line 46 - 'WebAtoms.Core.js' */        var result = array;
/*Line 47 - 'WebAtoms.Core.js' */        if (path) {
/*Line 48 - 'WebAtoms.Core.js' */            result = [];
/*Line 49 - 'WebAtoms.Core.js' */            var ae = new AtomEnumerator(array);
/*Line 50 - 'WebAtoms.Core.js' */            while (ae.next()) {
/*Line 51 - 'WebAtoms.Core.js' */                item = ae.current();
/*Line 52 - 'WebAtoms.Core.js' */                result.push(item[path]);
/*Line 53 - 'WebAtoms.Core.js' */            }
/*Line 54 - 'WebAtoms.Core.js' */        }
/*Line 55 - 'WebAtoms.Core.js' */        return result;
/*Line 56 - 'WebAtoms.Core.js' */    },

/*Line 58 - 'WebAtoms.Core.js' */    intersect: function (array, path, value) {
/*Line 59 - 'WebAtoms.Core.js' */        var result = [];
/*Line 60 - 'WebAtoms.Core.js' */        var ae = new AtomEnumerator(value);
/*Line 61 - 'WebAtoms.Core.js' */        var item;
/*Line 62 - 'WebAtoms.Core.js' */        var match;
/*Line 63 - 'WebAtoms.Core.js' */        while (ae.next()) {
/*Line 64 - 'WebAtoms.Core.js' */            item = ae.current();
/*Line 65 - 'WebAtoms.Core.js' */            match = this.getMatch(array, path, item);
/*Line 66 - 'WebAtoms.Core.js' */            if (match != undefined)
/*Line 67 - 'WebAtoms.Core.js' */                result.push(match);
/*Line 68 - 'WebAtoms.Core.js' */        }
/*Line 69 - 'WebAtoms.Core.js' */        return result;
/*Line 70 - 'WebAtoms.Core.js' */    },

/*Line 72 - 'WebAtoms.Core.js' */    getMatch: function (array, path, value) {
/*Line 73 - 'WebAtoms.Core.js' */        var ae = new AtomEnumerator(array);
/*Line 74 - 'WebAtoms.Core.js' */        var dataItem;
/*Line 75 - 'WebAtoms.Core.js' */        var item;
/*Line 76 - 'WebAtoms.Core.js' */        while (ae.next()) {
/*Line 77 - 'WebAtoms.Core.js' */            dataItem = ae.current();
/*Line 78 - 'WebAtoms.Core.js' */            item = dataItem;
/*Line 79 - 'WebAtoms.Core.js' */            if (path)
/*Line 80 - 'WebAtoms.Core.js' */                item = dataItem[path];
/*Line 81 - 'WebAtoms.Core.js' */            if (item == value)
/*Line 82 - 'WebAtoms.Core.js' */                return dataItem;
/*Line 83 - 'WebAtoms.Core.js' */        }
/*Line 84 - 'WebAtoms.Core.js' */    },

/*Line 86 - 'WebAtoms.Core.js' */    remove: function (array, item) {
/*Line 87 - 'WebAtoms.Core.js' */        var ae = new AtomEnumerator(array);
/*Line 88 - 'WebAtoms.Core.js' */        while (ae.next()) {
/*Line 89 - 'WebAtoms.Core.js' */            var arrayItem = ae.current();
/*Line 90 - 'WebAtoms.Core.js' */            if (arrayItem == item) {
/*Line 91 - 'WebAtoms.Core.js' */                array.splice(ae.currentIndex(), 1);
/*Line 92 - 'WebAtoms.Core.js' */                return;
/*Line 93 - 'WebAtoms.Core.js' */            }
/*Line 94 - 'WebAtoms.Core.js' */        }
/*Line 95 - 'WebAtoms.Core.js' */    }
/*Line 96 - 'WebAtoms.Core.js' */};

/*Line 98 - 'WebAtoms.Core.js' */window.AtomArray = AtomArray;

/*Line 100 - 'WebAtoms.Core.js' *///Creating AtomScope Class
/*Line 101 - 'WebAtoms.Core.js' */var AtomScope = (function () {
/*Line 102 - 'WebAtoms.Core.js' */    return classCreator("WebAtoms.AtomScope", null,
/*Line 103 - 'WebAtoms.Core.js' */        function (owner,parent,app) {
/*Line 104 - 'WebAtoms.Core.js' */            this.owner = owner;
/*Line 105 - 'WebAtoms.Core.js' */            this.parent = parent;
/*Line 106 - 'WebAtoms.Core.js' */            if (app) {
/*Line 107 - 'WebAtoms.Core.js' */                this.__application = app;
/*Line 108 - 'WebAtoms.Core.js' */            }
/*Line 109 - 'WebAtoms.Core.js' */            if (this.__application == this.owner) {
/*Line 110 - 'WebAtoms.Core.js' */                //this._$_watcher = this.__application;
/*Line 111 - 'WebAtoms.Core.js' */                this._v = 0;
/*Line 112 - 'WebAtoms.Core.js' */                this.refreshCommand = function () {
/*Line 113 - 'WebAtoms.Core.js' */                    appScope._v = appScope._v + 1;
/*Line 114 - 'WebAtoms.Core.js' */                    AtomBinder.refreshValue(appScope, "_v");
/*Line 115 - 'WebAtoms.Core.js' */                };
/*Line 116 - 'WebAtoms.Core.js' */            }
/*Line 117 - 'WebAtoms.Core.js' */            this._refreshValue = function (name) {
/*Line 118 - 'WebAtoms.Core.js' */                AtomBinder.refreshValue(this, name);
/*Line 119 - 'WebAtoms.Core.js' */                if (this.__application === this.owner) {
/*Line 120 - 'WebAtoms.Core.js' */                    this.__application._onRefreshValue(this, name);
/*Line 121 - 'WebAtoms.Core.js' */                }
/*Line 122 - 'WebAtoms.Core.js' */            };

/*Line 124 - 'WebAtoms.Core.js' */        },
/*Line 125 - 'WebAtoms.Core.js' */        {
/*Line 126 - 'WebAtoms.Core.js' */            setValue: function (name, value, forceRefresh) {
/*Line 127 - 'WebAtoms.Core.js' */                if (AtomBinder.getValue(this, name) == value) {
/*Line 128 - 'WebAtoms.Core.js' */                    if (forceRefresh) {
/*Line 129 - 'WebAtoms.Core.js' */                        this._refreshValue(name);
/*Line 130 - 'WebAtoms.Core.js' */                    }
/*Line 131 - 'WebAtoms.Core.js' */                    return;
/*Line 132 - 'WebAtoms.Core.js' */                }
/*Line 133 - 'WebAtoms.Core.js' */                var f = this["set_" + name];
/*Line 134 - 'WebAtoms.Core.js' */                if (f) {
/*Line 135 - 'WebAtoms.Core.js' */                    f.apply(this, [value]);
/*Line 136 - 'WebAtoms.Core.js' */                } else {
/*Line 137 - 'WebAtoms.Core.js' */                    this[name] = value;
/*Line 138 - 'WebAtoms.Core.js' */                }
/*Line 139 - 'WebAtoms.Core.js' */                this._refreshValue(name);
/*Line 140 - 'WebAtoms.Core.js' */            }
/*Line 141 - 'WebAtoms.Core.js' */        });
/*Line 142 - 'WebAtoms.Core.js' */})();
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
/*Line 0 - 'AtomComponent.js' */
/*Line 1 - 'AtomComponent.js' */
/*Line 2 - 'AtomComponent.js' */

/*Line 4 - 'AtomComponent.js' */(function(){
/*Line 5 - 'AtomComponent.js' */    return classCreator("WebAtoms.AtomComponent", null,
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
/*Line 110 - 'AtomComponent.js' */})();
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
/*Line 280 - 'AtomPromise.js' */        o.data = AtomBinder.getClone(data);
/*Line 281 - 'AtomPromise.js' */    }
/*Line 282 - 'AtomPromise.js' */    var e = AtomConfig.ajax.jsonPostEncode;
/*Line 283 - 'AtomPromise.js' */    if (e) {
/*Line 284 - 'AtomPromise.js' */        o = e(o);
/*Line 285 - 'AtomPromise.js' */    } else {
/*Line 286 - 'AtomPromise.js' */        o.data = { formModel: JSON.stringify(o.data) };
/*Line 287 - 'AtomPromise.js' */    }

/*Line 289 - 'AtomPromise.js' */    var attachments = o.attachments;
/*Line 290 - 'AtomPromise.js' */    if (attachments && attachments.length) {
/*Line 291 - 'AtomPromise.js' */        var fd = new FormData();
/*Line 292 - 'AtomPromise.js' */        var ae = new AtomEnumerator(attachments);
/*Line 293 - 'AtomPromise.js' */        while (ae.next()) {
/*Line 294 - 'AtomPromise.js' */            fd.append("file" + ae.currentIndex(), ae.current());
/*Line 295 - 'AtomPromise.js' */        }
/*Line 296 - 'AtomPromise.js' */        if (data) {
/*Line 297 - 'AtomPromise.js' */            for (var k in data) {
/*Line 298 - 'AtomPromise.js' */                fd.append(k, data[k]);
/*Line 299 - 'AtomPromise.js' */            }
/*Line 300 - 'AtomPromise.js' */        }
/*Line 301 - 'AtomPromise.js' */        o.type = "POST";
/*Line 302 - 'AtomPromise.js' */        o.xhr = function () {
/*Line 303 - 'AtomPromise.js' */            var myXhr = $.ajaxSettings.xhr();
/*Line 304 - 'AtomPromise.js' */            if (myXhr.upload) {
/*Line 305 - 'AtomPromise.js' */                myXhr.upload.addEventListener('progress', function (e) {
/*Line 306 - 'AtomPromise.js' */                    if (e.lengthComputable) {
/*Line 307 - 'AtomPromise.js' */                        var percentComplete = Math.round(e.loaded * 100 / e.total);
/*Line 308 - 'AtomPromise.js' */                        AtomBinder.setValue(atomApplication, 'progress', percentComplete);
/*Line 309 - 'AtomPromise.js' */                    }
/*Line 310 - 'AtomPromise.js' */                }, false);
/*Line 311 - 'AtomPromise.js' */            }
/*Line 312 - 'AtomPromise.js' */            return myXhr;
/*Line 313 - 'AtomPromise.js' */        };
/*Line 314 - 'AtomPromise.js' */        o.cache = false;
/*Line 315 - 'AtomPromise.js' */        o.contentType = false;
/*Line 316 - 'AtomPromise.js' */        o.processData = false;
/*Line 317 - 'AtomPromise.js' */    }

/*Line 319 - 'AtomPromise.js' */    if (query) {
/*Line 320 - 'AtomPromise.js' */        var q = {};
/*Line 321 - 'AtomPromise.js' */        if (!o.sendRawQueryString) {
/*Line 322 - 'AtomPromise.js' */            for (var k in query) {
/*Line 323 - 'AtomPromise.js' */                var v = query[k];
/*Line 324 - 'AtomPromise.js' */                if (v && ((typeof v) === "object")) {
/*Line 325 - 'AtomPromise.js' */                    v = JSON.stringify(AtomBinder.getClone(v));
/*Line 326 - 'AtomPromise.js' */                    if (v === undefined)
/*Line 327 - 'AtomPromise.js' */                        continue;
/*Line 328 - 'AtomPromise.js' */                    if (v === null)
/*Line 329 - 'AtomPromise.js' */                        continue;
/*Line 330 - 'AtomPromise.js' */                }
/*Line 331 - 'AtomPromise.js' */                q[k] = v;
/*Line 332 - 'AtomPromise.js' */            }
/*Line 333 - 'AtomPromise.js' */        }
/*Line 334 - 'AtomPromise.js' */        u = Atom.url(url, q);
/*Line 335 - 'AtomPromise.js' */    }

/*Line 337 - 'AtomPromise.js' */    if (url) {
/*Line 338 - 'AtomPromise.js' */        p.onInvoke(function () {
/*Line 339 - 'AtomPromise.js' */            p.handle = $.ajax(u, o);
/*Line 340 - 'AtomPromise.js' */        });
/*Line 341 - 'AtomPromise.js' */    }

/*Line 343 - 'AtomPromise.js' */    p.failed(function () {

/*Line 345 - 'AtomPromise.js' */        var res = p.errors[0].responseText;
/*Line 346 - 'AtomPromise.js' */        if (!res || p.errors[2] !== 'Internal Server Error') {
/*Line 347 - 'AtomPromise.js' */            res = p.errors[2];
/*Line 348 - 'AtomPromise.js' */        }

/*Line 350 - 'AtomPromise.js' */        p.error = {
/*Line 351 - 'AtomPromise.js' */            msg : res
/*Line 352 - 'AtomPromise.js' */        };

/*Line 354 - 'AtomPromise.js' */        if (p._showError) {
/*Line 355 - 'AtomPromise.js' */            if (p.error.msg) Atom.alert(p.error.msg);
/*Line 356 - 'AtomPromise.js' */        }
/*Line 357 - 'AtomPromise.js' */    });

/*Line 359 - 'AtomPromise.js' */    p.then(function (p) {
/*Line 360 - 'AtomPromise.js' */        var v = p.value();
/*Line 361 - 'AtomPromise.js' */        v = AtomPromise.parseDates(v);
/*Line 362 - 'AtomPromise.js' */        if (v && v.items && v.merge) {
/*Line 363 - 'AtomPromise.js' */            v.items.total = v.total;
/*Line 364 - 'AtomPromise.js' */            v = v.items;
/*Line 365 - 'AtomPromise.js' */            p.value(v);
/*Line 366 - 'AtomPromise.js' */        }
/*Line 367 - 'AtomPromise.js' */    });

/*Line 369 - 'AtomPromise.js' */    p.showError(true);
/*Line 370 - 'AtomPromise.js' */    p.showProgress(true);

/*Line 372 - 'AtomPromise.js' */    return p;
/*Line 373 - 'AtomPromise.js' */};

/*Line 375 - 'AtomPromise.js' */AtomPromise.get = function (url, query, options) {
/*Line 376 - 'AtomPromise.js' */    options = options || {};
/*Line 377 - 'AtomPromise.js' */    options.type = options.type || "get";
/*Line 378 - 'AtomPromise.js' */    options.dataType = options.dataType || "text";
/*Line 379 - 'AtomPromise.js' */    return AtomPromise.ajax(url, query, options, "get");
/*Line 380 - 'AtomPromise.js' */};

/*Line 382 - 'AtomPromise.js' */AtomPromise.plugins = {
/*Line 383 - 'AtomPromise.js' */};

/*Line 385 - 'AtomPromise.js' */AtomPromise.json = function (url, query, options) {
/*Line 386 - 'AtomPromise.js' */    options = options || {};
/*Line 387 - 'AtomPromise.js' */    options.type = options.type || "get";
/*Line 388 - 'AtomPromise.js' */    options.dataType = options.dataType || "json";

/*Line 390 - 'AtomPromise.js' */    var method = null;

/*Line 392 - 'AtomPromise.js' */    var i = url.indexOf('://');
/*Line 393 - 'AtomPromise.js' */    if (i !== -1) {
/*Line 394 - 'AtomPromise.js' */        var plugin = url.substr(0, i);
/*Line 395 - 'AtomPromise.js' */        if (!/http|https/i.test(plugin)) {
/*Line 396 - 'AtomPromise.js' */            url = url.substr(i + 3);
/*Line 397 - 'AtomPromise.js' */            method = AtomPromise.plugins[plugin];
/*Line 398 - 'AtomPromise.js' */        }
/*Line 399 - 'AtomPromise.js' */    }

/*Line 401 - 'AtomPromise.js' */    method = method || AtomPromise.ajax;

/*Line 403 - 'AtomPromise.js' */    return method(url, query, options, "json");
/*Line 404 - 'AtomPromise.js' */};

/*Line 406 - 'AtomPromise.js' */AtomPromise.cache = {
/*Line 407 - 'AtomPromise.js' */};

/*Line 409 - 'AtomPromise.js' */AtomPromise.cacheInProgress = {
/*Line 410 - 'AtomPromise.js' */};

/*Line 412 - 'AtomPromise.js' */AtomPromise.cachedPromise = function (key, p) {
/*Line 413 - 'AtomPromise.js' */    var c = AtomPromise.cache[key];

/*Line 415 - 'AtomPromise.js' */    if (!c && window.sessionStorage) {
/*Line 416 - 'AtomPromise.js' */        c = window.sessionStorage["__AP" + key];
/*Line 417 - 'AtomPromise.js' */        if (c) {
/*Line 418 - 'AtomPromise.js' */            c = JSON.parse(c);
/*Line 419 - 'AtomPromise.js' */            AtomPromise.cache[key] = c;
/*Line 420 - 'AtomPromise.js' */        }
/*Line 421 - 'AtomPromise.js' */    }

/*Line 423 - 'AtomPromise.js' */    if (c) {
/*Line 424 - 'AtomPromise.js' */        p.onInvoke(function () {
/*Line 425 - 'AtomPromise.js' */            p.pushValue(c);
/*Line 426 - 'AtomPromise.js' */        });
/*Line 427 - 'AtomPromise.js' */        return p;
/*Line 428 - 'AtomPromise.js' */    }

/*Line 430 - 'AtomPromise.js' */    p.then(function (p1) {
/*Line 431 - 'AtomPromise.js' */        AtomPromise.cache[key] = p1.value();
/*Line 432 - 'AtomPromise.js' */        if (window.sessionStorage) {
/*Line 433 - 'AtomPromise.js' */            window.sessionStorage["__AP" + key] = JSON.stringify( p1.value() );
/*Line 434 - 'AtomPromise.js' */        }
/*Line 435 - 'AtomPromise.js' */    });

/*Line 437 - 'AtomPromise.js' */    return p;
/*Line 438 - 'AtomPromise.js' */};

/*Line 440 - 'AtomPromise.js' */AtomPromise.cachedJson = function (url, query, options) {

/*Line 442 - 'AtomPromise.js' */    var vd = new Date();

/*Line 444 - 'AtomPromise.js' */    var v = AtomConfig.ajax.version;
/*Line 445 - 'AtomPromise.js' */    var vk = AtomConfig.ajax.versionKey + '=' + v;

/*Line 447 - 'AtomPromise.js' */    if (url.indexOf('?') === -1) {
/*Line 448 - 'AtomPromise.js' */        vk = '?' + vk;
/*Line 449 - 'AtomPromise.js' */    } else {
/*Line 450 - 'AtomPromise.js' */        if (!/\&$/.test(url)) {
/*Line 451 - 'AtomPromise.js' */            vk = '&' + vk;
/*Line 452 - 'AtomPromise.js' */        }
/*Line 453 - 'AtomPromise.js' */    }
/*Line 454 - 'AtomPromise.js' */    url += vk;

/*Line 456 - 'AtomPromise.js' */    options = options || {};
/*Line 457 - 'AtomPromise.js' */    // caching must be true everywhere
/*Line 458 - 'AtomPromise.js' */    options.cache = true;
/*Line 459 - 'AtomPromise.js' */    options.ifModified = true;
/*Line 460 - 'AtomPromise.js' */    options.versionUrl = false;

/*Line 462 - 'AtomPromise.js' */    var ap = AtomPromise.ajax(url, query, options, "json");
/*Line 463 - 'AtomPromise.js' */    return AtomPromise.cachedPromise(url, ap);
/*Line 464 - 'AtomPromise.js' */};

/*Line 466 - 'AtomPromise.js' */AtomPromise.configCache = {};

/*Line 468 - 'AtomPromise.js' */AtomPromise.configLabel = function (url, value, options) {

/*Line 470 - 'AtomPromise.js' */    if (value === null || value === undefined)
/*Line 471 - 'AtomPromise.js' */        return "";

/*Line 473 - 'AtomPromise.js' */    options = options || {};

/*Line 475 - 'AtomPromise.js' */    var valuePath = options.valuePath || "value";
/*Line 476 - 'AtomPromise.js' */    var labelPath = options.labelPath || "label";
/*Line 477 - 'AtomPromise.js' */    var isNumber = options.isNumber || false;

/*Line 479 - 'AtomPromise.js' */    if (isNumber) {
/*Line 480 - 'AtomPromise.js' */        if (typeof value !== "number") {
/*Line 481 - 'AtomPromise.js' */            value = parseFloat(value);
/*Line 482 - 'AtomPromise.js' */        }
/*Line 483 - 'AtomPromise.js' */    }

/*Line 485 - 'AtomPromise.js' */    var p = new AtomPromise();
/*Line 486 - 'AtomPromise.js' */    p.onInvoke(function () {

/*Line 488 - 'AtomPromise.js' */        var cf = AtomPromise.configCache[url];
/*Line 489 - 'AtomPromise.js' */        if (cf) {
/*Line 490 - 'AtomPromise.js' */            cf = cf[value];
/*Line 491 - 'AtomPromise.js' */            cf = cf ? cf[labelPath] : "";
/*Line 492 - 'AtomPromise.js' */            p.pushValue(cf);
/*Line 493 - 'AtomPromise.js' */            return;
/*Line 494 - 'AtomPromise.js' */        }

/*Line 496 - 'AtomPromise.js' */        var ap = AtomPromise.cachedJson(url);


/*Line 499 - 'AtomPromise.js' */        ap.then(function (a) {
/*Line 500 - 'AtomPromise.js' */            var v = "";

/*Line 502 - 'AtomPromise.js' */            var nv = {};

/*Line 504 - 'AtomPromise.js' */            var ae = new AtomEnumerator(a.value());
/*Line 505 - 'AtomPromise.js' */            while (ae.next()) {
/*Line 506 - 'AtomPromise.js' */                var item = ae.current();
/*Line 507 - 'AtomPromise.js' */                v = item[valuePath];
/*Line 508 - 'AtomPromise.js' */                if (isNumber) {
/*Line 509 - 'AtomPromise.js' */                    if (typeof v !== "number") {
/*Line 510 - 'AtomPromise.js' */                        v = parseFloat(v);
/*Line 511 - 'AtomPromise.js' */                    }
/*Line 512 - 'AtomPromise.js' */                }
/*Line 513 - 'AtomPromise.js' */                nv[v] = item;
/*Line 514 - 'AtomPromise.js' */            }
/*Line 515 - 'AtomPromise.js' */            AtomPromise.configCache[url] = nv;
/*Line 516 - 'AtomPromise.js' */            nv = nv[value];
/*Line 517 - 'AtomPromise.js' */            nv = nv ? nv[labelPath] : "";
/*Line 518 - 'AtomPromise.js' */            p.pushValue(nv);
/*Line 519 - 'AtomPromise.js' */        });

/*Line 521 - 'AtomPromise.js' */        ap.invoke();
/*Line 522 - 'AtomPromise.js' */    });

/*Line 524 - 'AtomPromise.js' */    return p;
/*Line 525 - 'AtomPromise.js' */};

/*Line 527 - 'AtomPromise.js' */AtomPromise.prototype.insertItem = function (index, item, arrayPath) {
/*Line 528 - 'AtomPromise.js' */    return this.then(function (p) {
/*Line 529 - 'AtomPromise.js' */        var v = p.value();
/*Line 530 - 'AtomPromise.js' */        if (v._$_itemInserted)
/*Line 531 - 'AtomPromise.js' */            return;
/*Line 532 - 'AtomPromise.js' */        if (arrayPath) {
/*Line 533 - 'AtomPromise.js' */            v = v[arrayPath];
/*Line 534 - 'AtomPromise.js' */        }
/*Line 535 - 'AtomPromise.js' */        if (index === -1) {
/*Line 536 - 'AtomPromise.js' */            v.push(item);
/*Line 537 - 'AtomPromise.js' */        } else {
/*Line 538 - 'AtomPromise.js' */            v.splice(index || 0, 0, item);
/*Line 539 - 'AtomPromise.js' */        }
/*Line 540 - 'AtomPromise.js' */        v._$_itemInserted = true;        
/*Line 541 - 'AtomPromise.js' */    });
/*Line 542 - 'AtomPromise.js' */};
/*Line 543 - 'AtomPromise.js' *///$setValue = AtomBinder.setValue;
/*Line 544 - 'AtomPromise.js' *///$getValue = AtomBinder.getValue;


/*Line 547 - 'AtomPromise.js' *///Object.prototype.setValue = function (key, value) {
/*Line 548 - 'AtomPromise.js' *///    
/*Line 549 - 'AtomPromise.js' *///    AtomBinder.setValue(this, key, value);
/*Line 550 - 'AtomPromise.js' *///};

/*Line 552 - 'AtomPromise.js' *///Object.prototype.getValue = function (key) {
/*Line 553 - 'AtomPromise.js' *///    return AtomBinder.getValue(this, key);
/*Line 554 - 'AtomPromise.js' *///};

/*Line 556 - 'AtomPromise.js' *///Object.prototype.add_WatchHandler = function(key,handler){
/*Line 557 - 'AtomPromise.js' *///    AtomBinder.add_WatchHandler(this,key,handler);
/*Line 558 - 'AtomPromise.js' *///};

/*Line 560 - 'AtomPromise.js' *///Object.prototype.remove_WatchHandler = function(key,handler){
/*Line 561 - 'AtomPromise.js' *///    AtomBinder.remove_WatchHandler(this,key,handler);
/*Line 562 - 'AtomPromise.js' *///};

/*Line 564 - 'AtomPromise.js' *///Array.prototype.add = function (item) {
/*Line 565 - 'AtomPromise.js' *///    AtomBinder.addItem(this, item);
/*Line 566 - 'AtomPromise.js' *///};

/*Line 568 - 'AtomPromise.js' *///Array.prototype.remove = function (item) {
/*Line 569 - 'AtomPromise.js' *///    AtomBinder.removeItem(this, item);
/*Line 570 - 'AtomPromise.js' *///};

/*Line 572 - 'AtomPromise.js' *///Array.prototype.add_CollectionHandler= function(handler){
/*Line 573 - 'AtomPromise.js' *///    AtomBinder.add_CollectionHandler(this,handler);
/*Line 574 - 'AtomPromise.js' *///};

/*Line 576 - 'AtomPromise.js' *///Array.prototype.remove_CollectionHandler= function(handler){
/*Line 577 - 'AtomPromise.js' *///    AtomBinder.remove_CollectionHandler(this,handler);
/*Line 578 - 'AtomPromise.js' *///};


/*Line 581 - 'AtomPromise.js' */var AtomLocalStorage = {

/*Line 583 - 'AtomPromise.js' */    list: function (storage, query)
/*Line 584 - 'AtomPromise.js' */    {
/*Line 585 - 'AtomPromise.js' */    },
/*Line 586 - 'AtomPromise.js' */    add: function (storage, query) {
/*Line 587 - 'AtomPromise.js' */    },
/*Line 588 - 'AtomPromise.js' */    remove: function (storage, query) {
/*Line 589 - 'AtomPromise.js' */    },
/*Line 590 - 'AtomPromise.js' */    clear: function (storage) {
/*Line 591 - 'AtomPromise.js' */    },
/*Line 592 - 'AtomPromise.js' */    set: function (storage, query, data) {
/*Line 593 - 'AtomPromise.js' */    },
/*Line 594 - 'AtomPromise.js' */    get: function (storage, query) {
/*Line 595 - 'AtomPromise.js' */    }

/*Line 597 - 'AtomPromise.js' */};


/*Line 600 - 'AtomPromise.js' */AtomPromise.plugins["local-storage"] = function (url, query, options) {
/*Line 601 - 'AtomPromise.js' */    var tokens = url.split('/');
/*Line 602 - 'AtomPromise.js' */    var storage = tokens[0];
/*Line 603 - 'AtomPromise.js' */    var method = tokens[1];
/*Line 604 - 'AtomPromise.js' */    var ap = new AtomPromise();
/*Line 605 - 'AtomPromise.js' */    ap.onInvoke(function (a) {
/*Line 606 - 'AtomPromise.js' */        var als = AtomLocalStorage;
/*Line 607 - 'AtomPromise.js' */        var r = als[method](storage, query, options.data);
/*Line 608 - 'AtomPromise.js' */        a.pushValue(r);
/*Line 609 - 'AtomPromise.js' */    });
/*Line 610 - 'AtomPromise.js' */    return ap;
/*Line 611 - 'AtomPromise.js' */};
/*Line 0 - 'AtomBinding.js' */
/*Line 1 - 'AtomBinding.js' */

/*Line 3 - 'AtomBinding.js' */(function (baseType) {
/*Line 4 - 'AtomBinding.js' */    return classCreatorEx({
/*Line 5 - 'AtomBinding.js' */        name: "WebAtoms.AtomBinding",
/*Line 6 - 'AtomBinding.js' */        base: baseType,
/*Line 7 - 'AtomBinding.js' */        start: function (control, element, key, path, twoWays, jq, vf, events) {
/*Line 8 - 'AtomBinding.js' */            this.element = element;
/*Line 9 - 'AtomBinding.js' */            this.control = control;
/*Line 10 - 'AtomBinding.js' */            this.vf = vf;
/*Line 11 - 'AtomBinding.js' */            this.key = key;
/*Line 12 - 'AtomBinding.js' */            this.events = events;

/*Line 14 - 'AtomBinding.js' */            if ($.isArray(path)) {
/*Line 15 - 'AtomBinding.js' */                this.pathList = [];
/*Line 16 - 'AtomBinding.js' */                this.path = [];
/*Line 17 - 'AtomBinding.js' */                var ae = new AtomEnumerator(path);
/*Line 18 - 'AtomBinding.js' */                while (ae.next()) {
/*Line 19 - 'AtomBinding.js' */                    var item = ae.current();
/*Line 20 - 'AtomBinding.js' */                    if (!$.isArray(item)) {
/*Line 21 - 'AtomBinding.js' */                        this.path.push({ path: item, value: null });
/*Line 22 - 'AtomBinding.js' */                        continue;
/*Line 23 - 'AtomBinding.js' */                    }
/*Line 24 - 'AtomBinding.js' */                    var pe = new AtomEnumerator(item);
/*Line 25 - 'AtomBinding.js' */                    var p = [];
/*Line 26 - 'AtomBinding.js' */                    while (pe.next()) {
/*Line 27 - 'AtomBinding.js' */                        p.push({ path: pe.current(), value: null });
/*Line 28 - 'AtomBinding.js' */                    }
/*Line 29 - 'AtomBinding.js' */                    this.pathList.push(p);
/*Line 30 - 'AtomBinding.js' */                }
/*Line 31 - 'AtomBinding.js' */                if (this.path.length) {
/*Line 32 - 'AtomBinding.js' */                    this.pathList = null;
/*Line 33 - 'AtomBinding.js' */                } else {
/*Line 34 - 'AtomBinding.js' */                    this.path = null;
/*Line 35 - 'AtomBinding.js' */                }

/*Line 37 - 'AtomBinding.js' */            } else {
/*Line 38 - 'AtomBinding.js' */                var ae = new AtomEnumerator(path.split("."));
/*Line 39 - 'AtomBinding.js' */                this.path = [];
/*Line 40 - 'AtomBinding.js' */                while (ae.next()) {
/*Line 41 - 'AtomBinding.js' */                    this.path.push({ path: ae.current(), value: null });
/*Line 42 - 'AtomBinding.js' */                }
/*Line 43 - 'AtomBinding.js' */            }
/*Line 44 - 'AtomBinding.js' */            this.twoWays = twoWays;
/*Line 45 - 'AtomBinding.js' */            this.jq = jq;
/*Line 46 - 'AtomBinding.js' */            this._isUpdating = false;
/*Line 47 - 'AtomBinding.js' */        },
/*Line 48 - 'AtomBinding.js' */        methods: {
/*Line 49 - 'AtomBinding.js' */            onPropChanged: function (sender, key) {
/*Line 50 - 'AtomBinding.js' */                // update target....
/*Line 51 - 'AtomBinding.js' */                // most like end of path...
/*Line 52 - 'AtomBinding.js' */                if (this.path == null || this.path.length == 0)
/*Line 53 - 'AtomBinding.js' */                    return;
/*Line 54 - 'AtomBinding.js' */                var ae = new AtomEnumerator(this.path);
/*Line 55 - 'AtomBinding.js' */                var obj = this.control;
/*Line 56 - 'AtomBinding.js' */                var objKey = null;
/*Line 57 - 'AtomBinding.js' */                while (ae.next()) {
/*Line 58 - 'AtomBinding.js' */                    objKey = ae.current();
/*Line 59 - 'AtomBinding.js' */                    objKey.value = obj;
/*Line 60 - 'AtomBinding.js' */                    if (!obj)
/*Line 61 - 'AtomBinding.js' */                        return;
/*Line 62 - 'AtomBinding.js' */                    if (!ae.isLast())
/*Line 63 - 'AtomBinding.js' */                        obj = AtomBinder.getValue(obj, objKey.path);
/*Line 64 - 'AtomBinding.js' */                }
/*Line 65 - 'AtomBinding.js' */                var value = null;
/*Line 66 - 'AtomBinding.js' */                if (this.jq) {
/*Line 67 - 'AtomBinding.js' */                    switch (this.key) {
/*Line 68 - 'AtomBinding.js' */                        case "valueAsDate":
/*Line 69 - 'AtomBinding.js' */                            value = this.element.valueAsDate;
/*Line 70 - 'AtomBinding.js' */                            break;
/*Line 71 - 'AtomBinding.js' */                        case "checked":
/*Line 72 - 'AtomBinding.js' */                            value = this.element.checked ? true : false;
/*Line 73 - 'AtomBinding.js' */                            break;
/*Line 74 - 'AtomBinding.js' */                        default:
/*Line 75 - 'AtomBinding.js' */                            value = $(this.element).val();
/*Line 76 - 'AtomBinding.js' */                    }
/*Line 77 - 'AtomBinding.js' */                } else {
/*Line 78 - 'AtomBinding.js' */                    value = AtomBinder.getValue(this.control, this.key);
/*Line 79 - 'AtomBinding.js' */                }
/*Line 80 - 'AtomBinding.js' */                AtomBinder.setValue(obj, objKey.path, value);
/*Line 81 - 'AtomBinding.js' */            },
/*Line 82 - 'AtomBinding.js' */            onDataChanged: function (sender, key) {
/*Line 83 - 'AtomBinding.js' */                if (this._isUpdating)
/*Line 84 - 'AtomBinding.js' */                    return;

/*Line 86 - 'AtomBinding.js' */                // called by jquery while posting an ajax request...
/*Line 87 - 'AtomBinding.js' */                if (arguments === undefined || arguments.length == 0)
/*Line 88 - 'AtomBinding.js' */                    return;

/*Line 90 - 'AtomBinding.js' */                var ae;
/*Line 91 - 'AtomBinding.js' */                var target = this.control;
/*Line 92 - 'AtomBinding.js' */                if (this.pathList) {
/*Line 93 - 'AtomBinding.js' */                    var newTarget = [];
/*Line 94 - 'AtomBinding.js' */                    ae = new AtomEnumerator(this.pathList);
/*Line 95 - 'AtomBinding.js' */                    while (ae.next()) {
/*Line 96 - 'AtomBinding.js' */                        newTarget.push(this.evaluate(target, ae.current()));
/*Line 97 - 'AtomBinding.js' */                    }
/*Line 98 - 'AtomBinding.js' */                    ae = new AtomEnumerator(newTarget);
/*Line 99 - 'AtomBinding.js' */                    while (ae.next()) {
/*Line 100 - 'AtomBinding.js' */                        if (ae.current() === undefined)
/*Line 101 - 'AtomBinding.js' */                            return;
/*Line 102 - 'AtomBinding.js' */                    }
/*Line 103 - 'AtomBinding.js' */                    this.setValue(newTarget);
/*Line 104 - 'AtomBinding.js' */                } else {
/*Line 105 - 'AtomBinding.js' */                    var path = this.path;
/*Line 106 - 'AtomBinding.js' */                    var newTarget = this.evaluate(target, path);
/*Line 107 - 'AtomBinding.js' */                    if (newTarget !== undefined)
/*Line 108 - 'AtomBinding.js' */                        this.setValue(newTarget);
/*Line 109 - 'AtomBinding.js' */                }
/*Line 110 - 'AtomBinding.js' */            },

/*Line 112 - 'AtomBinding.js' */            evaluate: function (target, path) {
/*Line 113 - 'AtomBinding.js' */                var newTarget = null;
/*Line 114 - 'AtomBinding.js' */                var property = null;
/*Line 115 - 'AtomBinding.js' */                var ae = new AtomEnumerator(path);

/*Line 117 - 'AtomBinding.js' */                // first remove old handlers...
/*Line 118 - 'AtomBinding.js' */                var remove = false;
/*Line 119 - 'AtomBinding.js' */                while (target && ae.next()) {
/*Line 120 - 'AtomBinding.js' */                    property = ae.current();
/*Line 121 - 'AtomBinding.js' */                    newTarget = AtomBinder.getValue(target, property.path);

/*Line 123 - 'AtomBinding.js' */                    if (!(/scope|appScope|atomParent|templateParent|localScope/gi.test(property.path))) {
/*Line 124 - 'AtomBinding.js' */                        var _this = this;
/*Line 125 - 'AtomBinding.js' */                        if (!property.value) {
/*Line 126 - 'AtomBinding.js' */                            this.bindEvent(target, "WatchHandler", "onDataChanged", property.path);
/*Line 127 - 'AtomBinding.js' */                            //this.bindEvent(target, "WatchHandler", function () {
/*Line 128 - 'AtomBinding.js' */                            //    _this.onDataChanged.apply(_this, arguments);
/*Line 129 - 'AtomBinding.js' */                            //}, property.path);
/*Line 130 - 'AtomBinding.js' */                        } else if (property.value != target) {
/*Line 131 - 'AtomBinding.js' */                            this.unbindEvent(property.value, "WatchHandler", null, property.path);
/*Line 132 - 'AtomBinding.js' */                            this.bindEvent(target, "WatchHandler", "onDataChanged", property.path);
/*Line 133 - 'AtomBinding.js' */                            //this.bindEvent(target, "WatchHandler", function () {
/*Line 134 - 'AtomBinding.js' */                            //    _this.onDataChanged.apply(_this, arguments);
/*Line 135 - 'AtomBinding.js' */                            //}, property.path);
/*Line 136 - 'AtomBinding.js' */                        }
/*Line 137 - 'AtomBinding.js' */                    }

/*Line 139 - 'AtomBinding.js' */                    property.value = target;
/*Line 140 - 'AtomBinding.js' */                    target = newTarget;
/*Line 141 - 'AtomBinding.js' */                }
/*Line 142 - 'AtomBinding.js' */                if (newTarget === undefined && AtomConfig.debug) {
/*Line 143 - 'AtomBinding.js' */                    log('Undefined:' + this.control._element.id + ' -> ' + ($.map(path, function (a) { return a.path; })).join('.'));
/*Line 144 - 'AtomBinding.js' */                }
/*Line 145 - 'AtomBinding.js' */                return newTarget;
/*Line 146 - 'AtomBinding.js' */            },

/*Line 148 - 'AtomBinding.js' */            onValChanged: function () {
/*Line 149 - 'AtomBinding.js' */                var self = this;
/*Line 150 - 'AtomBinding.js' */                WebAtoms.dispatcher.callLater(function () { self.onPropChanged(null, null); });
/*Line 151 - 'AtomBinding.js' */            },
/*Line 152 - 'AtomBinding.js' */            setup: function () {
/*Line 153 - 'AtomBinding.js' */                if (this.twoWays) {
/*Line 154 - 'AtomBinding.js' */                    if (this.jq) {
/*Line 155 - 'AtomBinding.js' */                        this.bindEvent(this.element, "change", "onValChanged");
/*Line 156 - 'AtomBinding.js' */                        this.bindEvent(this.element, "blur", "onValChanged");
/*Line 157 - 'AtomBinding.js' */                        if (this.events) {
/*Line 158 - 'AtomBinding.js' */                            var list = new AtomEnumerator(this.events.split(","));
/*Line 159 - 'AtomBinding.js' */                            while (list.next()) {
/*Line 160 - 'AtomBinding.js' */                                this.bindEvent(this.element, list.current(), "onValChanged");
/*Line 161 - 'AtomBinding.js' */                            }
/*Line 162 - 'AtomBinding.js' */                        }
/*Line 163 - 'AtomBinding.js' */                    } else {
/*Line 164 - 'AtomBinding.js' */                        this.bindEvent(this.control, "WatchHandler", "onPropChanged", this.key);
/*Line 165 - 'AtomBinding.js' */                    }
/*Line 166 - 'AtomBinding.js' */                }

/*Line 168 - 'AtomBinding.js' */                this.onDataChanged(this, null);

/*Line 170 - 'AtomBinding.js' */            },

/*Line 172 - 'AtomBinding.js' */            setValue: function (value) {

/*Line 174 - 'AtomBinding.js' */                if (!this.pathList && this.vf) {
/*Line 175 - 'AtomBinding.js' */                    value = [value];
/*Line 176 - 'AtomBinding.js' */                }

/*Line 178 - 'AtomBinding.js' */                if (this.vf) {
/*Line 179 - 'AtomBinding.js' */                    value.push(Atom);
/*Line 180 - 'AtomBinding.js' */                    value.push(AtomPromise);
/*Line 181 - 'AtomBinding.js' */                    value.push($x);
/*Line 182 - 'AtomBinding.js' */                    value = this.vf.apply(this, value);
/*Line 183 - 'AtomBinding.js' */                }

/*Line 185 - 'AtomBinding.js' */                if (value instanceof AtomPromise) {
/*Line 186 - 'AtomBinding.js' */                    value._persist = true;
/*Line 187 - 'AtomBinding.js' */                }

/*Line 189 - 'AtomBinding.js' */                this._lastValue = value;
/*Line 190 - 'AtomBinding.js' */                this._isUpdating = true;
/*Line 191 - 'AtomBinding.js' */                this.control.setLocalValue(this.key, value, this.element, true);
/*Line 192 - 'AtomBinding.js' */                this._isUpdating = false;
/*Line 193 - 'AtomBinding.js' */            }


/*Line 196 - 'AtomBinding.js' */        }
/*Line 197 - 'AtomBinding.js' */    });
/*Line 198 - 'AtomBinding.js' */})(WebAtoms.AtomComponent.prototype);
/*Line 0 - 'AtomDispatcher.js' */

/*Line 2 - 'AtomDispatcher.js' */var allControls = {
/*Line 3 - 'AtomDispatcher.js' */};

/*Line 5 - 'AtomDispatcher.js' */window.allControls = allControls;

/*Line 7 - 'AtomDispatcher.js' */(function (base) {
/*Line 8 - 'AtomDispatcher.js' */    return classCreator("WebAtoms.AtomDispatcher", base,
/*Line 9 - 'AtomDispatcher.js' */        function () {
/*Line 10 - 'AtomDispatcher.js' */            this._paused = false;
/*Line 11 - 'AtomDispatcher.js' */            //this.queue = [];
/*Line 12 - 'AtomDispatcher.js' */            this.head = null;
/*Line 13 - 'AtomDispatcher.js' */            this.tail = null;
/*Line 14 - 'AtomDispatcher.js' */            this.onTimeout = function () {
/*Line 15 - 'AtomDispatcher.js' */                if (this._paused)
/*Line 16 - 'AtomDispatcher.js' */                    return;
/*Line 17 - 'AtomDispatcher.js' */                if (!this.head) {
/*Line 18 - 'AtomDispatcher.js' */                    return;
/*Line 19 - 'AtomDispatcher.js' */                }
/*Line 20 - 'AtomDispatcher.js' */                var item = this.head;
/*Line 21 - 'AtomDispatcher.js' */                this.head = item.next;
/*Line 22 - 'AtomDispatcher.js' */                item.next = null;
/*Line 23 - 'AtomDispatcher.js' */                if (!this.head) {
/*Line 24 - 'AtomDispatcher.js' */                    // we have reached end...
/*Line 25 - 'AtomDispatcher.js' */                    this.tail = null;
/*Line 26 - 'AtomDispatcher.js' */                }
/*Line 27 - 'AtomDispatcher.js' */                //try{
/*Line 28 - 'AtomDispatcher.js' */                item();
/*Line 29 - 'AtomDispatcher.js' */                //} catch (ex) {

/*Line 31 - 'AtomDispatcher.js' */                //    if (window.console) {
/*Line 32 - 'AtomDispatcher.js' */                //        window.console.log(item.toString());
/*Line 33 - 'AtomDispatcher.js' */                //        window.console.log(JSON.stringify(ex));
/*Line 34 - 'AtomDispatcher.js' */                //    }
/*Line 35 - 'AtomDispatcher.js' */                //}
/*Line 36 - 'AtomDispatcher.js' */                window.setTimeout(this._onTimeout, 1);
/*Line 37 - 'AtomDispatcher.js' */            };
/*Line 38 - 'AtomDispatcher.js' */            //this._onTimeout = Function.createDelegate(this, this.onTimeout);
/*Line 39 - 'AtomDispatcher.js' */            var _this = this;
/*Line 40 - 'AtomDispatcher.js' */            this._onTimeout = function () {
/*Line 41 - 'AtomDispatcher.js' */                _this.onTimeout();
/*Line 42 - 'AtomDispatcher.js' */            };
/*Line 43 - 'AtomDispatcher.js' */        },
/*Line 44 - 'AtomDispatcher.js' */        {
/*Line 45 - 'AtomDispatcher.js' */            pause: function () {
/*Line 46 - 'AtomDispatcher.js' */                this._paused = true;
/*Line 47 - 'AtomDispatcher.js' */            },
/*Line 48 - 'AtomDispatcher.js' */            start: function () {
/*Line 49 - 'AtomDispatcher.js' */                this._paused = false;
/*Line 50 - 'AtomDispatcher.js' */                window.setTimeout(this._onTimeout, 1);
/*Line 51 - 'AtomDispatcher.js' */            },
/*Line 52 - 'AtomDispatcher.js' */            callLater: function (fn) {
/*Line 53 - 'AtomDispatcher.js' */                //this.queue.push(fn);
/*Line 54 - 'AtomDispatcher.js' */                if (this.tail) {
/*Line 55 - 'AtomDispatcher.js' */                    this.tail.next = fn;
/*Line 56 - 'AtomDispatcher.js' */                    this.tail = fn;
/*Line 57 - 'AtomDispatcher.js' */                }
/*Line 58 - 'AtomDispatcher.js' */                else {
/*Line 59 - 'AtomDispatcher.js' */                    // queue is empty..
/*Line 60 - 'AtomDispatcher.js' */                    this.head = fn;
/*Line 61 - 'AtomDispatcher.js' */                    this.tail = fn;
/*Line 62 - 'AtomDispatcher.js' */                }
/*Line 63 - 'AtomDispatcher.js' */                if (!this._paused)
/*Line 64 - 'AtomDispatcher.js' */                    this.start();
/*Line 65 - 'AtomDispatcher.js' */            },
/*Line 66 - 'AtomDispatcher.js' */            setupControls: function () {

/*Line 68 - 'AtomDispatcher.js' */                //if (window.console) {
/*Line 69 - 'AtomDispatcher.js' */                //    window.console.log("Starting Web Atoms");
/*Line 70 - 'AtomDispatcher.js' */                //}

/*Line 72 - 'AtomDispatcher.js' */                var a = $('[data-atom-type],[atom-type]').first()[0];
/*Line 73 - 'AtomDispatcher.js' */                if (a.atomControl != undefined && a.atomControl != null)
/*Line 74 - 'AtomDispatcher.js' */                    return;
/*Line 75 - 'AtomDispatcher.js' */                var ct = AtomUI.getAtomType(a);
/*Line 76 - 'AtomDispatcher.js' */                $(a).removeAttr("atom-type");
/*Line 77 - 'AtomDispatcher.js' */                $(a).removeAttr("data-atom-type");
/*Line 78 - 'AtomDispatcher.js' */                var ctrl = new (WebAtoms[ct])(a);
/*Line 79 - 'AtomDispatcher.js' */                ctrl.setup();

/*Line 81 - 'AtomDispatcher.js' */                var self = this;
/*Line 82 - 'AtomDispatcher.js' */                this.callLater(function () {
/*Line 83 - 'AtomDispatcher.js' */                    self.callLater(function () {
/*Line 84 - 'AtomDispatcher.js' */                        var app = atomApplication._element;
/*Line 85 - 'AtomDispatcher.js' */                        if (app.style.visibility == "hidden" || $(app).css("visibility") == "hidden") {
/*Line 86 - 'AtomDispatcher.js' */                            app.style.visibility = "visible";

/*Line 88 - 'AtomDispatcher.js' */                            app.atomControl.updateUI();
/*Line 89 - 'AtomDispatcher.js' */                        }
/*Line 90 - 'AtomDispatcher.js' */                    });
/*Line 91 - 'AtomDispatcher.js' */                });

/*Line 93 - 'AtomDispatcher.js' */            }
/*Line 94 - 'AtomDispatcher.js' */        }
/*Line 95 - 'AtomDispatcher.js' */        );
/*Line 96 - 'AtomDispatcher.js' */})();

/*Line 98 - 'AtomDispatcher.js' */WebAtoms.dispatcher = new WebAtoms.AtomDispatcher();

/*Line 100 - 'AtomDispatcher.js' */function aggregateHandler(f,i) {

/*Line 102 - 'AtomDispatcher.js' */    function ah(fx) {
/*Line 103 - 'AtomDispatcher.js' */        this._handler = fx;

/*Line 105 - 'AtomDispatcher.js' */        var self = this;

/*Line 107 - 'AtomDispatcher.js' */        this.invoke = function () {
/*Line 108 - 'AtomDispatcher.js' */            try {
/*Line 109 - 'AtomDispatcher.js' */                self._handler.apply(self, self.args);
/*Line 110 - 'AtomDispatcher.js' */            }
/*Line 111 - 'AtomDispatcher.js' */            catch (e) {
/*Line 112 - 'AtomDispatcher.js' */                if (console) {
/*Line 113 - 'AtomDispatcher.js' */                    console.log(e);
/*Line 114 - 'AtomDispatcher.js' */                }
/*Line 115 - 'AtomDispatcher.js' */            }
/*Line 116 - 'AtomDispatcher.js' */            finally {
/*Line 117 - 'AtomDispatcher.js' */                self.timeout = 0;
/*Line 118 - 'AtomDispatcher.js' */                self.pending = false;
/*Line 119 - 'AtomDispatcher.js' */            }
/*Line 120 - 'AtomDispatcher.js' */        }

/*Line 122 - 'AtomDispatcher.js' */        this.handler = function () {
/*Line 123 - 'AtomDispatcher.js' */            if (self.pending)
/*Line 124 - 'AtomDispatcher.js' */                return;
/*Line 125 - 'AtomDispatcher.js' */            self.pending = true;
/*Line 126 - 'AtomDispatcher.js' */            self.args = arguments;
/*Line 127 - 'AtomDispatcher.js' */            if (self.timeout) {
/*Line 128 - 'AtomDispatcher.js' */                clearTimeout(self.timeout);
/*Line 129 - 'AtomDispatcher.js' */            }
/*Line 130 - 'AtomDispatcher.js' */            self.timeout = setTimeout(self.invoke, i || 500);
/*Line 131 - 'AtomDispatcher.js' */        }
/*Line 132 - 'AtomDispatcher.js' */    }

/*Line 134 - 'AtomDispatcher.js' */    var n = new ah(f);
/*Line 135 - 'AtomDispatcher.js' */    return n.handler;
/*Line 136 - 'AtomDispatcher.js' */}

/*Line 0 - 'AtomErrors.js' */

/*Line 2 - 'AtomErrors.js' */var AtomValidator = (function (window) {
/*Line 3 - 'AtomErrors.js' */    return createClass({
/*Line 4 - 'AtomErrors.js' */        name: "AtomValidator",
/*Line 5 - 'AtomErrors.js' */        start: function (e) {
/*Line 6 - 'AtomErrors.js' */            this.value = e;
/*Line 7 - 'AtomErrors.js' */            this.list = {};
/*Line 8 - 'AtomErrors.js' */            this.errors = [];
/*Line 9 - 'AtomErrors.js' */        },
/*Line 10 - 'AtomErrors.js' */        methods: {
/*Line 11 - 'AtomErrors.js' */            dispose: function () {
/*Line 12 - 'AtomErrors.js' */                this.value = null;
/*Line 13 - 'AtomErrors.js' */                this.errors = null;
/*Line 14 - 'AtomErrors.js' */                this.list = null;
/*Line 15 - 'AtomErrors.js' */            },
/*Line 16 - 'AtomErrors.js' */            set: function (k,v) {
/*Line 17 - 'AtomErrors.js' */                this.list[k] = v;
/*Line 18 - 'AtomErrors.js' */                //this.errors = null;
/*Line 19 - 'AtomErrors.js' */            },
/*Line 20 - 'AtomErrors.js' */            reset: function () {
/*Line 21 - 'AtomErrors.js' */                this.errors = null;
/*Line 22 - 'AtomErrors.js' */                this.invoke(true);
/*Line 23 - 'AtomErrors.js' */                this.refresh();
/*Line 24 - 'AtomErrors.js' */            },
/*Line 25 - 'AtomErrors.js' */            clear: function () {
/*Line 26 - 'AtomErrors.js' */                this.errors = [];
/*Line 27 - 'AtomErrors.js' */            },
/*Line 28 - 'AtomErrors.js' */            invoke: function (force) {

/*Line 30 - 'AtomErrors.js' */                if (this.refreshing)
/*Line 31 - 'AtomErrors.js' */                    return this.errors;

/*Line 33 - 'AtomErrors.js' */                if (!force && this.errors)
/*Line 34 - 'AtomErrors.js' */                    return this.errors;

/*Line 36 - 'AtomErrors.js' */                var e = [];

/*Line 38 - 'AtomErrors.js' */                var v ;

/*Line 40 - 'AtomErrors.js' */                var ve = this.list.invalid;
/*Line 41 - 'AtomErrors.js' */                if (ve !== undefined) {
/*Line 42 - 'AtomErrors.js' */                    if (!ve) {
/*Line 43 - 'AtomErrors.js' */                        this.errors = e;
/*Line 44 - 'AtomErrors.js' */                        return e;
/*Line 45 - 'AtomErrors.js' */                    }
/*Line 46 - 'AtomErrors.js' */                    v = ve();
/*Line 47 - 'AtomErrors.js' */                    if (v) {
/*Line 48 - 'AtomErrors.js' */                        if ($.isArray(v)) {
/*Line 49 - 'AtomErrors.js' */                            e = e.concat(v);
/*Line 50 - 'AtomErrors.js' */                        } else {
/*Line 51 - 'AtomErrors.js' */                            e.push(v);
/*Line 52 - 'AtomErrors.js' */                        }
/*Line 53 - 'AtomErrors.js' */                    }
/*Line 54 - 'AtomErrors.js' */                    this.errors = e;
/*Line 55 - 'AtomErrors.js' */                    return e;
/*Line 56 - 'AtomErrors.js' */                }
/*Line 57 - 'AtomErrors.js' */                else {
/*Line 58 - 'AtomErrors.js' */                    for (var i in this.list) {
/*Line 59 - 'AtomErrors.js' */                        v = this.list[i];
/*Line 60 - 'AtomErrors.js' */                        if (!v) continue;
/*Line 61 - 'AtomErrors.js' */                        v = v();
/*Line 62 - 'AtomErrors.js' */                        if (v) {
/*Line 63 - 'AtomErrors.js' */                            if ($.isArray(v)) {
/*Line 64 - 'AtomErrors.js' */                                e = e.concat(v);
/*Line 65 - 'AtomErrors.js' */                            } else {
/*Line 66 - 'AtomErrors.js' */                                e.push(v);
/*Line 67 - 'AtomErrors.js' */                            }
/*Line 68 - 'AtomErrors.js' */                        }
/*Line 69 - 'AtomErrors.js' */                    }
/*Line 70 - 'AtomErrors.js' */                }
/*Line 71 - 'AtomErrors.js' */                if (e.length) {
/*Line 72 - 'AtomErrors.js' */                    this.errors = e;
/*Line 73 - 'AtomErrors.js' */                    return e;
/*Line 74 - 'AtomErrors.js' */                }
/*Line 75 - 'AtomErrors.js' */                return null;
/*Line 76 - 'AtomErrors.js' */            },
/*Line 77 - 'AtomErrors.js' */            refresh: function (e) {
/*Line 78 - 'AtomErrors.js' */                if (this.refreshing)
/*Line 79 - 'AtomErrors.js' */                    return;
/*Line 80 - 'AtomErrors.js' */                this.refreshing = true;
/*Line 81 - 'AtomErrors.js' */                try {
/*Line 82 - 'AtomErrors.js' */                    e = e || this.value;
/*Line 83 - 'AtomErrors.js' */                    var ac = e.atomControl;
/*Line 84 - 'AtomErrors.js' */                    if (ac) {
/*Line 85 - 'AtomErrors.js' */                        AtomBinder.refreshValue(ac, "errors");
/*Line 86 - 'AtomErrors.js' */                    }
/*Line 87 - 'AtomErrors.js' */                } finally {
/*Line 88 - 'AtomErrors.js' */                    this.refreshing = false;
/*Line 89 - 'AtomErrors.js' */                }
/*Line 90 - 'AtomErrors.js' */                var p = e._logicalParent || e.parentNode;
/*Line 91 - 'AtomErrors.js' */                if (p) {
/*Line 92 - 'AtomErrors.js' */                    this.refresh(p);
/*Line 93 - 'AtomErrors.js' */                }
/*Line 94 - 'AtomErrors.js' */            }
/*Line 95 - 'AtomErrors.js' */        }
/*Line 96 - 'AtomErrors.js' */    });
/*Line 97 - 'AtomErrors.js' */})(window);



/*Line 101 - 'AtomErrors.js' */// setup window errors array
/*Line 102 - 'AtomErrors.js' */window.errors = {
/*Line 103 - 'AtomErrors.js' */    set: function (e, key, error) {
/*Line 104 - 'AtomErrors.js' */        var item = e.atomValidator;
/*Line 105 - 'AtomErrors.js' */        if (!item) {
/*Line 106 - 'AtomErrors.js' */            item = new AtomValidator(e);
/*Line 107 - 'AtomErrors.js' */            e.atomValidator = item;
/*Line 108 - 'AtomErrors.js' */        }
/*Line 109 - 'AtomErrors.js' */        item.set(key, error);
/*Line 110 - 'AtomErrors.js' */    },
/*Line 111 - 'AtomErrors.js' */    clear: function (e, r) {
/*Line 112 - 'AtomErrors.js' */        var item = e.atomValidator;
/*Line 113 - 'AtomErrors.js' */        if (item) {
/*Line 114 - 'AtomErrors.js' */            item.clear();
/*Line 115 - 'AtomErrors.js' */        }
/*Line 116 - 'AtomErrors.js' */        this.refresh(e);
/*Line 117 - 'AtomErrors.js' */        if (r) {
/*Line 118 - 'AtomErrors.js' */            var ce = new ChildEnumerator(e);
/*Line 119 - 'AtomErrors.js' */            while (ce.next()) {
/*Line 120 - 'AtomErrors.js' */                this.clear(ce.current(), r);
/*Line 121 - 'AtomErrors.js' */            }
/*Line 122 - 'AtomErrors.js' */        }
/*Line 123 - 'AtomErrors.js' */    },
/*Line 124 - 'AtomErrors.js' */    get: function (e, r) {
/*Line 125 - 'AtomErrors.js' */        var list = [];
/*Line 126 - 'AtomErrors.js' */        var item = e.atomValidator;
/*Line 127 - 'AtomErrors.js' */        if (item) {
/*Line 128 - 'AtomErrors.js' */            var rv = item.invoke();
/*Line 129 - 'AtomErrors.js' */            if (rv && rv.length) {
/*Line 130 - 'AtomErrors.js' */                list = list.concat(
/*Line 131 - 'AtomErrors.js' */                    rv.filter(function (a) {
/*Line 132 - 'AtomErrors.js' */                        return a;
/*Line 133 - 'AtomErrors.js' */                    }).map(function (a) {
/*Line 134 - 'AtomErrors.js' */                        return { label: a, value: e }
/*Line 135 - 'AtomErrors.js' */                    })
/*Line 136 - 'AtomErrors.js' */                );
/*Line 137 - 'AtomErrors.js' */            }
/*Line 138 - 'AtomErrors.js' */            if (list && list.length)
/*Line 139 - 'AtomErrors.js' */                return list;
/*Line 140 - 'AtomErrors.js' */        }

/*Line 142 - 'AtomErrors.js' */        //if (e.checkValidity !== undefined) {
            
/*Line 144 - 'AtomErrors.js' */        //}

/*Line 146 - 'AtomErrors.js' */        if (r) {
/*Line 147 - 'AtomErrors.js' */            var ce = new ChildEnumerator(e);
/*Line 148 - 'AtomErrors.js' */            while (ce.next()) {
/*Line 149 - 'AtomErrors.js' */                var c = this.get(ce.current(), r);
/*Line 150 - 'AtomErrors.js' */                if (c && c.length) {
/*Line 151 - 'AtomErrors.js' */                    list = list.concat(c);
/*Line 152 - 'AtomErrors.js' */                }
/*Line 153 - 'AtomErrors.js' */            }
/*Line 154 - 'AtomErrors.js' */        }
/*Line 155 - 'AtomErrors.js' */        return list;
/*Line 156 - 'AtomErrors.js' */    },
/*Line 157 - 'AtomErrors.js' */    refresh: function (e) {
/*Line 158 - 'AtomErrors.js' */        var item = e.atomValidator;
/*Line 159 - 'AtomErrors.js' */        if (item) {
/*Line 160 - 'AtomErrors.js' */            item.refresh();
/*Line 161 - 'AtomErrors.js' */        }
/*Line 162 - 'AtomErrors.js' */    },
/*Line 163 - 'AtomErrors.js' */    reset: function (e) {
/*Line 164 - 'AtomErrors.js' */        var item = e.atomValidator;
/*Line 165 - 'AtomErrors.js' */        if (item) {
/*Line 166 - 'AtomErrors.js' */            item.reset();
/*Line 167 - 'AtomErrors.js' */        }
/*Line 168 - 'AtomErrors.js' */    },
/*Line 169 - 'AtomErrors.js' */    validate: function (e) {
/*Line 170 - 'AtomErrors.js' */        var item = e.atomValidator;
/*Line 171 - 'AtomErrors.js' */        if (item) {
/*Line 172 - 'AtomErrors.js' */            item.reset();
/*Line 173 - 'AtomErrors.js' */            return;
/*Line 174 - 'AtomErrors.js' */        }
/*Line 175 - 'AtomErrors.js' */        var ce = new ChildEnumerator(e);
/*Line 176 - 'AtomErrors.js' */        while (ce.next()) {
/*Line 177 - 'AtomErrors.js' */            var child = ce.current();
/*Line 178 - 'AtomErrors.js' */            this.validate(child);
/*Line 179 - 'AtomErrors.js' */        }
/*Line 180 - 'AtomErrors.js' */    }
/*Line 181 - 'AtomErrors.js' */};

/*Line 183 - 'AtomErrors.js' */var errors = window.errors;




/*Line 188 - 'AtomErrors.js' *///window.getInputErrors = function getInputErrors(e, skipFormField) {

/*Line 190 - 'AtomErrors.js' *///    // is this valid...
/*Line 191 - 'AtomErrors.js' *///    var v = null;
/*Line 192 - 'AtomErrors.js' *///    var errors = [];
/*Line 193 - 'AtomErrors.js' *///    if (/input|select|textarea/i.test(e.nodeName)) {
/*Line 194 - 'AtomErrors.js' *///        v = $(e).val();
/*Line 195 - 'AtomErrors.js' *///        var a = AtomUI.attributeMap(e, /atom\-(required|data\-error|regex)/);
/*Line 196 - 'AtomErrors.js' *///        var error = getInputError(e, a, v);
/*Line 197 - 'AtomErrors.js' *///        if (error) {
/*Line 198 - 'AtomErrors.js' *///            errors.push({ label: error, value: e });
/*Line 199 - 'AtomErrors.js' *///        }
/*Line 200 - 'AtomErrors.js' *///    } else {
/*Line 201 - 'AtomErrors.js' *///        var ac = e.atomControl;
/*Line 202 - 'AtomErrors.js' *///        if (ac) {
/*Line 203 - 'AtomErrors.js' *///            if (!skipFormField && ac.constructor == WebAtoms.AtomFormField) {
/*Line 204 - 'AtomErrors.js' *///                return ac.getInputErrors();
/*Line 205 - 'AtomErrors.js' *///            }
/*Line 206 - 'AtomErrors.js' *///            v = AtomBinder.getValue(ac, "value");

/*Line 208 - 'AtomErrors.js' *///            var a = AtomUI.attributeMap(e, /atom\-(required|data\-error|regex)/);
/*Line 209 - 'AtomErrors.js' *///            var error = getInputError(e, a, v);
/*Line 210 - 'AtomErrors.js' *///            if (error) {
/*Line 211 - 'AtomErrors.js' *///                errors.push({ label: error, value: e });
/*Line 212 - 'AtomErrors.js' *///            }
/*Line 213 - 'AtomErrors.js' *///        }
/*Line 214 - 'AtomErrors.js' *///        var ce = new ChildEnumerator(e);
/*Line 215 - 'AtomErrors.js' *///        while (ce.next()) {
/*Line 216 - 'AtomErrors.js' *///            var child = ce.current();
/*Line 217 - 'AtomErrors.js' *///            var error = getInputErrors(child);
/*Line 218 - 'AtomErrors.js' *///            if (error) {
/*Line 219 - 'AtomErrors.js' *///                errors = errors.concat(error);
/*Line 220 - 'AtomErrors.js' *///            }
/*Line 221 - 'AtomErrors.js' *///        }
/*Line 222 - 'AtomErrors.js' *///    }

/*Line 224 - 'AtomErrors.js' *///    if (!errors.length)
/*Line 225 - 'AtomErrors.js' *///        return null;
/*Line 226 - 'AtomErrors.js' *///    return errors;
/*Line 227 - 'AtomErrors.js' *///};

/*Line 229 - 'AtomErrors.js' *///window.clearInputErrors = function clearInputErrors(e) {

/*Line 231 - 'AtomErrors.js' *///    var $e = $(e);

/*Line 233 - 'AtomErrors.js' *///    $e.removeClass("atom-error-invalid");
/*Line 234 - 'AtomErrors.js' *///    $e.removeClass("atom-error-required");
/*Line 235 - 'AtomErrors.js' *///    $e.removeClass("atom-error-email");

/*Line 237 - 'AtomErrors.js' *///    var ac = e.atomControl;
/*Line 238 - 'AtomErrors.js' *///    if (ac) {

/*Line 240 - 'AtomErrors.js' *///        if (ac.constructor == WebAtoms.AtomFormField) {
/*Line 241 - 'AtomErrors.js' *///            ac.clearInputErrors();
/*Line 242 - 'AtomErrors.js' *///            return;
/*Line 243 - 'AtomErrors.js' *///        }

/*Line 245 - 'AtomErrors.js' *///    }

/*Line 247 - 'AtomErrors.js' *///    var ce = new ChildEnumerator(e);
/*Line 248 - 'AtomErrors.js' *///    while (ce.next()) {
/*Line 249 - 'AtomErrors.js' *///        var child = ce.current();
/*Line 250 - 'AtomErrors.js' *///        clearInputError(child);
/*Line 251 - 'AtomErrors.js' *///    }

/*Line 253 - 'AtomErrors.js' *///};
/*Line 0 - 'AtomUIComponent.js' */

/*Line 2 - 'AtomUIComponent.js' */(function (base) {
/*Line 3 - 'AtomUIComponent.js' */    return classCreator("WebAtoms.AtomUIComponent", base,
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
/*Line 39 - 'AtomUIComponent.js' */            set_scope: function (s) {
/*Line 40 - 'AtomUIComponent.js' */                var scope = this._localScope || this.get_scope();
/*Line 41 - 'AtomUIComponent.js' */                for (var k in s) {
/*Line 42 - 'AtomUIComponent.js' */                    if (/^(application|owner|app|parent)$/gi.test(k))
/*Line 43 - 'AtomUIComponent.js' */                        throw new Error("Invalid name for the scope property");
/*Line 44 - 'AtomUIComponent.js' */                    // if value is already set...
/*Line 45 - 'AtomUIComponent.js' */                    var v = s[k];
/*Line 46 - 'AtomUIComponent.js' */                    if (scope == window.appScope && !window.atomApplication._ready) {
/*Line 47 - 'AtomUIComponent.js' */                        if ((k.indexOf('_') != 0)
/*Line 48 - 'AtomUIComponent.js' */                            && (v !== undefined && v !== null)
/*Line 49 - 'AtomUIComponent.js' */                            && (/string|number|boolean/i.test(typeof (v)))){
/*Line 50 - 'AtomUIComponent.js' */                                atomApplication._defaultScope[k] = v;
/*Line 51 - 'AtomUIComponent.js' */                            }
/*Line 52 - 'AtomUIComponent.js' */                    }
/*Line 53 - 'AtomUIComponent.js' */                    if (scope[k] !== undefined)
/*Line 54 - 'AtomUIComponent.js' */                        continue;
/*Line 55 - 'AtomUIComponent.js' */                    scope[k] = v;
/*Line 56 - 'AtomUIComponent.js' */                }
/*Line 57 - 'AtomUIComponent.js' */            },

/*Line 59 - 'AtomUIComponent.js' */            get_name: function () {
/*Line 60 - 'AtomUIComponent.js' */                return this._name;
/*Line 61 - 'AtomUIComponent.js' */            },
/*Line 62 - 'AtomUIComponent.js' */            getTemplate: function (k) {

/*Line 64 - 'AtomUIComponent.js' */                var t = this["_" + k];
/*Line 65 - 'AtomUIComponent.js' */                if (t !== undefined && t !== null)
/*Line 66 - 'AtomUIComponent.js' */                    return t;

/*Line 68 - 'AtomUIComponent.js' */                // resolve...
/*Line 69 - 'AtomUIComponent.js' */                t = Templates.get(this.constructor, k);
/*Line 70 - 'AtomUIComponent.js' */                if (!t) {
/*Line 71 - 'AtomUIComponent.js' */                    return null;
/*Line 72 - 'AtomUIComponent.js' */                }
/*Line 73 - 'AtomUIComponent.js' */                this["_" + k] = t;
/*Line 74 - 'AtomUIComponent.js' */                return t;
/*Line 75 - 'AtomUIComponent.js' */            }
/*Line 76 - 'AtomUIComponent.js' */        },
/*Line 77 - 'AtomUIComponent.js' */        {
/*Line 78 - 'AtomUIComponent.js' */            next: null,
/*Line 79 - 'AtomUIComponent.js' */            value: undefined
/*Line 80 - 'AtomUIComponent.js' */        });
/*Line 81 - 'AtomUIComponent.js' */})(WebAtoms.AtomComponent.prototype);


/*Line 84 - 'AtomUIComponent.js' */Templates.compiled = {
/*Line 85 - 'AtomUIComponent.js' */};

/*Line 87 - 'AtomUIComponent.js' */Templates.compileElement = function (e) {
/*Line 88 - 'AtomUIComponent.js' */    var ae = new AtomEnumerator(e);
/*Line 89 - 'AtomUIComponent.js' */    ae.next();
/*Line 90 - 'AtomUIComponent.js' */    var a = ae.current();
/*Line 91 - 'AtomUIComponent.js' */    var e1 = document.createElement(a);
/*Line 92 - 'AtomUIComponent.js' */    if (!ae.next())
/*Line 93 - 'AtomUIComponent.js' */        return e1;
/*Line 94 - 'AtomUIComponent.js' */    a = ae.current();
/*Line 95 - 'AtomUIComponent.js' */    if (a) {
/*Line 96 - 'AtomUIComponent.js' */        for (var k in a) {
/*Line 97 - 'AtomUIComponent.js' */            e1.setAttribute(k, a[k]);
/*Line 98 - 'AtomUIComponent.js' */        }
/*Line 99 - 'AtomUIComponent.js' */    }
    
/*Line 101 - 'AtomUIComponent.js' */    while (ae.next()) {
/*Line 102 - 'AtomUIComponent.js' */        a = ae.current();
/*Line 103 - 'AtomUIComponent.js' */        if (!a)
/*Line 104 - 'AtomUIComponent.js' */            break;
/*Line 105 - 'AtomUIComponent.js' */        if (a.constructor == String) {
/*Line 106 - 'AtomUIComponent.js' */            e1.appendChild(document.createTextNode(a));
/*Line 107 - 'AtomUIComponent.js' */        } else {
/*Line 108 - 'AtomUIComponent.js' */            e1.appendChild(Templates.compileElement(a));
/*Line 109 - 'AtomUIComponent.js' */        }
/*Line 110 - 'AtomUIComponent.js' */    }
/*Line 111 - 'AtomUIComponent.js' */    return e1;
/*Line 112 - 'AtomUIComponent.js' */};

/*Line 114 - 'AtomUIComponent.js' */Templates.compileJsonML = function (j) {

/*Line 116 - 'AtomUIComponent.js' */    if (j.length == 1)
/*Line 117 - 'AtomUIComponent.js' */        return Templates.compileElement(j[0]);

/*Line 119 - 'AtomUIComponent.js' */    var r = [];
/*Line 120 - 'AtomUIComponent.js' */    var ae = new AtomEnumerator(j);
/*Line 121 - 'AtomUIComponent.js' */    while (ae.next()) {
/*Line 122 - 'AtomUIComponent.js' */        r.push(Templates.compileElement(ae.current()));
/*Line 123 - 'AtomUIComponent.js' */    }
/*Line 124 - 'AtomUIComponent.js' */    return r;
/*Line 125 - 'AtomUIComponent.js' */};

/*Line 127 - 'AtomUIComponent.js' */Templates.compile = function (type, name, t) {

/*Line 129 - 'AtomUIComponent.js' */    var div = document.createElement("div");
/*Line 130 - 'AtomUIComponent.js' */    div.innerHTML = t;

/*Line 132 - 'AtomUIComponent.js' */    if ($(div).children().length == 1) {
/*Line 133 - 'AtomUIComponent.js' */        t = AtomUI.cloneNode((div.firstElementChild || div.children[0]));
/*Line 134 - 'AtomUIComponent.js' */    }

/*Line 136 - 'AtomUIComponent.js' */    return t;
/*Line 137 - 'AtomUIComponent.js' */};

/*Line 139 - 'AtomUIComponent.js' */Templates.get = function (type, k) {
/*Line 140 - 'AtomUIComponent.js' */    //var x = this.compileType(type);
/*Line 141 - 'AtomUIComponent.js' */    //return x[k];

/*Line 143 - 'AtomUIComponent.js' */    var name = type.__typeName + "." + k;
/*Line 144 - 'AtomUIComponent.js' */    var x = this.compiled[name];
/*Line 145 - 'AtomUIComponent.js' */    if (x)
/*Line 146 - 'AtomUIComponent.js' */        return x;
/*Line 147 - 'AtomUIComponent.js' */    x = Templates.jsonML[name];
/*Line 148 - 'AtomUIComponent.js' */    if (!x) {
/*Line 149 - 'AtomUIComponent.js' */        if (type.__baseType) {
/*Line 150 - 'AtomUIComponent.js' */            x = Templates.get(type.__baseType, k);
/*Line 151 - 'AtomUIComponent.js' */        }
/*Line 152 - 'AtomUIComponent.js' */    } else {
/*Line 153 - 'AtomUIComponent.js' */        x = Templates.compileJsonML(x);
/*Line 154 - 'AtomUIComponent.js' */    }
/*Line 155 - 'AtomUIComponent.js' */    if (!x)
/*Line 156 - 'AtomUIComponent.js' */        return null;
/*Line 157 - 'AtomUIComponent.js' */    this.compiled[name] = x;
/*Line 158 - 'AtomUIComponent.js' */    return x;

/*Line 160 - 'AtomUIComponent.js' */};

/*Line 162 - 'AtomUIComponent.js' */Templates.compileType = function (type) {

/*Line 164 - 'AtomUIComponent.js' */    var name = type.__typeName;
/*Line 165 - 'AtomUIComponent.js' */    var shortName = name.split(".");
/*Line 166 - 'AtomUIComponent.js' */    shortName = shortName[shortName.length - 1];

/*Line 168 - 'AtomUIComponent.js' */    var x = this.compiled[name];
/*Line 169 - 'AtomUIComponent.js' */    if (x)
/*Line 170 - 'AtomUIComponent.js' */        return x;

/*Line 172 - 'AtomUIComponent.js' */    x = {
/*Line 173 - 'AtomUIComponent.js' */    };

/*Line 175 - 'AtomUIComponent.js' */    var tl = this[name] || this[shortName];
/*Line 176 - 'AtomUIComponent.js' */    if (tl) {
/*Line 177 - 'AtomUIComponent.js' */        for (var t in tl) {
/*Line 178 - 'AtomUIComponent.js' */            x[t] = this.compile(type, t, tl[t]);
/*Line 179 - 'AtomUIComponent.js' */        }
/*Line 180 - 'AtomUIComponent.js' */    }

/*Line 182 - 'AtomUIComponent.js' */    if (type.__baseType) {
/*Line 183 - 'AtomUIComponent.js' */        var y = this.compileType(type.__baseType);
/*Line 184 - 'AtomUIComponent.js' */        for (var yt in y) {
/*Line 185 - 'AtomUIComponent.js' */            if (!x[yt]) {
/*Line 186 - 'AtomUIComponent.js' */                x[yt] = y[yt];
/*Line 187 - 'AtomUIComponent.js' */            }
/*Line 188 - 'AtomUIComponent.js' */        }
/*Line 189 - 'AtomUIComponent.js' */    }

/*Line 191 - 'AtomUIComponent.js' */    this.compiled[name] = x;

/*Line 193 - 'AtomUIComponent.js' */    var t = this;
/*Line 194 - 'AtomUIComponent.js' */    delete t[name];
/*Line 195 - 'AtomUIComponent.js' */    delete t[shortName];

/*Line 197 - 'AtomUIComponent.js' */    return x;
/*Line 198 - 'AtomUIComponent.js' */};
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
/*Line 27 - 'AtomControl.js' */        value.push($x);
/*Line 28 - 'AtomControl.js' */        value = be.method.apply(null, value);

/*Line 30 - 'AtomControl.js' */        ctrl.setLocalValue(key, value, element);
/*Line 31 - 'AtomControl.js' */    },
/*Line 32 - 'AtomControl.js' */    "[": function (ctrl, key, value, element) {
/*Line 33 - 'AtomControl.js' */        value = value.substr(1, value.length - 2);
/*Line 34 - 'AtomControl.js' */        var be = AtomEvaluator.parse(value);
/*Line 35 - 'AtomControl.js' */        if (be.length == 0) {
/*Line 36 - 'AtomControl.js' */            value = eval(value);
/*Line 37 - 'AtomControl.js' */            AtomBinder.setValue(ctrl, key, value);
/*Line 38 - 'AtomControl.js' */        } else {
/*Line 39 - 'AtomControl.js' */            if (be.length == 1 && be.path[0] == be.original) {
/*Line 40 - 'AtomControl.js' */                ctrl.bind(element, key, value, false);
/*Line 41 - 'AtomControl.js' */            }
/*Line 42 - 'AtomControl.js' */            else {
/*Line 43 - 'AtomControl.js' */                ctrl.bind(element, key, be.path, false, be.method);
/*Line 44 - 'AtomControl.js' */            }
/*Line 45 - 'AtomControl.js' */        }
/*Line 46 - 'AtomControl.js' */    },
/*Line 47 - 'AtomControl.js' */    "$[": function (ctrl, key, value, element) {
/*Line 48 - 'AtomControl.js' */        var l = value.lastIndexOf("]");
/*Line 49 - 'AtomControl.js' */        var events = null;
/*Line 50 - 'AtomControl.js' */        if (l < value.length - 1) {
/*Line 51 - 'AtomControl.js' */            events = value.substr(l + 2);
/*Line 52 - 'AtomControl.js' */            events = events.substr(0, events.length - 1);
/*Line 53 - 'AtomControl.js' */        }
/*Line 54 - 'AtomControl.js' */        value = value.substr(0, l);
/*Line 55 - 'AtomControl.js' */        value = value.substr(2);
/*Line 56 - 'AtomControl.js' */        if (/^(@|\$)/g.test(value)) {
/*Line 57 - 'AtomControl.js' */            value = value.substr(1);
/*Line 58 - 'AtomControl.js' */        }
/*Line 59 - 'AtomControl.js' */        ctrl.bind(element, key, value, true, null, events);
/*Line 60 - 'AtomControl.js' */    },
/*Line 61 - 'AtomControl.js' */    "^[": function (ctrl, key, value, element) {
/*Line 62 - 'AtomControl.js' */        value = value.substr(2, value.length - 3);
/*Line 63 - 'AtomControl.js' */        if (/^(@|\$)/g.test(value)) {
/*Line 64 - 'AtomControl.js' */            value = value.substr(1);
/*Line 65 - 'AtomControl.js' */        }
/*Line 66 - 'AtomControl.js' */        ctrl.bind(element, key, value, true, null, "keyup,keydown,keypress,blur,click");
/*Line 67 - 'AtomControl.js' */    }
/*Line 68 - 'AtomControl.js' */};

/*Line 70 - 'AtomControl.js' */// Property Handlers
/*Line 71 - 'AtomControl.js' */var AtomProperties = {
/*Line 72 - 'AtomControl.js' */    any: function (e, v, k) {
/*Line 73 - 'AtomControl.js' */        AtomUI.attr(e, k, v);
/*Line 74 - 'AtomControl.js' */    },
/*Line 75 - 'AtomControl.js' */    isEnabled: function(element,value){
/*Line 76 - 'AtomControl.js' */        if (value) {
/*Line 77 - 'AtomControl.js' */            AtomUI.removeAttr(element,"disabled");
/*Line 78 - 'AtomControl.js' */        } else {
/*Line 79 - 'AtomControl.js' */            AtomUI.attr(element,"disabled", "disabled");
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
/*Line 103 - 'AtomControl.js' */    error: function (element, value) {
/*Line 104 - 'AtomControl.js' */        var f = value;
/*Line 105 - 'AtomControl.js' */        if (typeof f != 'function') {
/*Line 106 - 'AtomControl.js' */            f = function () {
/*Line 107 - 'AtomControl.js' */                return value;
/*Line 108 - 'AtomControl.js' */            }
/*Line 109 - 'AtomControl.js' */        }

/*Line 111 - 'AtomControl.js' */        errors.set(element, "error",f);
/*Line 112 - 'AtomControl.js' */    },
/*Line 113 - 'AtomControl.js' */    validate: function (p) {
/*Line 114 - 'AtomControl.js' */        var ctrl = p.control;
/*Line 115 - 'AtomControl.js' */        var element = p.element;
/*Line 116 - 'AtomControl.js' */        var key = p.key;
/*Line 117 - 'AtomControl.js' */        var value = p.value;
/*Line 118 - 'AtomControl.js' */        var eventName = p.eventName;
/*Line 119 - 'AtomControl.js' */        var valueFunction = p.valueFunction;
/*Line 120 - 'AtomControl.js' */        var validatorFunction = function () {
/*Line 121 - 'AtomControl.js' */            var v = valueFunction.call(ctrl,element);
/*Line 122 - 'AtomControl.js' */            return p.validator(v);
/*Line 123 - 'AtomControl.js' */        };

/*Line 125 - 'AtomControl.js' */        if (value) {
/*Line 126 - 'AtomControl.js' */            errors.set(element, key, validatorFunction);
/*Line 127 - 'AtomControl.js' */            if (eventName) {
/*Line 128 - 'AtomControl.js' */                var ve = Atom.query(eventName.split(','));
/*Line 129 - 'AtomControl.js' */                while (ve.next()) {
/*Line 130 - 'AtomControl.js' */                    eventName = ve.current();
/*Line 131 - 'AtomControl.js' */                    ctrl.bindEvent(element, eventName, function () {
/*Line 132 - 'AtomControl.js' */                        errors.reset(element);
/*Line 133 - 'AtomControl.js' */                    }, key);
/*Line 134 - 'AtomControl.js' */                }
/*Line 135 - 'AtomControl.js' */            }
/*Line 136 - 'AtomControl.js' */        } else {
/*Line 137 - 'AtomControl.js' */            errors.set(element, key, null);
/*Line 138 - 'AtomControl.js' */            if (eventName) {
/*Line 139 - 'AtomControl.js' */                var ve = Atom.query(eventName.split(','));
/*Line 140 - 'AtomControl.js' */                while (ve.next()) {
/*Line 141 - 'AtomControl.js' */                    eventName = ve.current();
/*Line 142 - 'AtomControl.js' */                    ctrl.unbindEvent(element, eventName, null, key);
/*Line 143 - 'AtomControl.js' */                }
/*Line 144 - 'AtomControl.js' */            }
/*Line 145 - 'AtomControl.js' */        }
/*Line 146 - 'AtomControl.js' */    },
/*Line 147 - 'AtomControl.js' */    invalid: function (element, v) {
/*Line 148 - 'AtomControl.js' */        var self = this;
/*Line 149 - 'AtomControl.js' */        AtomProperties.validate({
/*Line 150 - 'AtomControl.js' */            value: v,
/*Line 151 - 'AtomControl.js' */            key: "invalid",
/*Line 152 - 'AtomControl.js' */            valueFunction: function () {
/*Line 153 - 'AtomControl.js' */                return v;
/*Line 154 - 'AtomControl.js' */            },
/*Line 155 - 'AtomControl.js' */            validator: function (v) {
/*Line 156 - 'AtomControl.js' */                if (v) {
/*Line 157 - 'AtomControl.js' */                    if ($.isArray(v)) {
/*Line 158 - 'AtomControl.js' */                        return v.join(",");
/*Line 159 - 'AtomControl.js' */                    }
/*Line 160 - 'AtomControl.js' */                }
/*Line 161 - 'AtomControl.js' */                return v;
/*Line 162 - 'AtomControl.js' */            },
/*Line 163 - 'AtomControl.js' */            control: this,
/*Line 164 - 'AtomControl.js' */            element: element
/*Line 165 - 'AtomControl.js' */        });
/*Line 166 - 'AtomControl.js' */        if (this._created) {
/*Line 167 - 'AtomControl.js' */            errors.reset(element);
/*Line 168 - 'AtomControl.js' */        }
/*Line 169 - 'AtomControl.js' */    },
/*Line 170 - 'AtomControl.js' */    required: function (element, value) {

/*Line 172 - 'AtomControl.js' */        //if (!/input|textarea|select/i.test(element.tagName) && this._element == element) {
/*Line 173 - 'AtomControl.js' */        if (this._element == element) {
/*Line 174 - 'AtomControl.js' */            if (this.get_value) {
/*Line 175 - 'AtomControl.js' */                if (value) {
/*Line 176 - 'AtomControl.js' */                    this.bind(this._element, "invalid", [["value"]], false, function (v1) { return v1 ? null : "Required" });
/*Line 177 - 'AtomControl.js' */                } else {
/*Line 178 - 'AtomControl.js' */                    this.clearBinding(this._element, "invalid");
/*Line 179 - 'AtomControl.js' */                }
/*Line 180 - 'AtomControl.js' */                return;
/*Line 181 - 'AtomControl.js' */            }
/*Line 182 - 'AtomControl.js' */        }

/*Line 184 - 'AtomControl.js' */        if (!/input|textarea|select/i.test(element.tagName)) {
/*Line 185 - 'AtomControl.js' */            return;
/*Line 186 - 'AtomControl.js' */        }

/*Line 188 - 'AtomControl.js' */        var vf = function () {
/*Line 189 - 'AtomControl.js' */            return $(element).val();
/*Line 190 - 'AtomControl.js' */        };
/*Line 191 - 'AtomControl.js' */        var validator = function (v) {
/*Line 192 - 'AtomControl.js' */            return v ? null : "Required";
/*Line 193 - 'AtomControl.js' */        };
/*Line 194 - 'AtomControl.js' */        AtomProperties.validate({
/*Line 195 - 'AtomControl.js' */            control: this,
/*Line 196 - 'AtomControl.js' */            element: element,
/*Line 197 - 'AtomControl.js' */            key: "required",
/*Line 198 - 'AtomControl.js' */            value: value,
/*Line 199 - 'AtomControl.js' */            eventName: "change,blur",
/*Line 200 - 'AtomControl.js' */            valueFunction: vf,
/*Line 201 - 'AtomControl.js' */            validator: validator
/*Line 202 - 'AtomControl.js' */        });
/*Line 203 - 'AtomControl.js' */    },
/*Line 204 - 'AtomControl.js' */    regex: function (element, value) {
/*Line 205 - 'AtomControl.js' */        var vf = function () {
/*Line 206 - 'AtomControl.js' */            return $(element).val();
/*Line 207 - 'AtomControl.js' */        };
/*Line 208 - 'AtomControl.js' */        var validator = function (v) {
/*Line 209 - 'AtomControl.js' */            var r = value;
/*Line 210 - 'AtomControl.js' */            if (typeof r == 'string' || r.constructor == String) {
/*Line 211 - 'AtomControl.js' */                if (!(/^\//.test(r) || /(\/)|(\/i)$/.test(r))) {
/*Line 212 - 'AtomControl.js' */                    r = "/" + r + "/";
/*Line 213 - 'AtomControl.js' */                }
/*Line 214 - 'AtomControl.js' */                r = eval(r);
/*Line 215 - 'AtomControl.js' */            }
/*Line 216 - 'AtomControl.js' */            return r.test(v) ? null : "Invalid";
/*Line 217 - 'AtomControl.js' */        };
/*Line 218 - 'AtomControl.js' */        AtomProperties.validate({
/*Line 219 - 'AtomControl.js' */            control: this,
/*Line 220 - 'AtomControl.js' */            element: element,
/*Line 221 - 'AtomControl.js' */            value: value,
/*Line 222 - 'AtomControl.js' */            key: "regex",
/*Line 223 - 'AtomControl.js' */            eventName: "change,blur",
/*Line 224 - 'AtomControl.js' */            valueFunction: vf,
/*Line 225 - 'AtomControl.js' */            validator: validator
/*Line 226 - 'AtomControl.js' */        });

/*Line 228 - 'AtomControl.js' */    },
/*Line 229 - 'AtomControl.js' */    dataType: function (element, value) {
/*Line 230 - 'AtomControl.js' */        var vf = function () {
/*Line 231 - 'AtomControl.js' */            return $(element).val();
/*Line 232 - 'AtomControl.js' */        };
/*Line 233 - 'AtomControl.js' */        var validator = function (v) {
/*Line 234 - 'AtomControl.js' */            var r = null;
/*Line 235 - 'AtomControl.js' */            var msg = "Invalid";
/*Line 236 - 'AtomControl.js' */            if (/email/i.test(value)) {
/*Line 237 - 'AtomControl.js' */                r = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
/*Line 238 - 'AtomControl.js' */                msg = "Invalid email";
/*Line 239 - 'AtomControl.js' */            }
/*Line 240 - 'AtomControl.js' */            return r.test(v) ? null : msg ;
/*Line 241 - 'AtomControl.js' */        };
/*Line 242 - 'AtomControl.js' */        AtomProperties.validate({
/*Line 243 - 'AtomControl.js' */            control: this,
/*Line 244 - 'AtomControl.js' */            element: element,
/*Line 245 - 'AtomControl.js' */            value: value,
/*Line 246 - 'AtomControl.js' */            key: "dataType",
/*Line 247 - 'AtomControl.js' */            eventName: "change,blur",
/*Line 248 - 'AtomControl.js' */            valueFunction: vf,
/*Line 249 - 'AtomControl.js' */            validator: validator
/*Line 250 - 'AtomControl.js' */        });
/*Line 251 - 'AtomControl.js' */    },
/*Line 252 - 'AtomControl.js' */    mask: function (element, value) {
/*Line 253 - 'AtomControl.js' */        if (value) {
/*Line 254 - 'AtomControl.js' */            if (value.constructor === String) {
/*Line 255 - 'AtomControl.js' */                $(element).mask(value);
/*Line 256 - 'AtomControl.js' */            } else {
/*Line 257 - 'AtomControl.js' */                $(element).mask(value.mask, value.settings);
/*Line 258 - 'AtomControl.js' */            }
/*Line 259 - 'AtomControl.js' */        } else {
/*Line 260 - 'AtomControl.js' */            $(element).unmask();
/*Line 261 - 'AtomControl.js' */        }
/*Line 262 - 'AtomControl.js' */    },
/*Line 263 - 'AtomControl.js' */    html: function (element, value) {
/*Line 264 - 'AtomControl.js' */        element.innerHTML = value;
/*Line 265 - 'AtomControl.js' */    },
/*Line 266 - 'AtomControl.js' */    absPos: function (element, value) {
/*Line 267 - 'AtomControl.js' */        AtomProperties.setPosition(true, element, value);
/*Line 268 - 'AtomControl.js' */    },
/*Line 269 - 'AtomControl.js' */    relPos: function (element, value) {
/*Line 270 - 'AtomControl.js' */        AtomProperties.setPosition(false, element, value);
/*Line 271 - 'AtomControl.js' */    },
/*Line 272 - 'AtomControl.js' */    "class": function (element,value) {
/*Line 273 - 'AtomControl.js' */        if (element.atomClass) {
/*Line 274 - 'AtomControl.js' */            $(element).removeClass(element.atomClass);
/*Line 275 - 'AtomControl.js' */        }
/*Line 276 - 'AtomControl.js' */        if (value) {
/*Line 277 - 'AtomControl.js' */            value = AtomUI.createCss(value);
/*Line 278 - 'AtomControl.js' */            if (value) {
/*Line 279 - 'AtomControl.js' */                $(element).addClass(value);
/*Line 280 - 'AtomControl.js' */            }
/*Line 281 - 'AtomControl.js' */            element.atomClass = value;
/*Line 282 - 'AtomControl.js' */        }
/*Line 283 - 'AtomControl.js' */    },
/*Line 284 - 'AtomControl.js' */    setPosition: function (a, e, val) {
/*Line 285 - 'AtomControl.js' */        var l = val;

/*Line 287 - 'AtomControl.js' */        if (l.constructor == String) {
/*Line 288 - 'AtomControl.js' */            l = eval("[" + l + "]");
/*Line 289 - 'AtomControl.js' */        }

/*Line 291 - 'AtomControl.js' */        e.style.position = a ? 'absolute' : 'relative';

/*Line 293 - 'AtomControl.js' */        var left = l[0];
/*Line 294 - 'AtomControl.js' */        var top = l[1];

/*Line 296 - 'AtomControl.js' */        if (left !== null) {
/*Line 297 - 'AtomControl.js' */            e.style.left = left + "px";
/*Line 298 - 'AtomControl.js' */        }
/*Line 299 - 'AtomControl.js' */        if (top !== null) {
/*Line 300 - 'AtomControl.js' */            e.style.top = top + "px";
/*Line 301 - 'AtomControl.js' */        }
/*Line 302 - 'AtomControl.js' */        if (l.length > 2) {
/*Line 303 - 'AtomControl.js' */            var width = l[2];
/*Line 304 - 'AtomControl.js' */            var height = l[3];
/*Line 305 - 'AtomControl.js' */            if (width !== undefined && width !== null) {
/*Line 306 - 'AtomControl.js' */                e.style.width = width + "px";
/*Line 307 - 'AtomControl.js' */            }
/*Line 308 - 'AtomControl.js' */            if (height !== undefined && height !== null) {
/*Line 309 - 'AtomControl.js' */                e.style.height = height + "px";
/*Line 310 - 'AtomControl.js' */            }
/*Line 311 - 'AtomControl.js' */        }
/*Line 312 - 'AtomControl.js' */    }
/*Line 313 - 'AtomControl.js' */};

/*Line 315 - 'AtomControl.js' */window.AtomProperties = AtomProperties;

/*Line 317 - 'AtomControl.js' */(function (base) {

/*Line 319 - 'AtomControl.js' */    return classCreatorEx({
/*Line 320 - 'AtomControl.js' */        name: "WebAtoms.AtomControl",
/*Line 321 - 'AtomControl.js' */        base: base,
/*Line 322 - 'AtomControl.js' */        start: function (element) {
/*Line 323 - 'AtomControl.js' */            element.atomControl = this;
/*Line 324 - 'AtomControl.js' */            this._element = element;

/*Line 326 - 'AtomControl.js' */            this.dispatcher = WebAtoms.dispatcher;
/*Line 327 - 'AtomControl.js' */            this.bindings = [];
/*Line 328 - 'AtomControl.js' */            this._isVisible = true;

/*Line 330 - 'AtomControl.js' */            var eid = element.id;
/*Line 331 - 'AtomControl.js' */            if (eid && appScope) {
/*Line 332 - 'AtomControl.js' */                if (!/^\_\_waID/.test(eid)) {
/*Line 333 - 'AtomControl.js' */                    appScope[eid] = this;
/*Line 334 - 'AtomControl.js' */                }
/*Line 335 - 'AtomControl.js' */            }
/*Line 336 - 'AtomControl.js' */            AtomUI.assignID(element);

/*Line 338 - 'AtomControl.js' */            allControls[eid] = this;
/*Line 339 - 'AtomControl.js' */        },
/*Line 340 - 'AtomControl.js' */        properties: {
/*Line 341 - 'AtomControl.js' */            layout: null,
/*Line 342 - 'AtomControl.js' */            loadNext: null,
/*Line 343 - 'AtomControl.js' */            next: null,
/*Line 344 - 'AtomControl.js' */            merge: undefined,
/*Line 345 - 'AtomControl.js' */            value: undefined
/*Line 346 - 'AtomControl.js' */        },
/*Line 347 - 'AtomControl.js' */        methods: {
/*Line 348 - 'AtomControl.js' */            set_merge: function (v) {
/*Line 349 - 'AtomControl.js' */                this._mergeData2 = null;
/*Line 350 - 'AtomControl.js' */                if (!v)
/*Line 351 - 'AtomControl.js' */                    return;
/*Line 352 - 'AtomControl.js' */                var d = v.data;
/*Line 353 - 'AtomControl.js' */                if (d) {
/*Line 354 - 'AtomControl.js' */                    Atom.merge(this.get_data(), d, true);
/*Line 355 - 'AtomControl.js' */                    this._mergeData2 = d;
/*Line 356 - 'AtomControl.js' */                }
/*Line 357 - 'AtomControl.js' */                d = v.scope;
/*Line 358 - 'AtomControl.js' */                if (d) {
/*Line 359 - 'AtomControl.js' */                    Atom.merge(this.get_scope(), d, true);
/*Line 360 - 'AtomControl.js' */                }
/*Line 361 - 'AtomControl.js' */                d = v.appScope;
/*Line 362 - 'AtomControl.js' */                if (d) {
/*Line 363 - 'AtomControl.js' */                    Atom.merge(this.get_appScope(), d, true);
/*Line 364 - 'AtomControl.js' */                }
/*Line 365 - 'AtomControl.js' */                d = v.localScope;
/*Line 366 - 'AtomControl.js' */                if (d) {
/*Line 367 - 'AtomControl.js' */                    Atom.merge(this.get_localScope(), d, true);
/*Line 368 - 'AtomControl.js' */                }
/*Line 369 - 'AtomControl.js' */                d = v.owner;
/*Line 370 - 'AtomControl.js' */                if (d) {
/*Line 371 - 'AtomControl.js' */                    Atom.merge(this,d,true);
/*Line 372 - 'AtomControl.js' */                }
/*Line 373 - 'AtomControl.js' */                var action = (v.timeOut || v.timeout);
/*Line 374 - 'AtomControl.js' */                if (action) {
/*Line 375 - 'AtomControl.js' */                    var _this = this;
/*Line 376 - 'AtomControl.js' */                    var tm = 100;
/*Line 377 - 'AtomControl.js' */                    if (action.hasOwnProperty("length")) {
/*Line 378 - 'AtomControl.js' */                        if (action.length > 1) {
/*Line 379 - 'AtomControl.js' */                            tm = action[0];
/*Line 380 - 'AtomControl.js' */                            action = action[1];
/*Line 381 - 'AtomControl.js' */                        }
/*Line 382 - 'AtomControl.js' */                    }
/*Line 383 - 'AtomControl.js' */                    setTimeout(function () {
/*Line 384 - 'AtomControl.js' */                        _this.set_merge(action);
/*Line 385 - 'AtomControl.js' */                    }, tm);
/*Line 386 - 'AtomControl.js' */                    return;
/*Line 387 - 'AtomControl.js' */                }

/*Line 389 - 'AtomControl.js' */            },
/*Line 390 - 'AtomControl.js' */            invokeAction: function (action, evt) {
/*Line 391 - 'AtomControl.js' */                try {
/*Line 392 - 'AtomControl.js' */                    runAction.call(this,action, evt);
/*Line 393 - 'AtomControl.js' */                } catch (e) {
/*Line 394 - 'AtomControl.js' */                    alert(e);
/*Line 395 - 'AtomControl.js' */                    if (console.error) {
/*Line 396 - 'AtomControl.js' */                        console.error(e);
/*Line 397 - 'AtomControl.js' */                    }
/*Line 398 - 'AtomControl.js' */                }
/*Line 399 - 'AtomControl.js' */            },

/*Line 401 - 'AtomControl.js' */            refresh: function () {
/*Line 402 - 'AtomControl.js' */                // invoke some default action...!!!
/*Line 403 - 'AtomControl.js' */            },

/*Line 405 - 'AtomControl.js' */            get_element: function () {
/*Line 406 - 'AtomControl.js' */                return this._element;
/*Line 407 - 'AtomControl.js' */            },

/*Line 409 - 'AtomControl.js' */            clearBinding: function (element, key) {
/*Line 410 - 'AtomControl.js' */                var ae = new AtomEnumerator(this.bindings);
/*Line 411 - 'AtomControl.js' */                var item;
/*Line 412 - 'AtomControl.js' */                var removed = [];
/*Line 413 - 'AtomControl.js' */                while (ae.next()) {
/*Line 414 - 'AtomControl.js' */                    item = ae.current();
/*Line 415 - 'AtomControl.js' */                    if (element && item.element != element)
/*Line 416 - 'AtomControl.js' */                        continue;
/*Line 417 - 'AtomControl.js' */                    if (key && item.key != key)
/*Line 418 - 'AtomControl.js' */                        continue;
/*Line 419 - 'AtomControl.js' */                    //this.bindings.splice(ae.currentIndex(), 1);
/*Line 420 - 'AtomControl.js' */                    item.dispose();
/*Line 421 - 'AtomControl.js' */                    removed.push(item);
/*Line 422 - 'AtomControl.js' */                }
/*Line 423 - 'AtomControl.js' */                ae = new AtomEnumerator(removed);
/*Line 424 - 'AtomControl.js' */                while (ae.next()) {
/*Line 425 - 'AtomControl.js' */                    AtomArray.remove(this.bindings, ae.current());
/*Line 426 - 'AtomControl.js' */                }
/*Line 427 - 'AtomControl.js' */            },
/*Line 428 - 'AtomControl.js' */            addBinding: function (target, element, key, path, twoWays, jq, valueFunction, events) {
/*Line 429 - 'AtomControl.js' */                this.clearBinding(element, key);
/*Line 430 - 'AtomControl.js' */                var ab = new WebAtoms.AtomBinding(target, element, key, path, twoWays, jq, valueFunction, events);
/*Line 431 - 'AtomControl.js' */                this.bindings.push(ab);
/*Line 432 - 'AtomControl.js' */                ab.setup();
/*Line 433 - 'AtomControl.js' */            },

/*Line 435 - 'AtomControl.js' */            get_errors: function () {
/*Line 436 - 'AtomControl.js' */                return window.errors.get(this._element, true);
/*Line 437 - 'AtomControl.js' */            },
            
/*Line 439 - 'AtomControl.js' */            get_atomParent: function (element) {
/*Line 440 - 'AtomControl.js' */                if (element == null) {
/*Line 441 - 'AtomControl.js' */                    if (this._element._logicalParent || this._element.parentNode)
/*Line 442 - 'AtomControl.js' */                        element = this._element._logicalParent || this._element.parentNode;
/*Line 443 - 'AtomControl.js' */                    else
/*Line 444 - 'AtomControl.js' */                        return null;
/*Line 445 - 'AtomControl.js' */                }
/*Line 446 - 'AtomControl.js' */                if (element.atomControl) {
/*Line 447 - 'AtomControl.js' */                    return element.atomControl;
/*Line 448 - 'AtomControl.js' */                }
/*Line 449 - 'AtomControl.js' */                if (element === document || element === window || !element.parentNode)
/*Line 450 - 'AtomControl.js' */                    return null;
/*Line 451 - 'AtomControl.js' */                return this.get_atomParent(element._logicalParent || element.parentNode);
/*Line 452 - 'AtomControl.js' */            },

/*Line 454 - 'AtomControl.js' */            get_templateParent: function (element) {
/*Line 455 - 'AtomControl.js' */                if (!element) {
/*Line 456 - 'AtomControl.js' */                    element = this._element;
/*Line 457 - 'AtomControl.js' */                }
/*Line 458 - 'AtomControl.js' */                if (element._templateParent) {
/*Line 459 - 'AtomControl.js' */                    return element._templateParent;
/*Line 460 - 'AtomControl.js' */                }
/*Line 461 - 'AtomControl.js' */                var p = element._logicalParent || element.parentNode;
/*Line 462 - 'AtomControl.js' */                if (!p)
/*Line 463 - 'AtomControl.js' */                    throw new Error("Could not find templateParent");
/*Line 464 - 'AtomControl.js' */                return this.get_templateParent(element._logicalParent || element.parentNode);
/*Line 465 - 'AtomControl.js' */            },

/*Line 467 - 'AtomControl.js' */            get_data: function () {
/*Line 468 - 'AtomControl.js' */                if (this._data === undefined) {
/*Line 469 - 'AtomControl.js' */                    // get parent...
/*Line 470 - 'AtomControl.js' */                    var ap = this.get_atomParent(this._element._logicalParent || this._element.parentNode);
/*Line 471 - 'AtomControl.js' */                    if (ap)
/*Line 472 - 'AtomControl.js' */                        return ap.get_data();
/*Line 473 - 'AtomControl.js' */                }
/*Line 474 - 'AtomControl.js' */                return this._data;
/*Line 475 - 'AtomControl.js' */            },
/*Line 476 - 'AtomControl.js' */            set_data: function (d) {
/*Line 477 - 'AtomControl.js' */                this._data = d;
/*Line 478 - 'AtomControl.js' */                this.mergeData();
/*Line 479 - 'AtomControl.js' */                // update child references...
/*Line 480 - 'AtomControl.js' */                this.updateChildBindings(this._element);
/*Line 481 - 'AtomControl.js' */            },

/*Line 483 - 'AtomControl.js' */            validate: function () {
/*Line 484 - 'AtomControl.js' */                errors.validate(this._element);
/*Line 485 - 'AtomControl.js' */            },

/*Line 487 - 'AtomControl.js' */            mergeData: function () {
/*Line 488 - 'AtomControl.js' */                if (!this._mergeData2)
/*Line 489 - 'AtomControl.js' */                    return;
/*Line 490 - 'AtomControl.js' */                Atom.merge(this.get_data(), this._mergeData2, true);
/*Line 491 - 'AtomControl.js' */            },

/*Line 493 - 'AtomControl.js' */            updateChildBindings: function (element) {
/*Line 494 - 'AtomControl.js' */                var ae = new ChildEnumerator(element);
/*Line 495 - 'AtomControl.js' */                while (ae.next()) {
/*Line 496 - 'AtomControl.js' */                    var child = ae.current();
/*Line 497 - 'AtomControl.js' */                    if (child.atomControl && child.atomControl._created) {
/*Line 498 - 'AtomControl.js' */                        var ctrl = child.atomControl;
/*Line 499 - 'AtomControl.js' */                        if (ctrl._data !== undefined)
/*Line 500 - 'AtomControl.js' */                            continue;
/*Line 501 - 'AtomControl.js' */                        AtomBinder.refreshValue(ctrl, "data");
/*Line 502 - 'AtomControl.js' */                        ctrl.mergeData();
/*Line 503 - 'AtomControl.js' */                    }
/*Line 504 - 'AtomControl.js' */                    this.updateChildBindings(child);
/*Line 505 - 'AtomControl.js' */                }
/*Line 506 - 'AtomControl.js' */            },

/*Line 508 - 'AtomControl.js' */            initProperties: function () {

/*Line 510 - 'AtomControl.js' */                if (this._disposed)
/*Line 511 - 'AtomControl.js' */                    return;

/*Line 513 - 'AtomControl.js' */                //// init properties...
/*Line 514 - 'AtomControl.js' */                var element = this.get_element();

/*Line 516 - 'AtomControl.js' */                this.setProperties(element);
/*Line 517 - 'AtomControl.js' */                this._created = true;
/*Line 518 - 'AtomControl.js' */                this.onCreated();
/*Line 519 - 'AtomControl.js' */                this.onLoaded();
/*Line 520 - 'AtomControl.js' */            },


/*Line 523 - 'AtomControl.js' */            createChildren: function () {

/*Line 525 - 'AtomControl.js' */                this.onCreateChildren(this._element);

/*Line 527 - 'AtomControl.js' */                var t = this.getTemplate("template");

/*Line 529 - 'AtomControl.js' */                if (t) {
/*Line 530 - 'AtomControl.js' */                    var ce = new ChildEnumerator(this._element);
/*Line 531 - 'AtomControl.js' */                    // check if there is any children or not..
/*Line 532 - 'AtomControl.js' */                    if (!ce.next()) {
/*Line 533 - 'AtomControl.js' */                        if (t.constructor == String) {
/*Line 534 - 'AtomControl.js' */                            this._element.innerHTML = t;
/*Line 535 - 'AtomControl.js' */                            var caller = this;
/*Line 536 - 'AtomControl.js' */                            $(this._element).children().each(function () {
/*Line 537 - 'AtomControl.js' */                                this._templateParent = caller;
/*Line 538 - 'AtomControl.js' */                            });
/*Line 539 - 'AtomControl.js' */                        } else {
/*Line 540 - 'AtomControl.js' */                            //this._element.innerHTML = this._template;
/*Line 541 - 'AtomControl.js' */                            if (AtomUI.isNode(t)) {
/*Line 542 - 'AtomControl.js' */                                t = AtomUI.cloneNode(t);
/*Line 543 - 'AtomControl.js' */                                t._templateParent = this;
/*Line 544 - 'AtomControl.js' */                                this._element.appendChild(t);
/*Line 545 - 'AtomControl.js' */                            } else {
/*Line 546 - 'AtomControl.js' */                                // should be an array...
/*Line 547 - 'AtomControl.js' */                                var ae = new AtomEnumerator(t);
/*Line 548 - 'AtomControl.js' */                                while (ae.next()) {
/*Line 549 - 'AtomControl.js' */                                    var tc = ae.current();
/*Line 550 - 'AtomControl.js' */                                    tc = AtomUI.cloneNode(tc);
/*Line 551 - 'AtomControl.js' */                                    tc._templateParent = this;
/*Line 552 - 'AtomControl.js' */                                    this._element.appendChild(tc);
/*Line 553 - 'AtomControl.js' */                                }
/*Line 554 - 'AtomControl.js' */                            }
/*Line 555 - 'AtomControl.js' */                        }
/*Line 556 - 'AtomControl.js' */                        this.onCreateChildren(this._element);
/*Line 557 - 'AtomControl.js' */                    }
/*Line 558 - 'AtomControl.js' */                }
/*Line 559 - 'AtomControl.js' */            },


/*Line 562 - 'AtomControl.js' */            onCreateChildren: function (element) {

/*Line 564 - 'AtomControl.js' */                var ae = new ChildEnumerator(element);
/*Line 565 - 'AtomControl.js' */                var child;
/*Line 566 - 'AtomControl.js' */                while (ae.next()) {
/*Line 567 - 'AtomControl.js' */                    child = ae.current();

/*Line 569 - 'AtomControl.js' */                    var amap = AtomUI.attributeMap(child, /^atom\-(template|presenter|type|template\-name)$/gi);

/*Line 571 - 'AtomControl.js' */                    var t = amap["atom-template"];
/*Line 572 - 'AtomControl.js' */                    if (t) {
/*Line 573 - 'AtomControl.js' */                        child.removeAttributeNode(t.node);
/*Line 574 - 'AtomControl.js' */                        element.templateOwner = true;
/*Line 575 - 'AtomControl.js' */                        this["_" + t.value] = child;
/*Line 576 - 'AtomControl.js' */                        element.removeChild(child);
/*Line 577 - 'AtomControl.js' */                        continue;
/*Line 578 - 'AtomControl.js' */                    }

/*Line 580 - 'AtomControl.js' */                    var tn = amap["atom-template-name"];
/*Line 581 - 'AtomControl.js' */                    if (tn) {
/*Line 582 - 'AtomControl.js' */                        child.removeAttributeNode(tn.node);
/*Line 583 - 'AtomControl.js' */                        this._scopeTemplates = this._scopeTemplates || {};
/*Line 584 - 'AtomControl.js' */                        this._scopeTemplates[tn.value] = child;
/*Line 585 - 'AtomControl.js' */                        element.removeChild(child);
/*Line 586 - 'AtomControl.js' */                        continue;
/*Line 587 - 'AtomControl.js' */                    }

/*Line 589 - 'AtomControl.js' */                    var p = amap["atom-presenter"];
/*Line 590 - 'AtomControl.js' */                    if (p) {
/*Line 591 - 'AtomControl.js' */                        // search upwords for expected presenter...
/*Line 592 - 'AtomControl.js' */                        var owner = AtomUI.getPresenterOwner(this, p.value);
/*Line 593 - 'AtomControl.js' */                        owner["_" + p.value] = child;
/*Line 594 - 'AtomControl.js' */                    }

/*Line 596 - 'AtomControl.js' */                    var childType = amap["atom-type"];

/*Line 598 - 'AtomControl.js' */                    if (childType) {
/*Line 599 - 'AtomControl.js' */                        AtomUI.createControl(child, childType.value);
/*Line 600 - 'AtomControl.js' */                        //element.removeAttributeNode(childType.node);
/*Line 601 - 'AtomControl.js' */                    } else {
/*Line 602 - 'AtomControl.js' */                        this.onCreateChildren(child);
/*Line 603 - 'AtomControl.js' */                    }
/*Line 604 - 'AtomControl.js' */                }
/*Line 605 - 'AtomControl.js' */            },

/*Line 607 - 'AtomControl.js' */            onLoaded: function () {
/*Line 608 - 'AtomControl.js' */            },

/*Line 610 - 'AtomControl.js' */            onUpdateUI: function () {
/*Line 611 - 'AtomControl.js' */                if (this._layout) {
/*Line 612 - 'AtomControl.js' */                    this._layout.doLayout(this._element);
/*Line 613 - 'AtomControl.js' */                } else {
/*Line 614 - 'AtomControl.js' */                    this.updateChildUI(this.get_element());
/*Line 615 - 'AtomControl.js' */                }
/*Line 616 - 'AtomControl.js' */            },

/*Line 618 - 'AtomControl.js' */            updateUI: function () {
/*Line 619 - 'AtomControl.js' */                var ctrl = this;
/*Line 620 - 'AtomControl.js' */                this.dispatcher.callLater(function () {
/*Line 621 - 'AtomControl.js' */                    ctrl.onUpdateUI();
/*Line 622 - 'AtomControl.js' */                });
/*Line 623 - 'AtomControl.js' */            },

/*Line 625 - 'AtomControl.js' */            updateChildUI: function (parent) {
/*Line 626 - 'AtomControl.js' */                if (!parent)
/*Line 627 - 'AtomControl.js' */                    parent = this._element;
/*Line 628 - 'AtomControl.js' */                var ae = new ChildEnumerator(parent);
/*Line 629 - 'AtomControl.js' */                while (ae.next()) {
/*Line 630 - 'AtomControl.js' */                    var child = ae.current();
/*Line 631 - 'AtomControl.js' */                    if (child.atomControl) {
/*Line 632 - 'AtomControl.js' */                        child.atomControl.updateUI();
/*Line 633 - 'AtomControl.js' */                        continue;
/*Line 634 - 'AtomControl.js' */                    }
/*Line 635 - 'AtomControl.js' */                    this.updateChildUI(child);
/*Line 636 - 'AtomControl.js' */                }
/*Line 637 - 'AtomControl.js' */            },

/*Line 639 - 'AtomControl.js' */            onCreated: function () {
/*Line 640 - 'AtomControl.js' */                this.updateUI();
/*Line 641 - 'AtomControl.js' */            },

/*Line 643 - 'AtomControl.js' */            setProperties: function (element) {


/*Line 646 - 'AtomControl.js' */                var obj;
/*Line 647 - 'AtomControl.js' */                var key;
/*Line 648 - 'AtomControl.js' */                var value;
/*Line 649 - 'AtomControl.js' */                var fn;
/*Line 650 - 'AtomControl.js' */                var at;

/*Line 652 - 'AtomControl.js' */                var attr = element.attributes;
/*Line 653 - 'AtomControl.js' */                var ae = new AtomEnumerator(attr);

/*Line 655 - 'AtomControl.js' */                var remove = [];

/*Line 657 - 'AtomControl.js' */                var nodeValue = "value";
/*Line 658 - 'AtomControl.js' */                if (AtomBrowser.isIE && AtomBrowser.majorVersion < 9) {
/*Line 659 - 'AtomControl.js' */                    nodeValue = "nodeValue";
/*Line 660 - 'AtomControl.js' */                }

/*Line 662 - 'AtomControl.js' */                var bindList = {};

/*Line 664 - 'AtomControl.js' */                var compiledFunc = null;

/*Line 666 - 'AtomControl.js' */                while (ae.next()) {
/*Line 667 - 'AtomControl.js' */                    at = ae.current();
/*Line 668 - 'AtomControl.js' */                    key = at.nodeName;
/*Line 669 - 'AtomControl.js' */                    value = at[nodeValue];

/*Line 671 - 'AtomControl.js' */                    if (key === "data-atom-init") {
/*Line 672 - 'AtomControl.js' */                        compiledFunc = value;
/*Line 673 - 'AtomControl.js' */                        remove.push(at);
/*Line 674 - 'AtomControl.js' */                        continue;
/*Line 675 - 'AtomControl.js' */                    }
/*Line 676 - 'AtomControl.js' */                    if (/^data\-atom/.test(key)) {
/*Line 677 - 'AtomControl.js' */                        key = key.substr(5);
/*Line 678 - 'AtomControl.js' */                    }

/*Line 680 - 'AtomControl.js' */                    if (/^atomControl$/g.test(key)) {
/*Line 681 - 'AtomControl.js' */                        continue;
/*Line 682 - 'AtomControl.js' */                    }
/*Line 683 - 'AtomControl.js' */                    if (/^atom\-type$/.test(key)) {
/*Line 684 - 'AtomControl.js' */                        remove.push(at);
/*Line 685 - 'AtomControl.js' */                        continue;
/*Line 686 - 'AtomControl.js' */                    }
/*Line 687 - 'AtomControl.js' */                    if (!(/^(atom|bind|style|event)\-/g.test(key)))
/*Line 688 - 'AtomControl.js' */                        continue;
/*Line 689 - 'AtomControl.js' */                    if (!(/^(style|event)\-/g.test(key)))
/*Line 690 - 'AtomControl.js' */                        key = key.substr(5);

/*Line 692 - 'AtomControl.js' */                    if (!value)
/*Line 693 - 'AtomControl.js' */                        continue;

/*Line 695 - 'AtomControl.js' */                    if (!/(^style$|dock)/.test(key)) {
/*Line 696 - 'AtomControl.js' */                        remove.push(at);
/*Line 697 - 'AtomControl.js' */                    }

/*Line 699 - 'AtomControl.js' */                    // rename key...
/*Line 700 - 'AtomControl.js' */                    key = $.camelCase(key);

/*Line 702 - 'AtomControl.js' */                    bindList[key] = value;

/*Line 704 - 'AtomControl.js' */                }

/*Line 706 - 'AtomControl.js' */                if (compiledFunc) {
/*Line 707 - 'AtomControl.js' */                    var f = WebAtoms.PageSetup[compiledFunc];
/*Line 708 - 'AtomControl.js' */                    f.call(this, element);
/*Line 709 - 'AtomControl.js' */                }

/*Line 711 - 'AtomControl.js' */                // Since setValue may add up new attributes
/*Line 712 - 'AtomControl.js' */                // We set value after we have collected attribute list
/*Line 713 - 'AtomControl.js' */                for (key in bindList) {
/*Line 714 - 'AtomControl.js' */                    this.setValue(key, bindList[key], true, element);
/*Line 715 - 'AtomControl.js' */                }

/*Line 717 - 'AtomControl.js' */                ae = new AtomEnumerator(remove);
/*Line 718 - 'AtomControl.js' */                while (ae.next()) {
/*Line 719 - 'AtomControl.js' */                    //$(element).removeAttr(ae.current().nodeName);
/*Line 720 - 'AtomControl.js' */                    element.removeAttributeNode(ae.current());
/*Line 721 - 'AtomControl.js' */                }

/*Line 723 - 'AtomControl.js' */                var child = new ChildEnumerator(element);
/*Line 724 - 'AtomControl.js' */                while (child.next()) {
/*Line 725 - 'AtomControl.js' */                    var childItem = child.current();
/*Line 726 - 'AtomControl.js' */                    if (childItem.atomControl)
/*Line 727 - 'AtomControl.js' */                        continue;
/*Line 728 - 'AtomControl.js' */                    this.setProperties(childItem);
/*Line 729 - 'AtomControl.js' */                }

/*Line 731 - 'AtomControl.js' */            },

/*Line 733 - 'AtomControl.js' */            setValue: function (key, value, bind, element) {
/*Line 734 - 'AtomControl.js' */                if (value && value.constructor == String) {

/*Line 736 - 'AtomControl.js' */                    var s = value[0];

/*Line 738 - 'AtomControl.js' */                    var f = AtomBinders[s];
/*Line 739 - 'AtomControl.js' */                    if (f) {
/*Line 740 - 'AtomControl.js' */                        f(this, key, value, element);
/*Line 741 - 'AtomControl.js' */                        return;
/*Line 742 - 'AtomControl.js' */                    }

/*Line 744 - 'AtomControl.js' */                    s += value[1];
/*Line 745 - 'AtomControl.js' */                    f = AtomBinders[s];
/*Line 746 - 'AtomControl.js' */                    if (f) {
/*Line 747 - 'AtomControl.js' */                        f(this, key, value, element);
/*Line 748 - 'AtomControl.js' */                        return;
/*Line 749 - 'AtomControl.js' */                    }

/*Line 751 - 'AtomControl.js' */                }

/*Line 753 - 'AtomControl.js' */                this.setLocalValue(key, value, element);
/*Line 754 - 'AtomControl.js' */            },

/*Line 756 - 'AtomControl.js' */            setLocalValue: function (key, value, element, refresh) {

/*Line 758 - 'AtomControl.js' */                // undefined can never be set
/*Line 759 - 'AtomControl.js' */                if (value === undefined)
/*Line 760 - 'AtomControl.js' */                    return;

/*Line 762 - 'AtomControl.js' */                if (value && value instanceof AtomPromise) {

/*Line 764 - 'AtomControl.js' */                    element._promisesQueue = element._promisesQueue || {};

/*Line 766 - 'AtomControl.js' */                    var op = element._promisesQueue[key];
/*Line 767 - 'AtomControl.js' */                    if (op) {
/*Line 768 - 'AtomControl.js' */                        op.abort();
/*Line 769 - 'AtomControl.js' */                    }
/*Line 770 - 'AtomControl.js' */                    element._promisesQueue[key] = value;

/*Line 772 - 'AtomControl.js' */                    if (value._persist) {

/*Line 774 - 'AtomControl.js' */                        // is it a promise?
/*Line 775 - 'AtomControl.js' */                        this._promises = this._promises || {};

/*Line 777 - 'AtomControl.js' */                        // cache promise...
/*Line 778 - 'AtomControl.js' */                        this._promises[key] = value;


/*Line 781 - 'AtomControl.js' */                    }

/*Line 783 - 'AtomControl.js' */                    var caller = this;

/*Line 785 - 'AtomControl.js' */                    value.then(function (p) {

/*Line 787 - 'AtomControl.js' */                        if (element._promisesQueue[key] == p) {
/*Line 788 - 'AtomControl.js' */                            element._promisesQueue[key] = null;
/*Line 789 - 'AtomControl.js' */                        }

/*Line 791 - 'AtomControl.js' */                        element._promisesQueue[key] = null;

/*Line 793 - 'AtomControl.js' */                        caller.setLocalValue(key, p.value(), element, true);

/*Line 795 - 'AtomControl.js' */                        if (caller._loadNext) {
/*Line 796 - 'AtomControl.js' */                            caller.invokeAction(caller._loadNext);
/*Line 797 - 'AtomControl.js' */                        }
/*Line 798 - 'AtomControl.js' */                    });

/*Line 800 - 'AtomControl.js' */                    value.failed(function (p) {
/*Line 801 - 'AtomControl.js' */                        if (element._promisesQueue[key] == p) {
/*Line 802 - 'AtomControl.js' */                            element._promisesQueue[key] = null;
/*Line 803 - 'AtomControl.js' */                        }
/*Line 804 - 'AtomControl.js' */                    });

/*Line 806 - 'AtomControl.js' */                    value.invoke();
/*Line 807 - 'AtomControl.js' */                    return;

/*Line 809 - 'AtomControl.js' */                }

/*Line 811 - 'AtomControl.js' */                if (this._element == element) {
/*Line 812 - 'AtomControl.js' */                    var fn = this["set_" + key];
/*Line 813 - 'AtomControl.js' */                    if (fn != null) {
/*Line 814 - 'AtomControl.js' */                        if (refresh) {
/*Line 815 - 'AtomControl.js' */                            // checking old value is necessary
/*Line 816 - 'AtomControl.js' */                            // as two way binding may cause recursive
/*Line 817 - 'AtomControl.js' */                            // updates
/*Line 818 - 'AtomControl.js' */                            var oldValue = AtomBinder.getValue(this, key);
/*Line 819 - 'AtomControl.js' */                            if (oldValue == value)
/*Line 820 - 'AtomControl.js' */                                return;
/*Line 821 - 'AtomControl.js' */                        }
/*Line 822 - 'AtomControl.js' */                        fn.apply(this, [value]);
/*Line 823 - 'AtomControl.js' */                        if (refresh) {
/*Line 824 - 'AtomControl.js' */                            AtomBinder.refreshValue(this, key);
/*Line 825 - 'AtomControl.js' */                        }
/*Line 826 - 'AtomControl.js' */                        return;
/*Line 827 - 'AtomControl.js' */                    }
/*Line 828 - 'AtomControl.js' */                }

/*Line 830 - 'AtomControl.js' */                if (/^style/g.test(key) && key.length > 5) {
/*Line 831 - 'AtomControl.js' */                    var k = key.substr(5);
/*Line 832 - 'AtomControl.js' */                    k = String.fromCharCode(k.charCodeAt(0)).toLowerCase() + k.substr(1);
/*Line 833 - 'AtomControl.js' */                    element.style[k] = value;
/*Line 834 - 'AtomControl.js' */                    return;
/*Line 835 - 'AtomControl.js' */                }

/*Line 837 - 'AtomControl.js' */                if (/^event/g.test(key) && key.length > 5) {
/*Line 838 - 'AtomControl.js' */                    var k = key.substr(5);
/*Line 839 - 'AtomControl.js' */                    k = String.fromCharCode(k.charCodeAt(0)).toLowerCase() + k.substr(1);
/*Line 840 - 'AtomControl.js' */                    var _this = this;
/*Line 841 - 'AtomControl.js' */                    // unbind previous event...
/*Line 842 - 'AtomControl.js' */                    this.unbindEvent(element, k);
/*Line 843 - 'AtomControl.js' */                    this.bindEvent(element, k, null, null, function (evt) {
/*Line 844 - 'AtomControl.js' */                        _this.invokeAction(value, evt);
/*Line 845 - 'AtomControl.js' */                    });
/*Line 846 - 'AtomControl.js' */                    return;
/*Line 847 - 'AtomControl.js' */                }

/*Line 849 - 'AtomControl.js' */                var f = AtomProperties[key] || AtomProperties.any;
/*Line 850 - 'AtomControl.js' */                if (f) {
/*Line 851 - 'AtomControl.js' */                    f.call(this, element || this._element, value, key);
/*Line 852 - 'AtomControl.js' */                }

/*Line 854 - 'AtomControl.js' */            },

/*Line 856 - 'AtomControl.js' */            bind: function (element, key, value, twoWays, vf, events) {

/*Line 858 - 'AtomControl.js' */                if (value == null) {
/*Line 859 - 'AtomControl.js' */                    // remove existing binding...
/*Line 860 - 'AtomControl.js' */                    this.clearBinding(element, key);
/*Line 861 - 'AtomControl.js' */                    return;
/*Line 862 - 'AtomControl.js' */                }

/*Line 864 - 'AtomControl.js' */                var target = this;
/*Line 865 - 'AtomControl.js' */                if (value && value.constructor == String && /^window\./g.test(value)) {
/*Line 866 - 'AtomControl.js' */                    target = window;
/*Line 867 - 'AtomControl.js' */                }

/*Line 869 - 'AtomControl.js' */                var thisElement = this.get_element();

/*Line 871 - 'AtomControl.js' */                var jq = thisElement != element;

/*Line 873 - 'AtomControl.js' */                if (!jq) {
/*Line 874 - 'AtomControl.js' */                    var f = this["get_" + key];
/*Line 875 - 'AtomControl.js' */                    if (f == undefined || f == null) {
/*Line 876 - 'AtomControl.js' */                        jq = true;
/*Line 877 - 'AtomControl.js' */                    }
/*Line 878 - 'AtomControl.js' */                }

/*Line 880 - 'AtomControl.js' */                switch (key) {
/*Line 881 - 'AtomControl.js' */                    case "value":
/*Line 882 - 'AtomControl.js' */                        if (/input/gi.test(element.nodeName)) { jq = true; }
/*Line 883 - 'AtomControl.js' */                        this.addBinding(target, element, "value", value, twoWays, jq, vf, events);
/*Line 884 - 'AtomControl.js' */                        break;
/*Line 885 - 'AtomControl.js' */                    case "text":
/*Line 886 - 'AtomControl.js' */                        this.addBinding(target, element, "text", value, false, true, vf, events);
/*Line 887 - 'AtomControl.js' */                        break;
/*Line 888 - 'AtomControl.js' */                    default:
/*Line 889 - 'AtomControl.js' */                        this.addBinding(target, element, key, value, twoWays, jq, vf, events);
/*Line 890 - 'AtomControl.js' */                        break;
/*Line 891 - 'AtomControl.js' */                }

/*Line 893 - 'AtomControl.js' */            },

/*Line 895 - 'AtomControl.js' */            onInitialized: function () {
/*Line 896 - 'AtomControl.js' */            },

/*Line 898 - 'AtomControl.js' */            init: function () {

/*Line 900 - 'AtomControl.js' */                // first remove all templates ...
/*Line 901 - 'AtomControl.js' */                base.init.apply(this, arguments);

/*Line 903 - 'AtomControl.js' */                // init properties...
/*Line 904 - 'AtomControl.js' */                var element = this.get_element();

/*Line 906 - 'AtomControl.js' */                var amap = AtomUI.attributeMap(element, /^atom\-(name|local\-scope)$/gi);

/*Line 908 - 'AtomControl.js' */                var aname = amap["atom-name"];
/*Line 909 - 'AtomControl.js' */                if (!aname) {
/*Line 910 - 'AtomControl.js' */                    var eid = element.id;
/*Line 911 - 'AtomControl.js' */                    if (!/^\_\_waID/.test(eid)) {
/*Line 912 - 'AtomControl.js' */                        aname = element.id;
/*Line 913 - 'AtomControl.js' */                    }
/*Line 914 - 'AtomControl.js' */                } else {
/*Line 915 - 'AtomControl.js' */                    element.removeAttributeNode(aname.node);
/*Line 916 - 'AtomControl.js' */                    aname = aname.value;
/*Line 917 - 'AtomControl.js' */                }
/*Line 918 - 'AtomControl.js' */                if (aname) {
/*Line 919 - 'AtomControl.js' */                    if (/^(app|window|owner|scope|localScope|parent)$/gi.test(aname))
/*Line 920 - 'AtomControl.js' */                        throw new Error("Invalid Control Name '" + aname + "'");
/*Line 921 - 'AtomControl.js' */                    var s = this.get_scope();
/*Line 922 - 'AtomControl.js' */                    AtomBinder.setValue(s, aname, this);
/*Line 923 - 'AtomControl.js' */                    this._name = aname;
/*Line 924 - 'AtomControl.js' */                }


/*Line 927 - 'AtomControl.js' */                ls = amap["atom-local-scope"];
/*Line 928 - 'AtomControl.js' */                if (ls) {
/*Line 929 - 'AtomControl.js' */                    this._localScope = new AtomScope(this, this.get_scope(), atomApplication);
/*Line 930 - 'AtomControl.js' */                    this._scope = this._localScope;
/*Line 931 - 'AtomControl.js' */                    if (this._name) {
/*Line 932 - 'AtomControl.js' */                        this._localScope[this._name] = this;
/*Line 933 - 'AtomControl.js' */                    }
/*Line 934 - 'AtomControl.js' */                    element.removeAttributeNode(ls.node);
/*Line 935 - 'AtomControl.js' */                }

/*Line 937 - 'AtomControl.js' */                // scope is now ready, set scopeTemplates...
/*Line 938 - 'AtomControl.js' */                var st = this._scopeTemplates;
/*Line 939 - 'AtomControl.js' */                if (st) {
/*Line 940 - 'AtomControl.js' */                    var s = this.get_scope();
/*Line 941 - 'AtomControl.js' */                    for (var i in st) {
/*Line 942 - 'AtomControl.js' */                        var t = st[i];
/*Line 943 - 'AtomControl.js' */                        AtomBinder.setValue(s, i, t);
/*Line 944 - 'AtomControl.js' */                    }
/*Line 945 - 'AtomControl.js' */                    //try {
/*Line 946 - 'AtomControl.js' */                    //    delete this._scopeTemplates;
/*Line 947 - 'AtomControl.js' */                    //} catch (exx) {

/*Line 949 - 'AtomControl.js' */                    //}
/*Line 950 - 'AtomControl.js' */                }

/*Line 952 - 'AtomControl.js' */                //var fn = Function.createDelegate(this, this.initProperties);
/*Line 953 - 'AtomControl.js' */                var _this = this;
/*Line 954 - 'AtomControl.js' */                WebAtoms.dispatcher.callLater(function () {
/*Line 955 - 'AtomControl.js' */                    _this.initProperties();
/*Line 956 - 'AtomControl.js' */                });

/*Line 958 - 'AtomControl.js' */                // init every children..
/*Line 959 - 'AtomControl.js' */                this.initChildren(this._element);

/*Line 961 - 'AtomControl.js' */                //fn = Function.createDelegate(this, this.onInitialized);
/*Line 962 - 'AtomControl.js' */                WebAtoms.dispatcher.callLater(function () {
/*Line 963 - 'AtomControl.js' */                    _this.onInitialized();
/*Line 964 - 'AtomControl.js' */                });
/*Line 965 - 'AtomControl.js' */            },


/*Line 968 - 'AtomControl.js' */            dispose: function (e) {

/*Line 970 - 'AtomControl.js' */                // disposing only one element
/*Line 971 - 'AtomControl.js' */                if (e) {
/*Line 972 - 'AtomControl.js' */                    var eac = e.atomControl;
/*Line 973 - 'AtomControl.js' */                    if (eac) {
/*Line 974 - 'AtomControl.js' */                        eac.dispose();
/*Line 975 - 'AtomControl.js' */                    } else {
/*Line 976 - 'AtomControl.js' */                        this.clearBinding(e);
/*Line 977 - 'AtomControl.js' */                        this.disposeChildren(e);
/*Line 978 - 'AtomControl.js' */                    }
/*Line 979 - 'AtomControl.js' */                    $(e).remove();
/*Line 980 - 'AtomControl.js' */                    return;
/*Line 981 - 'AtomControl.js' */                }

/*Line 983 - 'AtomControl.js' */                e = this._element;

/*Line 985 - 'AtomControl.js' */                this._disposed = true;
/*Line 986 - 'AtomControl.js' */                this.disposeChildren(e);
/*Line 987 - 'AtomControl.js' */                this.clearBinding();
/*Line 988 - 'AtomControl.js' */                this.bindings.length = 0;

/*Line 990 - 'AtomControl.js' */                var v = e.atomValidator;
/*Line 991 - 'AtomControl.js' */                if (v) {
/*Line 992 - 'AtomControl.js' */                    v.dispose();
/*Line 993 - 'AtomControl.js' */                    e.atomValidator = undefined;
/*Line 994 - 'AtomControl.js' */                }
/*Line 995 - 'AtomControl.js' */                base.dispose.apply(this, arguments);
/*Line 996 - 'AtomControl.js' */            },


/*Line 999 - 'AtomControl.js' */            disposeChildren: function (e) {
/*Line 1000 - 'AtomControl.js' */                var oldIE = AtomBrowser.isIE && AtomBrowser.majorVersion < 9;
/*Line 1001 - 'AtomControl.js' */                var ae = new ChildEnumerator(e);
/*Line 1002 - 'AtomControl.js' */                while (ae.next()) {
/*Line 1003 - 'AtomControl.js' */                    var ce = ae.current();
/*Line 1004 - 'AtomControl.js' */                    if (ce.atomControl) {
/*Line 1005 - 'AtomControl.js' */                        ce.atomControl.dispose();
/*Line 1006 - 'AtomControl.js' */                        if (oldIE) {
/*Line 1007 - 'AtomControl.js' */                            ce.atomControl = undefined;
/*Line 1008 - 'AtomControl.js' */                        } else {
/*Line 1009 - 'AtomControl.js' */                            delete ce.atomControl;
/*Line 1010 - 'AtomControl.js' */                        }
/*Line 1011 - 'AtomControl.js' */                    } else {
/*Line 1012 - 'AtomControl.js' */                        this.clearBinding(ce);
/*Line 1013 - 'AtomControl.js' */                        this.unbindEvent(ce);
/*Line 1014 - 'AtomControl.js' */                        this.disposeChildren(ce);
/*Line 1015 - 'AtomControl.js' */                    }
/*Line 1016 - 'AtomControl.js' */                    //$(ce).remove();
/*Line 1017 - 'AtomControl.js' */                }
/*Line 1018 - 'AtomControl.js' */                // this will and should remove every children..
/*Line 1019 - 'AtomControl.js' */                try {
/*Line 1020 - 'AtomControl.js' */                    e.innerHTML = "";
/*Line 1021 - 'AtomControl.js' */                } catch (ex) {
/*Line 1022 - 'AtomControl.js' */                    $(e).html('');
/*Line 1023 - 'AtomControl.js' */                }
/*Line 1024 - 'AtomControl.js' */            },

/*Line 1026 - 'AtomControl.js' */            get_innerTemplate: function () {
/*Line 1027 - 'AtomControl.js' */                return this._template;
/*Line 1028 - 'AtomControl.js' */            },

/*Line 1030 - 'AtomControl.js' */            set_innerTemplate: function (v) {
/*Line 1031 - 'AtomControl.js' */                if (this._template === v) {
/*Line 1032 - 'AtomControl.js' */                    if (this._created)
/*Line 1033 - 'AtomControl.js' */                        return;
/*Line 1034 - 'AtomControl.js' */                }
/*Line 1035 - 'AtomControl.js' */                if (!this._created) {
/*Line 1036 - 'AtomControl.js' */                    var _this = this;
/*Line 1037 - 'AtomControl.js' */                    // this is because, sometimes template change occurs while creation
/*Line 1038 - 'AtomControl.js' */                    // which creates endless loop
/*Line 1039 - 'AtomControl.js' */                    WebAtoms.dispatcher.callLater(function () {
/*Line 1040 - 'AtomControl.js' */                        _this.set_innerTemplate(v);
/*Line 1041 - 'AtomControl.js' */                    });
/*Line 1042 - 'AtomControl.js' */                    return;
/*Line 1043 - 'AtomControl.js' */                }
/*Line 1044 - 'AtomControl.js' */                this._template = v;
/*Line 1045 - 'AtomControl.js' */                // disposing all children...
/*Line 1046 - 'AtomControl.js' */                this.disposeChildren(this._element);

/*Line 1048 - 'AtomControl.js' */                this.createChildren();
/*Line 1049 - 'AtomControl.js' */                this.setProperties(this._element);
/*Line 1050 - 'AtomControl.js' */                this.initChildren(this._element);
/*Line 1051 - 'AtomControl.js' */                this.updateUI();
/*Line 1052 - 'AtomControl.js' */            },

/*Line 1054 - 'AtomControl.js' */            initChildren: function (e) {
/*Line 1055 - 'AtomControl.js' */                var ae = new ChildEnumerator(e);
/*Line 1056 - 'AtomControl.js' */                var item;
/*Line 1057 - 'AtomControl.js' */                var ctrl;

/*Line 1059 - 'AtomControl.js' */                var remove = [];

/*Line 1061 - 'AtomControl.js' */                while (ae.next()) {
/*Line 1062 - 'AtomControl.js' */                    item = ae.current();

/*Line 1064 - 'AtomControl.js' */                    if (item.nodeName == "SCRIPT") {

/*Line 1066 - 'AtomControl.js' */                        var s = $.trim(item.innerHTML);
/*Line 1067 - 'AtomControl.js' */                        if (/^\(\{/.test(s) && /\}\)$/.test(s)) {
/*Line 1068 - 'AtomControl.js' */                            try {
/*Line 1069 - 'AtomControl.js' */                                s = (new Function("return " + s + ";"))()
/*Line 1070 - 'AtomControl.js' */                                this.set_scope(s);
/*Line 1071 - 'AtomControl.js' */                            } catch (ex) {
/*Line 1072 - 'AtomControl.js' */                                log(JSON.stringify(ex));
/*Line 1073 - 'AtomControl.js' */                                alert(JSON.stringify(ex));
/*Line 1074 - 'AtomControl.js' */                            }

/*Line 1076 - 'AtomControl.js' */                        }
/*Line 1077 - 'AtomControl.js' */                        remove.push(item);
/*Line 1078 - 'AtomControl.js' */                        continue;

/*Line 1080 - 'AtomControl.js' */                    }

/*Line 1082 - 'AtomControl.js' */                    ctrl = item.atomControl;
/*Line 1083 - 'AtomControl.js' */                    if (ctrl) {
/*Line 1084 - 'AtomControl.js' */                        ctrl.init();
/*Line 1085 - 'AtomControl.js' */                    } else {
/*Line 1086 - 'AtomControl.js' */                        this.initChildren(item);
/*Line 1087 - 'AtomControl.js' */                    }
/*Line 1088 - 'AtomControl.js' */                }

/*Line 1090 - 'AtomControl.js' */                ae = new AtomEnumerator(remove);
/*Line 1091 - 'AtomControl.js' */                while (ae.next()) {
/*Line 1092 - 'AtomControl.js' */                    e.removeChild(ae.current());
/*Line 1093 - 'AtomControl.js' */                }
/*Line 1094 - 'AtomControl.js' */            }
/*Line 1095 - 'AtomControl.js' */        }
/*Line 1096 - 'AtomControl.js' */    });
/*Line 1097 - 'AtomControl.js' */})(WebAtoms.AtomUIComponent.prototype);
/*Line 0 - 'AtomItemsControl.js' */

/*Line 2 - 'AtomItemsControl.js' */(function (base) {
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
/*Line 29 - 'AtomItemsControl.js' */            errorNext: null,
/*Line 30 - 'AtomItemsControl.js' */            postUrl: null,
/*Line 31 - 'AtomItemsControl.js' */            confirm: false,
/*Line 32 - 'AtomItemsControl.js' */            confirmMessage: null,
/*Line 33 - 'AtomItemsControl.js' */            filter: null,
/*Line 34 - 'AtomItemsControl.js' */            items: null,
/*Line 35 - 'AtomItemsControl.js' */            itemTemplate: null
/*Line 36 - 'AtomItemsControl.js' */        },
/*Line 37 - 'AtomItemsControl.js' */        methods: {
/*Line 38 - 'AtomItemsControl.js' */            get_postData: function () {
/*Line 39 - 'AtomItemsControl.js' */                return this._postData || this.get_selectedItem();
/*Line 40 - 'AtomItemsControl.js' */            },
/*Line 41 - 'AtomItemsControl.js' */            get_allValues: function () {
/*Line 42 - 'AtomItemsControl.js' */                if (!this._valueSeparator)
/*Line 43 - 'AtomItemsControl.js' */                    return;
/*Line 44 - 'AtomItemsControl.js' */                if (!this._valuePath)
/*Line 45 - 'AtomItemsControl.js' */                    return;
/*Line 46 - 'AtomItemsControl.js' */                var list = [];
/*Line 47 - 'AtomItemsControl.js' */                var vp = this._valuePath;
/*Line 48 - 'AtomItemsControl.js' */                var vfp = function (item) {
/*Line 49 - 'AtomItemsControl.js' */                    return item[vp];
/*Line 50 - 'AtomItemsControl.js' */                };
/*Line 51 - 'AtomItemsControl.js' */                var ae = Atom.query(this.get_dataItems());
/*Line 52 - 'AtomItemsControl.js' */                while (ae.next()) {
/*Line 53 - 'AtomItemsControl.js' */                    list.push(vfp(ae.current()));
/*Line 54 - 'AtomItemsControl.js' */                }
/*Line 55 - 'AtomItemsControl.js' */                return list.join(this._valueSeparator);
/*Line 56 - 'AtomItemsControl.js' */            },
/*Line 57 - 'AtomItemsControl.js' */            get_value: function () {

/*Line 59 - 'AtomItemsControl.js' */                if (this._allowMultipleSelection) {
/*Line 60 - 'AtomItemsControl.js' */                    var items = this._selectedItems;
/*Line 61 - 'AtomItemsControl.js' */                    if (items.length == 0) {
/*Line 62 - 'AtomItemsControl.js' */                        if (this._value !== undefined)
/*Line 63 - 'AtomItemsControl.js' */                            return this._value;
/*Line 64 - 'AtomItemsControl.js' */                        return null;
/*Line 65 - 'AtomItemsControl.js' */                    }
/*Line 66 - 'AtomItemsControl.js' */                    items = AtomArray.getValues(items, this._valuePath);
/*Line 67 - 'AtomItemsControl.js' */                    if (this._valueSeparator)
/*Line 68 - 'AtomItemsControl.js' */                        items = items.join(this._valueSeparator);
/*Line 69 - 'AtomItemsControl.js' */                    return items;
/*Line 70 - 'AtomItemsControl.js' */                }

/*Line 72 - 'AtomItemsControl.js' */                var s = this.get_selectedItem();
/*Line 73 - 'AtomItemsControl.js' */                if (!s) {
/*Line 74 - 'AtomItemsControl.js' */                    if (this._value !== undefined)
/*Line 75 - 'AtomItemsControl.js' */                        return this._value;
/*Line 76 - 'AtomItemsControl.js' */                    return null;
/*Line 77 - 'AtomItemsControl.js' */                }
/*Line 78 - 'AtomItemsControl.js' */                if (this._valuePath) {
/*Line 79 - 'AtomItemsControl.js' */                    s = s[this._valuePath];
/*Line 80 - 'AtomItemsControl.js' */                }
/*Line 81 - 'AtomItemsControl.js' */                return s;
/*Line 82 - 'AtomItemsControl.js' */            },
/*Line 83 - 'AtomItemsControl.js' */            set_value: function (v) {
/*Line 84 - 'AtomItemsControl.js' */                this._value = v;
/*Line 85 - 'AtomItemsControl.js' */                if (v === undefined || v === null) {
/*Line 86 - 'AtomItemsControl.js' */                    // reset...
/*Line 87 - 'AtomItemsControl.js' */                    AtomBinder.clear(this._selectedItems);
/*Line 88 - 'AtomItemsControl.js' */                    return;
/*Line 89 - 'AtomItemsControl.js' */                }
/*Line 90 - 'AtomItemsControl.js' */                var dataItems = this.get_dataItems();
/*Line 91 - 'AtomItemsControl.js' */                if (this._allowMultipleSelection && this._valueSeparator) {
/*Line 92 - 'AtomItemsControl.js' */                    if (v.constructor != String) {
/*Line 93 - 'AtomItemsControl.js' */                        v = "" + v;
/*Line 94 - 'AtomItemsControl.js' */                    }
/*Line 95 - 'AtomItemsControl.js' */                    v = AtomArray.split(v, this._valueSeparator);
/*Line 96 - 'AtomItemsControl.js' */                } else {
/*Line 97 - 'AtomItemsControl.js' */                    v = [v];
/*Line 98 - 'AtomItemsControl.js' */                }
/*Line 99 - 'AtomItemsControl.js' */                var items = AtomArray.intersect(dataItems, this._valuePath, v);
/*Line 100 - 'AtomItemsControl.js' */                this._selectedItems.length = 0;
/*Line 101 - 'AtomItemsControl.js' */                var ae = new AtomEnumerator(items);
/*Line 102 - 'AtomItemsControl.js' */                while (ae.next()) {
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
/*Line 124 - 'AtomItemsControl.js' */                this._selectAll = true;
/*Line 125 - 'AtomItemsControl.js' */                AtomBinder.refreshItems(this._selectedItems);
/*Line 126 - 'AtomItemsControl.js' */            },
/*Line 127 - 'AtomItemsControl.js' */            refresh: function () {
/*Line 128 - 'AtomItemsControl.js' */                if (this._promises && this._promises.items) {
/*Line 129 - 'AtomItemsControl.js' */                    this._promises.items.invoke();
/*Line 130 - 'AtomItemsControl.js' */                }

/*Line 132 - 'AtomItemsControl.js' */            },

/*Line 134 - 'AtomItemsControl.js' */            set_defaultValue: function (v) {
/*Line 135 - 'AtomItemsControl.js' */                if (this.get_value())
/*Line 136 - 'AtomItemsControl.js' */                    return;
/*Line 137 - 'AtomItemsControl.js' */                AtomBinder.setValue(this, "value", v);
/*Line 138 - 'AtomItemsControl.js' */            },
/*Line 139 - 'AtomItemsControl.js' */            invokePost: function () {
/*Line 140 - 'AtomItemsControl.js' */                if (!this._onUIChanged)
/*Line 141 - 'AtomItemsControl.js' */                    return;

/*Line 143 - 'AtomItemsControl.js' */                if (this._confirm) {
/*Line 144 - 'AtomItemsControl.js' */                    if (!confirm(this._confirmMessage))
/*Line 145 - 'AtomItemsControl.js' */                        return;
/*Line 146 - 'AtomItemsControl.js' */                }

/*Line 148 - 'AtomItemsControl.js' */                if (!this._postUrl) {
/*Line 149 - 'AtomItemsControl.js' */                    this.invokeAction(this._next);
/*Line 150 - 'AtomItemsControl.js' */                    return;
/*Line 151 - 'AtomItemsControl.js' */                }

/*Line 153 - 'AtomItemsControl.js' */                var data = this.get_postData();

/*Line 155 - 'AtomItemsControl.js' */                if (data === null || data === undefined)
/*Line 156 - 'AtomItemsControl.js' */                    return;

/*Line 158 - 'AtomItemsControl.js' */                data = AtomBinder.getClone(data);

/*Line 160 - 'AtomItemsControl.js' */                var caller = this;
/*Line 161 - 'AtomItemsControl.js' */                var p = AtomPromise.json(this._postUrl, null, { type: "POST", data: data });
/*Line 162 - 'AtomItemsControl.js' */                p.then(function () {
/*Line 163 - 'AtomItemsControl.js' */                    caller.invokeNext();
/*Line 164 - 'AtomItemsControl.js' */                });
/*Line 165 - 'AtomItemsControl.js' */                var errorNext = this._errorNext;
/*Line 166 - 'AtomItemsControl.js' */                if (errorNext) {
/*Line 167 - 'AtomItemsControl.js' */                    p.failed(function (pr) {
/*Line 168 - 'AtomItemsControl.js' */                        caller.invokeAction(errorNext);
/*Line 169 - 'AtomItemsControl.js' */                    });
/*Line 170 - 'AtomItemsControl.js' */                }
/*Line 171 - 'AtomItemsControl.js' */                p.invoke();
/*Line 172 - 'AtomItemsControl.js' */            },

/*Line 174 - 'AtomItemsControl.js' */            invokeNext: function () {
/*Line 175 - 'AtomItemsControl.js' */                this.invokeAction(this._next);
/*Line 176 - 'AtomItemsControl.js' */            },

/*Line 178 - 'AtomItemsControl.js' */            set_filter: function (f) {
/*Line 179 - 'AtomItemsControl.js' */                if (f == this._filter)
/*Line 180 - 'AtomItemsControl.js' */                    return;
/*Line 181 - 'AtomItemsControl.js' */                this._filter = f;
/*Line 182 - 'AtomItemsControl.js' */                this._filteredItems = null;
/*Line 183 - 'AtomItemsControl.js' */                if (this.hasItems()) {
/*Line 184 - 'AtomItemsControl.js' */                    this.onCollectionChangedInternal("refresh", -1, null);
/*Line 185 - 'AtomItemsControl.js' */                }
/*Line 186 - 'AtomItemsControl.js' */            },

/*Line 188 - 'AtomItemsControl.js' */            isSelected: function (item) {
/*Line 189 - 'AtomItemsControl.js' */                var se = new AtomEnumerator(this._selectedItems);
/*Line 190 - 'AtomItemsControl.js' */                var sitem = null;
/*Line 191 - 'AtomItemsControl.js' */                while (se.next()) {
/*Line 192 - 'AtomItemsControl.js' */                    sitem = se.current();
/*Line 193 - 'AtomItemsControl.js' */                    if (sitem == item) {
/*Line 194 - 'AtomItemsControl.js' */                        return true;
/*Line 195 - 'AtomItemsControl.js' */                    }
/*Line 196 - 'AtomItemsControl.js' */                }
/*Line 197 - 'AtomItemsControl.js' */                return false;
/*Line 198 - 'AtomItemsControl.js' */            },

/*Line 200 - 'AtomItemsControl.js' */            get_dataItems: function () {
/*Line 201 - 'AtomItemsControl.js' */                var r = this._items;
/*Line 202 - 'AtomItemsControl.js' */                if (this.hasItems()) {
/*Line 203 - 'AtomItemsControl.js' */                    var f = this._filter;
/*Line 204 - 'AtomItemsControl.js' */                    if (f) {
/*Line 205 - 'AtomItemsControl.js' */                        //if (this._filteredItems)
/*Line 206 - 'AtomItemsControl.js' */                        //    return this._filteredItems;
/*Line 207 - 'AtomItemsControl.js' */                        var a = [];
/*Line 208 - 'AtomItemsControl.js' */                        if (typeof f == 'object') {
/*Line 209 - 'AtomItemsControl.js' */                            a = Atom.query(r).where(f).toArray();
/*Line 210 - 'AtomItemsControl.js' */                        } else {
/*Line 211 - 'AtomItemsControl.js' */                            var ae = new AtomEnumerator(r);
/*Line 212 - 'AtomItemsControl.js' */                            while (ae.next()) {
/*Line 213 - 'AtomItemsControl.js' */                                var item = ae.current();
/*Line 214 - 'AtomItemsControl.js' */                                if (f(item, ae.currentIndex())) {
/*Line 215 - 'AtomItemsControl.js' */                                    a.push(item);
/*Line 216 - 'AtomItemsControl.js' */                                }
/*Line 217 - 'AtomItemsControl.js' */                            }
/*Line 218 - 'AtomItemsControl.js' */                        }
/*Line 219 - 'AtomItemsControl.js' */                        this._filteredItems = a;
/*Line 220 - 'AtomItemsControl.js' */                        r = a;
/*Line 221 - 'AtomItemsControl.js' */                    }

/*Line 223 - 'AtomItemsControl.js' */                    var sp = this._sortPath;
/*Line 224 - 'AtomItemsControl.js' */                    if (sp) {
/*Line 225 - 'AtomItemsControl.js' */                        r = r.sort(sp);
/*Line 226 - 'AtomItemsControl.js' */                    }
/*Line 227 - 'AtomItemsControl.js' */                    return r;
/*Line 228 - 'AtomItemsControl.js' */                }
/*Line 229 - 'AtomItemsControl.js' */                return $(this._itemsPresenter).children();
/*Line 230 - 'AtomItemsControl.js' */            },

/*Line 232 - 'AtomItemsControl.js' */            getIndexOfDataItem: function (item) {
/*Line 233 - 'AtomItemsControl.js' */                if (item == null)
/*Line 234 - 'AtomItemsControl.js' */                    return -1;
/*Line 235 - 'AtomItemsControl.js' */                var array = this.get_dataItems();
/*Line 236 - 'AtomItemsControl.js' */                var ae = new AtomEnumerator(array);
/*Line 237 - 'AtomItemsControl.js' */                while (ae.next()) {
/*Line 238 - 'AtomItemsControl.js' */                    if (ae.current() == item)
/*Line 239 - 'AtomItemsControl.js' */                        return ae.currentIndex();
/*Line 240 - 'AtomItemsControl.js' */                }
/*Line 241 - 'AtomItemsControl.js' */                return -1;
/*Line 242 - 'AtomItemsControl.js' */            },
/*Line 243 - 'AtomItemsControl.js' */            getDataItemAtIndex: function (index) {
/*Line 244 - 'AtomItemsControl.js' */                if (index == -1)
/*Line 245 - 'AtomItemsControl.js' */                    return null;
/*Line 246 - 'AtomItemsControl.js' */                return this.get_dataItems()[index];
/*Line 247 - 'AtomItemsControl.js' */            },

/*Line 249 - 'AtomItemsControl.js' */            get_childAtomControls: function () {
/*Line 250 - 'AtomItemsControl.js' */                var p = this._itemsPresenter || this._element;
/*Line 251 - 'AtomItemsControl.js' */                var r = [];
/*Line 252 - 'AtomItemsControl.js' */                var ce = new ChildEnumerator(p);
/*Line 253 - 'AtomItemsControl.js' */                while (ce.next()) {
/*Line 254 - 'AtomItemsControl.js' */                    var a = ce.current();
/*Line 255 - 'AtomItemsControl.js' */                    a = !a || a.atomControl;
/*Line 256 - 'AtomItemsControl.js' */                    if (!a)
/*Line 257 - 'AtomItemsControl.js' */                        continue;
/*Line 258 - 'AtomItemsControl.js' */                    r.push(a);
/*Line 259 - 'AtomItemsControl.js' */                }
/*Line 260 - 'AtomItemsControl.js' */                return r;
/*Line 261 - 'AtomItemsControl.js' */            },

/*Line 263 - 'AtomItemsControl.js' */            get_selectedChild: function () {
/*Line 264 - 'AtomItemsControl.js' */                var item = this.get_selectedItem();
/*Line 265 - 'AtomItemsControl.js' */                if (!this.hasItems())
/*Line 266 - 'AtomItemsControl.js' */                    return item;
/*Line 267 - 'AtomItemsControl.js' */                var ce = new ChildEnumerator(this._itemsPresenter);
/*Line 268 - 'AtomItemsControl.js' */                while (ce.next()) {
/*Line 269 - 'AtomItemsControl.js' */                    var child = ce.current();
/*Line 270 - 'AtomItemsControl.js' */                    if (child.atomControl.get_data() == item)
/*Line 271 - 'AtomItemsControl.js' */                        return child;
/*Line 272 - 'AtomItemsControl.js' */                }
/*Line 273 - 'AtomItemsControl.js' */                return null;
/*Line 274 - 'AtomItemsControl.js' */            },

/*Line 276 - 'AtomItemsControl.js' */            set_allowSelectFirst: function (b) {
/*Line 277 - 'AtomItemsControl.js' */                b = b ? b != "false" : b;
/*Line 278 - 'AtomItemsControl.js' */                this._allowSelectFirst = b;
/*Line 279 - 'AtomItemsControl.js' */            },

/*Line 281 - 'AtomItemsControl.js' */            get_selectedItem: function () {
/*Line 282 - 'AtomItemsControl.js' */                if (this._selectedItems.length > 0)
/*Line 283 - 'AtomItemsControl.js' */                    return this._selectedItems[0];
/*Line 284 - 'AtomItemsControl.js' */                return null;
/*Line 285 - 'AtomItemsControl.js' */            },
/*Line 286 - 'AtomItemsControl.js' */            set_selectedItem: function (value) {
/*Line 287 - 'AtomItemsControl.js' */                if (value) {
/*Line 288 - 'AtomItemsControl.js' */                    this._selectedItems.length = 1;
/*Line 289 - 'AtomItemsControl.js' */                    this._selectedItems[0] = value;
/*Line 290 - 'AtomItemsControl.js' */                } else {
/*Line 291 - 'AtomItemsControl.js' */                    this._selectedItems.length = 0;
/*Line 292 - 'AtomItemsControl.js' */                }
/*Line 293 - 'AtomItemsControl.js' */                AtomBinder.refreshItems(this._selectedItems);
/*Line 294 - 'AtomItemsControl.js' */            },

/*Line 296 - 'AtomItemsControl.js' */            get_selectedItems: function () {
/*Line 297 - 'AtomItemsControl.js' */                return this._selectedItems;
/*Line 298 - 'AtomItemsControl.js' */            },
/*Line 299 - 'AtomItemsControl.js' */            set_selectedItems: function () {
/*Line 300 - 'AtomItemsControl.js' */                // watching !!!
/*Line 301 - 'AtomItemsControl.js' */                // updating !!!
/*Line 302 - 'AtomItemsControl.js' */                throw new Error("Not yet implemented");
/*Line 303 - 'AtomItemsControl.js' */            },

/*Line 305 - 'AtomItemsControl.js' */            get_selectedIndex: function () {
/*Line 306 - 'AtomItemsControl.js' */                var item = this.get_selectedItem();
/*Line 307 - 'AtomItemsControl.js' */                return this.getIndexOfDataItem(item);
/*Line 308 - 'AtomItemsControl.js' */            },
/*Line 309 - 'AtomItemsControl.js' */            set_selectedIndex: function (value) {
/*Line 310 - 'AtomItemsControl.js' */                AtomBinder.setValue(this, "selectedItem", this.getDataItemAtIndex(value));
/*Line 311 - 'AtomItemsControl.js' */            },

/*Line 313 - 'AtomItemsControl.js' */            updateChildSelections: function (type, index, item) {

/*Line 315 - 'AtomItemsControl.js' */            },

/*Line 317 - 'AtomItemsControl.js' */            bringSelectionIntoView: function () {

/*Line 319 - 'AtomItemsControl.js' */                // do not scroll for first auto select 
/*Line 320 - 'AtomItemsControl.js' */                if (this._allowSelectFirst && this.get_selectedIndex() == 0)
/*Line 321 - 'AtomItemsControl.js' */                    return;

/*Line 323 - 'AtomItemsControl.js' */                //var children = $(this._itemsPresenter).children();
/*Line 324 - 'AtomItemsControl.js' */                var ae = new ChildEnumerator(this._itemsPresenter);
/*Line 325 - 'AtomItemsControl.js' */                while (ae.next()) {
/*Line 326 - 'AtomItemsControl.js' */                    var item = ae.current();
/*Line 327 - 'AtomItemsControl.js' */                    var dataItem = item.atomControl ? item.atomControl.get_data() : item;
/*Line 328 - 'AtomItemsControl.js' */                    if (this.isSelected(dataItem)) {
/*Line 329 - 'AtomItemsControl.js' */                        item.scrollIntoView();
/*Line 330 - 'AtomItemsControl.js' */                        return;
/*Line 331 - 'AtomItemsControl.js' */                    }
/*Line 332 - 'AtomItemsControl.js' */                }
/*Line 333 - 'AtomItemsControl.js' */            },

/*Line 335 - 'AtomItemsControl.js' */            updateSelectionBindings: function () {
/*Line 336 - 'AtomItemsControl.js' */                AtomBinder.refreshValue(this, "value");
/*Line 337 - 'AtomItemsControl.js' */                AtomBinder.refreshValue(this, "selectedItem");
/*Line 338 - 'AtomItemsControl.js' */                AtomBinder.refreshValue(this, "selectedItems");
/*Line 339 - 'AtomItemsControl.js' */                AtomBinder.refreshValue(this, "selectedIndex");
/*Line 340 - 'AtomItemsControl.js' */                if (!this._selectedItems.length) {
/*Line 341 - 'AtomItemsControl.js' */                    if (this._selectAll === true) {
/*Line 342 - 'AtomItemsControl.js' */                        this._selectAll = false;
/*Line 343 - 'AtomItemsControl.js' */                        AtomBinder.refreshValue(this, "selectAll");
/*Line 344 - 'AtomItemsControl.js' */                    }
/*Line 345 - 'AtomItemsControl.js' */                }
/*Line 346 - 'AtomItemsControl.js' */            },

/*Line 348 - 'AtomItemsControl.js' */            onSelectedItemsChanged: function (type, index, item) {
/*Line 349 - 'AtomItemsControl.js' */                if (!this._onUIChanged) {
/*Line 350 - 'AtomItemsControl.js' */                    this.updateChildSelections(type, index, item);
/*Line 351 - 'AtomItemsControl.js' */                    if (this._autoScrollToSelection) {
/*Line 352 - 'AtomItemsControl.js' */                        this.bringSelectionIntoView();
/*Line 353 - 'AtomItemsControl.js' */                    }
/*Line 354 - 'AtomItemsControl.js' */                }
/*Line 355 - 'AtomItemsControl.js' */                this.updateSelectionBindings();
/*Line 356 - 'AtomItemsControl.js' */                this.updateUI();

/*Line 358 - 'AtomItemsControl.js' */                this.invokePost();
/*Line 359 - 'AtomItemsControl.js' */            },


/*Line 362 - 'AtomItemsControl.js' */            hasItems: function () {
/*Line 363 - 'AtomItemsControl.js' */                return this._items != undefined && this._items != null;
/*Line 364 - 'AtomItemsControl.js' */            },

/*Line 366 - 'AtomItemsControl.js' */            get_items: function () {
/*Line 367 - 'AtomItemsControl.js' */                return this._items;
/*Line 368 - 'AtomItemsControl.js' */            },
/*Line 369 - 'AtomItemsControl.js' */            set_items: function (v) {
/*Line 370 - 'AtomItemsControl.js' */                var _this = this;
/*Line 371 - 'AtomItemsControl.js' */                if (this._items) {
/*Line 372 - 'AtomItemsControl.js' */                    this.unbindEvent(this._items, "CollectionChanged", null);
/*Line 373 - 'AtomItemsControl.js' */                }
/*Line 374 - 'AtomItemsControl.js' */                this._items = v;
/*Line 375 - 'AtomItemsControl.js' */                this._filteredItems = null;
/*Line 376 - 'AtomItemsControl.js' */                // try starting observing....
/*Line 377 - 'AtomItemsControl.js' */                if (v != null) {
/*Line 378 - 'AtomItemsControl.js' */                    this.bindEvent(this._items, "CollectionChanged", function () {
/*Line 379 - 'AtomItemsControl.js' */                        _this.onCollectionChangedInternal.apply(_this, arguments);
/*Line 380 - 'AtomItemsControl.js' */                    });
/*Line 381 - 'AtomItemsControl.js' */                    this.onCollectionChangedInternal("refresh", -1, null);
/*Line 382 - 'AtomItemsControl.js' */                }
/*Line 383 - 'AtomItemsControl.js' */            },
/*Line 384 - 'AtomItemsControl.js' */            set_itemTemplate: function (v) {
/*Line 385 - 'AtomItemsControl.js' */                this._itemTemplate = v;
/*Line 386 - 'AtomItemsControl.js' */                this.onCollectionChangedInternal("refresh", -1, null);
/*Line 387 - 'AtomItemsControl.js' */            },

/*Line 389 - 'AtomItemsControl.js' */            onCollectionChangedInternal: function (mode, index, item) {
/*Line 390 - 'AtomItemsControl.js' */                if (!this._created)
/*Line 391 - 'AtomItemsControl.js' */                    return;

/*Line 393 - 'AtomItemsControl.js' */                Atom.refresh(this, "allValues");

/*Line 395 - 'AtomItemsControl.js' */                var value = this.get_value();

/*Line 397 - 'AtomItemsControl.js' */                if (this.hasItems()) {
/*Line 398 - 'AtomItemsControl.js' */                    this.onCollectionChanged(mode, index, item);
/*Line 399 - 'AtomItemsControl.js' */                    //this._selectedItems.length = 0;
/*Line 400 - 'AtomItemsControl.js' */                    if (!(value || this._allowSelectFirst)) {
/*Line 401 - 'AtomItemsControl.js' */                        AtomBinder.clear(this._selectedItems);
/*Line 402 - 'AtomItemsControl.js' */                    }
/*Line 403 - 'AtomItemsControl.js' */                }


/*Line 406 - 'AtomItemsControl.js' */                if (value != null) {
/*Line 407 - 'AtomItemsControl.js' */                    this.set_value(value);
/*Line 408 - 'AtomItemsControl.js' */                    if (this.get_selectedIndex() != -1) {
/*Line 409 - 'AtomItemsControl.js' */                        return;
/*Line 410 - 'AtomItemsControl.js' */                    } else {
/*Line 411 - 'AtomItemsControl.js' */                        this._value = undefined;
/*Line 412 - 'AtomItemsControl.js' */                    }
/*Line 413 - 'AtomItemsControl.js' */                }

/*Line 415 - 'AtomItemsControl.js' */                this.selectDefault();

/*Line 417 - 'AtomItemsControl.js' */            },

/*Line 419 - 'AtomItemsControl.js' */            selectDefault: function () {


/*Line 422 - 'AtomItemsControl.js' */                if (this._allowSelectFirst) {
/*Line 423 - 'AtomItemsControl.js' */                    if (this.get_dataItems().length > 0) {
/*Line 424 - 'AtomItemsControl.js' */                        this.set_selectedIndex(0);
/*Line 425 - 'AtomItemsControl.js' */                        return;
/*Line 426 - 'AtomItemsControl.js' */                    }
/*Line 427 - 'AtomItemsControl.js' */                }

/*Line 429 - 'AtomItemsControl.js' */                this.updateSelectionBindings();
/*Line 430 - 'AtomItemsControl.js' */            },

/*Line 432 - 'AtomItemsControl.js' */            onScroll: function () {
/*Line 433 - 'AtomItemsControl.js' */                if (this.scrollTimeout) {
/*Line 434 - 'AtomItemsControl.js' */                    clearTimeout(this.scrollTimeout);
/*Line 435 - 'AtomItemsControl.js' */                }
/*Line 436 - 'AtomItemsControl.js' */                var _this = this;
/*Line 437 - 'AtomItemsControl.js' */                this.scrollTimeout = setTimeout(function () {
/*Line 438 - 'AtomItemsControl.js' */                    _this.scrollTimeout = 0;
/*Line 439 - 'AtomItemsControl.js' */                    _this.onVirtualCollectionChanged();
/*Line 440 - 'AtomItemsControl.js' */                }, 10);
/*Line 441 - 'AtomItemsControl.js' */            },

/*Line 443 - 'AtomItemsControl.js' */            onVirtualCollectionChanged: function () {
/*Line 444 - 'AtomItemsControl.js' */                var element = this._itemsPresenter;
/*Line 445 - 'AtomItemsControl.js' */                var items = this.get_dataItems(true);

/*Line 447 - 'AtomItemsControl.js' */                var parentScope = this.get_scope();

/*Line 449 - 'AtomItemsControl.js' */                var et = this.getTemplate("itemTemplate");
/*Line 450 - 'AtomItemsControl.js' */                if (et) {
/*Line 451 - 'AtomItemsControl.js' */                    et = AtomUI.getAtomType(et);
/*Line 452 - 'AtomItemsControl.js' */                    if (et) {
/*Line 453 - 'AtomItemsControl.js' */                        this._childItemType = et;
/*Line 454 - 'AtomItemsControl.js' */                    }
/*Line 455 - 'AtomItemsControl.js' */                }

/*Line 457 - 'AtomItemsControl.js' */                var ae = new AtomEnumerator(items);
/*Line 458 - 'AtomItemsControl.js' */                WebAtoms.dispatcher.pause();

/*Line 460 - 'AtomItemsControl.js' */                if (this._itemsPresenter == this._element) {
/*Line 461 - 'AtomItemsControl.js' */                    var d = document.createElement("DIV");
/*Line 462 - 'AtomItemsControl.js' */                    var $d = $(d);
/*Line 463 - 'AtomItemsControl.js' */                    $d.addClass("atom-virtual-container");
/*Line 464 - 'AtomItemsControl.js' */                    //$d.css("width", $(this._itemsPresenter).innerWidth());
/*Line 465 - 'AtomItemsControl.js' */                    $d.css({posiiton:"absolute",width: "100%", height:"100%"});
/*Line 466 - 'AtomItemsControl.js' */                    this._element.innerHTML = "";
/*Line 467 - 'AtomItemsControl.js' */                    this._element.appendChild(d);
/*Line 468 - 'AtomItemsControl.js' */                    this._itemsPresenter = d;
/*Line 469 - 'AtomItemsControl.js' */                    element = this._itemsPresenter;
/*Line 470 - 'AtomItemsControl.js' */                }

/*Line 472 - 'AtomItemsControl.js' */                var cache = this._cachedItems;
/*Line 473 - 'AtomItemsControl.js' */                if (!cache) {
/*Line 474 - 'AtomItemsControl.js' */                    cache = {};
/*Line 475 - 'AtomItemsControl.js' */                    this.disposeChildren(element);
/*Line 476 - 'AtomItemsControl.js' */                }
/*Line 477 - 'AtomItemsControl.js' */                this._cachedItems = cache;

/*Line 479 - 'AtomItemsControl.js' */                //this.disposeChildren(element);

/*Line 481 - 'AtomItemsControl.js' */                if (!items.length) {
/*Line 482 - 'AtomItemsControl.js' */                    WebAtoms.dispatcher.start();

/*Line 484 - 'AtomItemsControl.js' */                    AtomBinder.refreshValue(this, "childAtomControls");
/*Line 485 - 'AtomItemsControl.js' */                    return;
/*Line 486 - 'AtomItemsControl.js' */                }

/*Line 488 - 'AtomItemsControl.js' */                var scroller = this._itemsPresenter.parentElement;
/*Line 489 - 'AtomItemsControl.js' */                var $scroller = $(scroller);
/*Line 490 - 'AtomItemsControl.js' */                $scroller.css("overflow", "auto");

/*Line 492 - 'AtomItemsControl.js' */                $(element).css("position", "relative");

/*Line 494 - 'AtomItemsControl.js' */                var scrollerWidth = $scroller.width();
/*Line 495 - 'AtomItemsControl.js' */                var scrollerHeight = $scroller.height();



/*Line 499 - 'AtomItemsControl.js' */                this.unbindEvent(scroller, "scroll");

/*Line 501 - 'AtomItemsControl.js' */                var n = items.length;
/*Line 502 - 'AtomItemsControl.js' */                var presenterWidth = $(this._itemsPresenter).innerWidth();



/*Line 506 - 'AtomItemsControl.js' */                var t = this.getTemplate("itemTemplate");
/*Line 507 - 'AtomItemsControl.js' */                var $t = $(t);
/*Line 508 - 'AtomItemsControl.js' */                var h = $t.outerHeight(true);
/*Line 509 - 'AtomItemsControl.js' */                var w = $t.outerWidth(true);

/*Line 511 - 'AtomItemsControl.js' */                if (!(h || w)) {
/*Line 512 - 'AtomItemsControl.js' */                    throw new Error("Either width or height must be explicitly specified for virtualization");
/*Line 513 - 'AtomItemsControl.js' */                }

/*Line 515 - 'AtomItemsControl.js' */                var cols = 1;
/*Line 516 - 'AtomItemsControl.js' */                var rows = 1;

/*Line 518 - 'AtomItemsControl.js' */                if (h > 0) {
/*Line 519 - 'AtomItemsControl.js' */                    if (w > 0) {
/*Line 520 - 'AtomItemsControl.js' */                        // wrap...
/*Line 521 - 'AtomItemsControl.js' */                        if (presenterWidth <= 0) {
/*Line 522 - 'AtomItemsControl.js' */                            if (console) {
/*Line 523 - 'AtomItemsControl.js' */                                console.warn("presenterWidth is 0, you may need to stretch width", this);
/*Line 524 - 'AtomItemsControl.js' */                            }
/*Line 525 - 'AtomItemsControl.js' */                        }
/*Line 526 - 'AtomItemsControl.js' */                        cols = Math.ceil(presenterWidth / w) || 1;
/*Line 527 - 'AtomItemsControl.js' */                        rows = Math.ceil(n / cols) || 1;
/*Line 528 - 'AtomItemsControl.js' */                        $scroller.css("overflow-x", "hidden");
/*Line 529 - 'AtomItemsControl.js' */                    } else {
/*Line 530 - 'AtomItemsControl.js' */                        if (!scrollerHeight)
/*Line 531 - 'AtomItemsControl.js' */                            throw new Error("Height must be explicitly specified for wrapping container");
/*Line 532 - 'AtomItemsControl.js' */                        rows = n;
/*Line 533 - 'AtomItemsControl.js' */                        $scroller.css("overflow-y", "auto");
/*Line 534 - 'AtomItemsControl.js' */                        $scroller.css("overflow-x", "hidden");

/*Line 536 - 'AtomItemsControl.js' */                    }
/*Line 537 - 'AtomItemsControl.js' */                } else {

/*Line 539 - 'AtomItemsControl.js' */                }

/*Line 541 - 'AtomItemsControl.js' */                if (h > 0) {
/*Line 542 - 'AtomItemsControl.js' */                    $(this._itemsPresenter).height(rows * h);
/*Line 543 - 'AtomItemsControl.js' */                } else {
/*Line 544 - 'AtomItemsControl.js' */                    $(this._itemsPresenter).width(cols * w);
/*Line 545 - 'AtomItemsControl.js' */                }

/*Line 547 - 'AtomItemsControl.js' */                var visibleX = Math.floor(scroller.scrollLeft / (w || 1));
/*Line 548 - 'AtomItemsControl.js' */                var visibleY = Math.floor(scroller.scrollTop / (h || 1));
/*Line 549 - 'AtomItemsControl.js' */                var widthX = (( Math.floor( scroller.offsetWidth / (w || 1))) -1) || 1;
/*Line 550 - 'AtomItemsControl.js' */                var heightX = scroller.offsetHeight / (h || 1);


/*Line 553 - 'AtomItemsControl.js' */                var removed = [];

/*Line 555 - 'AtomItemsControl.js' */                while (ae.next()) {

/*Line 557 - 'AtomItemsControl.js' */                    var index = ae.currentIndex();
/*Line 558 - 'AtomItemsControl.js' */                    var yindex = Math.floor(index / cols);
/*Line 559 - 'AtomItemsControl.js' */                    var xindex = index % cols;

/*Line 561 - 'AtomItemsControl.js' */                    var elementChild = cache[index];

/*Line 563 - 'AtomItemsControl.js' */                    if (xindex < visibleX || xindex > visibleX + widthX) {
/*Line 564 - 'AtomItemsControl.js' */                        if (elementChild) {
/*Line 565 - 'AtomItemsControl.js' */                            cache[index] = null;
/*Line 566 - 'AtomItemsControl.js' */                            removed.push(elementChild);
/*Line 567 - 'AtomItemsControl.js' */                        }
/*Line 568 - 'AtomItemsControl.js' */                        continue;
/*Line 569 - 'AtomItemsControl.js' */                    }
/*Line 570 - 'AtomItemsControl.js' */                    if (yindex < visibleY || yindex > visibleY + heightX) {
/*Line 571 - 'AtomItemsControl.js' */                        if (elementChild) {
/*Line 572 - 'AtomItemsControl.js' */                            cache[index] = null;
/*Line 573 - 'AtomItemsControl.js' */                            removed.push(elementChild);
/*Line 574 - 'AtomItemsControl.js' */                        }
/*Line 575 - 'AtomItemsControl.js' */                        continue;
/*Line 576 - 'AtomItemsControl.js' */                    }

/*Line 578 - 'AtomItemsControl.js' */                    if (elementChild) {
/*Line 579 - 'AtomItemsControl.js' */                        continue;
/*Line 580 - 'AtomItemsControl.js' */                    }

/*Line 582 - 'AtomItemsControl.js' */                    var data = ae.current();
/*Line 583 - 'AtomItemsControl.js' */                    elementChild = this.createChildElement(parentScope, element, data, ae);
/*Line 584 - 'AtomItemsControl.js' */                    cache[index] = elementChild;
/*Line 585 - 'AtomItemsControl.js' */                    var $ec = $(elementChild);
/*Line 586 - 'AtomItemsControl.js' */                    $ec.css("position", "absolute");
/*Line 587 - 'AtomItemsControl.js' */                    if (w > 0) {
/*Line 588 - 'AtomItemsControl.js' */                        $ec.css("width", w + "px");
/*Line 589 - 'AtomItemsControl.js' */                        $ec.css("left", (xindex * w) + "px");
/*Line 590 - 'AtomItemsControl.js' */                    }
/*Line 591 - 'AtomItemsControl.js' */                    if (h > 0) {
/*Line 592 - 'AtomItemsControl.js' */                        $ec.css("top", (yindex * h) + "px");
/*Line 593 - 'AtomItemsControl.js' */                    }

/*Line 595 - 'AtomItemsControl.js' */                    this.applyItemStyle(elementChild, data, ae.isFirst(), ae.isLast());

/*Line 597 - 'AtomItemsControl.js' */                }

/*Line 599 - 'AtomItemsControl.js' */                var _this = this;
/*Line 600 - 'AtomItemsControl.js' */                this.bindEvent(scroller, "scroll", function () {
/*Line 601 - 'AtomItemsControl.js' */                    _this.onScroll();
/*Line 602 - 'AtomItemsControl.js' */                });

/*Line 604 - 'AtomItemsControl.js' */                WebAtoms.dispatcher.start();

/*Line 606 - 'AtomItemsControl.js' */                ae = new AtomEnumerator(removed);
/*Line 607 - 'AtomItemsControl.js' */                while (ae.next()) {
/*Line 608 - 'AtomItemsControl.js' */                    var item = ae.current();
/*Line 609 - 'AtomItemsControl.js' */                    item.atomControl.dispose();
/*Line 610 - 'AtomItemsControl.js' */                    $(item).remove();
/*Line 611 - 'AtomItemsControl.js' */                }

/*Line 613 - 'AtomItemsControl.js' */                AtomBinder.refreshValue(this, "childAtomControls");
/*Line 614 - 'AtomItemsControl.js' */            },

/*Line 616 - 'AtomItemsControl.js' */            onCollectionChanged: function (mode, index, item) {

/*Line 618 - 'AtomItemsControl.js' */                if (/reset|refresh/i.test(mode)) {
/*Line 619 - 'AtomItemsControl.js' */                    this._scopes = {};
/*Line 620 - 'AtomItemsControl.js' */                    this._cachedItems = null;
/*Line 621 - 'AtomItemsControl.js' */                }

/*Line 623 - 'AtomItemsControl.js' */                if (this._uiVirtualize) {
/*Line 624 - 'AtomItemsControl.js' */                    this.onVirtualCollectionChanged();
/*Line 625 - 'AtomItemsControl.js' */                    return;
/*Line 626 - 'AtomItemsControl.js' */                }

/*Line 628 - 'AtomItemsControl.js' */                // just reset for now...
/*Line 629 - 'AtomItemsControl.js' */                if (/remove/gi.test(mode)) {
/*Line 630 - 'AtomItemsControl.js' */                    // simply delete and remove...
/*Line 631 - 'AtomItemsControl.js' */                    var ce = new ChildEnumerator(this._itemsPresenter);
/*Line 632 - 'AtomItemsControl.js' */                    while (ce.next()) {
/*Line 633 - 'AtomItemsControl.js' */                        var c = ce.current();
/*Line 634 - 'AtomItemsControl.js' */                        if (c.atomControl && c.atomControl.get_data() == item) {
/*Line 635 - 'AtomItemsControl.js' */                            c.atomControl.dispose();
/*Line 636 - 'AtomItemsControl.js' */                            $(c).remove();
/*Line 637 - 'AtomItemsControl.js' */                            break;
/*Line 638 - 'AtomItemsControl.js' */                        }
/*Line 639 - 'AtomItemsControl.js' */                    }
/*Line 640 - 'AtomItemsControl.js' */                    this.updateUI();
/*Line 641 - 'AtomItemsControl.js' */                    return;
/*Line 642 - 'AtomItemsControl.js' */                }

/*Line 644 - 'AtomItemsControl.js' */                var parentScope = this.get_scope();

/*Line 646 - 'AtomItemsControl.js' */                var et = this.getTemplate("itemTemplate");
/*Line 647 - 'AtomItemsControl.js' */                if (et) {
/*Line 648 - 'AtomItemsControl.js' */                    et = AtomUI.getAtomType(et);
/*Line 649 - 'AtomItemsControl.js' */                    if (et) {
/*Line 650 - 'AtomItemsControl.js' */                        this._childItemType = et;
/*Line 651 - 'AtomItemsControl.js' */                    }
/*Line 652 - 'AtomItemsControl.js' */                }

/*Line 654 - 'AtomItemsControl.js' */                if (/add/gi.test(mode)) {
/*Line 655 - 'AtomItemsControl.js' */                    WebAtoms.dispatcher.pause();

/*Line 657 - 'AtomItemsControl.js' */                    var ae = new AtomEnumerator(this._items);
/*Line 658 - 'AtomItemsControl.js' */                    var ce = new ChildEnumerator(this._itemsPresenter);
/*Line 659 - 'AtomItemsControl.js' */                    while (ae.next()) {
/*Line 660 - 'AtomItemsControl.js' */                        ce.next();
/*Line 661 - 'AtomItemsControl.js' */                        var c = ce.current();
/*Line 662 - 'AtomItemsControl.js' */                        if (ae.currentIndex() == index) {
/*Line 663 - 'AtomItemsControl.js' */                            var ctrl = this.createChildElement(parentScope, this._itemsPresenter, item, ae, c);
/*Line 664 - 'AtomItemsControl.js' */                            this.applyItemStyle(ctrl, item, ae.isFirst(), ae.isLast());
/*Line 665 - 'AtomItemsControl.js' */                            break;
/*Line 666 - 'AtomItemsControl.js' */                        }
/*Line 667 - 'AtomItemsControl.js' */                        if (ae.isLast()) {
/*Line 668 - 'AtomItemsControl.js' */                            var ctrl = this.createChildElement(parentScope, this._itemsPresenter, item, ae);
/*Line 669 - 'AtomItemsControl.js' */                            this.applyItemStyle(ctrl, item, ae.isFirst(), ae.isLast());
/*Line 670 - 'AtomItemsControl.js' */                            break;
/*Line 671 - 'AtomItemsControl.js' */                        }
/*Line 672 - 'AtomItemsControl.js' */                    }

/*Line 674 - 'AtomItemsControl.js' */                    WebAtoms.dispatcher.start();
/*Line 675 - 'AtomItemsControl.js' */                    this.updateUI();
/*Line 676 - 'AtomItemsControl.js' */                    return;
/*Line 677 - 'AtomItemsControl.js' */                }

/*Line 679 - 'AtomItemsControl.js' */                var element = this._itemsPresenter;

/*Line 681 - 'AtomItemsControl.js' */                var dataItems = this.get_dataItems();


/*Line 684 - 'AtomItemsControl.js' */                //AtomUI.removeAllChildren(element);
/*Line 685 - 'AtomItemsControl.js' */                this.disposeChildren(element);
/*Line 686 - 'AtomItemsControl.js' */                //this._dataElements.length = 0;
/*Line 687 - 'AtomItemsControl.js' */                // rebuild from template...

/*Line 689 - 'AtomItemsControl.js' */                WebAtoms.dispatcher.pause();

/*Line 691 - 'AtomItemsControl.js' */                // implement stock...


/*Line 694 - 'AtomItemsControl.js' */                var items = this.get_dataItems(true);

/*Line 696 - 'AtomItemsControl.js' */                var added = [];

/*Line 698 - 'AtomItemsControl.js' */                var ae = new AtomEnumerator(items);


/*Line 701 - 'AtomItemsControl.js' */                    this.getTemplate("itemTemplate");

/*Line 703 - 'AtomItemsControl.js' */                    while (ae.next()) {
/*Line 704 - 'AtomItemsControl.js' */                        var data = ae.current();
/*Line 705 - 'AtomItemsControl.js' */                        var elementChild = this.createChildElement(parentScope, element, data, ae);
/*Line 706 - 'AtomItemsControl.js' */                        added.push(elementChild);
/*Line 707 - 'AtomItemsControl.js' */                        this.applyItemStyle(elementChild, data, ae.isFirst(), ae.isLast());
/*Line 708 - 'AtomItemsControl.js' */                    }


/*Line 711 - 'AtomItemsControl.js' */                    //var ae = new AtomEnumerator(items);
/*Line 712 - 'AtomItemsControl.js' */                    //while (ae.next()) {
/*Line 713 - 'AtomItemsControl.js' */                    //    var data = ae.current();
/*Line 714 - 'AtomItemsControl.js' */                    //    var elementChild = this.createChildElement(parentScope, element, data, ae);
/*Line 715 - 'AtomItemsControl.js' */                    //    this.applyItemStyle(elementChild, data, ae.isFirst(), ae.isLast());
/*Line 716 - 'AtomItemsControl.js' */                    //}
/*Line 717 - 'AtomItemsControl.js' */                    var self = this;
/*Line 718 - 'AtomItemsControl.js' */                    WebAtoms.dispatcher.callLater(function () {
/*Line 719 - 'AtomItemsControl.js' */                        var dirty = [];
/*Line 720 - 'AtomItemsControl.js' */                        var ce = new ChildEnumerator(element);
/*Line 721 - 'AtomItemsControl.js' */                        while (ce.next()) {
/*Line 722 - 'AtomItemsControl.js' */                            var item = ce.current();
/*Line 723 - 'AtomItemsControl.js' */                            var f = added.filter(function (fx) { return item == fx; });
/*Line 724 - 'AtomItemsControl.js' */                            if (f.pop() != item) {
/*Line 725 - 'AtomItemsControl.js' */                                dirty.push(item);
/*Line 726 - 'AtomItemsControl.js' */                            }
/*Line 727 - 'AtomItemsControl.js' */                        }
/*Line 728 - 'AtomItemsControl.js' */                        ce = new AtomEnumerator(dirty);
/*Line 729 - 'AtomItemsControl.js' */                        while (ce.next()) {
/*Line 730 - 'AtomItemsControl.js' */                            var item = ce.current();
/*Line 731 - 'AtomItemsControl.js' */                            //self.dispose(item);
/*Line 732 - 'AtomItemsControl.js' */                            if (item.atomControl) {
/*Line 733 - 'AtomItemsControl.js' */                                item.atomControl.dispose();
/*Line 734 - 'AtomItemsControl.js' */                            }
/*Line 735 - 'AtomItemsControl.js' */                            $(item).remove();
/*Line 736 - 'AtomItemsControl.js' */                        }

/*Line 738 - 'AtomItemsControl.js' */                    });

                

/*Line 742 - 'AtomItemsControl.js' */                WebAtoms.dispatcher.start();

/*Line 744 - 'AtomItemsControl.js' */                AtomBinder.refreshValue(this, "childAtomControls");


/*Line 747 - 'AtomItemsControl.js' */            },

/*Line 749 - 'AtomItemsControl.js' */            set_innerTemplate: function (v) {
/*Line 750 - 'AtomItemsControl.js' */                this._itemsPresenter = this._element;
/*Line 751 - 'AtomItemsControl.js' */                base.set_innerTemplate.apply(this, arguments);
/*Line 752 - 'AtomItemsControl.js' */                this.onCollectionChangedInternal("mode", -1, null);
/*Line 753 - 'AtomItemsControl.js' */            },

/*Line 755 - 'AtomItemsControl.js' */            applyItemStyle: function (item, dataItem, first, last) {
/*Line 756 - 'AtomItemsControl.js' */            },

/*Line 758 - 'AtomItemsControl.js' */            createChildElement: function (parentScope, parentElement, data, ae, before) {

/*Line 760 - 'AtomItemsControl.js' */                var elementChild = AtomUI.cloneNode(this._itemTemplate);
/*Line 761 - 'AtomItemsControl.js' */                elementChild._logicalParent = parentElement;
/*Line 762 - 'AtomItemsControl.js' */                elementChild._templateParent = this;
/*Line 763 - 'AtomItemsControl.js' */                elementChild._isDirty = true;

/*Line 765 - 'AtomItemsControl.js' */                WebAtoms.dispatcher.callLater(function () {
/*Line 766 - 'AtomItemsControl.js' */                    if (before) {
/*Line 767 - 'AtomItemsControl.js' */                        parentElement.insertBefore(elementChild, before);
/*Line 768 - 'AtomItemsControl.js' */                    } else {
/*Line 769 - 'AtomItemsControl.js' */                        parentElement.appendChild(elementChild);
/*Line 770 - 'AtomItemsControl.js' */                    }
/*Line 771 - 'AtomItemsControl.js' */                });

/*Line 773 - 'AtomItemsControl.js' */                var scopes = this._scopes || {};
/*Line 774 - 'AtomItemsControl.js' */                this._scopes = scopes;

/*Line 776 - 'AtomItemsControl.js' */                var scope = scopes[ae.currentIndex()] || new AtomScope(this, parentScope, parentScope.__application);
/*Line 777 - 'AtomItemsControl.js' */                scopes[ae.currentIndex()] = scope;
/*Line 778 - 'AtomItemsControl.js' */                if (ae) {
/*Line 779 - 'AtomItemsControl.js' */                    scope.itemIsFirst = ae.isFirst();
/*Line 780 - 'AtomItemsControl.js' */                    scope.itemIsLast = ae.isLast();
/*Line 781 - 'AtomItemsControl.js' */                    scope.itemIndex = ae.currentIndex();
/*Line 782 - 'AtomItemsControl.js' */                    scope.itemExpanded = false;
/*Line 783 - 'AtomItemsControl.js' */                    scope.data = data;
/*Line 784 - 'AtomItemsControl.js' */                    scope.get_itemSelected = function () {
/*Line 785 - 'AtomItemsControl.js' */                        return scope.owner.isSelected(data);
/*Line 786 - 'AtomItemsControl.js' */                    };
/*Line 787 - 'AtomItemsControl.js' */                    scope.set_itemSelected = function (v) {
/*Line 788 - 'AtomItemsControl.js' */                        scope.owner.toggleSelection(data, true);
/*Line 789 - 'AtomItemsControl.js' */                    };
/*Line 790 - 'AtomItemsControl.js' */                }

/*Line 792 - 'AtomItemsControl.js' */                var ac = AtomUI.createControl(elementChild, this._childItemType, data, scope);
/*Line 793 - 'AtomItemsControl.js' */                return elementChild;
/*Line 794 - 'AtomItemsControl.js' */            },

/*Line 796 - 'AtomItemsControl.js' */            toggleSelection: function (data) {
/*Line 797 - 'AtomItemsControl.js' */                this._onUIChanged = true;
/*Line 798 - 'AtomItemsControl.js' */                this._value = undefined;
/*Line 799 - 'AtomItemsControl.js' */                if (this._allowMultipleSelection) {
/*Line 800 - 'AtomItemsControl.js' */                    if (AtomUI.contains(this._selectedItems, data)) {
/*Line 801 - 'AtomItemsControl.js' */                        AtomBinder.removeItem(this._selectedItems, data);
/*Line 802 - 'AtomItemsControl.js' */                    } else {
/*Line 803 - 'AtomItemsControl.js' */                        AtomBinder.addItem(this._selectedItems, data);
/*Line 804 - 'AtomItemsControl.js' */                    }
/*Line 805 - 'AtomItemsControl.js' */                } else {
/*Line 806 - 'AtomItemsControl.js' */                    this._selectedItems.length = 1;
/*Line 807 - 'AtomItemsControl.js' */                    this._selectedItems[0] = data;
/*Line 808 - 'AtomItemsControl.js' */                    AtomBinder.refreshItems(this._selectedItems);
/*Line 809 - 'AtomItemsControl.js' */                }
/*Line 810 - 'AtomItemsControl.js' */                this._onUIChanged = false;
/*Line 811 - 'AtomItemsControl.js' */            },

/*Line 813 - 'AtomItemsControl.js' */            onUpdateUI: function () {
/*Line 814 - 'AtomItemsControl.js' */                base.onUpdateUI.call(this);

/*Line 816 - 'AtomItemsControl.js' */                if (this._uiVirtualize) {
/*Line 817 - 'AtomItemsControl.js' */                    this.onVirtualCollectionChanged();
/*Line 818 - 'AtomItemsControl.js' */                }

/*Line 820 - 'AtomItemsControl.js' */                var ae = new ChildEnumerator(this._itemsPresenter);
/*Line 821 - 'AtomItemsControl.js' */                while (ae.next()) {
/*Line 822 - 'AtomItemsControl.js' */                    var item = ae.current();
/*Line 823 - 'AtomItemsControl.js' */                    if (!item.atomControl)
/*Line 824 - 'AtomItemsControl.js' */                        continue;
/*Line 825 - 'AtomItemsControl.js' */                    var dataItem = item.atomControl.get_data();
/*Line 826 - 'AtomItemsControl.js' */                    AtomBinder.refreshValue(item.atomControl.get_scope(), "itemSelected");
/*Line 827 - 'AtomItemsControl.js' */                    this.applyItemStyle(item, dataItem, ae.isFirst(), ae.isLast());
/*Line 828 - 'AtomItemsControl.js' */                }
/*Line 829 - 'AtomItemsControl.js' */            },

/*Line 831 - 'AtomItemsControl.js' */            onCreated: function () {


/*Line 834 - 'AtomItemsControl.js' */                if (this._items) {
/*Line 835 - 'AtomItemsControl.js' */                    this.onCollectionChangedInternal("refresh", -1, null);
/*Line 836 - 'AtomItemsControl.js' */                }

/*Line 838 - 'AtomItemsControl.js' */                var caller = this;

/*Line 840 - 'AtomItemsControl.js' */                this.dispatcher.callLater(function () {
/*Line 841 - 'AtomItemsControl.js' */                    if (caller._autoScrollToSelection) {
/*Line 842 - 'AtomItemsControl.js' */                        caller.bringSelectionIntoView();
/*Line 843 - 'AtomItemsControl.js' */                    }
/*Line 844 - 'AtomItemsControl.js' */                });

/*Line 846 - 'AtomItemsControl.js' */            },

/*Line 848 - 'AtomItemsControl.js' */            dispose: function () {
/*Line 849 - 'AtomItemsControl.js' */                base.dispose.call(this);
/*Line 850 - 'AtomItemsControl.js' */                this._selectedItems = null;
/*Line 851 - 'AtomItemsControl.js' */                this._scopes = null;
/*Line 852 - 'AtomItemsControl.js' */                this._cachedItems = null;
/*Line 853 - 'AtomItemsControl.js' */            },


/*Line 856 - 'AtomItemsControl.js' */            init: function () {

/*Line 858 - 'AtomItemsControl.js' */                var element = this.get_element();


/*Line 861 - 'AtomItemsControl.js' */                // set self as Items Presenter..
/*Line 862 - 'AtomItemsControl.js' */                if (!this._itemsPresenter) {
/*Line 863 - 'AtomItemsControl.js' */                    this._itemsPresenter = this._element;
/*Line 864 - 'AtomItemsControl.js' */                }
/*Line 865 - 'AtomItemsControl.js' */                else {
/*Line 866 - 'AtomItemsControl.js' */                    //this._layout = WebAtoms.AtomViewBoxLayout.defaultInstnace;
/*Line 867 - 'AtomItemsControl.js' */                }

/*Line 869 - 'AtomItemsControl.js' */                var _this = this;
/*Line 870 - 'AtomItemsControl.js' */                this.bindEvent(this._selectedItems, "CollectionChanged", function () {
/*Line 871 - 'AtomItemsControl.js' */                    _this.onSelectedItemsChanged.apply(_this, arguments);
/*Line 872 - 'AtomItemsControl.js' */                });
/*Line 873 - 'AtomItemsControl.js' */                base.init.apply(this, arguments);


/*Line 876 - 'AtomItemsControl.js' */                var caller = this;

/*Line 878 - 'AtomItemsControl.js' */                this.removeItemCommand = function (scope, sender) {
/*Line 879 - 'AtomItemsControl.js' */                    if (!sender)
/*Line 880 - 'AtomItemsControl.js' */                        return;
/*Line 881 - 'AtomItemsControl.js' */                    var d = sender.get_data();
/*Line 882 - 'AtomItemsControl.js' */                    AtomBinder.removeItem(caller._items, d);
/*Line 883 - 'AtomItemsControl.js' */                };

/*Line 885 - 'AtomItemsControl.js' */                this.removeSelectedCommand = function (scope, sender) {
/*Line 886 - 'AtomItemsControl.js' */                    var s = caller.get_selectedItems().slice(0);
/*Line 887 - 'AtomItemsControl.js' */                    var ae = new AtomEnumerator(s);
/*Line 888 - 'AtomItemsControl.js' */                    while (ae.next()) {
/*Line 889 - 'AtomItemsControl.js' */                        AtomBinder.removeItem(caller.get_items(), ae.current());
/*Line 890 - 'AtomItemsControl.js' */                    }
/*Line 891 - 'AtomItemsControl.js' */                };

/*Line 893 - 'AtomItemsControl.js' */                this.removeAllCommand = function (scope, sender) {
/*Line 894 - 'AtomItemsControl.js' */                    AtomBinder.clear(caller.get_items());
/*Line 895 - 'AtomItemsControl.js' */                };
/*Line 896 - 'AtomItemsControl.js' */            }
/*Line 897 - 'AtomItemsControl.js' */        }
/*Line 898 - 'AtomItemsControl.js' */    });
/*Line 899 - 'AtomItemsControl.js' */})(WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomButton.js' */

/*Line 2 - 'AtomButton.js' */(function (base) {
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

/*Line 19 - 'AtomButton.js' */                var errors = this.get_errors();
/*Line 20 - 'AtomButton.js' */                if (errors.length) {

/*Line 22 - 'AtomButton.js' */                    alert(errors.join("\n"));

/*Line 24 - 'AtomButton.js' */                    return false;
/*Line 25 - 'AtomButton.js' */                }


/*Line 28 - 'AtomButton.js' */                if (this._next) {
/*Line 29 - 'AtomButton.js' */                    if (this._sendData && this._next) {
/*Line 30 - 'AtomButton.js' */                        AtomBinder.setValue(this._next, "data", this.get_data());
/*Line 31 - 'AtomButton.js' */                    }
/*Line 32 - 'AtomButton.js' */                    this.invokeAction(this._next);
/*Line 33 - 'AtomButton.js' */                }
/*Line 34 - 'AtomButton.js' */                return false;
/*Line 35 - 'AtomButton.js' */            },

/*Line 37 - 'AtomButton.js' */            init: function () {

/*Line 39 - 'AtomButton.js' */                var element = this._element;
/*Line 40 - 'AtomButton.js' */                this.bindEvent(element, "click", "onClickHandler");
/*Line 41 - 'AtomButton.js' */                base.init.apply(this);
/*Line 42 - 'AtomButton.js' */            }
/*Line 43 - 'AtomButton.js' */        }

/*Line 45 - 'AtomButton.js' */    });
/*Line 46 - 'AtomButton.js' */})(WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomListBox.js' */

/*Line 2 - 'AtomListBox.js' */(function (baseType) {
/*Line 3 - 'AtomListBox.js' */    return classCreatorEx({
/*Line 4 - 'AtomListBox.js' */        name: "WebAtoms.AtomListBox",
/*Line 5 - 'AtomListBox.js' */        base: baseType,
/*Line 6 - 'AtomListBox.js' */        start: function (e) {
/*Line 7 - 'AtomListBox.js' */            this._labelPath = "label";
/*Line 8 - 'AtomListBox.js' */            this._valuePath = "value";

/*Line 10 - 'AtomListBox.js' */            this._autoScrollToSelection = false;

/*Line 12 - 'AtomListBox.js' */        },
/*Line 13 - 'AtomListBox.js' */        properties: {
/*Line 14 - 'AtomListBox.js' */            autoSelectOnClick: true
/*Line 15 - 'AtomListBox.js' */        },
/*Line 16 - 'AtomListBox.js' */        methods: {

/*Line 18 - 'AtomListBox.js' */            setClass: function () {
/*Line 19 - 'AtomListBox.js' */                var $e = $(this._element);
/*Line 20 - 'AtomListBox.js' */                $e.addClass("atom-list-box");
/*Line 21 - 'AtomListBox.js' */            },

/*Line 23 - 'AtomListBox.js' */            onClick: function (event) {

/*Line 25 - 'AtomListBox.js' */                if (!this._autoSelectOnClick)
/*Line 26 - 'AtomListBox.js' */                    return;

/*Line 28 - 'AtomListBox.js' */                this.onSelectItem(null, null, event);
/*Line 29 - 'AtomListBox.js' */                //return AtomUI.cancelEvent(event);
/*Line 30 - 'AtomListBox.js' */            },

/*Line 32 - 'AtomListBox.js' */            get_itemWidth: function () {
/*Line 33 - 'AtomListBox.js' */                if (!this._items || !this._items.length)
/*Line 34 - 'AtomListBox.js' */                    return 0;
/*Line 35 - 'AtomListBox.js' */                var w = $(this._element).innerWidth();
/*Line 36 - 'AtomListBox.js' */                return w / this._items.length;
/*Line 37 - 'AtomListBox.js' */            },

/*Line 39 - 'AtomListBox.js' */            applyItemStyle: function (item, dataItem, first, last) {
/*Line 40 - 'AtomListBox.js' */                var $item = $(item);
/*Line 41 - 'AtomListBox.js' */                $item.removeClass("selected-item list-item first-item last-item");
/*Line 42 - 'AtomListBox.js' */                //$(item).removeClass("list-item");
/*Line 43 - 'AtomListBox.js' */                //$(item).removeClass("first-item");
/*Line 44 - 'AtomListBox.js' */                //$(item).removeClass("last-item");
/*Line 45 - 'AtomListBox.js' */                if (!dataItem)
/*Line 46 - 'AtomListBox.js' */                    return;
/*Line 47 - 'AtomListBox.js' */                $item.addClass("list-item");
/*Line 48 - 'AtomListBox.js' */                if (first) {
/*Line 49 - 'AtomListBox.js' */                    $item.addClass("first-item");
/*Line 50 - 'AtomListBox.js' */                }
/*Line 51 - 'AtomListBox.js' */                if (last) {
/*Line 52 - 'AtomListBox.js' */                    $item.addClass("last-item");
/*Line 53 - 'AtomListBox.js' */                }
/*Line 54 - 'AtomListBox.js' */                if (this.isSelected(dataItem)) {
/*Line 55 - 'AtomListBox.js' */                    $item.addClass("selected-item");
/*Line 56 - 'AtomListBox.js' */                }
/*Line 57 - 'AtomListBox.js' */            },

/*Line 59 - 'AtomListBox.js' */            onCreated: function () {
/*Line 60 - 'AtomListBox.js' */                this.bindEvent(this._itemsPresenter, "click", "onClick");
/*Line 61 - 'AtomListBox.js' */                baseType.onCreated.call(this);
/*Line 62 - 'AtomListBox.js' */            },

/*Line 64 - 'AtomListBox.js' */            invokePost: function () {
/*Line 65 - 'AtomListBox.js' */                if (this.get_selectedIndex() != -1) {
/*Line 66 - 'AtomListBox.js' */                    baseType.invokePost.apply(this, arguments);
/*Line 67 - 'AtomListBox.js' */                }
/*Line 68 - 'AtomListBox.js' */            },

/*Line 70 - 'AtomListBox.js' */            onSelectItem: function (scope, sender, event) {
/*Line 71 - 'AtomListBox.js' */                var target = event ? event.target : null;
/*Line 72 - 'AtomListBox.js' */                var element = this._itemsPresenter;
/*Line 73 - 'AtomListBox.js' */                var childElement = target || sender._element;

/*Line 75 - 'AtomListBox.js' */                var isCheckBox = /checkbox/i.test(childElement.type);

/*Line 77 - 'AtomListBox.js' */                while (childElement.parentNode != null && childElement.parentNode != element)
/*Line 78 - 'AtomListBox.js' */                    childElement = childElement.parentNode;
/*Line 79 - 'AtomListBox.js' */                if (childElement == document) {
/*Line 80 - 'AtomListBox.js' */                    //console.log("listbox clicked outside");
/*Line 81 - 'AtomListBox.js' */                    return;
/*Line 82 - 'AtomListBox.js' */                }
/*Line 83 - 'AtomListBox.js' */                var dataItem = childElement;
/*Line 84 - 'AtomListBox.js' */                if (this.hasItems()) {
/*Line 85 - 'AtomListBox.js' */                    dataItem = childElement.atomControl.get_data();
/*Line 86 - 'AtomListBox.js' */                }

/*Line 88 - 'AtomListBox.js' */                if (isCheckBox) {
/*Line 89 - 'AtomListBox.js' */                    var oldS = this._allowMultipleSelection;
/*Line 90 - 'AtomListBox.js' */                    try {
/*Line 91 - 'AtomListBox.js' */                        this._allowMultipleSelection = true;
/*Line 92 - 'AtomListBox.js' */                        this.toggleSelection(dataItem);
/*Line 93 - 'AtomListBox.js' */                    } finally {
/*Line 94 - 'AtomListBox.js' */                        this._allowMultipleSelection = oldS;
/*Line 95 - 'AtomListBox.js' */                    }
/*Line 96 - 'AtomListBox.js' */                } else {
/*Line 97 - 'AtomListBox.js' */                    this.toggleSelection(dataItem);
/*Line 98 - 'AtomListBox.js' */                }

/*Line 100 - 'AtomListBox.js' */            },


/*Line 103 - 'AtomListBox.js' */            updateChildSelections: function () {
/*Line 104 - 'AtomListBox.js' */                var e = this._element;
/*Line 105 - 'AtomListBox.js' */                if (/select/i.test(e.tagName)) {
/*Line 106 - 'AtomListBox.js' */                    var i = this.get_selectedIndex();
/*Line 107 - 'AtomListBox.js' */                    if (e.selectedIndex != i) {
/*Line 108 - 'AtomListBox.js' */                        WebAtoms.dispatcher.callLater(function () {
/*Line 109 - 'AtomListBox.js' */                            e.selectedIndex = i;
/*Line 110 - 'AtomListBox.js' */                        });
/*Line 111 - 'AtomListBox.js' */                    }
/*Line 112 - 'AtomListBox.js' */                } else {
/*Line 113 - 'AtomListBox.js' */                    baseType.updateChildSelections.apply(this, arguments);
/*Line 114 - 'AtomListBox.js' */                }
/*Line 115 - 'AtomListBox.js' */            },

/*Line 117 - 'AtomListBox.js' */            init: function () {

/*Line 119 - 'AtomListBox.js' */                this.setClass();

/*Line 121 - 'AtomListBox.js' */                baseType.init.call(this);
/*Line 122 - 'AtomListBox.js' */                var self = this;

/*Line 124 - 'AtomListBox.js' */                var e = this._element;
/*Line 125 - 'AtomListBox.js' */                if (/select/i.test(e.tagName)) {
/*Line 126 - 'AtomListBox.js' */                    this.set_allowSelectFirst(true);
/*Line 127 - 'AtomListBox.js' */                    this.bindEvent(e, 'change', function () {
/*Line 128 - 'AtomListBox.js' */                        AtomBinder.setValue(self, 'selectedIndex', e.selectedIndex);
/*Line 129 - 'AtomListBox.js' */                    });
/*Line 130 - 'AtomListBox.js' */                }



/*Line 134 - 'AtomListBox.js' */                this.selectCommand = function () {
/*Line 135 - 'AtomListBox.js' */                    self.onSelectItem.apply(self, arguments);
/*Line 136 - 'AtomListBox.js' */                };
/*Line 137 - 'AtomListBox.js' */                this.selectAllCommand = function () {
/*Line 138 - 'AtomListBox.js' */                    self.set_selectAll(true);
/*Line 139 - 'AtomListBox.js' */                };
/*Line 140 - 'AtomListBox.js' */                this.clearSelectionCommand = function () {
/*Line 141 - 'AtomListBox.js' */                    self.set_selectedIndex(-1);
/*Line 142 - 'AtomListBox.js' */                };
/*Line 143 - 'AtomListBox.js' */            }
/*Line 144 - 'AtomListBox.js' */        }
/*Line 145 - 'AtomListBox.js' */    });
/*Line 146 - 'AtomListBox.js' */})(WebAtoms.AtomItemsControl.prototype);

/*Line 0 - 'AtomAutoCompleteBox.js' */
/*Line 1 - 'AtomAutoCompleteBox.js' */

/*Line 3 - 'AtomAutoCompleteBox.js' */(function (base) {
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
/*Line 23 - 'AtomAutoCompleteBox.js' */            //set_required: function (v) {
/*Line 24 - 'AtomAutoCompleteBox.js' */            //    this._required = v;
/*Line 25 - 'AtomAutoCompleteBox.js' */            //    if (v) {
/*Line 26 - 'AtomAutoCompleteBox.js' */            //        this.bind(this._element, "invalid", [["value"]], false, function (v1) { return v1 ? null : "Required" });
/*Line 27 - 'AtomAutoCompleteBox.js' */            //    } else {
/*Line 28 - 'AtomAutoCompleteBox.js' */            //        this.clearBinding(this._element, "invalid");
/*Line 29 - 'AtomAutoCompleteBox.js' */            //    }

/*Line 31 - 'AtomAutoCompleteBox.js' */            //},
/*Line 32 - 'AtomAutoCompleteBox.js' */            //get_required: function () {
/*Line 33 - 'AtomAutoCompleteBox.js' */            //    return this._required;
/*Line 34 - 'AtomAutoCompleteBox.js' */            //},
/*Line 35 - 'AtomAutoCompleteBox.js' */            get_offsetLeft: function () {
/*Line 36 - 'AtomAutoCompleteBox.js' */                //return $(this._element).offset().left - parseInt( $(atomApplication._element).css("left") , 10);
/*Line 37 - 'AtomAutoCompleteBox.js' */                return $(this._element).offset().left;
/*Line 38 - 'AtomAutoCompleteBox.js' */            },
/*Line 39 - 'AtomAutoCompleteBox.js' */            get_offsetTop: function () {
/*Line 40 - 'AtomAutoCompleteBox.js' */                return $(this._element).offset().top;
/*Line 41 - 'AtomAutoCompleteBox.js' */            },

/*Line 43 - 'AtomAutoCompleteBox.js' */            get_offsetWidth: function () {
/*Line 44 - 'AtomAutoCompleteBox.js' */                return $(this._inputBox).offset().width;
/*Line 45 - 'AtomAutoCompleteBox.js' */            },

/*Line 47 - 'AtomAutoCompleteBox.js' */            set_itemsUrl: function (v) {
/*Line 48 - 'AtomAutoCompleteBox.js' */                var url = "[ !$owner.keyPressed ? undefined : AtomPromise.json('" + v + "').showProgress(false) ]";
/*Line 49 - 'AtomAutoCompleteBox.js' */                this.setValue("items", url, true, this._element);
/*Line 50 - 'AtomAutoCompleteBox.js' */            },

/*Line 52 - 'AtomAutoCompleteBox.js' */            set_isPopupOpen: function (v) {
/*Line 53 - 'AtomAutoCompleteBox.js' */                this._isPopupOpen = v;
/*Line 54 - 'AtomAutoCompleteBox.js' */                if (v) {
/*Line 55 - 'AtomAutoCompleteBox.js' */                    AtomBinder.refreshValue(this, "offsetTop");
/*Line 56 - 'AtomAutoCompleteBox.js' */                    AtomBinder.refreshValue(this, "offsetLeft");
/*Line 57 - 'AtomAutoCompleteBox.js' */                    AtomBinder.refreshValue(this, "offsetWidth");
/*Line 58 - 'AtomAutoCompleteBox.js' */                    //this.bindEvent(window, "click", "onWindowClick");
/*Line 59 - 'AtomAutoCompleteBox.js' */                    var _this = this;
/*Line 60 - 'AtomAutoCompleteBox.js' */                    this.trySelect();
/*Line 61 - 'AtomAutoCompleteBox.js' */                    this.bindEvent(window, "click", function () {
/*Line 62 - 'AtomAutoCompleteBox.js' */                        _this.onWindowClick.apply(_this, arguments);
/*Line 63 - 'AtomAutoCompleteBox.js' */                    });
/*Line 64 - 'AtomAutoCompleteBox.js' */                } else {
/*Line 65 - 'AtomAutoCompleteBox.js' */                    //this.unbindEvent(window, "click", "onWindowClick");
/*Line 66 - 'AtomAutoCompleteBox.js' */                    this.unbindEvent(window, "click");
/*Line 67 - 'AtomAutoCompleteBox.js' */                }
/*Line 68 - 'AtomAutoCompleteBox.js' */            },

/*Line 70 - 'AtomAutoCompleteBox.js' */            onSelectedItemsChanged: function () {
/*Line 71 - 'AtomAutoCompleteBox.js' */                if (this._onUIChanged) {
/*Line 72 - 'AtomAutoCompleteBox.js' */                    if (this._selectedItems.length > 0) {
/*Line 73 - 'AtomAutoCompleteBox.js' */                        this.refreshLabel();
/*Line 74 - 'AtomAutoCompleteBox.js' */                    }
/*Line 75 - 'AtomAutoCompleteBox.js' */                }
/*Line 76 - 'AtomAutoCompleteBox.js' */                base.onSelectedItemsChanged.apply(this, arguments);
/*Line 77 - 'AtomAutoCompleteBox.js' */            },

/*Line 79 - 'AtomAutoCompleteBox.js' */            onClick: function (e) {
/*Line 80 - 'AtomAutoCompleteBox.js' */                base.onClick.apply(this, arguments);
/*Line 81 - 'AtomAutoCompleteBox.js' */                this._backupValue = this.get_value();
/*Line 82 - 'AtomAutoCompleteBox.js' */                this.refreshLabel();
/*Line 83 - 'AtomAutoCompleteBox.js' */                this._backupLabel = this.get_displayLabel();
/*Line 84 - 'AtomAutoCompleteBox.js' */                AtomBinder.setValue(this, "keyPressed", false);
/*Line 85 - 'AtomAutoCompleteBox.js' */                AtomBinder.setValue(this, "isPopupOpen", false);
/*Line 86 - 'AtomAutoCompleteBox.js' */            },

/*Line 88 - 'AtomAutoCompleteBox.js' */            restoreSelection: function () {
/*Line 89 - 'AtomAutoCompleteBox.js' */                AtomBinder.setValue(this, "isPopupOpen", false);
/*Line 90 - 'AtomAutoCompleteBox.js' */                if (this._backupValue) {
/*Line 91 - 'AtomAutoCompleteBox.js' */                    AtomBinder.setValue(this, "value", this._backupValue);
/*Line 92 - 'AtomAutoCompleteBox.js' */                    AtomBinder.setValue(this, "displayLabel", this._backupLabel);
/*Line 93 - 'AtomAutoCompleteBox.js' */                    this._backupValue = null;
/*Line 94 - 'AtomAutoCompleteBox.js' */                } else {
/*Line 95 - 'AtomAutoCompleteBox.js' */                    AtomBinder.setValue(this, "selectedIndex", -1);
/*Line 96 - 'AtomAutoCompleteBox.js' */                }
/*Line 97 - 'AtomAutoCompleteBox.js' */            },

/*Line 99 - 'AtomAutoCompleteBox.js' */            onKeyUp: function (e) {

/*Line 101 - 'AtomAutoCompleteBox.js' */                AtomBinder.setValue(this, "isPopupOpen", true);

/*Line 103 - 'AtomAutoCompleteBox.js' */                switch (e.keyCode) {
/*Line 104 - 'AtomAutoCompleteBox.js' */                    case 27:
/*Line 105 - 'AtomAutoCompleteBox.js' */                        AtomBinder.setValue(this, "keyPressed", false);
/*Line 106 - 'AtomAutoCompleteBox.js' */                        this.restoreSelection();
/*Line 107 - 'AtomAutoCompleteBox.js' */                        return;
/*Line 108 - 'AtomAutoCompleteBox.js' */                    case 13:
/*Line 109 - 'AtomAutoCompleteBox.js' */                        AtomBinder.setValue(this, "keyPressed", false);
/*Line 110 - 'AtomAutoCompleteBox.js' */                        AtomBinder.setValue(this, "isPopupOpen", false);
/*Line 111 - 'AtomAutoCompleteBox.js' */                        this._backupValue = this.get_value();
/*Line 112 - 'AtomAutoCompleteBox.js' */                        this.refreshLabel();
/*Line 113 - 'AtomAutoCompleteBox.js' */                        this._backupLabel = this.get_displayLabel();
/*Line 114 - 'AtomAutoCompleteBox.js' */                        return AtomUI.cancelEvent(e);
/*Line 115 - 'AtomAutoCompleteBox.js' */                    case 37:
/*Line 116 - 'AtomAutoCompleteBox.js' */                        // Left
/*Line 117 - 'AtomAutoCompleteBox.js' */                        break;
/*Line 118 - 'AtomAutoCompleteBox.js' */                    case 38:
/*Line 119 - 'AtomAutoCompleteBox.js' */                        // up
/*Line 120 - 'AtomAutoCompleteBox.js' */                        AtomBinder.setValue(this, "keyPressed", false);
/*Line 121 - 'AtomAutoCompleteBox.js' */                        this.moveSelection(true);
/*Line 122 - 'AtomAutoCompleteBox.js' */                        return;
/*Line 123 - 'AtomAutoCompleteBox.js' */                    case 39:
/*Line 124 - 'AtomAutoCompleteBox.js' */                        // right
/*Line 125 - 'AtomAutoCompleteBox.js' */                        break;
/*Line 126 - 'AtomAutoCompleteBox.js' */                    case 40:
/*Line 127 - 'AtomAutoCompleteBox.js' */                        AtomBinder.setValue(this, "keyPressed", false);
/*Line 128 - 'AtomAutoCompleteBox.js' */                        this.moveSelection(false);
/*Line 129 - 'AtomAutoCompleteBox.js' */                        return;
/*Line 130 - 'AtomAutoCompleteBox.js' */                    default:
/*Line 131 - 'AtomAutoCompleteBox.js' */                        // try selecting complete word...
/*Line 132 - 'AtomAutoCompleteBox.js' */                        var caller = this;
/*Line 133 - 'AtomAutoCompleteBox.js' */                        this.dispatcher.callLater(function () {
/*Line 134 - 'AtomAutoCompleteBox.js' */                            caller.trySelect();
/*Line 135 - 'AtomAutoCompleteBox.js' */                        });
/*Line 136 - 'AtomAutoCompleteBox.js' */                        break;
/*Line 137 - 'AtomAutoCompleteBox.js' */                }

/*Line 139 - 'AtomAutoCompleteBox.js' */                if (this.oldTimeout) {
/*Line 140 - 'AtomAutoCompleteBox.js' */                    clearTimeout(this.oldTimeout);
/*Line 141 - 'AtomAutoCompleteBox.js' */                }
/*Line 142 - 'AtomAutoCompleteBox.js' */                var _this = this;
/*Line 143 - 'AtomAutoCompleteBox.js' */                this.oldTimeout = setTimeout(function () {
/*Line 144 - 'AtomAutoCompleteBox.js' */                    AtomBinder.setValue(_this, "keyPressed", true);
/*Line 145 - 'AtomAutoCompleteBox.js' */                }, 500);

/*Line 147 - 'AtomAutoCompleteBox.js' */            },

/*Line 149 - 'AtomAutoCompleteBox.js' */            trySelect: function () {

/*Line 151 - 'AtomAutoCompleteBox.js' */                if (!this._items || this._items.length == 0)
/*Line 152 - 'AtomAutoCompleteBox.js' */                    return;

/*Line 154 - 'AtomAutoCompleteBox.js' */                //if (this.get_selectedIndex() != -1)
/*Line 155 - 'AtomAutoCompleteBox.js' */                //    return;

/*Line 157 - 'AtomAutoCompleteBox.js' */                var ae = new AtomEnumerator(this._items);
/*Line 158 - 'AtomAutoCompleteBox.js' */                var lp = this._labelPath;

/*Line 160 - 'AtomAutoCompleteBox.js' */                var cl = this._displayLabel;

/*Line 162 - 'AtomAutoCompleteBox.js' */                if (cl)
/*Line 163 - 'AtomAutoCompleteBox.js' */                    cl = cl.toLowerCase();

/*Line 165 - 'AtomAutoCompleteBox.js' */                while (ae.next()) {
/*Line 166 - 'AtomAutoCompleteBox.js' */                    var item = ae.current();
/*Line 167 - 'AtomAutoCompleteBox.js' */                    var l = item;
/*Line 168 - 'AtomAutoCompleteBox.js' */                    if (lp)
/*Line 169 - 'AtomAutoCompleteBox.js' */                        l = l[lp];
/*Line 170 - 'AtomAutoCompleteBox.js' */                    if (l.toLowerCase().indexOf(cl)==0) {
/*Line 171 - 'AtomAutoCompleteBox.js' */                        AtomBinder.setValue(this, "selectedItem", item);
/*Line 172 - 'AtomAutoCompleteBox.js' */                        AtomBinder.setValue(this, "selectedText", l);
/*Line 173 - 'AtomAutoCompleteBox.js' */                        this.bringSelectionIntoView();
/*Line 174 - 'AtomAutoCompleteBox.js' */                        return;
/*Line 175 - 'AtomAutoCompleteBox.js' */                    }
/*Line 176 - 'AtomAutoCompleteBox.js' */                }
/*Line 177 - 'AtomAutoCompleteBox.js' */            },

/*Line 179 - 'AtomAutoCompleteBox.js' */            moveSelection: function (up) {
/*Line 180 - 'AtomAutoCompleteBox.js' */                if (!this._items || !this._items.length)
/*Line 181 - 'AtomAutoCompleteBox.js' */                    return;
/*Line 182 - 'AtomAutoCompleteBox.js' */                var i = this.get_selectedIndex();

/*Line 184 - 'AtomAutoCompleteBox.js' */                if (i == -1) {
/*Line 185 - 'AtomAutoCompleteBox.js' */                    this.backupLabel = this.get_displayLabel();
/*Line 186 - 'AtomAutoCompleteBox.js' */                }

/*Line 188 - 'AtomAutoCompleteBox.js' */                i = up ? (i - 1) : (i + 1);
/*Line 189 - 'AtomAutoCompleteBox.js' */                if (up && i == -2) {
/*Line 190 - 'AtomAutoCompleteBox.js' */                    i = this._items.length - 1;
/*Line 191 - 'AtomAutoCompleteBox.js' */                }
/*Line 192 - 'AtomAutoCompleteBox.js' */                if (!up && i == this._items.length) {
/*Line 193 - 'AtomAutoCompleteBox.js' */                    i = -1;
/*Line 194 - 'AtomAutoCompleteBox.js' */                }

/*Line 196 - 'AtomAutoCompleteBox.js' */                AtomBinder.setValue(this, "selectedIndex", i);
/*Line 197 - 'AtomAutoCompleteBox.js' */                if (i == -1) {
/*Line 198 - 'AtomAutoCompleteBox.js' */                    AtomBinder.setValue(this, "displayLabel", this.backupLabel || "");
/*Line 199 - 'AtomAutoCompleteBox.js' */                } else {
/*Line 200 - 'AtomAutoCompleteBox.js' */                    this.refreshLabel();
/*Line 201 - 'AtomAutoCompleteBox.js' */                }
/*Line 202 - 'AtomAutoCompleteBox.js' */            },

/*Line 204 - 'AtomAutoCompleteBox.js' */            refreshLabel: function () {
/*Line 205 - 'AtomAutoCompleteBox.js' */                var item = this.get_selectedItem();
/*Line 206 - 'AtomAutoCompleteBox.js' */                var l = item;
/*Line 207 - 'AtomAutoCompleteBox.js' */                if (l && this._labelPath) {
/*Line 208 - 'AtomAutoCompleteBox.js' */                    l = l[this._labelPath];
/*Line 209 - 'AtomAutoCompleteBox.js' */                }
/*Line 210 - 'AtomAutoCompleteBox.js' */                AtomBinder.setValue(this, "displayLabel", l || "");
/*Line 211 - 'AtomAutoCompleteBox.js' */            },

/*Line 213 - 'AtomAutoCompleteBox.js' */            onWindowClick: function (e) {
/*Line 214 - 'AtomAutoCompleteBox.js' */                var se = this._element;
/*Line 215 - 'AtomAutoCompleteBox.js' */                var p = this._itemsPresenter;
/*Line 216 - 'AtomAutoCompleteBox.js' */                var childElement = e.target;
/*Line 217 - 'AtomAutoCompleteBox.js' */                while (childElement.parentNode != null && childElement != se && childElement != p)
/*Line 218 - 'AtomAutoCompleteBox.js' */                    childElement = childElement.parentNode;
/*Line 219 - 'AtomAutoCompleteBox.js' */                if (childElement == se || childElement == p)
/*Line 220 - 'AtomAutoCompleteBox.js' */                    return;
/*Line 221 - 'AtomAutoCompleteBox.js' */                // close popup....
/*Line 222 - 'AtomAutoCompleteBox.js' */                this.restoreSelection();

/*Line 224 - 'AtomAutoCompleteBox.js' */            },

/*Line 226 - 'AtomAutoCompleteBox.js' */            onInputFocus: function () {
/*Line 227 - 'AtomAutoCompleteBox.js' */                if (!this._autoOpen)
/*Line 228 - 'AtomAutoCompleteBox.js' */                    return;
/*Line 229 - 'AtomAutoCompleteBox.js' */                this._backupValue = this.get_value();
/*Line 230 - 'AtomAutoCompleteBox.js' */                this._backupLabel = this.get_displayLabel();
/*Line 231 - 'AtomAutoCompleteBox.js' */                AtomBinder.setValue(this, "isPopupOpen", true);
/*Line 232 - 'AtomAutoCompleteBox.js' */                $(this._inputBox).select();
/*Line 233 - 'AtomAutoCompleteBox.js' */            },

/*Line 235 - 'AtomAutoCompleteBox.js' */            onInputBlur: function () {
/*Line 236 - 'AtomAutoCompleteBox.js' */                if (this._mouseCapture)
/*Line 237 - 'AtomAutoCompleteBox.js' */                    return;
/*Line 238 - 'AtomAutoCompleteBox.js' */                var caller = this;

/*Line 240 - 'AtomAutoCompleteBox.js' */                setTimeout(function () {
/*Line 241 - 'AtomAutoCompleteBox.js' */                    if (caller._isPopupOpen) {
/*Line 242 - 'AtomAutoCompleteBox.js' */                        AtomBinder.setValue(caller, "isPopupOpen", false);
/*Line 243 - 'AtomAutoCompleteBox.js' */                        caller.restoreSelection();
/*Line 244 - 'AtomAutoCompleteBox.js' */                    }
/*Line 245 - 'AtomAutoCompleteBox.js' */                }, 10);
/*Line 246 - 'AtomAutoCompleteBox.js' */            },

/*Line 248 - 'AtomAutoCompleteBox.js' */            onCreated: function () {

/*Line 250 - 'AtomAutoCompleteBox.js' */                this._itemsPresenter._logicalParent = this._element;

/*Line 252 - 'AtomAutoCompleteBox.js' */                $(this._itemsPresenter).remove();

/*Line 254 - 'AtomAutoCompleteBox.js' */                document.body.appendChild(this._itemsPresenter);

/*Line 256 - 'AtomAutoCompleteBox.js' */                $(this._itemsPresenter).addClass("auto-complete-popup");

/*Line 258 - 'AtomAutoCompleteBox.js' */                base.onCreated.apply(this, arguments);
/*Line 259 - 'AtomAutoCompleteBox.js' */                this.bindEvent(this._itemsPresenter, "mouseover", "onMouseOver");
/*Line 260 - 'AtomAutoCompleteBox.js' */                this.bindEvent(this._itemsPresenter, "mouseout", "onMouseOut");
/*Line 261 - 'AtomAutoCompleteBox.js' */            },

/*Line 263 - 'AtomAutoCompleteBox.js' */            onMouseOver: function () {
/*Line 264 - 'AtomAutoCompleteBox.js' */                this._mouseCapture++;

/*Line 266 - 'AtomAutoCompleteBox.js' */            },

/*Line 268 - 'AtomAutoCompleteBox.js' */            onMouseOut: function () {
/*Line 269 - 'AtomAutoCompleteBox.js' */                var _this = this;
/*Line 270 - 'AtomAutoCompleteBox.js' */                setTimeout(function () {
/*Line 271 - 'AtomAutoCompleteBox.js' */                    _this._mouseCapture--;

/*Line 273 - 'AtomAutoCompleteBox.js' */                }, 1000);
/*Line 274 - 'AtomAutoCompleteBox.js' */            },

/*Line 276 - 'AtomAutoCompleteBox.js' */            init: function () {

/*Line 278 - 'AtomAutoCompleteBox.js' */                base.init.apply(this, arguments);
/*Line 279 - 'AtomAutoCompleteBox.js' */                this.bindEvent(this._inputBox, "focus", "onInputFocus");
/*Line 280 - 'AtomAutoCompleteBox.js' */                this.bindEvent(this._inputBox, "blur", "onInputBlur");
/*Line 281 - 'AtomAutoCompleteBox.js' */                this.bindEvent(this._inputBox, "keyup", "onKeyUp");
/*Line 282 - 'AtomAutoCompleteBox.js' */            },
/*Line 283 - 'AtomAutoCompleteBox.js' */            dispose: function () {
/*Line 284 - 'AtomAutoCompleteBox.js' */                if(this._itemsPresenter){
/*Line 285 - 'AtomAutoCompleteBox.js' */                    this.disposeChildren(this._itemsPresenter);
/*Line 286 - 'AtomAutoCompleteBox.js' */                    $(this._itemsPresenter).remove();
/*Line 287 - 'AtomAutoCompleteBox.js' */                    this._itemsPresenter = null;
/*Line 288 - 'AtomAutoCompleteBox.js' */                }
/*Line 289 - 'AtomAutoCompleteBox.js' */                base.dispose.call(this);
/*Line 290 - 'AtomAutoCompleteBox.js' */            }
/*Line 291 - 'AtomAutoCompleteBox.js' */        }
/*Line 292 - 'AtomAutoCompleteBox.js' */    });
/*Line 293 - 'AtomAutoCompleteBox.js' */})(WebAtoms.AtomListBox.prototype);

/*Line 0 - 'AtomComboBox.js' */
/*Line 1 - 'AtomComboBox.js' */


/*Line 4 - 'AtomComboBox.js' */(function (base) {
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
/*Line 78 - 'AtomComboBox.js' */})(WebAtoms.AtomItemsControl.prototype);



/*Line 0 - 'AtomDateListBox.js' */

/*Line 2 - 'AtomDateListBox.js' */(function (base) {
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
/*Line 73 - 'AtomDateListBox.js' */                    et = AtomUI.getAtomType(et);
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
/*Line 203 - 'AtomDateListBox.js' */})(WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomDockPanel.js' */

/*Line 2 - 'AtomDockPanel.js' */(function (base) {

/*Line 4 - 'AtomDockPanel.js' */    var AtomUI = window.AtomUI;

/*Line 6 - 'AtomDockPanel.js' */    return classCreatorEx({
/*Line 7 - 'AtomDockPanel.js' */        name: "WebAtoms.AtomDockPanel",
/*Line 8 - 'AtomDockPanel.js' */        base: base,
/*Line 9 - 'AtomDockPanel.js' */        start: function (e) {
/*Line 10 - 'AtomDockPanel.js' */            $(e).addClass("atom-dock-panel");
/*Line 11 - 'AtomDockPanel.js' */        },
/*Line 12 - 'AtomDockPanel.js' */        properties: {
/*Line 13 - 'AtomDockPanel.js' */            resizeOnChildResized: false,
/*Line 14 - 'AtomDockPanel.js' */            contentWidth: 0
/*Line 15 - 'AtomDockPanel.js' */        },
/*Line 16 - 'AtomDockPanel.js' */        methods: {
/*Line 17 - 'AtomDockPanel.js' */            resizeChild: function (item) {
/*Line 18 - 'AtomDockPanel.js' */                if (item.atomControl) {
/*Line 19 - 'AtomDockPanel.js' */                    item.atomControl.updateUI();
/*Line 20 - 'AtomDockPanel.js' */                } else {
/*Line 21 - 'AtomDockPanel.js' */                    this.updateChildUI(item);
/*Line 22 - 'AtomDockPanel.js' */                }
/*Line 23 - 'AtomDockPanel.js' */            },

/*Line 25 - 'AtomDockPanel.js' */            calculateSize: function () {
/*Line 26 - 'AtomDockPanel.js' */                var element = this.get_element();
/*Line 27 - 'AtomDockPanel.js' */                var $element = $(element);
/*Line 28 - 'AtomDockPanel.js' */                var size = { width: $element.width(), height: $element.height() };

/*Line 30 - 'AtomDockPanel.js' */                //if (AtomBrowser.isIE && AtomBrowser.majorVersion < 10) {
/*Line 31 - 'AtomDockPanel.js' */                //    size = { width: element.offsetWidth, height: element.offsetHeight };
/*Line 32 - 'AtomDockPanel.js' */                //}else {

/*Line 34 - 'AtomDockPanel.js' */                //var s = AtomUI.getComputedStyle(element);

/*Line 36 - 'AtomDockPanel.js' */                //size = { width: AtomUI.parseStyleNumber(s.width), height: AtomUI.parseStyleNumber(s.height) };
/*Line 37 - 'AtomDockPanel.js' */                //}

/*Line 39 - 'AtomDockPanel.js' */                if (!this._resizeOnChildResized)
/*Line 40 - 'AtomDockPanel.js' */                    return size;

/*Line 42 - 'AtomDockPanel.js' */                var desiredHeight = 0;

/*Line 44 - 'AtomDockPanel.js' */                var ae = new ChildEnumerator(element);
/*Line 45 - 'AtomDockPanel.js' */                while (ae.next()) {
/*Line 46 - 'AtomDockPanel.js' */                    var child = ae.current();
/*Line 47 - 'AtomDockPanel.js' */                    var dock = AtomUI.attr(child, "atom-dock");
/*Line 48 - 'AtomDockPanel.js' */                    switch (dock) {
/*Line 49 - 'AtomDockPanel.js' */                        case "Bottom":
/*Line 50 - 'AtomDockPanel.js' */                        case "Fill":
/*Line 51 - 'AtomDockPanel.js' */                        case "Top":
/*Line 52 - 'AtomDockPanel.js' */                            var h;
/*Line 53 - 'AtomDockPanel.js' */                            if (AtomBrowser.isIE && AtomBrowser.majorVersion < 10) {
/*Line 54 - 'AtomDockPanel.js' */                                h = child.offsetHeight;
/*Line 55 - 'AtomDockPanel.js' */                            } else {
/*Line 56 - 'AtomDockPanel.js' */                                //h = AtomUI.getItemRect(child).height;
/*Line 57 - 'AtomDockPanel.js' */                                h = $(child).outerHeight(true);
/*Line 58 - 'AtomDockPanel.js' */                            }
/*Line 59 - 'AtomDockPanel.js' */                            desiredHeight += h;
/*Line 60 - 'AtomDockPanel.js' */                            break;
/*Line 61 - 'AtomDockPanel.js' */                    }
/*Line 62 - 'AtomDockPanel.js' */                }

/*Line 64 - 'AtomDockPanel.js' */                if (size.height < desiredHeight) {
/*Line 65 - 'AtomDockPanel.js' */                    size.height = desiredHeight;
/*Line 66 - 'AtomDockPanel.js' */                    $element.height(size.height);
/*Line 67 - 'AtomDockPanel.js' */                }

/*Line 69 - 'AtomDockPanel.js' */                return size;
/*Line 70 - 'AtomDockPanel.js' */            },

/*Line 72 - 'AtomDockPanel.js' */            onUpdateUI: function () {


/*Line 75 - 'AtomDockPanel.js' */                var element = this.get_element();
/*Line 76 - 'AtomDockPanel.js' */                var $element = $(element);

/*Line 78 - 'AtomDockPanel.js' */                var i;
/*Line 79 - 'AtomDockPanel.js' */                var left = 0;
/*Line 80 - 'AtomDockPanel.js' */                var top = parseInt($(element).css("paddingTop"), 10);

/*Line 82 - 'AtomDockPanel.js' */                var s = this.calculateSize();

/*Line 84 - 'AtomDockPanel.js' */                // is parent of this is body??
/*Line 85 - 'AtomDockPanel.js' */                var height = s.height;
/*Line 86 - 'AtomDockPanel.js' */                var width = s.width;

/*Line 88 - 'AtomDockPanel.js' */                if (this._contentWidth) {
/*Line 89 - 'AtomDockPanel.js' */                    left = (width - this._contentWidth) / 2;
/*Line 90 - 'AtomDockPanel.js' */                    width = this._contentWidth;
/*Line 91 - 'AtomDockPanel.js' */                }

/*Line 93 - 'AtomDockPanel.js' */                var children = [];
/*Line 94 - 'AtomDockPanel.js' */                var en;
/*Line 95 - 'AtomDockPanel.js' */                var item;

/*Line 97 - 'AtomDockPanel.js' */                var itemRect;
/*Line 98 - 'AtomDockPanel.js' */                var clientRect;

/*Line 100 - 'AtomDockPanel.js' */                var itemHeight;
/*Line 101 - 'AtomDockPanel.js' */                var itemWidth;

/*Line 103 - 'AtomDockPanel.js' */                var childList = {
/*Line 104 - 'AtomDockPanel.js' */                    top: [],
/*Line 105 - 'AtomDockPanel.js' */                    bottom: [],
/*Line 106 - 'AtomDockPanel.js' */                    left: [],
/*Line 107 - 'AtomDockPanel.js' */                    right: [],
/*Line 108 - 'AtomDockPanel.js' */                    fill:[]
/*Line 109 - 'AtomDockPanel.js' */                };

/*Line 111 - 'AtomDockPanel.js' */                isScriptOrStyle = /script|style/i;

/*Line 113 - 'AtomDockPanel.js' */                var ce = new ChildEnumerator(element);
/*Line 114 - 'AtomDockPanel.js' */                while (ce.next()) {
/*Line 115 - 'AtomDockPanel.js' */                    var e = ce.current();
/*Line 116 - 'AtomDockPanel.js' */                    if (isScriptOrStyle.test(e.tagName))
/*Line 117 - 'AtomDockPanel.js' */                        continue;
/*Line 118 - 'AtomDockPanel.js' */                    var $e = $(e);
/*Line 119 - 'AtomDockPanel.js' */                    if ($e.css("display") == "none")
/*Line 120 - 'AtomDockPanel.js' */                        continue;
/*Line 121 - 'AtomDockPanel.js' */                    if ($e.css("visibility") == "hidden")
/*Line 122 - 'AtomDockPanel.js' */                        continue;
/*Line 123 - 'AtomDockPanel.js' */                    if ($e.is(".dock-left,[dock$='Left']")) {
/*Line 124 - 'AtomDockPanel.js' */                        childList.left.push(e);
/*Line 125 - 'AtomDockPanel.js' */                        continue;
/*Line 126 - 'AtomDockPanel.js' */                    }
/*Line 127 - 'AtomDockPanel.js' */                    if ($e.is(".dock-right,[dock$='Right']")) {
/*Line 128 - 'AtomDockPanel.js' */                        childList.right.push(e);
/*Line 129 - 'AtomDockPanel.js' */                        continue;
/*Line 130 - 'AtomDockPanel.js' */                    }
/*Line 131 - 'AtomDockPanel.js' */                    if ($e.is("header,.dock-top,[dock$='Top']")) {
/*Line 132 - 'AtomDockPanel.js' */                        childList.top.push(e);
/*Line 133 - 'AtomDockPanel.js' */                        continue;
/*Line 134 - 'AtomDockPanel.js' */                    }
/*Line 135 - 'AtomDockPanel.js' */                    if ($e.is("footer,.dock-bottom,[dock$='Bottom']")) {
/*Line 136 - 'AtomDockPanel.js' */                        childList.bottom.push(e);
/*Line 137 - 'AtomDockPanel.js' */                        continue;
/*Line 138 - 'AtomDockPanel.js' */                    }
/*Line 139 - 'AtomDockPanel.js' */                    if ($e.is("section,.dock-fill,[dock$='Fill']")) {
/*Line 140 - 'AtomDockPanel.js' */                        childList.fill.push(e);
/*Line 141 - 'AtomDockPanel.js' */                        continue;
/*Line 142 - 'AtomDockPanel.js' */                    }
/*Line 143 - 'AtomDockPanel.js' */                    //childList.fill.push(e);
/*Line 144 - 'AtomDockPanel.js' */                }

/*Line 146 - 'AtomDockPanel.js' */                en = new AtomEnumerator(childList.top);
/*Line 147 - 'AtomDockPanel.js' */                while (en.next()) {
/*Line 148 - 'AtomDockPanel.js' */                    item = en.current();
/*Line 149 - 'AtomDockPanel.js' */                    var $item = $(item);

/*Line 151 - 'AtomDockPanel.js' */                    itemHeight = $item.outerHeight(true);

/*Line 153 - 'AtomDockPanel.js' */                    AtomUI.setItemRect($item,item, { top: top, left: left, width: width });

/*Line 155 - 'AtomDockPanel.js' */                    top += itemHeight;
/*Line 156 - 'AtomDockPanel.js' */                    height -= itemHeight;

/*Line 158 - 'AtomDockPanel.js' */                    this.resizeChild(item);
/*Line 159 - 'AtomDockPanel.js' */                }

/*Line 161 - 'AtomDockPanel.js' */                en = new AtomEnumerator(childList.bottom.reverse());
/*Line 162 - 'AtomDockPanel.js' */                while (en.next()) {
/*Line 163 - 'AtomDockPanel.js' */                    item = en.current();
/*Line 164 - 'AtomDockPanel.js' */                    var $item = $(item);
/*Line 165 - 'AtomDockPanel.js' */                    itemHeight = $item.outerHeight(true);

/*Line 167 - 'AtomDockPanel.js' */                    height -= itemHeight;

/*Line 169 - 'AtomDockPanel.js' */                    AtomUI.setItemRect($item,item, { left: left, top: (top + height), width: width });

/*Line 171 - 'AtomDockPanel.js' */                    this.resizeChild(item);
/*Line 172 - 'AtomDockPanel.js' */                }

/*Line 174 - 'AtomDockPanel.js' */                en = new AtomEnumerator(childList.left);
/*Line 175 - 'AtomDockPanel.js' */                while (en.next()) {
/*Line 176 - 'AtomDockPanel.js' */                    item = en.current();
/*Line 177 - 'AtomDockPanel.js' */                    var $item = $(item);
/*Line 178 - 'AtomDockPanel.js' */                    var itemWidth = $item.outerWidth(true);
/*Line 179 - 'AtomDockPanel.js' */                    width -= itemWidth;

/*Line 181 - 'AtomDockPanel.js' */                    AtomUI.setItemRect($item, item, { top: top, left: left, height: height });
/*Line 182 - 'AtomDockPanel.js' */                    left += itemWidth;

/*Line 184 - 'AtomDockPanel.js' */                    this.resizeChild(item);
/*Line 185 - 'AtomDockPanel.js' */                }

/*Line 187 - 'AtomDockPanel.js' */                en = new AtomEnumerator(childList.right.reverse());
/*Line 188 - 'AtomDockPanel.js' */                while (en.next()) {
/*Line 189 - 'AtomDockPanel.js' */                    item = en.current();
/*Line 190 - 'AtomDockPanel.js' */                    var $item = $(item);
/*Line 191 - 'AtomDockPanel.js' */                    var itemWidth = $item.outerWidth(true);
/*Line 192 - 'AtomDockPanel.js' */                    width -= itemWidth;

/*Line 194 - 'AtomDockPanel.js' */                    AtomUI.setItemRect($item, item, { left: (width + left), top: top, height: height });

/*Line 196 - 'AtomDockPanel.js' */                    this.resizeChild(item);
/*Line 197 - 'AtomDockPanel.js' */                }

/*Line 199 - 'AtomDockPanel.js' */                en = new AtomEnumerator(childList.fill);
/*Line 200 - 'AtomDockPanel.js' */                while (en.next()) {
/*Line 201 - 'AtomDockPanel.js' */                    item = en.current();
/*Line 202 - 'AtomDockPanel.js' */                    var $item = $(item);
/*Line 203 - 'AtomDockPanel.js' */                    itemWidth = $item.css("max-width");
/*Line 204 - 'AtomDockPanel.js' */                    if (itemWidth) {
/*Line 205 - 'AtomDockPanel.js' */                        itemWidth = parseFloat(itemWidth);
/*Line 206 - 'AtomDockPanel.js' */                        if (itemWidth > 0) {
/*Line 207 - 'AtomDockPanel.js' */                            width = itemWidth;
/*Line 208 - 'AtomDockPanel.js' */                        }
/*Line 209 - 'AtomDockPanel.js' */                    }

/*Line 211 - 'AtomDockPanel.js' */                    AtomUI.setItemRect($item, item, { left: left, top: top, width: width, height: height });

/*Line 213 - 'AtomDockPanel.js' */                    this.resizeChild(item);
/*Line 214 - 'AtomDockPanel.js' */                }

/*Line 216 - 'AtomDockPanel.js' */            }
/*Line 217 - 'AtomDockPanel.js' */        }
/*Line 218 - 'AtomDockPanel.js' */    });
/*Line 219 - 'AtomDockPanel.js' */})(WebAtoms.AtomControl.prototype);

/*Line 0 - 'AtomPostButton.js' */

/*Line 2 - 'AtomPostButton.js' */(function (base) {
/*Line 3 - 'AtomPostButton.js' */    return classCreatorEx({
/*Line 4 - 'AtomPostButton.js' */        name: "WebAtoms.AtomPostButton",
/*Line 5 - 'AtomPostButton.js' */        base: base,
/*Line 6 - 'AtomPostButton.js' */        start:function(){
/*Line 7 - 'AtomPostButton.js' */        },
/*Line 8 - 'AtomPostButton.js' */        properties: {
/*Line 9 - 'AtomPostButton.js' */            postData: null,
/*Line 10 - 'AtomPostButton.js' */            postResult: null,
/*Line 11 - 'AtomPostButton.js' */            postError: null,
/*Line 12 - 'AtomPostButton.js' */            postUrl: null,
/*Line 13 - 'AtomPostButton.js' */            next: null,
/*Line 14 - 'AtomPostButton.js' */            errorNext: null,
/*Line 15 - 'AtomPostButton.js' */            confirm: false,
/*Line 16 - 'AtomPostButton.js' */            confirmMessage: null,
/*Line 17 - 'AtomPostButton.js' */            mergeData: null
/*Line 18 - 'AtomPostButton.js' */        },
/*Line 19 - 'AtomPostButton.js' */        methods: {
/*Line 20 - 'AtomPostButton.js' */            get_postData: function () {
/*Line 21 - 'AtomPostButton.js' */                return this._postData || this.get_data();
/*Line 22 - 'AtomPostButton.js' */            },

/*Line 24 - 'AtomPostButton.js' */            onClickHandler: function (e) {
/*Line 25 - 'AtomPostButton.js' */                if (this._confirm) {
/*Line 26 - 'AtomPostButton.js' */                    var _this = this;
/*Line 27 - 'AtomPostButton.js' */                    Atom.confirm(this._confirmMessage, function () {
/*Line 28 - 'AtomPostButton.js' */                        _this.onConfirmed(e);
/*Line 29 - 'AtomPostButton.js' */                    });
/*Line 30 - 'AtomPostButton.js' */                    return;
/*Line 31 - 'AtomPostButton.js' */                }
/*Line 32 - 'AtomPostButton.js' */                this.onConfirmed(e);
/*Line 33 - 'AtomPostButton.js' */            },

/*Line 35 - 'AtomPostButton.js' */            onConfirmed: function (e) {


/*Line 38 - 'AtomPostButton.js' */                if (!this._postUrl) {
/*Line 39 - 'AtomPostButton.js' */                    base.onClickHandler.apply(this, arguments);
/*Line 40 - 'AtomPostButton.js' */                    return;
/*Line 41 - 'AtomPostButton.js' */                }

/*Line 43 - 'AtomPostButton.js' */                var data = this.get_postData();

/*Line 45 - 'AtomPostButton.js' */                if (data === null || data === undefined)
/*Line 46 - 'AtomPostButton.js' */                    return;

/*Line 48 - 'AtomPostButton.js' */                var m = this._mergeData;
/*Line 49 - 'AtomPostButton.js' */                if (m) {
/*Line 50 - 'AtomPostButton.js' */                    for (var i in m) {
/*Line 51 - 'AtomPostButton.js' */                        data[i] = m[i];
/*Line 52 - 'AtomPostButton.js' */                    }
/*Line 53 - 'AtomPostButton.js' */                }

/*Line 55 - 'AtomPostButton.js' */                //data = AtomBinder.getClone(data);

/*Line 57 - 'AtomPostButton.js' */                var caller = this;
/*Line 58 - 'AtomPostButton.js' */                var invokeNext = function (p) {
/*Line 59 - 'AtomPostButton.js' */                    AtomBinder.setValue(caller, "postResult", p.value());
/*Line 60 - 'AtomPostButton.js' */                    caller.invokeAction(caller._next);
/*Line 61 - 'AtomPostButton.js' */                };

/*Line 63 - 'AtomPostButton.js' */                //this.invokeAjax(this._postUrl, { type: "POST", data: data, success: invokeNext });


/*Line 66 - 'AtomPostButton.js' */                var p = AtomPromise.json(this._postUrl, null, { type: "POST", data: data });
/*Line 67 - 'AtomPostButton.js' */                p.then(invokeNext);

/*Line 69 - 'AtomPostButton.js' */                var errorNext = this._errorNext;
/*Line 70 - 'AtomPostButton.js' */                if (errorNext) {
/*Line 71 - 'AtomPostButton.js' */                    p.failed(function (pr) {
/*Line 72 - 'AtomPostButton.js' */                        AtomBinder.setValue(caller, "postError", pr);
/*Line 73 - 'AtomPostButton.js' */                        caller.invokeAction(caller, errorNext);
/*Line 74 - 'AtomPostButton.js' */                    });
/*Line 75 - 'AtomPostButton.js' */                }

/*Line 77 - 'AtomPostButton.js' */                p.invoke();

/*Line 79 - 'AtomPostButton.js' */            }
/*Line 80 - 'AtomPostButton.js' */        }
/*Line 81 - 'AtomPostButton.js' */    });
/*Line 82 - 'AtomPostButton.js' */})(WebAtoms.AtomButton.prototype);
/*Line 0 - 'AtomToggleButtonBar.js' */

/*Line 2 - 'AtomToggleButtonBar.js' */(function (baseType) {
/*Line 3 - 'AtomToggleButtonBar.js' */    return classCreatorEx({
/*Line 4 - 'AtomToggleButtonBar.js' */        name: "WebAtoms.AtomToggleButtonBar",
/*Line 5 - 'AtomToggleButtonBar.js' */        base: baseType,
/*Line 6 - 'AtomToggleButtonBar.js' */        start: function (e) {
/*Line 7 - 'AtomToggleButtonBar.js' */            this._allowSelectFirst = true;
/*Line 8 - 'AtomToggleButtonBar.js' */            this._allowMultipleSelection = false;
/*Line 9 - 'AtomToggleButtonBar.js' */            this._showTabs = false;
/*Line 10 - 'AtomToggleButtonBar.js' */            this._autoScrollToSelection = false;

/*Line 12 - 'AtomToggleButtonBar.js' */            //$(e).removeClass("atom-list-box");

/*Line 14 - 'AtomToggleButtonBar.js' */            //if (! /ul/i.test(e.tagName)) {
/*Line 15 - 'AtomToggleButtonBar.js' */            //    //throw new Error("Button bar can only support UL style");
/*Line 16 - 'AtomToggleButtonBar.js' */            //    log("Button bar can only support UL style");
/*Line 17 - 'AtomToggleButtonBar.js' */            //}

/*Line 19 - 'AtomToggleButtonBar.js' */        },
/*Line 20 - 'AtomToggleButtonBar.js' */        properties: {
/*Line 21 - 'AtomToggleButtonBar.js' */            showTabs: false
/*Line 22 - 'AtomToggleButtonBar.js' */        },
/*Line 23 - 'AtomToggleButtonBar.js' */        methods: {

/*Line 25 - 'AtomToggleButtonBar.js' */            setClass: function () {
/*Line 26 - 'AtomToggleButtonBar.js' */                var $e = $(this._element);
/*Line 27 - 'AtomToggleButtonBar.js' */                $e.removeClass("atom-tab-bar atom-toggle-button-bar");
/*Line 28 - 'AtomToggleButtonBar.js' */                $e.addClass(this._showTabs ? 'atom-tab-bar' : 'atom-toggle-button-bar');
/*Line 29 - 'AtomToggleButtonBar.js' */            },

/*Line 31 - 'AtomToggleButtonBar.js' */            set_showTabs: function (v) {
/*Line 32 - 'AtomToggleButtonBar.js' */                this._showTabs = v;
/*Line 33 - 'AtomToggleButtonBar.js' */                this.setClass();
/*Line 34 - 'AtomToggleButtonBar.js' */            }
/*Line 35 - 'AtomToggleButtonBar.js' */        }
/*Line 36 - 'AtomToggleButtonBar.js' */    });
/*Line 37 - 'AtomToggleButtonBar.js' */})(WebAtoms.AtomListBox.prototype);
/*Line 0 - 'AtomViewStack.js' */

/*Line 2 - 'AtomViewStack.js' */(function (baseType) {

/*Line 4 - 'AtomViewStack.js' */    return classCreatorEx({
/*Line 5 - 'AtomViewStack.js' */        name: "WebAtoms.AtomViewStack",
/*Line 6 - 'AtomViewStack.js' */        base: baseType,
/*Line 7 - 'AtomViewStack.js' */        start: function (e) {
/*Line 8 - 'AtomViewStack.js' */            this._swipeDirection = 'left-right';
/*Line 9 - 'AtomViewStack.js' */        },
/*Line 10 - 'AtomViewStack.js' */        properties: {
/*Line 11 - 'AtomViewStack.js' */            selectedIndex: -1,
/*Line 12 - 'AtomViewStack.js' */            previousIndex: -1,
/*Line 13 - 'AtomViewStack.js' */            swipeDirection: 'left-right'
/*Line 14 - 'AtomViewStack.js' */        },
/*Line 15 - 'AtomViewStack.js' */        methods: {
/*Line 16 - 'AtomViewStack.js' */            bringSelectionIntoView: function () {
/*Line 17 - 'AtomViewStack.js' */            },
/*Line 18 - 'AtomViewStack.js' */            set_swipeDirection: function (v) {
/*Line 19 - 'AtomViewStack.js' */                var ov = this._swipeDirection;
/*Line 20 - 'AtomViewStack.js' */                if (ov) {
/*Line 21 - 'AtomViewStack.js' */                    $(this._element).removeClass(ov);
/*Line 22 - 'AtomViewStack.js' */                }
/*Line 23 - 'AtomViewStack.js' */                this._swipeDirection = v;
/*Line 24 - 'AtomViewStack.js' */                if (v) {
/*Line 25 - 'AtomViewStack.js' */                    $(this._element).addClass(v);
/*Line 26 - 'AtomViewStack.js' */                }
/*Line 27 - 'AtomViewStack.js' */            },
/*Line 28 - 'AtomViewStack.js' */            set_selectedIndex: function (v) {

/*Line 30 - 'AtomViewStack.js' */                if (this._isAnimating) {
/*Line 31 - 'AtomViewStack.js' */                    var self = this;
/*Line 32 - 'AtomViewStack.js' */                    setTimeout(function () {
/*Line 33 - 'AtomViewStack.js' */                        self.set_selectedIndex(v);
/*Line 34 - 'AtomViewStack.js' */                    }, 50);
/*Line 35 - 'AtomViewStack.js' */                    return;
/*Line 36 - 'AtomViewStack.js' */                }
/*Line 37 - 'AtomViewStack.js' */                if (v == this._selectedIndex)
/*Line 38 - 'AtomViewStack.js' */                    return;
/*Line 39 - 'AtomViewStack.js' */                this._previousIndex = this._selectedIndex;
/*Line 40 - 'AtomViewStack.js' */                this._selectedIndex = v;
/*Line 41 - 'AtomViewStack.js' */                this.updateUI();
/*Line 42 - 'AtomViewStack.js' */            },
/*Line 43 - 'AtomViewStack.js' */            get_selectedChild: function () {
/*Line 44 - 'AtomViewStack.js' */                return this._selectedChild;
/*Line 45 - 'AtomViewStack.js' */            },
/*Line 46 - 'AtomViewStack.js' */            onUpdateUI: function () {

/*Line 48 - 'AtomViewStack.js' */                var element = this._element;
/*Line 49 - 'AtomViewStack.js' */                var childEn = new ChildEnumerator(element);

/*Line 51 - 'AtomViewStack.js' */                var selectedIndex = this.get_selectedIndex();
/*Line 52 - 'AtomViewStack.js' */                var previousIndex = this._previousIndex;

/*Line 54 - 'AtomViewStack.js' */                var queue = WebAtoms.dispatcher;
/*Line 55 - 'AtomViewStack.js' */                queue.pause();

/*Line 57 - 'AtomViewStack.js' */                var i = -1;

/*Line 59 - 'AtomViewStack.js' */                var self = this;

/*Line 61 - 'AtomViewStack.js' */                var selectedElement, previousElement;

/*Line 63 - 'AtomViewStack.js' */                while (childEn.next()) {
/*Line 64 - 'AtomViewStack.js' */                    i = i + 1;
/*Line 65 - 'AtomViewStack.js' */                    var item = childEn.current();
/*Line 66 - 'AtomViewStack.js' */                    var $item = $(item);
/*Line 67 - 'AtomViewStack.js' */                    $item.addClass("view-stack-child");
/*Line 68 - 'AtomViewStack.js' */                    if (previousIndex == -1) {
/*Line 69 - 'AtomViewStack.js' */                        $item.addClass("hidden");
/*Line 70 - 'AtomViewStack.js' */                    }
/*Line 71 - 'AtomViewStack.js' */                    if (i == selectedIndex) {
/*Line 72 - 'AtomViewStack.js' */                        selectedElement = item;
/*Line 73 - 'AtomViewStack.js' */                    } else if (i == previousIndex) {
/*Line 74 - 'AtomViewStack.js' */                        previousElement = item;
/*Line 75 - 'AtomViewStack.js' */                    } else {
/*Line 76 - 'AtomViewStack.js' */                        $item.addClass("hidden");
/*Line 77 - 'AtomViewStack.js' */                    }
/*Line 78 - 'AtomViewStack.js' */                }

/*Line 80 - 'AtomViewStack.js' */                if (selectedElement) {
/*Line 81 - 'AtomViewStack.js' */                    var width = $(element).innerWidth();
/*Line 82 - 'AtomViewStack.js' */                    var height = $(element).innerHeight();

/*Line 84 - 'AtomViewStack.js' */                    this._selectedChild = selectedElement;
/*Line 85 - 'AtomViewStack.js' */                    var $selectedElement = $(selectedElement);
/*Line 86 - 'AtomViewStack.js' */                    AtomUI.setItemRect($selectedElement,selectedElement, { width: width, height: height });
/*Line 87 - 'AtomViewStack.js' */                    var sac = selectedElement.atomControl;
/*Line 88 - 'AtomViewStack.js' */                    if (sac) {
/*Line 89 - 'AtomViewStack.js' */                        sac.updateUI();
/*Line 90 - 'AtomViewStack.js' */                    }

/*Line 92 - 'AtomViewStack.js' */                    if (previousElement && previousElement != selectedElement) {
/*Line 93 - 'AtomViewStack.js' */                        var self = this;

/*Line 95 - 'AtomViewStack.js' */                        var $previousElement = $(previousElement);

/*Line 97 - 'AtomViewStack.js' */                        var sd = this._swipeDirection;
/*Line 98 - 'AtomViewStack.js' */                        if (sd != null && /none/i.test(sd)) {
/*Line 99 - 'AtomViewStack.js' */                            $previousElement.addClass("hidden");
/*Line 100 - 'AtomViewStack.js' */                            $selectedElement.removeClass("hidden");
/*Line 101 - 'AtomViewStack.js' */                        } else {
/*Line 102 - 'AtomViewStack.js' */                            // animate...
/*Line 103 - 'AtomViewStack.js' */                            var ael = [selectedElement, previousElement];
/*Line 104 - 'AtomViewStack.js' */                            $(ael).removeClass("hidden");
/*Line 105 - 'AtomViewStack.js' */                            this._isAnimating = true;
/*Line 106 - 'AtomViewStack.js' */                            if (selectedIndex < previousIndex) {
/*Line 107 - 'AtomViewStack.js' */                                $selectedElement.css("left", -width);
/*Line 108 - 'AtomViewStack.js' */                                //log("left: -" + width);
/*Line 109 - 'AtomViewStack.js' */                            } else {
/*Line 110 - 'AtomViewStack.js' */                                $selectedElement.css("left", width);
/*Line 111 - 'AtomViewStack.js' */                                //log("left: " + width);
/*Line 112 - 'AtomViewStack.js' */                            }
/*Line 113 - 'AtomViewStack.js' */                            $(ael).addClass("animate-left-property");
/*Line 114 - 'AtomViewStack.js' */                            setTimeout(function () {
/*Line 115 - 'AtomViewStack.js' */                                $selectedElement.css("left", 0);
/*Line 116 - 'AtomViewStack.js' */                                //log("left: 0");
/*Line 117 - 'AtomViewStack.js' */                                if (selectedIndex < previousIndex) {
/*Line 118 - 'AtomViewStack.js' */                                    $previousElement.css("left", width);
/*Line 119 - 'AtomViewStack.js' */                                } else {
/*Line 120 - 'AtomViewStack.js' */                                    $previousElement.css("left", -width);
/*Line 121 - 'AtomViewStack.js' */                                }
/*Line 122 - 'AtomViewStack.js' */                                setTimeout(function () {
/*Line 123 - 'AtomViewStack.js' */                                    self._isAnimating = false;
/*Line 124 - 'AtomViewStack.js' */                                    $(ael).removeClass("animate-left-property");
/*Line 125 - 'AtomViewStack.js' */                                    $previousElement.addClass("hidden");
/*Line 126 - 'AtomViewStack.js' */                                }, 800);
/*Line 127 - 'AtomViewStack.js' */                            }, 50);
/*Line 128 - 'AtomViewStack.js' */                        }
/*Line 129 - 'AtomViewStack.js' */                    } else {
/*Line 130 - 'AtomViewStack.js' */                        $selectedElement.removeClass("hidden");
/*Line 131 - 'AtomViewStack.js' */                    }
/*Line 132 - 'AtomViewStack.js' */                }

/*Line 134 - 'AtomViewStack.js' */                queue.start();

/*Line 136 - 'AtomViewStack.js' */            },
/*Line 137 - 'AtomViewStack.js' */            init: function () {
/*Line 138 - 'AtomViewStack.js' */                var element = this.get_element();
/*Line 139 - 'AtomViewStack.js' */                var $element = $(element);
/*Line 140 - 'AtomViewStack.js' */                $element.addClass("atom-view-stack");
/*Line 141 - 'AtomViewStack.js' */                baseType.init.call(this);

/*Line 143 - 'AtomViewStack.js' */                if (!element.parentNode.atomControl) {
/*Line 144 - 'AtomViewStack.js' */                    $element.addClass("atom-view-stack-fill");
/*Line 145 - 'AtomViewStack.js' */                }
/*Line 146 - 'AtomViewStack.js' */                $element.addClass(this._swipeDirection);

/*Line 148 - 'AtomViewStack.js' */                //this.updateUI();
/*Line 149 - 'AtomViewStack.js' */            }
/*Line 150 - 'AtomViewStack.js' */        }
/*Line 151 - 'AtomViewStack.js' */    });
/*Line 152 - 'AtomViewStack.js' */})(WebAtoms.AtomControl.prototype);

/*Line 0 - 'AtomForm.js' */

/*Line 2 - 'AtomForm.js' */(function (baseType) {
/*Line 3 - 'AtomForm.js' */    return classCreatorEx({
/*Line 4 - 'AtomForm.js' */        name: "WebAtoms.AtomForm",
/*Line 5 - 'AtomForm.js' */        base: baseType,
/*Line 6 - 'AtomForm.js' */        start: function () {
/*Line 7 - 'AtomForm.js' */            this._success = null;
/*Line 8 - 'AtomForm.js' */            this._submit = null;
/*Line 9 - 'AtomForm.js' */            this._errors = null;
/*Line 10 - 'AtomForm.js' */            this._attachments = null;
/*Line 11 - 'AtomForm.js' */        },
/*Line 12 - 'AtomForm.js' */        properties: {
/*Line 13 - 'AtomForm.js' */            result: null,
/*Line 14 - 'AtomForm.js' */            errorNext: null,
/*Line 15 - 'AtomForm.js' */            mergeData: null,
/*Line 16 - 'AtomForm.js' */            mergeResult: true,
/*Line 17 - 'AtomForm.js' */            postUrl: null,
/*Line 18 - 'AtomForm.js' */            postData: null,
/*Line 19 - 'AtomForm.js' */            successMessage: null,
/*Line 20 - 'AtomForm.js' */            clearData: false,
/*Line 21 - 'AtomForm.js' */            errorTemplate: null
/*Line 22 - 'AtomForm.js' */        },
/*Line 23 - 'AtomForm.js' */        methods: {
/*Line 24 - 'AtomForm.js' */            createFormLayout: function () {
/*Line 25 - 'AtomForm.js' */            },


/*Line 28 - 'AtomForm.js' */            preparePostData: function () {


/*Line 31 - 'AtomForm.js' */                var element = this.get_element();
/*Line 32 - 'AtomForm.js' */                var data = this._postData || this.get_data();

/*Line 34 - 'AtomForm.js' */                var m = this._mergeData;
/*Line 35 - 'AtomForm.js' */                if (m) {
/*Line 36 - 'AtomForm.js' */                    for (var i in m) {
/*Line 37 - 'AtomForm.js' */                        data[i] = m[i];
/*Line 38 - 'AtomForm.js' */                    }
/*Line 39 - 'AtomForm.js' */                }

/*Line 41 - 'AtomForm.js' */                return data;
/*Line 42 - 'AtomForm.js' */            },

/*Line 44 - 'AtomForm.js' */            onSubmit: function () {

/*Line 46 - 'AtomForm.js' */                //if (!this.isValid()) {
/*Line 47 - 'AtomForm.js' */                //    return;
/*Line 48 - 'AtomForm.js' */                //}

/*Line 50 - 'AtomForm.js' */                this.validate();

/*Line 52 - 'AtomForm.js' */                var errors = this.get_errors();
/*Line 53 - 'AtomForm.js' */                if (errors.length) {
/*Line 54 - 'AtomForm.js' */                    var labels = document.getElementsByTagName("label");
/*Line 55 - 'AtomForm.js' */                    this.invokeAction({
/*Line 56 - 'AtomForm.js' */                        localWindow: {
/*Line 57 - 'AtomForm.js' */                            path: this.getTemplate("errorTemplate"),
/*Line 58 - 'AtomForm.js' */                            prop: {
/*Line 59 - 'AtomForm.js' */                                data: errors.map(function (i) {
/*Line 60 - 'AtomForm.js' */                                    var l = Atom.query(labels).firstOrDefault({ control: i.value });
/*Line 61 - 'AtomForm.js' */                                    if (l) {
/*Line 62 - 'AtomForm.js' */                                        i.label = $(l).text() + " (" + i.label + ")";
/*Line 63 - 'AtomForm.js' */                                    }
/*Line 64 - 'AtomForm.js' */                                    return i;
/*Line 65 - 'AtomForm.js' */                                }),
/*Line 66 - 'AtomForm.js' */                                title: "Form Errors"
/*Line 67 - 'AtomForm.js' */                            }
/*Line 68 - 'AtomForm.js' */                        }
/*Line 69 - 'AtomForm.js' */                    });
/*Line 70 - 'AtomForm.js' */                    return;
/*Line 71 - 'AtomForm.js' */                }

/*Line 73 - 'AtomForm.js' */                var data = this.preparePostData();
/*Line 74 - 'AtomForm.js' */                var url = AtomPromise.getUrl(this._postUrl);
/*Line 75 - 'AtomForm.js' */                var p = AtomPromise.json(url, { _tv: Atom.time() }, { type: "POST", data: data });
/*Line 76 - 'AtomForm.js' */                p.then(this._success);
/*Line 77 - 'AtomForm.js' */                var errorNext = this._errorNext;
/*Line 78 - 'AtomForm.js' */                if (errorNext) {
/*Line 79 - 'AtomForm.js' */                    var self = this;
/*Line 80 - 'AtomForm.js' */                    p.failed(function (pr) {
/*Line 81 - 'AtomForm.js' */                        self.invokeAction(errorNext);
/*Line 82 - 'AtomForm.js' */                    });
/*Line 83 - 'AtomForm.js' */                }
/*Line 84 - 'AtomForm.js' */                p.invoke();
/*Line 85 - 'AtomForm.js' */            },

/*Line 87 - 'AtomForm.js' */            onSuccess: function (p) {

/*Line 89 - 'AtomForm.js' */                var result = p.value();

/*Line 91 - 'AtomForm.js' */                AtomBinder.setValue(this, "result", result);

/*Line 93 - 'AtomForm.js' */                if (this._mergeResult) {
/*Line 94 - 'AtomForm.js' */                    // merge...
/*Line 95 - 'AtomForm.js' */                    // AtomBinder.setValue(this, "data", result);
/*Line 96 - 'AtomForm.js' */                    var data = this.get_data();
/*Line 97 - 'AtomForm.js' */                    for (var index in result) {
/*Line 98 - 'AtomForm.js' */                        AtomBinder.setValue(data, index, result[index]);
/*Line 99 - 'AtomForm.js' */                    }
/*Line 100 - 'AtomForm.js' */                }

/*Line 102 - 'AtomForm.js' */                if (this._clearData) {
/*Line 103 - 'AtomForm.js' */                    var data = this.get_data();
/*Line 104 - 'AtomForm.js' */                    for (var index in this._clearData) {
/*Line 105 - 'AtomForm.js' */                        AtomBinder.setValue(data, index, result[index]);
/*Line 106 - 'AtomForm.js' */                    }
/*Line 107 - 'AtomForm.js' */                }

/*Line 109 - 'AtomForm.js' */                if (this._successMessage) {
/*Line 110 - 'AtomForm.js' */                    Atom.alert(this._successMessage);
/*Line 111 - 'AtomForm.js' */                }

/*Line 113 - 'AtomForm.js' */                this.invokeAction(this._next);

/*Line 115 - 'AtomForm.js' */            },

/*Line 117 - 'AtomForm.js' */            onKeyUp: function (e) {
/*Line 118 - 'AtomForm.js' */                if (e.target && e.target.nodeName && /textarea/gi.test(e.target.nodeName))
/*Line 119 - 'AtomForm.js' */                    return;
/*Line 120 - 'AtomForm.js' */                if (e.keyCode == 13) {
/*Line 121 - 'AtomForm.js' */                    var self = this;
/*Line 122 - 'AtomForm.js' */                    // fix for IE 11, IE 11 does not fire Change event on enter
/*Line 123 - 'AtomForm.js' */                    if (/input/gi.test(e.target.nodeName)) {
/*Line 124 - 'AtomForm.js' */                        $(e.target).change();
/*Line 125 - 'AtomForm.js' */                    }
/*Line 126 - 'AtomForm.js' */                    WebAtoms.dispatcher.callLater(function () {
/*Line 127 - 'AtomForm.js' */                        self.onSubmit();
/*Line 128 - 'AtomForm.js' */                    });
/*Line 129 - 'AtomForm.js' */                }
/*Line 130 - 'AtomForm.js' */            },

/*Line 132 - 'AtomForm.js' */            init: function () {
/*Line 133 - 'AtomForm.js' */                baseType.init.call(this);

/*Line 135 - 'AtomForm.js' */                var self = this;
/*Line 136 - 'AtomForm.js' */                this._success = function () {
/*Line 137 - 'AtomForm.js' */                    self.onSuccess.apply(self, arguments);
/*Line 138 - 'AtomForm.js' */                };

/*Line 140 - 'AtomForm.js' */                this._submit = function () {
/*Line 141 - 'AtomForm.js' */                    WebAtoms.dispatcher.callLater(function () {
/*Line 142 - 'AtomForm.js' */                        self.onSubmit.apply(self, arguments);
/*Line 143 - 'AtomForm.js' */                    });
/*Line 144 - 'AtomForm.js' */                };

/*Line 146 - 'AtomForm.js' */                var element = this.get_element();

/*Line 148 - 'AtomForm.js' */                this.submitCommand = this._submit;

/*Line 150 - 'AtomForm.js' */                if (/form/i.test(this._element.nodeName)) {
/*Line 151 - 'AtomForm.js' */                    this.bindEvent(element, "submit", function (e) {
/*Line 152 - 'AtomForm.js' */                        if (e) { e.preventDefault(); }
/*Line 153 - 'AtomForm.js' */                        self.submitCommand();
/*Line 154 - 'AtomForm.js' */                        return false;
/*Line 155 - 'AtomForm.js' */                    });
/*Line 156 - 'AtomForm.js' */                }else{
/*Line 157 - 'AtomForm.js' */                    this.bindEvent(element, "keyup", "onKeyUp");

/*Line 159 - 'AtomForm.js' */                    $(element).find("input[type=submit]").bind("click", null, this._submit);
/*Line 160 - 'AtomForm.js' */                    $(element).find("button[type=submit]").bind("click", null, this._submit);
/*Line 161 - 'AtomForm.js' */                }



/*Line 165 - 'AtomForm.js' */            }

/*Line 167 - 'AtomForm.js' */        }
/*Line 168 - 'AtomForm.js' */    });
/*Line 169 - 'AtomForm.js' */})(WebAtoms.AtomControl.prototype);

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

/*Line 17 - 'AtomFormLayout.js' */                var isChildField = false;

/*Line 19 - 'AtomFormLayout.js' */                //var amap = AtomUI.attributeMap(child, /^(atom\-(init|type|label|required|regex|data\-type|is\-valid|field\-(value|visible|class)|error))$/i);
/*Line 20 - 'AtomFormLayout.js' */                var amap = AtomUI.attributeMap(child, /^(atom\-(init|type|label|field\-(visible|class)))$/i);

/*Line 22 - 'AtomFormLayout.js' */                var at = amap["atom-type"];
/*Line 23 - 'AtomFormLayout.js' */                if (at) {
/*Line 24 - 'AtomFormLayout.js' */                    amap["atom-type"] = null;
/*Line 25 - 'AtomFormLayout.js' */                    switch (at.value) {
/*Line 26 - 'AtomFormLayout.js' */                        case "AtomFormField":
/*Line 27 - 'AtomFormLayout.js' */                            isChildField = true;
/*Line 28 - 'AtomFormLayout.js' */                            break;
/*Line 29 - 'AtomFormLayout.js' */                        case "AtomFormGridLayout":
/*Line 30 - 'AtomFormLayout.js' */                        case "AtomFormTab":
/*Line 31 - 'AtomFormLayout.js' */                            parent.appendChild(child);
/*Line 32 - 'AtomFormLayout.js' */                            var a = AtomUI.createControl(child, at.value);
/*Line 33 - 'AtomFormLayout.js' */                            return a;
/*Line 34 - 'AtomFormLayout.js' */                            break;
/*Line 35 - 'AtomFormLayout.js' */                    }
/*Line 36 - 'AtomFormLayout.js' */                }


/*Line 39 - 'AtomFormLayout.js' */                var field = AtomUI.cloneNode(this._fieldTemplate);

/*Line 41 - 'AtomFormLayout.js' */                var cp = AtomUI.findPresenter(field);
/*Line 42 - 'AtomFormLayout.js' */                if (cp) {
/*Line 43 - 'AtomFormLayout.js' */                    if (isChildField) {
/*Line 44 - 'AtomFormLayout.js' */                        var ce = new ChildEnumerator(child);
/*Line 45 - 'AtomFormLayout.js' */                        while (ce.next()) {
/*Line 46 - 'AtomFormLayout.js' */                            cp.appendChild(ce.current());
/*Line 47 - 'AtomFormLayout.js' */                        }
/*Line 48 - 'AtomFormLayout.js' */                    } else {
/*Line 49 - 'AtomFormLayout.js' */                        cp.appendChild(child);
/*Line 50 - 'AtomFormLayout.js' */                    }
/*Line 51 - 'AtomFormLayout.js' */                    AtomUI.removeAttr(cp, "atom-presenter");
/*Line 52 - 'AtomFormLayout.js' */                } else {
/*Line 53 - 'AtomFormLayout.js' */                    field.contentElement = child;
/*Line 54 - 'AtomFormLayout.js' */                }

/*Line 56 - 'AtomFormLayout.js' */                parent.appendChild(field);

/*Line 58 - 'AtomFormLayout.js' */                for (var k in amap) {
/*Line 59 - 'AtomFormLayout.js' */                    var v = amap[k];
/*Line 60 - 'AtomFormLayout.js' */                    if (!v)
/*Line 61 - 'AtomFormLayout.js' */                        continue;
/*Line 62 - 'AtomFormLayout.js' */                    child.removeAttributeNode(v.node);
/*Line 63 - 'AtomFormLayout.js' */                    field.setAttributeNode(v.node);
/*Line 64 - 'AtomFormLayout.js' */                }

/*Line 66 - 'AtomFormLayout.js' */                amap = AtomUI.attributeMap(child, /^atom\-required$/i);

/*Line 68 - 'AtomFormLayout.js' */                var childID = AtomUI.assignID(child);
/*Line 69 - 'AtomFormLayout.js' */                AtomUI.attr(field, "atom-field-id", childID);

/*Line 71 - 'AtomFormLayout.js' */                if (amap["atom-required"]) {
/*Line 72 - 'AtomFormLayout.js' */                    AtomUI.attr(field, "atom-required", "true");
/*Line 73 - 'AtomFormLayout.js' */                }

/*Line 75 - 'AtomFormLayout.js' */                return AtomUI.createControl(field, WebAtoms.AtomFieldType);
/*Line 76 - 'AtomFormLayout.js' */            },

/*Line 78 - 'AtomFormLayout.js' */            createChildren: function () {
/*Line 79 - 'AtomFormLayout.js' */                var element = this._element;
/*Line 80 - 'AtomFormLayout.js' */                $(element).addClass("atom-form");
/*Line 81 - 'AtomFormLayout.js' */                var ae = new AtomEnumerator($(element).children());

/*Line 83 - 'AtomFormLayout.js' */                // add table...
/*Line 84 - 'AtomFormLayout.js' */                var table = document.createElement("TABLE");

/*Line 86 - 'AtomFormLayout.js' */                $(table).addClass("atom-form-table");

/*Line 88 - 'AtomFormLayout.js' */                var tbody = document.createElement("TBODY");

/*Line 90 - 'AtomFormLayout.js' */                AtomUI.removeAllChildren(element);
/*Line 91 - 'AtomFormLayout.js' */                //element.innerHTML = "";

/*Line 93 - 'AtomFormLayout.js' */                element.appendChild(table);
/*Line 94 - 'AtomFormLayout.js' */                table.appendChild(tbody);

/*Line 96 - 'AtomFormLayout.js' */                var child;
/*Line 97 - 'AtomFormLayout.js' */                this.getTemplate("fieldTemplate");

/*Line 99 - 'AtomFormLayout.js' */                while (ae.next()) {
/*Line 100 - 'AtomFormLayout.js' */                    child = ae.current();
/*Line 101 - 'AtomFormLayout.js' */                    if (!child)
/*Line 102 - 'AtomFormLayout.js' */                        continue;

/*Line 104 - 'AtomFormLayout.js' */                    this.createField(tbody, child);

/*Line 106 - 'AtomFormLayout.js' */                }

/*Line 108 - 'AtomFormLayout.js' */            }
/*Line 109 - 'AtomFormLayout.js' */        }
/*Line 110 - 'AtomFormLayout.js' */    });
/*Line 111 - 'AtomFormLayout.js' */})(WebAtoms.AtomControl.prototype);
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
/*Line 17 - 'AtomWindow.js' */            title: undefined,
/*Line 18 - 'AtomWindow.js' */            windowUrl: undefined,
/*Line 19 - 'AtomWindow.js' */            cancelNext: undefined
/*Line 20 - 'AtomWindow.js' */        },
/*Line 21 - 'AtomWindow.js' */        methods: {


/*Line 24 - 'AtomWindow.js' */            get_openerData: function () {
/*Line 25 - 'AtomWindow.js' */                var v = this.get_opener();
/*Line 26 - 'AtomWindow.js' */                if (!v)
/*Line 27 - 'AtomWindow.js' */                    return;
/*Line 28 - 'AtomWindow.js' */                return v.get_data();
/*Line 29 - 'AtomWindow.js' */            },

/*Line 31 - 'AtomWindow.js' */            onCloseCommand: function (scope, sender) {
/*Line 32 - 'AtomWindow.js' */                AtomBinder.setValue(this, "isOpen", false);
/*Line 33 - 'AtomWindow.js' */                var val = this._value;
/*Line 34 - 'AtomWindow.js' */                var self = this;
/*Line 35 - 'AtomWindow.js' */                this._value = null;

/*Line 37 - 'AtomWindow.js' */                WebAtoms.dispatcher.callLater(function () {
/*Line 38 - 'AtomWindow.js' */                    AtomBinder.setValue(self, "value", val);
/*Line 39 - 'AtomWindow.js' */                    self.invokeAction(self._next);
/*Line 40 - 'AtomWindow.js' */                    self.disposeChildren(self._element);
/*Line 41 - 'AtomWindow.js' */                });
/*Line 42 - 'AtomWindow.js' */            },

/*Line 44 - 'AtomWindow.js' */            onCancelCommand: function(scope,sender){
/*Line 45 - 'AtomWindow.js' */                AtomBinder.setValue(this, "isOpen", false);
/*Line 46 - 'AtomWindow.js' */                var self = this;

/*Line 48 - 'AtomWindow.js' */                WebAtoms.dispatcher.callLater(function () {
/*Line 49 - 'AtomWindow.js' */                    self.invokeAction(self._cancelNext);
/*Line 50 - 'AtomWindow.js' */                    self.disposeChildren(self._element);
/*Line 51 - 'AtomWindow.js' */                });
/*Line 52 - 'AtomWindow.js' */            },

/*Line 54 - 'AtomWindow.js' */            refresh: function (scope, sender) {
/*Line 55 - 'AtomWindow.js' */                this.openWindow(scope, sender);
/*Line 56 - 'AtomWindow.js' */            },

/*Line 58 - 'AtomWindow.js' */            openWindow: function (scope, sender) {

/*Line 60 - 'AtomWindow.js' */                var tt = this.getTemplate("frameTemplate");

/*Line 62 - 'AtomWindow.js' */                tt = AtomUI.cloneNode(tt);

/*Line 64 - 'AtomWindow.js' */                var tt$ = $(tt);

/*Line 66 - 'AtomWindow.js' */                var wdiv = tt$.find("[data-atom-presenter=windowDiv],[atom-presenter=windowDiv]").get(0);
/*Line 67 - 'AtomWindow.js' */                var wtitle = tt$.find("[data-atom-presenter=windowTitleDiv],[atom-presenter=windowTitleDiv]").get(0);

/*Line 69 - 'AtomWindow.js' */                var wt = this.getTemplate("windowTemplate");

/*Line 71 - 'AtomWindow.js' */                $(wt).addClass("atom-window-template");

/*Line 73 - 'AtomWindow.js' */                if (!(AtomUI.attr(wt, "atom-dock"))) {
/*Line 74 - 'AtomWindow.js' */                    AtomUI.attr(wt, "atom-dock", "Fill");
/*Line 75 - 'AtomWindow.js' */                }

/*Line 77 - 'AtomWindow.js' */                if (wt.length) {
/*Line 78 - 'AtomWindow.js' */                    for (var i = 0; i < wt.length; i++) {
/*Line 79 - 'AtomWindow.js' */                        wdiv.appendChild(wt[i]);
/*Line 80 - 'AtomWindow.js' */                    }
/*Line 81 - 'AtomWindow.js' */                } else {
/*Line 82 - 'AtomWindow.js' */                    wdiv.appendChild(wt);
/*Line 83 - 'AtomWindow.js' */                }

/*Line 85 - 'AtomWindow.js' */                var wct = this.getTemplate("commandTemplate");
/*Line 86 - 'AtomWindow.js' */                if (wct) {
/*Line 87 - 'AtomWindow.js' */                    AtomUI.attr(wct, "atom-dock", "Bottom");
/*Line 88 - 'AtomWindow.js' */                    wct.setAttribute("class", "atom-wizard-command-bar");
/*Line 89 - 'AtomWindow.js' */                    wdiv.appendChild(wct);
/*Line 90 - 'AtomWindow.js' */                }

/*Line 92 - 'AtomWindow.js' */                this.set_innerTemplate(tt);

/*Line 94 - 'AtomWindow.js' */                if (this._iframe) {
/*Line 95 - 'AtomWindow.js' */                    this._iframe.atomWindow = this;
/*Line 96 - 'AtomWindow.js' */                }

/*Line 98 - 'AtomWindow.js' */                if (sender) {
/*Line 99 - 'AtomWindow.js' */                    this._opener = sender;
/*Line 100 - 'AtomWindow.js' */                    AtomBinder.refreshValue(this, "opener");
/*Line 101 - 'AtomWindow.js' */                    AtomBinder.refreshValue(this, "openerData");
/*Line 102 - 'AtomWindow.js' */                }

/*Line 104 - 'AtomWindow.js' */                var _this = this;
/*Line 105 - 'AtomWindow.js' */                WebAtoms.dispatcher.callLater(function () {
/*Line 106 - 'AtomWindow.js' */                    AtomBinder.setValue(_this, "isOpen", true);
/*Line 107 - 'AtomWindow.js' */                    if (!_this._url) {
/*Line 108 - 'AtomWindow.js' */                        var children = $(_this._windowPlaceholder).find("input");
/*Line 109 - 'AtomWindow.js' */                        if (children.length > 0) {
/*Line 110 - 'AtomWindow.js' */                            var item = children.get(0);
/*Line 111 - 'AtomWindow.js' */                            try {
/*Line 112 - 'AtomWindow.js' */                                item.focus();
/*Line 113 - 'AtomWindow.js' */                            } catch (er) {
/*Line 114 - 'AtomWindow.js' */                            }
/*Line 115 - 'AtomWindow.js' */                        }
/*Line 116 - 'AtomWindow.js' */                    }
/*Line 117 - 'AtomWindow.js' */                });
/*Line 118 - 'AtomWindow.js' */            },

/*Line 120 - 'AtomWindow.js' */            init: function () {



/*Line 124 - 'AtomWindow.js' */                $(this._element).addClass("atom-window-placeholder");
/*Line 125 - 'AtomWindow.js' */                baseType.init.call(this);

/*Line 127 - 'AtomWindow.js' */                var self = this;
/*Line 128 - 'AtomWindow.js' */                this.closeCommand = function () {
/*Line 129 - 'AtomWindow.js' */                    self.onCloseCommand.apply(self, arguments);
/*Line 130 - 'AtomWindow.js' */                };

/*Line 132 - 'AtomWindow.js' */                this.cancelCommand = function () {
/*Line 133 - 'AtomWindow.js' */                    self.onCancelCommand.apply(self, arguments);
/*Line 134 - 'AtomWindow.js' */                };

/*Line 136 - 'AtomWindow.js' */                this.openCommand = function () {
/*Line 137 - 'AtomWindow.js' */                    self.openWindow.apply(self, arguments);
/*Line 138 - 'AtomWindow.js' */                };

/*Line 140 - 'AtomWindow.js' */                WebAtoms.dispatcher.callLater(function () {
/*Line 141 - 'AtomWindow.js' */                    var e = self._element;
/*Line 142 - 'AtomWindow.js' */                    if (!e._logicalParent) {
/*Line 143 - 'AtomWindow.js' */                        e._logicalParent = e.parentNode;
/*Line 144 - 'AtomWindow.js' */                        $(e).remove();
/*Line 145 - 'AtomWindow.js' */                        document.body.appendChild(e);
/*Line 146 - 'AtomWindow.js' */                    }
/*Line 147 - 'AtomWindow.js' */                });
/*Line 148 - 'AtomWindow.js' */            }
/*Line 149 - 'AtomWindow.js' */        }
/*Line 150 - 'AtomWindow.js' */    });
/*Line 151 - 'AtomWindow.js' */})(WebAtoms.AtomControl.prototype);


/*Line 154 - 'AtomWindow.js' */WebAtoms.AtomWindow.openNewWindow = function (c) {
/*Line 155 - 'AtomWindow.js' */    var e1 = document.createElement("DIV");
/*Line 156 - 'AtomWindow.js' */    var id = AtomUI.assignID(e1);
/*Line 157 - 'AtomWindow.js' */    if (c.localScope) {
/*Line 158 - 'AtomWindow.js' */        e1.setAttribute("data-atom-local-scope", "true");
/*Line 159 - 'AtomWindow.js' */    }
/*Line 160 - 'AtomWindow.js' */    e1._logicalParent = c.opener;
/*Line 161 - 'AtomWindow.js' */    document.body.appendChild(e1);

/*Line 163 - 'AtomWindow.js' */    var w = AtomUI.createControl(e1, WebAtoms.AtomWindow);


/*Line 166 - 'AtomWindow.js' */    var url = c.url;

/*Line 168 - 'AtomWindow.js' */    if (url.length !== undefined) {
/*Line 169 - 'AtomWindow.js' */        c.next = url[1];
/*Line 170 - 'AtomWindow.js' */        c.url = url[0];
/*Line 171 - 'AtomWindow.js' */        url = new AtomUri(c.url);
/*Line 172 - 'AtomWindow.js' */    } else {
/*Line 173 - 'AtomWindow.js' */        url = {
/*Line 174 - 'AtomWindow.js' */            path: url.path,
/*Line 175 - 'AtomWindow.js' */            query: url.prop,
/*Line 176 - 'AtomWindow.js' */            hash: url.scope
/*Line 177 - 'AtomWindow.js' */        };
/*Line 178 - 'AtomWindow.js' */        if (c.url.next) {
/*Line 179 - 'AtomWindow.js' */            c.next = c.url.next;
/*Line 180 - 'AtomWindow.js' */        }
/*Line 181 - 'AtomWindow.js' */    }

/*Line 183 - 'AtomWindow.js' */    w._next = [c.next || {}, function () {
/*Line 184 - 'AtomWindow.js' */        WebAtoms.dispatcher.callLater(function () {
/*Line 185 - 'AtomWindow.js' */            w.dispose();
/*Line 186 - 'AtomWindow.js' */            $(e1).remove();
/*Line 187 - 'AtomWindow.js' */        });
/*Line 188 - 'AtomWindow.js' */    }];

/*Line 190 - 'AtomWindow.js' */    var wt = url.path;
/*Line 191 - 'AtomWindow.js' */    if (!AtomUI.isNode(wt)) {
/*Line 192 - 'AtomWindow.js' */        wt = Atom.get(c.scope, url.path);
/*Line 193 - 'AtomWindow.js' */    }

/*Line 195 - 'AtomWindow.js' */    var $wt = $( AtomUI.cloneNode(wt));
/*Line 196 - 'AtomWindow.js' */    var ct = $wt.children("[atom-template=commandTemplate],[data-atom-template=commandTemplate]").get(0);
/*Line 197 - 'AtomWindow.js' */    if (ct) {
/*Line 198 - 'AtomWindow.js' */        AtomUI.removeAttr(ct, "atom-template");
/*Line 199 - 'AtomWindow.js' */        w._commandTemplate = ct;
/*Line 200 - 'AtomWindow.js' */        $(ct).remove();
/*Line 201 - 'AtomWindow.js' */    }

/*Line 203 - 'AtomWindow.js' */    ct = $wt.children("[atom-template=windowTemplate],[data-atom-template=windowTemplate]").get(0);
/*Line 204 - 'AtomWindow.js' */    if (ct) {
/*Line 205 - 'AtomWindow.js' */        AtomUI.removeAttr(ct, "atom-template");
/*Line 206 - 'AtomWindow.js' */        w._windowTemplate = ct;
/*Line 207 - 'AtomWindow.js' */    } else {
/*Line 208 - 'AtomWindow.js' */        AtomUI.removeAttr(wt, "atom-template");
/*Line 209 - 'AtomWindow.js' */        w._windowTemplate = wt;
/*Line 210 - 'AtomWindow.js' */    }

/*Line 212 - 'AtomWindow.js' */    if (c.localScope && c.opener) {
/*Line 213 - 'AtomWindow.js' */        var d = c.opener.get_data();
/*Line 214 - 'AtomWindow.js' */        w._data = d;
/*Line 215 - 'AtomWindow.js' */    }

/*Line 217 - 'AtomWindow.js' */    w.init();

/*Line 219 - 'AtomWindow.js' */    WebAtoms.dispatcher.callLater(function () { 
/*Line 220 - 'AtomWindow.js' */        var scope = w.get_scope();

/*Line 222 - 'AtomWindow.js' */        var hash = url.hash;
/*Line 223 - 'AtomWindow.js' */        for (var i in hash) {
/*Line 224 - 'AtomWindow.js' */            if (hash.hasOwnProperty(i))
/*Line 225 - 'AtomWindow.js' */                Atom.set(scope, i, hash[i]);
/*Line 226 - 'AtomWindow.js' */        }

/*Line 228 - 'AtomWindow.js' */        var query = url.query;
/*Line 229 - 'AtomWindow.js' */        for (var i in query) {
/*Line 230 - 'AtomWindow.js' */            if (query.hasOwnProperty(i))
/*Line 231 - 'AtomWindow.js' */                Atom.set(w, i, query[i]);
/*Line 232 - 'AtomWindow.js' */        }

/*Line 234 - 'AtomWindow.js' */        w.openWindow(c.scope, c.opener);
/*Line 235 - 'AtomWindow.js' */    });
/*Line 236 - 'AtomWindow.js' */};
/*Line 0 - 'AtomCalendar.js' */

/*Line 2 - 'AtomCalendar.js' */(function (baseType) {
/*Line 3 - 'AtomCalendar.js' */    return classCreatorEx({
/*Line 4 - 'AtomCalendar.js' */        name: "WebAtoms.AtomCalendar",
/*Line 5 - 'AtomCalendar.js' */        base: baseType,
/*Line 6 - 'AtomCalendar.js' */        start: function (e) {
/*Line 7 - 'AtomCalendar.js' */            $(e).addClass("atom-calendar");

/*Line 9 - 'AtomCalendar.js' */            var today = new Date();
/*Line 10 - 'AtomCalendar.js' */            this._month = today.getMonth() + 1;
/*Line 11 - 'AtomCalendar.js' */            this._year = today.getFullYear();

/*Line 13 - 'AtomCalendar.js' */            this._startYear = -5;
/*Line 14 - 'AtomCalendar.js' */            this._endYear = 10;

/*Line 16 - 'AtomCalendar.js' */            this._currentYear = (new Date()).getFullYear();
/*Line 17 - 'AtomCalendar.js' */            this._value = null;


/*Line 20 - 'AtomCalendar.js' */        },
/*Line 21 - 'AtomCalendar.js' */        properties: {
/*Line 22 - 'AtomCalendar.js' */            month: 0,
/*Line 23 - 'AtomCalendar.js' */            year:0,
/*Line 24 - 'AtomCalendar.js' */            startYear: -5,
/*Line 25 - 'AtomCalendar.js' */            endYear: 0,
/*Line 26 - 'AtomCalendar.js' */            currentYear: 0,
/*Line 27 - 'AtomCalendar.js' */            visibleDate: undefined
/*Line 28 - 'AtomCalendar.js' */        },
/*Line 29 - 'AtomCalendar.js' */        methods: {
/*Line 30 - 'AtomCalendar.js' */            set_month: function (v) {
/*Line 31 - 'AtomCalendar.js' */                this._month = v;
/*Line 32 - 'AtomCalendar.js' */                this.updateCalendar();
/*Line 33 - 'AtomCalendar.js' */            },

/*Line 35 - 'AtomCalendar.js' */            set_year: function (v) {
/*Line 36 - 'AtomCalendar.js' */                this._year = v;
/*Line 37 - 'AtomCalendar.js' */                this.updateCalendar();
/*Line 38 - 'AtomCalendar.js' */            },

/*Line 40 - 'AtomCalendar.js' */            set_visibleDate: function (v) {
/*Line 41 - 'AtomCalendar.js' */                if (!v)
/*Line 42 - 'AtomCalendar.js' */                    return;
/*Line 43 - 'AtomCalendar.js' */                if (v == this._visibleDate)
/*Line 44 - 'AtomCalendar.js' */                    return;
/*Line 45 - 'AtomCalendar.js' */                this._visibleDate = v;
/*Line 46 - 'AtomCalendar.js' */                this._year = v.getFullYear();
/*Line 47 - 'AtomCalendar.js' */                this._month = v.getMonth() + 1;
/*Line 48 - 'AtomCalendar.js' */                this.updateCalendar();
/*Line 49 - 'AtomCalendar.js' */                AtomBinder.refreshValue(this, "year");
/*Line 50 - 'AtomCalendar.js' */                AtomBinder.refreshValue(this, "month");
/*Line 51 - 'AtomCalendar.js' */            },

/*Line 53 - 'AtomCalendar.js' */            onCreated: function () {
/*Line 54 - 'AtomCalendar.js' */                baseType.onCreated.call(this);
/*Line 55 - 'AtomCalendar.js' */                var self = this;
/*Line 56 - 'AtomCalendar.js' */                WebAtoms.dispatcher.callLater(function () {
/*Line 57 - 'AtomCalendar.js' */                    self.updateCalendar();
/*Line 58 - 'AtomCalendar.js' */                });
/*Line 59 - 'AtomCalendar.js' */            },

/*Line 61 - 'AtomCalendar.js' */            applyItemStyle: function (item, data, first, last) {
/*Line 62 - 'AtomCalendar.js' */            },

/*Line 64 - 'AtomCalendar.js' */            updateCalendar: function(){
/*Line 65 - 'AtomCalendar.js' */                if (!this._created)
/*Line 66 - 'AtomCalendar.js' */                    return;
/*Line 67 - 'AtomCalendar.js' */                var now = new Date();

/*Line 69 - 'AtomCalendar.js' */                var d = new Date(this._year, this._month - 1, 1);
/*Line 70 - 'AtomCalendar.js' */                var first = new Date(this._year, this._month - 1, 1);

/*Line 72 - 'AtomCalendar.js' */                if (first.getDay()) {
/*Line 73 - 'AtomCalendar.js' */                    // go to first day of the month...
/*Line 74 - 'AtomCalendar.js' */                    var start = first.getDay() - 1;
/*Line 75 - 'AtomCalendar.js' */                    start = -start;

/*Line 77 - 'AtomCalendar.js' */                    first.setDate(start);
/*Line 78 - 'AtomCalendar.js' */                }

/*Line 80 - 'AtomCalendar.js' */                var m = first.getMonth();
/*Line 81 - 'AtomCalendar.js' */                var y = first.getFullYear();

/*Line 83 - 'AtomCalendar.js' */                var items = [];

/*Line 85 - 'AtomCalendar.js' */                var i = 0;

/*Line 87 - 'AtomCalendar.js' */                var cm = this._month - 1;

/*Line 89 - 'AtomCalendar.js' */                for (i = 0; i < 42; i++) {
/*Line 90 - 'AtomCalendar.js' */                    var cd = i + first.getDate();
/*Line 91 - 'AtomCalendar.js' */                    var id = new Date(y, m, cd);
/*Line 92 - 'AtomCalendar.js' */                    var w = id.getDay();
/*Line 93 - 'AtomCalendar.js' */                    w = w == 0 || w == 6;
/*Line 94 - 'AtomCalendar.js' */                    items.push({
/*Line 95 - 'AtomCalendar.js' */                        label: id.getDate(),
/*Line 96 - 'AtomCalendar.js' */                        isWeekEnd: w,
/*Line 97 - 'AtomCalendar.js' */                        isToday:
/*Line 98 - 'AtomCalendar.js' */                            now.getDate() == id.getDate()
/*Line 99 - 'AtomCalendar.js' */                            && now.getMonth() == id.getMonth()
/*Line 100 - 'AtomCalendar.js' */                            && now.getFullYear() == id.getFullYear(),
/*Line 101 - 'AtomCalendar.js' */                        isOtherMonth: id.getMonth() != cm,
/*Line 102 - 'AtomCalendar.js' */                        dateLabel: AtomDate.toShortDateString(id),
/*Line 103 - 'AtomCalendar.js' */                        value: AtomDate.toMMDDYY(id),
/*Line 104 - 'AtomCalendar.js' */                        date: id
/*Line 105 - 'AtomCalendar.js' */                    });
/*Line 106 - 'AtomCalendar.js' */                }


/*Line 109 - 'AtomCalendar.js' */                AtomBinder.setValue(this, "items", items);
/*Line 110 - 'AtomCalendar.js' */            },
/*Line 111 - 'AtomCalendar.js' */            changeMonth: function (n) {
/*Line 112 - 'AtomCalendar.js' */                var m = this._month;
/*Line 113 - 'AtomCalendar.js' */                m += n;
/*Line 114 - 'AtomCalendar.js' */                if (m > 12) {
/*Line 115 - 'AtomCalendar.js' */                    m = 1;
/*Line 116 - 'AtomCalendar.js' */                    Atom.set(this, "year", this._year + 1);
/*Line 117 - 'AtomCalendar.js' */                }
/*Line 118 - 'AtomCalendar.js' */                if (m == 0) {
/*Line 119 - 'AtomCalendar.js' */                    Atom.set(this, "year", this._year - 1);
/*Line 120 - 'AtomCalendar.js' */                    m = 12;
/*Line 121 - 'AtomCalendar.js' */                }
/*Line 122 - 'AtomCalendar.js' */                AtomBinder.setValue(this, "month",m);
/*Line 123 - 'AtomCalendar.js' */            },
/*Line 124 - 'AtomCalendar.js' */            init: function () {
/*Line 125 - 'AtomCalendar.js' */                baseType.init.call(this);
/*Line 126 - 'AtomCalendar.js' */                var _this = this;
/*Line 127 - 'AtomCalendar.js' */                this.nextMonthCommand = function () {
/*Line 128 - 'AtomCalendar.js' */                    _this.changeMonth(1);
/*Line 129 - 'AtomCalendar.js' */                };
/*Line 130 - 'AtomCalendar.js' */                this.prevMonthCommand = function () {
/*Line 131 - 'AtomCalendar.js' */                    _this.changeMonth(-1);
/*Line 132 - 'AtomCalendar.js' */                }
/*Line 133 - 'AtomCalendar.js' */            }
/*Line 134 - 'AtomCalendar.js' */        }
/*Line 135 - 'AtomCalendar.js' */    });
/*Line 136 - 'AtomCalendar.js' */})(WebAtoms.AtomListBox.prototype);
/*Line 0 - 'AtomCheckBoxList.js' */

/*Line 2 - 'AtomCheckBoxList.js' */(function (base) {
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
/*Line 19 - 'AtomCheckBoxList.js' */})(WebAtoms.AtomItemsControl.prototype);

/*Line 0 - 'AtomDataPager.js' */

/*Line 2 - 'AtomDataPager.js' */(function (base) {

/*Line 4 - 'AtomDataPager.js' */    return classCreatorEx(
/*Line 5 - 'AtomDataPager.js' */        {
/*Line 6 - 'AtomDataPager.js' */            name: "WebAtoms.AtomDataPager",
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
/*Line 48 - 'AtomDataPager.js' */                    if (!this._pageSize)
/*Line 49 - 'AtomDataPager.js' */                        return;
/*Line 50 - 'AtomDataPager.js' */                    var l = this._items.length;
/*Line 51 - 'AtomDataPager.js' */                    var t = this._total;
/*Line 52 - 'AtomDataPager.js' */                    var count = Math.ceil(t / this._pageSize);

/*Line 54 - 'AtomDataPager.js' */                    if (count == this._pages.length)
/*Line 55 - 'AtomDataPager.js' */                        return;

/*Line 57 - 'AtomDataPager.js' */                    var ps = this._pageSize;
/*Line 58 - 'AtomDataPager.js' */                    var pages = [];
/*Line 59 - 'AtomDataPager.js' */                    var i;
/*Line 60 - 'AtomDataPager.js' */                    for (i = 0; i < count; i++) {
/*Line 61 - 'AtomDataPager.js' */                        pages.push({
/*Line 62 - 'AtomDataPager.js' */                            value: i,
/*Line 63 - 'AtomDataPager.js' */                            label: i + 1
/*Line 64 - 'AtomDataPager.js' */                        });
/*Line 65 - 'AtomDataPager.js' */                    }
/*Line 66 - 'AtomDataPager.js' */                    AtomBinder.setValue(this, "pages", pages);
/*Line 67 - 'AtomDataPager.js' */                },

/*Line 69 - 'AtomDataPager.js' */                set_items: function (v) {

/*Line 71 - 'AtomDataPager.js' */                    if (v != this._items) {
/*Line 72 - 'AtomDataPager.js' */                        if (this._items) {
/*Line 73 - 'AtomDataPager.js' */                            this.unbindEvent(this._items, "CollectionChanged", "onCollectionChangedInternal");
/*Line 74 - 'AtomDataPager.js' */                        }
/*Line 75 - 'AtomDataPager.js' */                    }

/*Line 77 - 'AtomDataPager.js' */                    if (!v)
/*Line 78 - 'AtomDataPager.js' */                        return;
/*Line 79 - 'AtomDataPager.js' */                    this._items = v;

/*Line 81 - 'AtomDataPager.js' */                    if (v != null && this._created) {
/*Line 82 - 'AtomDataPager.js' */                        this.bindEvent(this._items, "CollectionChanged", "onCollectionChangedInternal");
/*Line 83 - 'AtomDataPager.js' */                        this.onCollectionChangedInternal("refresh", -1, null);
/*Line 84 - 'AtomDataPager.js' */                    }

/*Line 86 - 'AtomDataPager.js' */                },

/*Line 88 - 'AtomDataPager.js' */                onCollectionChangedInternal: function () {
/*Line 89 - 'AtomDataPager.js' */                    var v = this._items;
/*Line 90 - 'AtomDataPager.js' */                    if (v.length === undefined) {
/*Line 91 - 'AtomDataPager.js' */                        var val = v[this._itemsPath];

/*Line 93 - 'AtomDataPager.js' */                        AtomBinder.setValue(this, "total", v[this._totalPath]);
/*Line 94 - 'AtomDataPager.js' */                        AtomBinder.setValue(this, "value", val);
/*Line 95 - 'AtomDataPager.js' */                    } else {
/*Line 96 - 'AtomDataPager.js' */                        if (v.total) {
/*Line 97 - 'AtomDataPager.js' */                            AtomBinder.setValue(this, "total", v.total);
/*Line 98 - 'AtomDataPager.js' */                        } else {
/*Line 99 - 'AtomDataPager.js' */                            //AtomBinder.setValue(this, "pages", []);
/*Line 100 - 'AtomDataPager.js' */                        }
/*Line 101 - 'AtomDataPager.js' */                        AtomBinder.setValue(this, "value", v);
/*Line 102 - 'AtomDataPager.js' */                    }

/*Line 104 - 'AtomDataPager.js' */                    this.preparePages();
/*Line 105 - 'AtomDataPager.js' */                },

/*Line 107 - 'AtomDataPager.js' */                onCreated: function () {
/*Line 108 - 'AtomDataPager.js' */                    if (this._items) {
/*Line 109 - 'AtomDataPager.js' */                        this.bindEvent(this._items, "CollectionChanged", "onCollectionChangedInternal");
/*Line 110 - 'AtomDataPager.js' */                        this.onCollectionChangedInternal("refresh", -1, null);
/*Line 111 - 'AtomDataPager.js' */                    }
/*Line 112 - 'AtomDataPager.js' */                },


/*Line 115 - 'AtomDataPager.js' */                set_currentPage: function (v) {
/*Line 116 - 'AtomDataPager.js' */                    this._currentPage = v;
/*Line 117 - 'AtomDataPager.js' */                    AtomBinder.refreshValue(this, "pageStart");
/*Line 118 - 'AtomDataPager.js' */                },

/*Line 120 - 'AtomDataPager.js' */                get_pageStart: function () {
/*Line 121 - 'AtomDataPager.js' */                    return this._currentPage * this._pageSize;
/*Line 122 - 'AtomDataPager.js' */                },

/*Line 124 - 'AtomDataPager.js' */                set_pageSize: function (v) {
/*Line 125 - 'AtomDataPager.js' */                    this._pageSize = v;
/*Line 126 - 'AtomDataPager.js' */                    this.preparePages();
/*Line 127 - 'AtomDataPager.js' */                },
/*Line 128 - 'AtomDataPager.js' */                set_total: function (v) {
/*Line 129 - 'AtomDataPager.js' */                    if (this._total == v)
/*Line 130 - 'AtomDataPager.js' */                        return;
/*Line 131 - 'AtomDataPager.js' */                    this._total = v;
/*Line 132 - 'AtomDataPager.js' */                },
/*Line 133 - 'AtomDataPager.js' */                init: function () {

/*Line 135 - 'AtomDataPager.js' */                    $(this._element).addClass("atom-data-pager");

/*Line 137 - 'AtomDataPager.js' */                    base.init.apply(this, arguments);
/*Line 138 - 'AtomDataPager.js' */                }
/*Line 139 - 'AtomDataPager.js' */            }

/*Line 141 - 'AtomDataPager.js' */    }
/*Line 142 - 'AtomDataPager.js' */);

/*Line 144 - 'AtomDataPager.js' */})(WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomDateControl.js' */

/*Line 2 - 'AtomDateControl.js' */// Date Month Year

/*Line 4 - 'AtomDateControl.js' */(function (base) {
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
/*Line 144 - 'AtomDateControl.js' */})(WebAtoms.AtomControl.prototype);

/*Line 0 - 'AtomDateField.js' */
/*Line 1 - 'AtomDateField.js' */

/*Line 3 - 'AtomDateField.js' */(function (base) {
/*Line 4 - 'AtomDateField.js' */    return classCreatorEx({
/*Line 5 - 'AtomDateField.js' */        name: "WebAtoms.AtomDateField",
/*Line 6 - 'AtomDateField.js' */        base: base,
/*Line 7 - 'AtomDateField.js' */        start: function (e) {
/*Line 8 - 'AtomDateField.js' */            this._presenters = ["calendarPresenter", "itemsPresenter"];
/*Line 9 - 'AtomDateField.js' */            $(e).addClass("atom-date-field");
/*Line 10 - 'AtomDateField.js' */        },
/*Line 11 - 'AtomDateField.js' */        properties: {
/*Line 12 - 'AtomDateField.js' */            isOpen: false,
/*Line 13 - 'AtomDateField.js' */            time: "9:00 AM"
/*Line 14 - 'AtomDateField.js' */        },
/*Line 15 - 'AtomDateField.js' */        methods: {
/*Line 16 - 'AtomDateField.js' */            get_offsetLeft: function () {
/*Line 17 - 'AtomDateField.js' */                //return $(this._element).offset().left - parseInt( $(atomApplication._element).css("left") , 10);
/*Line 18 - 'AtomDateField.js' */                return $(this._element).offset().left;
/*Line 19 - 'AtomDateField.js' */            },
/*Line 20 - 'AtomDateField.js' */            get_offsetTop: function () {
/*Line 21 - 'AtomDateField.js' */                return $(this._element).offset().top;
/*Line 22 - 'AtomDateField.js' */            },

/*Line 24 - 'AtomDateField.js' */            onPopupRemoved: function (e) {
/*Line 25 - 'AtomDateField.js' */                AtomBinder.setValue(this, "isOpen", false);
/*Line 26 - 'AtomDateField.js' */            },

/*Line 28 - 'AtomDateField.js' */            set_isOpen: function (v) {
/*Line 29 - 'AtomDateField.js' */                this._isOpen = v;
/*Line 30 - 'AtomDateField.js' */                if (v) {
/*Line 31 - 'AtomDateField.js' */                    this.getTemplate("popupTemplate");

/*Line 33 - 'AtomDateField.js' */                    this.popup = AtomUI.cloneNode(this._popupTemplate);
/*Line 34 - 'AtomDateField.js' */                    this.popup._logicalParent = this._element;
/*Line 35 - 'AtomDateField.js' */                    this.popup._templateParent = this;
/*Line 36 - 'AtomDateField.js' */                    //this.popup.style.visibility = "hidden";
/*Line 37 - 'AtomDateField.js' */                    document.body.appendChild(this.popup);
/*Line 38 - 'AtomDateField.js' */                    this.onCreateChildren(this.popup);
/*Line 39 - 'AtomDateField.js' */                    this.setProperties(this.popup);
/*Line 40 - 'AtomDateField.js' */                    this.initChildren(this.popup);

/*Line 42 - 'AtomDateField.js' */                    var _this = this;
/*Line 43 - 'AtomDateField.js' */                    this._refreshInterval = setInterval(function () {
/*Line 44 - 'AtomDateField.js' */                        AtomBinder.refreshValue(_this, "offsetLeft");
/*Line 45 - 'AtomDateField.js' */                        AtomBinder.refreshValue(_this, "offsetTop");
/*Line 46 - 'AtomDateField.js' */                    });

/*Line 48 - 'AtomDateField.js' */                    AtomPopup.show(this._element, this.popup, -1, function () {
/*Line 49 - 'AtomDateField.js' */                        Atom.set(_this, "isOpen", false);
/*Line 50 - 'AtomDateField.js' */                    });

/*Line 52 - 'AtomDateField.js' */                    //var _this = this;
/*Line 53 - 'AtomDateField.js' */                    //WebAtoms.dispatcher.callLater(function () {
/*Line 54 - 'AtomDateField.js' */                    //    AtomPopup.show(_this._element, _this.popup, 0, function () {
/*Line 55 - 'AtomDateField.js' */                    //        _this.onPopupRemoved(_this.popup);
/*Line 56 - 'AtomDateField.js' */                    //    });
/*Line 57 - 'AtomDateField.js' */                    //});
/*Line 58 - 'AtomDateField.js' */                } else {
/*Line 59 - 'AtomDateField.js' */                    //AtomPopup.hide(this.popup);
/*Line 60 - 'AtomDateField.js' */                    if (this._refreshInterval) {
/*Line 61 - 'AtomDateField.js' */                        clearInterval(this._refreshInterval);
/*Line 62 - 'AtomDateField.js' */                    }
/*Line 63 - 'AtomDateField.js' */                    if (this.popup) {
/*Line 64 - 'AtomDateField.js' */                        this.disposeChildren(this.popup);
/*Line 65 - 'AtomDateField.js' */                        $(this.popup).remove();
/*Line 66 - 'AtomDateField.js' */                        this.popup = null;
/*Line 67 - 'AtomDateField.js' */                    }
/*Line 68 - 'AtomDateField.js' */                }
/*Line 69 - 'AtomDateField.js' */            },

/*Line 71 - 'AtomDateField.js' */            dispose: function () {
/*Line 72 - 'AtomDateField.js' */                this.set_isOpen(false);
/*Line 73 - 'AtomDateField.js' */                base.dispose.call(this);
/*Line 74 - 'AtomDateField.js' */            },
/*Line 75 - 'AtomDateField.js' */            get_isOpen: function () {
/*Line 76 - 'AtomDateField.js' */                return this._isOpen;
/*Line 77 - 'AtomDateField.js' */            },

/*Line 79 - 'AtomDateField.js' */            get_selectedItem: function () {
/*Line 80 - 'AtomDateField.js' */                if (this._selectedItems.length)
/*Line 81 - 'AtomDateField.js' */                    return this._selectedItems[0];
/*Line 82 - 'AtomDateField.js' */                return null;
/*Line 83 - 'AtomDateField.js' */            },

/*Line 85 - 'AtomDateField.js' */            set_time: function (v) {
/*Line 86 - 'AtomDateField.js' */                if (this._set_timeCalled)
/*Line 87 - 'AtomDateField.js' */                    return;
/*Line 88 - 'AtomDateField.js' */                this._set_timeCalled = true;
/*Line 89 - 'AtomDateField.js' */                if (v) {
/*Line 90 - 'AtomDateField.js' */                    this._time = v;
/*Line 91 - 'AtomDateField.js' */                    var d = AtomDate.setTime(this.get_value(), v);
/*Line 92 - 'AtomDateField.js' */                    AtomBinder.setValue(this, "value", d);
/*Line 93 - 'AtomDateField.js' */                }
/*Line 94 - 'AtomDateField.js' */                this._set_timeCalled = false;
/*Line 95 - 'AtomDateField.js' */            },

/*Line 97 - 'AtomDateField.js' */            set_value: function (v) {
/*Line 98 - 'AtomDateField.js' */                v = AtomDate.parse(v);
/*Line 99 - 'AtomDateField.js' */                this._value = v;

/*Line 101 - 'AtomDateField.js' */                AtomBinder.setValue(this, "time", AtomDate.toTimeString(v));

/*Line 103 - 'AtomDateField.js' */                this._selectedItems.length = 0;
/*Line 104 - 'AtomDateField.js' */                if (v) {

/*Line 106 - 'AtomDateField.js' */                    this._selectedItems.push({ date: v, dateLabel: AtomDate.toShortDateString(v), value: AtomDate.toMMDDYY(v), label: v.getDate() });
/*Line 107 - 'AtomDateField.js' */                    this.set_visibleDate(v);
/*Line 108 - 'AtomDateField.js' */                }
/*Line 109 - 'AtomDateField.js' */                if (this._created) {
/*Line 110 - 'AtomDateField.js' */                    AtomBinder.refreshItems(this._selectedItems);
/*Line 111 - 'AtomDateField.js' */                    AtomBinder.refreshValue(this, "value");
/*Line 112 - 'AtomDateField.js' */                    AtomBinder.refreshValue(this, "selectedItem");
/*Line 113 - 'AtomDateField.js' */                    AtomBinder.refreshValue(this, "selectedItems");
/*Line 114 - 'AtomDateField.js' */                }
/*Line 115 - 'AtomDateField.js' */            },
/*Line 116 - 'AtomDateField.js' */            get_value: function (v) {
/*Line 117 - 'AtomDateField.js' */                if (this._selectedItems.length)
/*Line 118 - 'AtomDateField.js' */                    return this._selectedItems[0].date;
/*Line 119 - 'AtomDateField.js' */                return this._value;
/*Line 120 - 'AtomDateField.js' */            },

/*Line 122 - 'AtomDateField.js' */            toggleDate: function (scope, sender) {
/*Line 123 - 'AtomDateField.js' */                var item = sender.get_data();
/*Line 124 - 'AtomDateField.js' */                this._selectedItems.length = 0;
/*Line 125 - 'AtomDateField.js' */                AtomBinder.addItem(this._selectedItems, item);
/*Line 126 - 'AtomDateField.js' */                AtomBinder.refreshValue(this, "value");
/*Line 127 - 'AtomDateField.js' */                AtomBinder.refreshValue(this, "selectedItem");
/*Line 128 - 'AtomDateField.js' */                AtomBinder.refreshValue(this, "selectedItems");
/*Line 129 - 'AtomDateField.js' */                AtomBinder.setValue(this, "isOpen", false);
/*Line 130 - 'AtomDateField.js' */            }


/*Line 133 - 'AtomDateField.js' */        }
/*Line 134 - 'AtomDateField.js' */    });
/*Line 135 - 'AtomDateField.js' */})(WebAtoms.AtomDateListBox.prototype);
/*Line 0 - 'AtomDeleteButton.js' */

/*Line 2 - 'AtomDeleteButton.js' */(function (base) {
/*Line 3 - 'AtomDeleteButton.js' */    return classCreatorEx({
/*Line 4 - 'AtomDeleteButton.js' */        name: "WebAtoms.AtomDeleteButton",
/*Line 5 - 'AtomDeleteButton.js' */        base: base,
/*Line 6 - 'AtomDeleteButton.js' */        start: function () {
/*Line 7 - 'AtomDeleteButton.js' */            this._confirm = true;
/*Line 8 - 'AtomDeleteButton.js' */            this._confirmMessage = "Are you sure you want to delete this item?";
/*Line 9 - 'AtomDeleteButton.js' */        },
/*Line 10 - 'AtomDeleteButton.js' */        methods: {
/*Line 11 - 'AtomDeleteButton.js' */        },
/*Line 12 - 'AtomDeleteButton.js' */        properties: {
/*Line 13 - 'AtomDeleteButton.js' */        }
/*Line 14 - 'AtomDeleteButton.js' */    });
/*Line 15 - 'AtomDeleteButton.js' */})(WebAtoms.AtomPostButton.prototype);

/*Line 0 - 'AtomFrameView.js' */
/*Line 1 - 'AtomFrameView.js' */

/*Line 3 - 'AtomFrameView.js' */(function (baseType) {
/*Line 4 - 'AtomFrameView.js' */    return createClass({
/*Line 5 - 'AtomFrameView.js' */        name: "WebAtoms.AtomFrameView",
/*Line 6 - 'AtomFrameView.js' */        base: baseType,
/*Line 7 - 'AtomFrameView.js' */        start: function (e) {
/*Line 8 - 'AtomFrameView.js' */            var self = this;
/*Line 9 - 'AtomFrameView.js' */            $(e).addClass("atom-frame-view");
/*Line 10 - 'AtomFrameView.js' */            this._items = [];
/*Line 11 - 'AtomFrameView.js' */            this._layout = WebAtoms.AtomViewBoxLayout.defaultInstance;
/*Line 12 - 'AtomFrameView.js' */            this.backCommand = function () {
/*Line 13 - 'AtomFrameView.js' */                self.onBackCommand.apply(self, arguments);
/*Line 14 - 'AtomFrameView.js' */            };
/*Line 15 - 'AtomFrameView.js' */        },
/*Line 16 - 'AtomFrameView.js' */        properties: {
/*Line 17 - 'AtomFrameView.js' */            url: '',
/*Line 18 - 'AtomFrameView.js' */            replaceUrl: '',
/*Line 19 - 'AtomFrameView.js' */            layout: null,
/*Line 20 - 'AtomFrameView.js' */            items: [],
/*Line 21 - 'AtomFrameView.js' */            removeOnBack: true
/*Line 22 - 'AtomFrameView.js' */        },
/*Line 23 - 'AtomFrameView.js' */        methods: {
/*Line 24 - 'AtomFrameView.js' */            set_replaceUrl: function (v) {
/*Line 25 - 'AtomFrameView.js' */                //var item = Atom.query(this._items).firstOrDefault({ index: this._selectedIndex });
/*Line 26 - 'AtomFrameView.js' */                //this.replaceItemWithUrl(item, v);
/*Line 27 - 'AtomFrameView.js' */                var ae = new AtomEnumerator(this._items);

/*Line 29 - 'AtomFrameView.js' */                var remove = [];

/*Line 31 - 'AtomFrameView.js' */                this.set_url(v);

/*Line 33 - 'AtomFrameView.js' */                while (ae.next()) {
/*Line 34 - 'AtomFrameView.js' */                    var item = ae.current();
/*Line 35 - 'AtomFrameView.js' */                    if (item.url != v) {
/*Line 36 - 'AtomFrameView.js' */                        this.replaceItemWithUrl(item);
/*Line 37 - 'AtomFrameView.js' */                    }
/*Line 38 - 'AtomFrameView.js' */                }


/*Line 41 - 'AtomFrameView.js' */            },

/*Line 43 - 'AtomFrameView.js' */            set_url: function (v) {
/*Line 44 - 'AtomFrameView.js' */                if (!v) {
/*Line 45 - 'AtomFrameView.js' */                    return;
/*Line 46 - 'AtomFrameView.js' */                }

/*Line 48 - 'AtomFrameView.js' */                if (/replace\:/.test(v)) {
/*Line 49 - 'AtomFrameView.js' */                    this.set_replaceUrl(v.substr(8));
/*Line 50 - 'AtomFrameView.js' */                    this._url = v;
/*Line 51 - 'AtomFrameView.js' */                    return;
/*Line 52 - 'AtomFrameView.js' */                }

/*Line 54 - 'AtomFrameView.js' */                var i = v.indexOf('?');
/*Line 55 - 'AtomFrameView.js' */                var u = v;
/*Line 56 - 'AtomFrameView.js' */                var q = "";
/*Line 57 - 'AtomFrameView.js' */                var self = this;
/*Line 58 - 'AtomFrameView.js' */                if (i !== -1) {
/*Line 59 - 'AtomFrameView.js' */                    u = v.substr(0,i);
/*Line 60 - 'AtomFrameView.js' */                    q = v.substr(i + 1);
/*Line 61 - 'AtomFrameView.js' */                }

/*Line 63 - 'AtomFrameView.js' */                var items = this._items;

/*Line 65 - 'AtomFrameView.js' */                var item = Atom.query(items).firstOrDefault({ url: u });
/*Line 66 - 'AtomFrameView.js' */                if (!item) {

/*Line 68 - 'AtomFrameView.js' */                    // get item from scope...
/*Line 69 - 'AtomFrameView.js' */                    var scope = Atom.get(this, "scope");
/*Line 70 - 'AtomFrameView.js' */                    var t = scope[u];
/*Line 71 - 'AtomFrameView.js' */                    if (!t) {
/*Line 72 - 'AtomFrameView.js' */                        if (console && console.error) {
/*Line 73 - 'AtomFrameView.js' */                            console.error("Page Template " + t + " not found");
/*Line 74 - 'AtomFrameView.js' */                        }
/*Line 75 - 'AtomFrameView.js' */                        return;
/*Line 76 - 'AtomFrameView.js' */                    }

/*Line 78 - 'AtomFrameView.js' */                    t = AtomUI.cloneNode(t);
/*Line 79 - 'AtomFrameView.js' */                    t._logicalParent = this._element;
/*Line 80 - 'AtomFrameView.js' */                    item = {
/*Line 81 - 'AtomFrameView.js' */                        url: u,
/*Line 82 - 'AtomFrameView.js' */                        index: items.length,
/*Line 83 - 'AtomFrameView.js' */                        opener: this._url,
/*Line 84 - 'AtomFrameView.js' */                        element: t
/*Line 85 - 'AtomFrameView.js' */                    };
/*Line 86 - 'AtomFrameView.js' */                    Atom.add(items, item);
/*Line 87 - 'AtomFrameView.js' */                    var c = AtomUI.createControl(t, AtomUI.getAtomType(t) || WebAtoms.AtomControl);
/*Line 88 - 'AtomFrameView.js' */                    item.control = c;
/*Line 89 - 'AtomFrameView.js' */                    WebAtoms.dispatcher.callLater(function () {
/*Line 90 - 'AtomFrameView.js' */                        c.init();
/*Line 91 - 'AtomFrameView.js' */                        self._element.appendChild(t);
/*Line 92 - 'AtomFrameView.js' */                        Atom.set(self, "selectedIndex", item.index);
/*Line 93 - 'AtomFrameView.js' */                        self.updateUI();
/*Line 94 - 'AtomFrameView.js' */                    });
/*Line 95 - 'AtomFrameView.js' */                } else {
/*Line 96 - 'AtomFrameView.js' */                    Atom.set(this, "selectedIndex", item.index);
/*Line 97 - 'AtomFrameView.js' */                    this.updateUI();
/*Line 98 - 'AtomFrameView.js' */                }

/*Line 100 - 'AtomFrameView.js' */                if (q) {
/*Line 101 - 'AtomFrameView.js' */                    //WebAtoms.dispatcher.callLater(function () {
/*Line 102 - 'AtomFrameView.js' */                    //    location.hash = q;
/*Line 103 - 'AtomFrameView.js' */                    //});
/*Line 104 - 'AtomFrameView.js' */                    this.invokeAction({ appScope: AtomUI.parseUrl(q) });
/*Line 105 - 'AtomFrameView.js' */                }
/*Line 106 - 'AtomFrameView.js' */                this._url = v;
/*Line 107 - 'AtomFrameView.js' */            },

/*Line 109 - 'AtomFrameView.js' */            replaceItemWithUrl: function (item, url) {
/*Line 110 - 'AtomFrameView.js' */                if (url) {
/*Line 111 - 'AtomFrameView.js' */                    this.set_url(url);
/*Line 112 - 'AtomFrameView.js' */                }
/*Line 113 - 'AtomFrameView.js' */                if (item) {
/*Line 114 - 'AtomFrameView.js' */                    var self = this;
/*Line 115 - 'AtomFrameView.js' */                    setTimeout(function () {
/*Line 116 - 'AtomFrameView.js' */                        self.removeItem(item);
/*Line 117 - 'AtomFrameView.js' */                    }, 1000);
/*Line 118 - 'AtomFrameView.js' */                }

/*Line 120 - 'AtomFrameView.js' */            },

/*Line 122 - 'AtomFrameView.js' */            removeItem: function (item) {
/*Line 123 - 'AtomFrameView.js' */                Atom.remove(this._items, item);
/*Line 124 - 'AtomFrameView.js' */                item.control.dispose();
/*Line 125 - 'AtomFrameView.js' */                $(item.element).remove();

/*Line 127 - 'AtomFrameView.js' */                var ae = new AtomEnumerator(this._items);
/*Line 128 - 'AtomFrameView.js' */                while (ae.next()) {
/*Line 129 - 'AtomFrameView.js' */                    item = ae.current();
/*Line 130 - 'AtomFrameView.js' */                    item.index = ae.currentIndex();
/*Line 131 - 'AtomFrameView.js' */                }
/*Line 132 - 'AtomFrameView.js' */            },

/*Line 134 - 'AtomFrameView.js' */            onBackCommand: function () {
/*Line 135 - 'AtomFrameView.js' */                var index = this._selectedIndex;
/*Line 136 - 'AtomFrameView.js' */                if (index) {
/*Line 137 - 'AtomFrameView.js' */                    var item = Atom.query(this._items).firstOrDefault({ index: index });
/*Line 138 - 'AtomFrameView.js' */                    if (item) {
/*Line 139 - 'AtomFrameView.js' */                        var self = this;
/*Line 140 - 'AtomFrameView.js' */                        index = index - 1;
/*Line 141 - 'AtomFrameView.js' */                        Atom.set(this, "selectedIndex", index);
/*Line 142 - 'AtomFrameView.js' */                        if (self._removeOnBack) {
/*Line 143 - 'AtomFrameView.js' */                            this.replaceItemWithUrl(item, item.opener);
/*Line 144 - 'AtomFrameView.js' */                        }

/*Line 146 - 'AtomFrameView.js' */                    }
/*Line 147 - 'AtomFrameView.js' */                }
/*Line 148 - 'AtomFrameView.js' */            },
/*Line 149 - 'AtomFrameView.js' */            init: function () {
/*Line 150 - 'AtomFrameView.js' */                baseType.init.call(this);
/*Line 151 - 'AtomFrameView.js' */                var self = this;
/*Line 152 - 'AtomFrameView.js' */                var u = this._url;
/*Line 153 - 'AtomFrameView.js' */                if (u) {
/*Line 154 - 'AtomFrameView.js' */                    WebAtoms.dispatcher.callLater(function () {
/*Line 155 - 'AtomFrameView.js' */                        self.set_url(u);
/*Line 156 - 'AtomFrameView.js' */                    });
/*Line 157 - 'AtomFrameView.js' */                }
/*Line 158 - 'AtomFrameView.js' */            }
/*Line 159 - 'AtomFrameView.js' */        }
/*Line 160 - 'AtomFrameView.js' */    });
/*Line 161 - 'AtomFrameView.js' */})(WebAtoms.AtomViewStack.prototype);
/*Line 0 - 'AtomLinkBar.js' */

/*Line 2 - 'AtomLinkBar.js' */(function (base) {
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

/*Line 24 - 'AtomLinkBar.js' */            setClass: function () {
/*Line 25 - 'AtomLinkBar.js' */                var $e = $(this._element);
/*Line 26 - 'AtomLinkBar.js' */                $e.removeClass("atom-tab-bar atom-link-bar");
/*Line 27 - 'AtomLinkBar.js' */                $e.addClass(this._showTabs ? 'atom-tab-bar' : 'atom-link-bar');
/*Line 28 - 'AtomLinkBar.js' */            },

/*Line 30 - 'AtomLinkBar.js' */            set_menuDirection: function (v) {
/*Line 31 - 'AtomLinkBar.js' */                var $e = $(this._element);
/*Line 32 - 'AtomLinkBar.js' */                $e.removeClass("vertical horizontal");
/*Line 33 - 'AtomLinkBar.js' */                $e.addClass(v);
/*Line 34 - 'AtomLinkBar.js' */                this._menuDirection = v;
/*Line 35 - 'AtomLinkBar.js' */            },

/*Line 37 - 'AtomLinkBar.js' */            onClick: function () {
/*Line 38 - 'AtomLinkBar.js' */            },



/*Line 42 - 'AtomLinkBar.js' */            openMenu: function (e) {

/*Line 44 - 'AtomLinkBar.js' */                var target = e.target;

/*Line 46 - 'AtomLinkBar.js' */                var ap = this.get_atomParent(target);

/*Line 48 - 'AtomLinkBar.js' */                if (ap == null)
/*Line 49 - 'AtomLinkBar.js' */                    return;

/*Line 51 - 'AtomLinkBar.js' */                var data = ap.get_data();

/*Line 53 - 'AtomLinkBar.js' */                if (!data[this._itemsPath])
/*Line 54 - 'AtomLinkBar.js' */                    return;

/*Line 56 - 'AtomLinkBar.js' */                var menu = this._subMenu;

/*Line 58 - 'AtomLinkBar.js' */                if (menu) {
/*Line 59 - 'AtomLinkBar.js' */                    AtomPopup.hide(menu._element);
/*Line 60 - 'AtomLinkBar.js' */                }
/*Line 61 - 'AtomLinkBar.js' */                else {

/*Line 63 - 'AtomLinkBar.js' */                    var mt = this.getTemplate("menuTemplate");

/*Line 65 - 'AtomLinkBar.js' */                    menu = AtomUI.cloneNode(mt);
/*Line 66 - 'AtomLinkBar.js' */                    menu._templateParent = this;
/*Line 67 - 'AtomLinkBar.js' */                    menu.style.position = "absolute";
/*Line 68 - 'AtomLinkBar.js' */                    //menu.style.zOrder = 
/*Line 69 - 'AtomLinkBar.js' */                    document.body.appendChild(menu);
/*Line 70 - 'AtomLinkBar.js' */                    var mt = AtomUI.getAtomType(mt) || WebAtoms.AtomControl;

/*Line 72 - 'AtomLinkBar.js' */                    menu = AtomUI.createControl(menu, mt, data);

/*Line 74 - 'AtomLinkBar.js' */                    this._subMenu = menu;
/*Line 75 - 'AtomLinkBar.js' */                }

/*Line 77 - 'AtomLinkBar.js' */                AtomBinder.setValue(menu, "data", data);

/*Line 79 - 'AtomLinkBar.js' */                AtomPopup.show(ap._element, menu._element, 0);

/*Line 81 - 'AtomLinkBar.js' */                AtomUI.cancelEvent(e);
/*Line 82 - 'AtomLinkBar.js' */            },


/*Line 85 - 'AtomLinkBar.js' */            selectDefault: function () {
/*Line 86 - 'AtomLinkBar.js' */                if (!this._items)
/*Line 87 - 'AtomLinkBar.js' */                    return;

/*Line 89 - 'AtomLinkBar.js' */                if (!this._selectCurrent)
/*Line 90 - 'AtomLinkBar.js' */                    return;

/*Line 92 - 'AtomLinkBar.js' */                if (this._value) {
/*Line 93 - 'AtomLinkBar.js' */                    return;
/*Line 94 - 'AtomLinkBar.js' */                }
/*Line 95 - 'AtomLinkBar.js' */                AtomBinder.setValue(this, "value", location.pathname);

/*Line 97 - 'AtomLinkBar.js' */                if (this.get_selectedIndex() == -1) {
/*Line 98 - 'AtomLinkBar.js' */                    this.selectItem(this._items);
/*Line 99 - 'AtomLinkBar.js' */                }

/*Line 101 - 'AtomLinkBar.js' */                this.updateSelectionBindings();
/*Line 102 - 'AtomLinkBar.js' */            },

/*Line 104 - 'AtomLinkBar.js' */            selectItem: function (a, t) {
/*Line 105 - 'AtomLinkBar.js' */                var ae = new AtomEnumerator(a);
/*Line 106 - 'AtomLinkBar.js' */                var vp = this._valuePath;
/*Line 107 - 'AtomLinkBar.js' */                var lp = location.pathname.toLowerCase();
/*Line 108 - 'AtomLinkBar.js' */                while (ae.next()) {
/*Line 109 - 'AtomLinkBar.js' */                    var item = ae.current();
/*Line 110 - 'AtomLinkBar.js' */                    var l = item;
/*Line 111 - 'AtomLinkBar.js' */                    if (vp)
/*Line 112 - 'AtomLinkBar.js' */                        l = l[vp];
/*Line 113 - 'AtomLinkBar.js' */                    if (!l)
/*Line 114 - 'AtomLinkBar.js' */                        continue;
/*Line 115 - 'AtomLinkBar.js' */                    if (lp == l.toLowerCase()) {
/*Line 116 - 'AtomLinkBar.js' */                        if (!t) {
/*Line 117 - 'AtomLinkBar.js' */                            AtomBinder.setValue(this, "selectedItem", item);
/*Line 118 - 'AtomLinkBar.js' */                        }
/*Line 119 - 'AtomLinkBar.js' */                        return true;
/*Line 120 - 'AtomLinkBar.js' */                    }

/*Line 122 - 'AtomLinkBar.js' */                    if (item.links) {
/*Line 123 - 'AtomLinkBar.js' */                        if (this.selectItem(item.links, true)) {
/*Line 124 - 'AtomLinkBar.js' */                            AtomBinder.setValue(this, "selectedItem", item);
/*Line 125 - 'AtomLinkBar.js' */                            return true;
/*Line 126 - 'AtomLinkBar.js' */                        }
/*Line 127 - 'AtomLinkBar.js' */                    }
/*Line 128 - 'AtomLinkBar.js' */                }
/*Line 129 - 'AtomLinkBar.js' */                return false;
/*Line 130 - 'AtomLinkBar.js' */            },

/*Line 132 - 'AtomLinkBar.js' */            dispose: function () {

/*Line 134 - 'AtomLinkBar.js' */                if (this._subMenu) {
/*Line 135 - 'AtomLinkBar.js' */                    this._subMenu.dispose();
/*Line 136 - 'AtomLinkBar.js' */                    this._subMenu = null;
/*Line 137 - 'AtomLinkBar.js' */                }
/*Line 138 - 'AtomLinkBar.js' */                base.dispose.apply(this, arguments);
/*Line 139 - 'AtomLinkBar.js' */            },

/*Line 141 - 'AtomLinkBar.js' */            init: function () {
/*Line 142 - 'AtomLinkBar.js' */                base.init.apply(this, arguments);

/*Line 144 - 'AtomLinkBar.js' */                //this.bindEvent(this._element, "mouseover", "openMenuCommand");
/*Line 145 - 'AtomLinkBar.js' */                this.bindEvent(this._element, "click", "openMenuCommand");
/*Line 146 - 'AtomLinkBar.js' */                //this.setValue("class", "[$owner.showTabs ? 'atom-tab-button-bar' : 'menu atom-link-bar']", true, this._element);
/*Line 147 - 'AtomLinkBar.js' */                //this.bind(this._element,
/*Line 148 - 'AtomLinkBar.js' */                //    'class',
/*Line 149 - 'AtomLinkBar.js' */                //    ['showTabs'], 0,
/*Line 150 - 'AtomLinkBar.js' */                //    function (v) {
/*Line 151 - 'AtomLinkBar.js' */                //        return v ? 'atom-tab-bar' : 'atom-link-bar'
/*Line 152 - 'AtomLinkBar.js' */                //    });

/*Line 154 - 'AtomLinkBar.js' */                this.set_menuDirection('horizontal');
/*Line 155 - 'AtomLinkBar.js' */            }

/*Line 157 - 'AtomLinkBar.js' */        }
/*Line 158 - 'AtomLinkBar.js' */    });
/*Line 159 - 'AtomLinkBar.js' */})(WebAtoms.AtomToggleButtonBar.prototype);

/*Line 0 - 'AtomMultiButtonList.js' */

/*Line 2 - 'AtomMultiButtonList.js' */(function (base) {
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
/*Line 70 - 'AtomMultiButtonList.js' */                    var ce = ace.current();
/*Line 71 - 'AtomMultiButtonList.js' */                    ce.checked = false;
/*Line 72 - 'AtomMultiButtonList.js' */                }

/*Line 74 - 'AtomMultiButtonList.js' */                if (!this._value)
/*Line 75 - 'AtomMultiButtonList.js' */                    return;

/*Line 77 - 'AtomMultiButtonList.js' */                var ae;
/*Line 78 - 'AtomMultiButtonList.js' */                var ace;
/*Line 79 - 'AtomMultiButtonList.js' */                var item;
/*Line 80 - 'AtomMultiButtonList.js' */                var selections = this._value.split(",");

/*Line 82 - 'AtomMultiButtonList.js' */                ace.reset();

/*Line 84 - 'AtomMultiButtonList.js' */                var cb;
/*Line 85 - 'AtomMultiButtonList.js' */                while (ace.next()) {
/*Line 86 - 'AtomMultiButtonList.js' */                    cb = ace.current();
/*Line 87 - 'AtomMultiButtonList.js' */                    ae = new AtomEnumerator(selections);
/*Line 88 - 'AtomMultiButtonList.js' */                    while (ae.next()) {
/*Line 89 - 'AtomMultiButtonList.js' */                        item = ae.current();
/*Line 90 - 'AtomMultiButtonList.js' */                        item = $.trim(item);
/*Line 91 - 'AtomMultiButtonList.js' */                        if (cb.value == item) {
/*Line 92 - 'AtomMultiButtonList.js' */                            cb.checked = true;
/*Line 93 - 'AtomMultiButtonList.js' */                        }
/*Line 94 - 'AtomMultiButtonList.js' */                    }
/*Line 95 - 'AtomMultiButtonList.js' */                }
/*Line 96 - 'AtomMultiButtonList.js' */            },

/*Line 98 - 'AtomMultiButtonList.js' */            onDataChange: function () {
/*Line 99 - 'AtomMultiButtonList.js' */                var ae = new AtomEnumerator(this._dataElements);
/*Line 100 - 'AtomMultiButtonList.js' */                var add = [];
/*Line 101 - 'AtomMultiButtonList.js' */                while (ae.next()) {
/*Line 102 - 'AtomMultiButtonList.js' */                    var item = ae.current();
/*Line 103 - 'AtomMultiButtonList.js' */                    var dataItem = $(item).val();
/*Line 104 - 'AtomMultiButtonList.js' */                    //var checked = $(item).attr("checked");
/*Line 105 - 'AtomMultiButtonList.js' */                    if (item.checked) {
/*Line 106 - 'AtomMultiButtonList.js' */                        add.push(dataItem);
/*Line 107 - 'AtomMultiButtonList.js' */                    }
/*Line 108 - 'AtomMultiButtonList.js' */                }
/*Line 109 - 'AtomMultiButtonList.js' */                this._value = add.join(", ");
/*Line 110 - 'AtomMultiButtonList.js' */                AtomBinder.refreshValue(this, "value");
/*Line 111 - 'AtomMultiButtonList.js' */            },

/*Line 113 - 'AtomMultiButtonList.js' */            createChildElement: function (parentScope, parentElement, data) {
/*Line 114 - 'AtomMultiButtonList.js' */                var span = document.createElement("SPAN");
/*Line 115 - 'AtomMultiButtonList.js' */                parentElement.appendChild(span);

/*Line 117 - 'AtomMultiButtonList.js' */                parentElement = span;
/*Line 118 - 'AtomMultiButtonList.js' */                span = document.createElement("SPAN");
/*Line 119 - 'AtomMultiButtonList.js' */                var lp = this.get_labelPath();
/*Line 120 - 'AtomMultiButtonList.js' */                var vp = this.get_valuePath();
/*Line 121 - 'AtomMultiButtonList.js' */                l = data;
/*Line 122 - 'AtomMultiButtonList.js' */                v = data;
/*Line 123 - 'AtomMultiButtonList.js' */                if (lp)
/*Line 124 - 'AtomMultiButtonList.js' */                    l = data[lp];
/*Line 125 - 'AtomMultiButtonList.js' */                if (vp)
/*Line 126 - 'AtomMultiButtonList.js' */                    v = data[vp];


/*Line 129 - 'AtomMultiButtonList.js' */                var gpName = null;
/*Line 130 - 'AtomMultiButtonList.js' */                if (this._isRadio) {
/*Line 131 - 'AtomMultiButtonList.js' */                    gpName = "_g" + AtomUI.getNewIndex();
/*Line 132 - 'AtomMultiButtonList.js' */                }

/*Line 134 - 'AtomMultiButtonList.js' */                parentElement.appendChild(span);

/*Line 136 - 'AtomMultiButtonList.js' */                var options = new AtomEnumerator(this._options);
/*Line 137 - 'AtomMultiButtonList.js' */                while (options.next()) {
/*Line 138 - 'AtomMultiButtonList.js' */                    var op = options.current();
/*Line 139 - 'AtomMultiButtonList.js' */                    if (vp) {
/*Line 140 - 'AtomMultiButtonList.js' */                        op = op[vp];
/*Line 141 - 'AtomMultiButtonList.js' */                    }

/*Line 143 - 'AtomMultiButtonList.js' */                    var val = v + "." + op;

/*Line 145 - 'AtomMultiButtonList.js' */                    var cb = document.createElement("INPUT");
/*Line 146 - 'AtomMultiButtonList.js' */                    if (this._isRadio) {
/*Line 147 - 'AtomMultiButtonList.js' */                        AtomUI.attr(cb, "type", "radio");
/*Line 148 - 'AtomMultiButtonList.js' */                        AtomUI.attr(cb, "name", gpName);
/*Line 149 - 'AtomMultiButtonList.js' */                    } else {
/*Line 150 - 'AtomMultiButtonList.js' */                        AtomUI.attr(cb, "type", "checkbox");
/*Line 151 - 'AtomMultiButtonList.js' */                    }
/*Line 152 - 'AtomMultiButtonList.js' */                    $(cb).val(val);
/*Line 153 - 'AtomMultiButtonList.js' */                    span.appendChild(cb);
/*Line 154 - 'AtomMultiButtonList.js' */                    this.bindEvent(cb, "change", "onDataChange");
/*Line 155 - 'AtomMultiButtonList.js' */                    this._dataElements.push(cb);
/*Line 156 - 'AtomMultiButtonList.js' */                }

/*Line 158 - 'AtomMultiButtonList.js' */                span = document.createElement("SPAN");
/*Line 159 - 'AtomMultiButtonList.js' */                parentElement.appendChild(span);
/*Line 160 - 'AtomMultiButtonList.js' */                // Create Label First..
/*Line 161 - 'AtomMultiButtonList.js' */                var txt = document.createTextNode(l);
/*Line 162 - 'AtomMultiButtonList.js' */                span.appendChild(txt);
/*Line 163 - 'AtomMultiButtonList.js' */                //span.style.float = "left";

/*Line 165 - 'AtomMultiButtonList.js' */            }
/*Line 166 - 'AtomMultiButtonList.js' */        }
/*Line 167 - 'AtomMultiButtonList.js' */    });
/*Line 168 - 'AtomMultiButtonList.js' */})(WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomNavigatorList.js' */

/*Line 2 - 'AtomNavigatorList.js' */(function (base) {
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

/*Line 161 - 'AtomNavigatorList.js' */                var dt = this._detailTemplate;
/*Line 162 - 'AtomNavigatorList.js' */                if (!(AtomUI.attr(dt,"atom-dock"))) {
/*Line 163 - 'AtomNavigatorList.js' */                    AtomUI.attr(dt, "atom-dock", "Fill");
/*Line 164 - 'AtomNavigatorList.js' */                }

/*Line 166 - 'AtomNavigatorList.js' */                if (this._headerTemplate) {
/*Line 167 - 'AtomNavigatorList.js' */                    var hd = AtomUI.cloneNode(this._headerTemplate);
/*Line 168 - 'AtomNavigatorList.js' */                    hd.setAttribute("atom-dock", "Top");
/*Line 169 - 'AtomNavigatorList.js' */                    $(hd).addClass("atom-navigator-list-header");
/*Line 170 - 'AtomNavigatorList.js' */                    hd._templateParent = this;
/*Line 171 - 'AtomNavigatorList.js' */                    this.addTemplate(this._gridPanel, hd);
/*Line 172 - 'AtomNavigatorList.js' */                }

/*Line 174 - 'AtomNavigatorList.js' */                if (this._footerTemplate) {
/*Line 175 - 'AtomNavigatorList.js' */                    var fd = AtomUI.cloneNode(this._footerTemplate);
/*Line 176 - 'AtomNavigatorList.js' */                    fd.setAttribute("atom-dock", "Bottom");
/*Line 177 - 'AtomNavigatorList.js' */                    $(fd).addClass("atom-navigator-list-footer");
/*Line 178 - 'AtomNavigatorList.js' */                    this.addTemplate(this._gridPanel, fd);
/*Line 179 - 'AtomNavigatorList.js' */                }
/*Line 180 - 'AtomNavigatorList.js' */            },

/*Line 182 - 'AtomNavigatorList.js' */            init: function () {
/*Line 183 - 'AtomNavigatorList.js' */                base.init.call(this);

/*Line 185 - 'AtomNavigatorList.js' */                var _this = this;

/*Line 187 - 'AtomNavigatorList.js' */                this.backCommand = function () {
/*Line 188 - 'AtomNavigatorList.js' */                    _this.onBackCommand.apply(_this, arguments);
/*Line 189 - 'AtomNavigatorList.js' */                };

/*Line 191 - 'AtomNavigatorList.js' */                this.addCommand = function () {
/*Line 192 - 'AtomNavigatorList.js' */                    _this.onAddCommand.apply(_this, arguments);
/*Line 193 - 'AtomNavigatorList.js' */                };

/*Line 195 - 'AtomNavigatorList.js' */                this.cancelAddCommand = function () {
/*Line 196 - 'AtomNavigatorList.js' */                    _this.onCancelAddNewCommand.apply(_this, arguments);
/*Line 197 - 'AtomNavigatorList.js' */                };

/*Line 199 - 'AtomNavigatorList.js' */                this.showDetailCommand = function () {
/*Line 200 - 'AtomNavigatorList.js' */                    var s = _this.get_selectedItem();
/*Line 201 - 'AtomNavigatorList.js' */                    if (s) {
/*Line 202 - 'AtomNavigatorList.js' */                        AtomBinder.setValue(_this, "displayMode", 1);
/*Line 203 - 'AtomNavigatorList.js' */                        _this.updateDisplayMode();
/*Line 204 - 'AtomNavigatorList.js' */                    }
/*Line 205 - 'AtomNavigatorList.js' */                };
/*Line 206 - 'AtomNavigatorList.js' */            }
/*Line 207 - 'AtomNavigatorList.js' */        }
/*Line 208 - 'AtomNavigatorList.js' */    });
/*Line 209 - 'AtomNavigatorList.js' */})(WebAtoms.AtomListBox.prototype);

/*Line 0 - 'AtomNumberComboBox.js' */

/*Line 2 - 'AtomNumberComboBox.js' */(function (base) {

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
/*Line 58 - 'AtomNumberComboBox.js' */})(WebAtoms.AtomComboBox.prototype);

/*Line 0 - 'AtomPhoneControl.js' */
/*Line 1 - 'AtomPhoneControl.js' */
/*Line 2 - 'AtomPhoneControl.js' */



/*Line 6 - 'AtomPhoneControl.js' */(function (base) {

/*Line 8 - 'AtomPhoneControl.js' */    var document = window.document;
/*Line 9 - 'AtomPhoneControl.js' */    var $ = window.$;

/*Line 11 - 'AtomPhoneControl.js' */    var phoneConfig = [
/*Line 12 - 'AtomPhoneControl.js' */        {
/*Line 13 - 'AtomPhoneControl.js' */            label: "(US +1)",
/*Line 14 - 'AtomPhoneControl.js' */            code: 1,
/*Line 15 - 'AtomPhoneControl.js' */            country: "US",
/*Line 16 - 'AtomPhoneControl.js' */            format: "999-999-9999"
/*Line 17 - 'AtomPhoneControl.js' */        },
/*Line 18 - 'AtomPhoneControl.js' */        {
/*Line 19 - 'AtomPhoneControl.js' */            label: "(CA +1)",
/*Line 20 - 'AtomPhoneControl.js' */            code: 1,
/*Line 21 - 'AtomPhoneControl.js' */            country: "CA",
/*Line 22 - 'AtomPhoneControl.js' */            format: "999-999-9999"
/*Line 23 - 'AtomPhoneControl.js' */        },
/*Line 24 - 'AtomPhoneControl.js' */        {
/*Line 25 - 'AtomPhoneControl.js' */            label: "(IN +91)",
/*Line 26 - 'AtomPhoneControl.js' */            code: 91,
/*Line 27 - 'AtomPhoneControl.js' */            country: "IN",
/*Line 28 - 'AtomPhoneControl.js' */            format: "99-99-999999"
/*Line 29 - 'AtomPhoneControl.js' */        },
/*Line 30 - 'AtomPhoneControl.js' */        {
/*Line 31 - 'AtomPhoneControl.js' */            label: "(UK +44)",
/*Line 32 - 'AtomPhoneControl.js' */            code: 44,
/*Line 33 - 'AtomPhoneControl.js' */            country: "UK",
/*Line 34 - 'AtomPhoneControl.js' */            format: "999-999-9999"
/*Line 35 - 'AtomPhoneControl.js' */        },
/*Line 36 - 'AtomPhoneControl.js' */    ];

/*Line 38 - 'AtomPhoneControl.js' */    return classCreatorEx({
/*Line 39 - 'AtomPhoneControl.js' */        name: "WebAtoms.AtomPhoneControl",
/*Line 40 - 'AtomPhoneControl.js' */        base: base,
/*Line 41 - 'AtomPhoneControl.js' */        start: function () {
/*Line 42 - 'AtomPhoneControl.js' */            this._value = "";
/*Line 43 - 'AtomPhoneControl.js' */        },
/*Line 44 - 'AtomPhoneControl.js' */        properties: {
/*Line 45 - 'AtomPhoneControl.js' */            countries: phoneConfig
/*Line 46 - 'AtomPhoneControl.js' */        },
/*Line 47 - 'AtomPhoneControl.js' */        methods: {
/*Line 48 - 'AtomPhoneControl.js' */            set_value: function (v) {
/*Line 49 - 'AtomPhoneControl.js' */                this._value = v;
/*Line 50 - 'AtomPhoneControl.js' */                if (this._countries) {
/*Line 51 - 'AtomPhoneControl.js' */                    this.setupValues();
/*Line 52 - 'AtomPhoneControl.js' */                }
/*Line 53 - 'AtomPhoneControl.js' */            },
/*Line 54 - 'AtomPhoneControl.js' */            set_required: function (v) {
/*Line 55 - 'AtomPhoneControl.js' */                if (!this.num) {
/*Line 56 - 'AtomPhoneControl.js' */                    var self = this;
/*Line 57 - 'AtomPhoneControl.js' */                    WebAtoms.dispatcher.callLater(function () {
/*Line 58 - 'AtomPhoneControl.js' */                        self.set_required(v);
/*Line 59 - 'AtomPhoneControl.js' */                    });
/*Line 60 - 'AtomPhoneControl.js' */                    return;
/*Line 61 - 'AtomPhoneControl.js' */                }
/*Line 62 - 'AtomPhoneControl.js' */                this._required = v;
/*Line 63 - 'AtomPhoneControl.js' */                if (v) {
/*Line 64 - 'AtomPhoneControl.js' */                    AtomProperties.required.call(this, this.num, true);
/*Line 65 - 'AtomPhoneControl.js' */                } else {
/*Line 66 - 'AtomPhoneControl.js' */                    AtomProperties.required.call(this, this.num, false);
/*Line 67 - 'AtomPhoneControl.js' */                }
/*Line 68 - 'AtomPhoneControl.js' */            },
/*Line 69 - 'AtomPhoneControl.js' */            get_required: function () {
/*Line 70 - 'AtomPhoneControl.js' */                return this._required;
/*Line 71 - 'AtomPhoneControl.js' */            },

/*Line 73 - 'AtomPhoneControl.js' */            setupValues: function () {
/*Line 74 - 'AtomPhoneControl.js' */                if (!this._value) {
/*Line 75 - 'AtomPhoneControl.js' */                    $(this.num).val("");
/*Line 76 - 'AtomPhoneControl.js' */                    $(this.ext).val("");
/*Line 77 - 'AtomPhoneControl.js' */                    $(this.msg).val("");
/*Line 78 - 'AtomPhoneControl.js' */                    return;
/*Line 79 - 'AtomPhoneControl.js' */                }
/*Line 80 - 'AtomPhoneControl.js' */                var tokens = this._value.split(":", 6);

/*Line 82 - 'AtomPhoneControl.js' */                var cc = tokens[1];

/*Line 84 - 'AtomPhoneControl.js' */                var ae = new AtomEnumerator(this._countries);
/*Line 85 - 'AtomPhoneControl.js' */                while (ae.next()) {
/*Line 86 - 'AtomPhoneControl.js' */                    var ci = ae.current();
/*Line 87 - 'AtomPhoneControl.js' */                    if (ci.country == cc) {
/*Line 88 - 'AtomPhoneControl.js' */                        this.cs.selectedIndex = ae.currentIndex();
/*Line 89 - 'AtomPhoneControl.js' */                        break;
/*Line 90 - 'AtomPhoneControl.js' */                    }
/*Line 91 - 'AtomPhoneControl.js' */                }

/*Line 93 - 'AtomPhoneControl.js' */                var num = (tokens[3] || "").split(".").join("-");
/*Line 94 - 'AtomPhoneControl.js' */                if (num == "--")
/*Line 95 - 'AtomPhoneControl.js' */                    num = "";
/*Line 96 - 'AtomPhoneControl.js' */                $(this.num).val(num);
/*Line 97 - 'AtomPhoneControl.js' */                $(this.ext).val(tokens[4]);
/*Line 98 - 'AtomPhoneControl.js' */                $(this.msg).val(tokens[5]);
/*Line 99 - 'AtomPhoneControl.js' */                this.onFormat();
/*Line 100 - 'AtomPhoneControl.js' */            },

/*Line 102 - 'AtomPhoneControl.js' */            onDataChange: function () {
/*Line 103 - 'AtomPhoneControl.js' */                var value = "v2:";
/*Line 104 - 'AtomPhoneControl.js' */                var si = this.cs.selectedIndex;
/*Line 105 - 'AtomPhoneControl.js' */                var ci = this._countries[si];
/*Line 106 - 'AtomPhoneControl.js' */                value += ci.country + ":" + ci.code;
/*Line 107 - 'AtomPhoneControl.js' */                var num = (($(this.num).val()).split("-").join("."));
/*Line 108 - 'AtomPhoneControl.js' */                value += ":" + num;
/*Line 109 - 'AtomPhoneControl.js' */                value += ":" + $(this.ext).val();
/*Line 110 - 'AtomPhoneControl.js' */                value += ":" + $(this.msg).val();

/*Line 112 - 'AtomPhoneControl.js' */                if (num) {
/*Line 113 - 'AtomPhoneControl.js' */                    this._value = value;
/*Line 114 - 'AtomPhoneControl.js' */                } else {
/*Line 115 - 'AtomPhoneControl.js' */                    this._value = "";
/*Line 116 - 'AtomPhoneControl.js' */                }

/*Line 118 - 'AtomPhoneControl.js' */                AtomBinder.refreshValue(this, "value");
/*Line 119 - 'AtomPhoneControl.js' */            },

/*Line 121 - 'AtomPhoneControl.js' */            set_countries: function (r) {
/*Line 122 - 'AtomPhoneControl.js' */                this._countries = r;
/*Line 123 - 'AtomPhoneControl.js' */                this.onFormat();
/*Line 124 - 'AtomPhoneControl.js' */            },


/*Line 127 - 'AtomPhoneControl.js' */            onCountryChange: function () {
/*Line 128 - 'AtomPhoneControl.js' */                this.onDataChange();
/*Line 129 - 'AtomPhoneControl.js' */                this.onFormat();
/*Line 130 - 'AtomPhoneControl.js' */            },

/*Line 132 - 'AtomPhoneControl.js' */            onFormat: function () {
/*Line 133 - 'AtomPhoneControl.js' */                if (this._isFormatting) return;
/*Line 134 - 'AtomPhoneControl.js' */                this._isFormatting = true;

/*Line 136 - 'AtomPhoneControl.js' */                var r = this._countries;
/*Line 137 - 'AtomPhoneControl.js' */                var options = this.cs.options;
/*Line 138 - 'AtomPhoneControl.js' */                options.length = 0;
/*Line 139 - 'AtomPhoneControl.js' */                var ae = new AtomEnumerator(r);
/*Line 140 - 'AtomPhoneControl.js' */                while (ae.next()) {
/*Line 141 - 'AtomPhoneControl.js' */                    var ci = ae.current();
/*Line 142 - 'AtomPhoneControl.js' */                    if (!ci.valueIndex) {
/*Line 143 - 'AtomPhoneControl.js' */                        ci.label = ci.label;
/*Line 144 - 'AtomPhoneControl.js' */                        ci.valueIndex = ae.currentIndex();
/*Line 145 - 'AtomPhoneControl.js' */                    }
/*Line 146 - 'AtomPhoneControl.js' */                    options[ae.currentIndex()] = new Option(ci.label, ci.valueIndex, false, false);
/*Line 147 - 'AtomPhoneControl.js' */                }

/*Line 149 - 'AtomPhoneControl.js' */                this.setupValues();

/*Line 151 - 'AtomPhoneControl.js' */                var cs = this.cs;
/*Line 152 - 'AtomPhoneControl.js' */                if (cs.selectedIndex == -1)
/*Line 153 - 'AtomPhoneControl.js' */                    return;
/*Line 154 - 'AtomPhoneControl.js' */                var ci = this._countries[cs.selectedIndex];

/*Line 156 - 'AtomPhoneControl.js' */                if (ci.format) {
/*Line 157 - 'AtomPhoneControl.js' */                    $(this.num).mask(ci.format);
/*Line 158 - 'AtomPhoneControl.js' */                } else {
/*Line 159 - 'AtomPhoneControl.js' */                    $(this.num).unmask();
/*Line 160 - 'AtomPhoneControl.js' */                }
/*Line 161 - 'AtomPhoneControl.js' */                this._isFormatting = false;
/*Line 162 - 'AtomPhoneControl.js' */            },


/*Line 165 - 'AtomPhoneControl.js' */            init: function () {
/*Line 166 - 'AtomPhoneControl.js' */                this.cs = document.createElement("SELECT");
/*Line 167 - 'AtomPhoneControl.js' */                //this.cs.style['float'] = "left";
/*Line 168 - 'AtomPhoneControl.js' */                this.num = document.createElement("INPUT");
/*Line 169 - 'AtomPhoneControl.js' */                this.num.type = "text";
/*Line 170 - 'AtomPhoneControl.js' */                //this.num.style.width = "150px";
/*Line 171 - 'AtomPhoneControl.js' */                //this.num.style['float'] = "left";
/*Line 172 - 'AtomPhoneControl.js' */                //this.num.style.marginLeft = "2px";
/*Line 173 - 'AtomPhoneControl.js' */                this.ext = document.createElement("INPUT");
/*Line 174 - 'AtomPhoneControl.js' */                //this.num = [this.num1, this.num2, this.num3, this.ext];
/*Line 175 - 'AtomPhoneControl.js' */                this.ext.type = "text";
/*Line 176 - 'AtomPhoneControl.js' */                //this.ext.style.width = "30px";
/*Line 177 - 'AtomPhoneControl.js' */                //this.ext.style['float'] = "left";
/*Line 178 - 'AtomPhoneControl.js' */                //this.ext.style.marginLeft = "2px";
/*Line 179 - 'AtomPhoneControl.js' */                $(this.ext).attr("placeholder", "Ext.");
/*Line 180 - 'AtomPhoneControl.js' */                this.msg = document.createElement("INPUT");
/*Line 181 - 'AtomPhoneControl.js' */                this.msg.type = "text";
/*Line 182 - 'AtomPhoneControl.js' */                //this.msg.style.width = "100px";
/*Line 183 - 'AtomPhoneControl.js' */                //this.msg.style['float'] = "left";
/*Line 184 - 'AtomPhoneControl.js' */                //this.msg.style.marginLeft = "2px";
/*Line 185 - 'AtomPhoneControl.js' */                $(this.msg).attr("placeholder", "Message");

/*Line 187 - 'AtomPhoneControl.js' */                var element = this.get_element();
/*Line 188 - 'AtomPhoneControl.js' */                //element.style.width = "450px";
/*Line 189 - 'AtomPhoneControl.js' */                element.appendChild(this.cs);
/*Line 190 - 'AtomPhoneControl.js' */                element.appendChild(this.num);
/*Line 191 - 'AtomPhoneControl.js' */                element.appendChild(this.ext);
/*Line 192 - 'AtomPhoneControl.js' */                element.appendChild(this.msg);

/*Line 194 - 'AtomPhoneControl.js' */                var caller = this;

/*Line 196 - 'AtomPhoneControl.js' */                this.onKeyUpLater = function (e) {
/*Line 197 - 'AtomPhoneControl.js' */                    var evt = e;
/*Line 198 - 'AtomPhoneControl.js' */                    caller.onDataChange(evt);
/*Line 199 - 'AtomPhoneControl.js' */                };

/*Line 201 - 'AtomPhoneControl.js' */                this.bindEvent(this.cs, "change", "onCountryChange");
/*Line 202 - 'AtomPhoneControl.js' */                this.bindEvent(this.num, "change", "onDataChange");
/*Line 203 - 'AtomPhoneControl.js' */                this.bindEvent(this.num, "keyup", "onKeyUpLater");
/*Line 204 - 'AtomPhoneControl.js' */                this.bindEvent(this.num, "keypress", "onKeyUpLater");
/*Line 205 - 'AtomPhoneControl.js' */                this.bindEvent(this.ext, "change", "onDataChange");
/*Line 206 - 'AtomPhoneControl.js' */                this.bindEvent(this.msg, "change", "onDataChange");

/*Line 208 - 'AtomPhoneControl.js' */                $(this._element).addClass("atom-phone-control");
/*Line 209 - 'AtomPhoneControl.js' */                $(this.num).addClass("atom-pc-num");
/*Line 210 - 'AtomPhoneControl.js' */                $(this.msg).addClass("atom-pc-msg");
/*Line 211 - 'AtomPhoneControl.js' */                $(this.cs).addClass("atom-pc-cs");
/*Line 212 - 'AtomPhoneControl.js' */                $(this.ext).addClass("atom-pc-ext");


/*Line 215 - 'AtomPhoneControl.js' */                base.init.call(this);
/*Line 216 - 'AtomPhoneControl.js' */                var phone = this;

/*Line 218 - 'AtomPhoneControl.js' */                WebAtoms.dispatcher.callLater(function () {
/*Line 219 - 'AtomPhoneControl.js' */                    phone.onFormat();
/*Line 220 - 'AtomPhoneControl.js' */                });

/*Line 222 - 'AtomPhoneControl.js' */            }
/*Line 223 - 'AtomPhoneControl.js' */        }
/*Line 224 - 'AtomPhoneControl.js' */    });
/*Line 225 - 'AtomPhoneControl.js' */})(WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomRadioButtonList.js' */

/*Line 2 - 'AtomRadioButtonList.js' */(function (baseType) {
/*Line 3 - 'AtomRadioButtonList.js' */    return classCreatorEx({
/*Line 4 - 'AtomRadioButtonList.js' */        name: "WebAtoms.AtomRadioButtonList",
/*Line 5 - 'AtomRadioButtonList.js' */        base: baseType,
/*Line 6 - 'AtomRadioButtonList.js' */        start: function () {
/*Line 7 - 'AtomRadioButtonList.js' */            this._allowMultipleSelection = false;
/*Line 8 - 'AtomRadioButtonList.js' */        },
/*Line 9 - 'AtomRadioButtonList.js' */        properties: {
/*Line 10 - 'AtomRadioButtonList.js' */            groupName:""
/*Line 11 - 'AtomRadioButtonList.js' */        },
/*Line 12 - 'AtomRadioButtonList.js' */        methods: {
/*Line 13 - 'AtomRadioButtonList.js' */            init: function () {
/*Line 14 - 'AtomRadioButtonList.js' */                this._groupName = "__g" + AtomUI.getNewIndex();
/*Line 15 - 'AtomRadioButtonList.js' */                baseType.init.call(this);
/*Line 16 - 'AtomRadioButtonList.js' */            }
/*Line 17 - 'AtomRadioButtonList.js' */        }
/*Line 18 - 'AtomRadioButtonList.js' */    });
/*Line 19 - 'AtomRadioButtonList.js' */})(WebAtoms.AtomItemsControl.prototype);

/*Line 0 - 'AtomSortableColumn.js' */

/*Line 2 - 'AtomSortableColumn.js' */(function (baseType) {
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
/*Line 17 - 'AtomSortableColumn.js' */                var $e = $(this._element);
/*Line 18 - 'AtomSortableColumn.js' */                $e.removeClass("atom-sort-asc atom-sort-desc");
/*Line 19 - 'AtomSortableColumn.js' */                if (v) {
/*Line 20 - 'AtomSortableColumn.js' */                    $e.addClass("atom-sort-" + v.toLowerCase());
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
/*Line 70 - 'AtomSortableColumn.js' */})(WebAtoms.AtomControl.prototype);
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

/*Line 2 - 'AtomTabControl.js' */(function (baseType) {
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
/*Line 54 - 'AtomTabControl.js' */})(WebAtoms.AtomControl.prototype);

/*Line 0 - 'AtomTimePicker.js' */

/*Line 2 - 'AtomTimePicker.js' */(function (baseType) {
/*Line 3 - 'AtomTimePicker.js' */    return classCreatorEx({
/*Line 4 - 'AtomTimePicker.js' */        name: "WebAtoms.AtomTimePicker",
/*Line 5 - 'AtomTimePicker.js' */        base: baseType,
/*Line 6 - 'AtomTimePicker.js' */        start: function (e) {
/*Line 7 - 'AtomTimePicker.js' */            log("AtomTimePicker is Depricated !!!, use AtomTimeEditor");
/*Line 8 - 'AtomTimePicker.js' */        },
/*Line 9 - 'AtomTimePicker.js' */        properties: {
/*Line 10 - 'AtomTimePicker.js' */            displayLabel: "9:00 AM"
/*Line 11 - 'AtomTimePicker.js' */        },
/*Line 12 - 'AtomTimePicker.js' */        methods: {
/*Line 13 - 'AtomTimePicker.js' */            init: function () {
/*Line 14 - 'AtomTimePicker.js' */                this._autoOpen = true;
/*Line 15 - 'AtomTimePicker.js' */                var items = [];
/*Line 16 - 'AtomTimePicker.js' */                for (var i = 0; i <= 23; i++) {
/*Line 17 - 'AtomTimePicker.js' */                    var a = "AM";
/*Line 18 - 'AtomTimePicker.js' */                    var n = i;
/*Line 19 - 'AtomTimePicker.js' */                    if (i > 11) {
/*Line 20 - 'AtomTimePicker.js' */                        a = "PM";
/*Line 21 - 'AtomTimePicker.js' */                        if (i > 12) {
/*Line 22 - 'AtomTimePicker.js' */                            n = i - 12;
/*Line 23 - 'AtomTimePicker.js' */                        }
/*Line 24 - 'AtomTimePicker.js' */                    }
/*Line 25 - 'AtomTimePicker.js' */                    var item = n + ":00 " + a;
/*Line 26 - 'AtomTimePicker.js' */                    items.push({ label: item, value: item });
/*Line 27 - 'AtomTimePicker.js' */                    item = n + ":30 " + a;
/*Line 28 - 'AtomTimePicker.js' */                    items.push({ label: item, value: item });
/*Line 29 - 'AtomTimePicker.js' */                }
/*Line 30 - 'AtomTimePicker.js' */                this._items = items;
/*Line 31 - 'AtomTimePicker.js' */                baseType.init.call(this);
/*Line 32 - 'AtomTimePicker.js' */            }
/*Line 33 - 'AtomTimePicker.js' */        }
/*Line 34 - 'AtomTimePicker.js' */    });
/*Line 35 - 'AtomTimePicker.js' */})(WebAtoms.AtomAutoCompleteBox.prototype);

/*Line 37 - 'AtomTimePicker.js' */var AtomicUpdator = function (self) {
/*Line 38 - 'AtomTimePicker.js' */    this._self = self;
/*Line 39 - 'AtomTimePicker.js' */    this._updating = false;
/*Line 40 - 'AtomTimePicker.js' */    this.update = function (f) {
/*Line 41 - 'AtomTimePicker.js' */        if (this._updating)
/*Line 42 - 'AtomTimePicker.js' */            return;
/*Line 43 - 'AtomTimePicker.js' */        try{
/*Line 44 - 'AtomTimePicker.js' */            this._updating = true;
/*Line 45 - 'AtomTimePicker.js' */            f.apply(this._self);
/*Line 46 - 'AtomTimePicker.js' */        } finally {
/*Line 47 - 'AtomTimePicker.js' */            this._updating = false;
/*Line 48 - 'AtomTimePicker.js' */        }
/*Line 49 - 'AtomTimePicker.js' */    };
/*Line 50 - 'AtomTimePicker.js' */};

/*Line 52 - 'AtomTimePicker.js' */(function (baseType) {

/*Line 54 - 'AtomTimePicker.js' */    var timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9] [ap][m]$/i;

/*Line 56 - 'AtomTimePicker.js' */    return classCreatorEx({
/*Line 57 - 'AtomTimePicker.js' */        name: "WebAtoms.AtomTimeEditor",
/*Line 58 - 'AtomTimePicker.js' */        base: baseType,
/*Line 59 - 'AtomTimePicker.js' */        start: function (e) {
/*Line 60 - 'AtomTimePicker.js' */            $(e).addClass("atom-time-editor");
/*Line 61 - 'AtomTimePicker.js' */            this._updater = new AtomicUpdator(this);
/*Line 62 - 'AtomTimePicker.js' */        },
/*Line 63 - 'AtomTimePicker.js' */        properties: {
/*Line 64 - 'AtomTimePicker.js' */            time: "10:00",
/*Line 65 - 'AtomTimePicker.js' */            ap: "AM",
/*Line 66 - 'AtomTimePicker.js' */            value: "10:00 AM"
/*Line 67 - 'AtomTimePicker.js' */        },
/*Line 68 - 'AtomTimePicker.js' */        methods: {
/*Line 69 - 'AtomTimePicker.js' */            get_hours24: function () {
/*Line 70 - 'AtomTimePicker.js' */                var t = this._time.split(':');
/*Line 71 - 'AtomTimePicker.js' */                var h = parseInt(t[0] || '0');
/*Line 72 - 'AtomTimePicker.js' */                if (this._ap == 'PM') {
/*Line 73 - 'AtomTimePicker.js' */                    if (h != 12) {
/*Line 74 - 'AtomTimePicker.js' */                        h += 12;
/*Line 75 - 'AtomTimePicker.js' */                    }
/*Line 76 - 'AtomTimePicker.js' */                }
/*Line 77 - 'AtomTimePicker.js' */                return h;
/*Line 78 - 'AtomTimePicker.js' */            },
/*Line 79 - 'AtomTimePicker.js' */            set_hours24: function (v) {
/*Line 80 - 'AtomTimePicker.js' */                this.setTime(v, this.get_minutes());
/*Line 81 - 'AtomTimePicker.js' */            },
/*Line 82 - 'AtomTimePicker.js' */            get_hours: function () {
/*Line 83 - 'AtomTimePicker.js' */                var t = this._time.split(':');
/*Line 84 - 'AtomTimePicker.js' */                var h = parseInt(t[0] || '0');
/*Line 85 - 'AtomTimePicker.js' */                return h;
/*Line 86 - 'AtomTimePicker.js' */            },
/*Line 87 - 'AtomTimePicker.js' */            get_minutes: function () {
/*Line 88 - 'AtomTimePicker.js' */                var t = this._time.split(':');
/*Line 89 - 'AtomTimePicker.js' */                return parseInt(t[1] || '0');
/*Line 90 - 'AtomTimePicker.js' */            },
/*Line 91 - 'AtomTimePicker.js' */            setTime: function (h, m, is24) {
/*Line 92 - 'AtomTimePicker.js' */                var ap = this.get_ap();
/*Line 93 - 'AtomTimePicker.js' */                if ( is24 && (h > 12)) {
/*Line 94 - 'AtomTimePicker.js' */                    h -= 12;
/*Line 95 - 'AtomTimePicker.js' */                    ap = "PM";
/*Line 96 - 'AtomTimePicker.js' */                }
/*Line 97 - 'AtomTimePicker.js' */                h = "" + h;
/*Line 98 - 'AtomTimePicker.js' */                if (h.length == 1) {
/*Line 99 - 'AtomTimePicker.js' */                    h = "0" + h;
/*Line 100 - 'AtomTimePicker.js' */                }
/*Line 101 - 'AtomTimePicker.js' */                m = m + "";
/*Line 102 - 'AtomTimePicker.js' */                if (m.length == 1) {
/*Line 103 - 'AtomTimePicker.js' */                    m = "0" + m;
/*Line 104 - 'AtomTimePicker.js' */                }
/*Line 105 - 'AtomTimePicker.js' */                AtomBinder.setValue(this, "value", h + ":" + m + " " + ap);
/*Line 106 - 'AtomTimePicker.js' */            },
/*Line 107 - 'AtomTimePicker.js' */            set_hours: function (v) {
/*Line 108 - 'AtomTimePicker.js' */                this.setTime(v, this.get_minutes());
/*Line 109 - 'AtomTimePicker.js' */            },
/*Line 110 - 'AtomTimePicker.js' */            set_minutes: function (v) {
/*Line 111 - 'AtomTimePicker.js' */                this.setTime(this.get_hours(), v);
/*Line 112 - 'AtomTimePicker.js' */            },
/*Line 113 - 'AtomTimePicker.js' */            set_value: function (v) {
/*Line 114 - 'AtomTimePicker.js' */                this._updater.update(function () {
/*Line 115 - 'AtomTimePicker.js' */                    if (this._value == v)
/*Line 116 - 'AtomTimePicker.js' */                        return;
/*Line 117 - 'AtomTimePicker.js' */                    if (!timeRegex.test(v)) {
/*Line 118 - 'AtomTimePicker.js' */                        throw new Error("Unknown time format, expecting ##:## AM");
/*Line 119 - 'AtomTimePicker.js' */                    }
/*Line 120 - 'AtomTimePicker.js' */                    this._value = v;
/*Line 121 - 'AtomTimePicker.js' */                    v = v.split(' ');
/*Line 122 - 'AtomTimePicker.js' */                    this._time = v[0];
/*Line 123 - 'AtomTimePicker.js' */                    this._ap = (v[1]).toUpperCase();
/*Line 124 - 'AtomTimePicker.js' */                    this.refreshProperties();
/*Line 125 - 'AtomTimePicker.js' */                });
/*Line 126 - 'AtomTimePicker.js' */            },
/*Line 127 - 'AtomTimePicker.js' */            refreshProperties: function () {
/*Line 128 - 'AtomTimePicker.js' */                Atom.refresh(this, "value");
/*Line 129 - 'AtomTimePicker.js' */                Atom.refresh(this, "time");
/*Line 130 - 'AtomTimePicker.js' */                Atom.refresh(this, "ap");
/*Line 131 - 'AtomTimePicker.js' */                Atom.refresh(this, "hours");
/*Line 132 - 'AtomTimePicker.js' */                Atom.refresh(this, "hours24");
/*Line 133 - 'AtomTimePicker.js' */                Atom.refresh(this, "minutes");
/*Line 134 - 'AtomTimePicker.js' */            },
/*Line 135 - 'AtomTimePicker.js' */            set_time: function (v) {
/*Line 136 - 'AtomTimePicker.js' */                this.set_value(v + " " + this._ap);
/*Line 137 - 'AtomTimePicker.js' */            },
/*Line 138 - 'AtomTimePicker.js' */            set_ap: function (v) {
/*Line 139 - 'AtomTimePicker.js' */                this.set_value(this._time + " " + v);
/*Line 140 - 'AtomTimePicker.js' */            },
/*Line 141 - 'AtomTimePicker.js' */            get_value: function () {
/*Line 142 - 'AtomTimePicker.js' */                return this._time + " " + this._ap;
/*Line 143 - 'AtomTimePicker.js' */            }
/*Line 144 - 'AtomTimePicker.js' */        }
/*Line 145 - 'AtomTimePicker.js' */    });
/*Line 146 - 'AtomTimePicker.js' */})(WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomUploadButton.js' */

/*Line 2 - 'AtomUploadButton.js' */(function (baseType) {
/*Line 3 - 'AtomUploadButton.js' */    return classCreatorEx({
/*Line 4 - 'AtomUploadButton.js' */        name: "WebAtoms.AtomUploadButton",
/*Line 5 - 'AtomUploadButton.js' */        base: baseType,
/*Line 6 - 'AtomUploadButton.js' */        start: function (e) {
/*Line 7 - 'AtomUploadButton.js' */            if (/input/gi.test(e.nodeName) && /file/gi.test(AtomUI.attr(e,"type"))) {
/*Line 8 - 'AtomUploadButton.js' */                this._filePresenter = e;
/*Line 9 - 'AtomUploadButton.js' */                return;
/*Line 10 - 'AtomUploadButton.js' */            }

/*Line 12 - 'AtomUploadButton.js' */            var fp = this._filePresenter = document.createElement("input");
/*Line 13 - 'AtomUploadButton.js' */            AtomUI.attr(fp, "type", "file");
/*Line 14 - 'AtomUploadButton.js' */            $(fp).css({
/*Line 15 - 'AtomUploadButton.js' */                left: "-500px",
/*Line 16 - 'AtomUploadButton.js' */                position: "absolute",
/*Line 17 - 'AtomUploadButton.js' */                top: "0"
/*Line 18 - 'AtomUploadButton.js' */            });
/*Line 19 - 'AtomUploadButton.js' */            document.body.appendChild(this._filePresenter);
/*Line 20 - 'AtomUploadButton.js' */        },
/*Line 21 - 'AtomUploadButton.js' */        properties: {
/*Line 22 - 'AtomUploadButton.js' */            fileTypes: undefined,
/*Line 23 - 'AtomUploadButton.js' */            accept: "*/*",
/*Line 24 - 'AtomUploadButton.js' */            capture: "",
/*Line 25 - 'AtomUploadButton.js' */            progress: 0
/*Line 26 - 'AtomUploadButton.js' */        },
/*Line 27 - 'AtomUploadButton.js' */        methods: {
/*Line 28 - 'AtomUploadButton.js' */            set_accept: function (v) {
/*Line 29 - 'AtomUploadButton.js' */                this._accept = v;
/*Line 30 - 'AtomUploadButton.js' */                if (v) {
/*Line 31 - 'AtomUploadButton.js' */                    var fp = this._filePresenter;
/*Line 32 - 'AtomUploadButton.js' */                    if (fp) {
/*Line 33 - 'AtomUploadButton.js' */                        AtomUI.attr(fp, "accept", v);
/*Line 34 - 'AtomUploadButton.js' */                    }
/*Line 35 - 'AtomUploadButton.js' */                }
/*Line 36 - 'AtomUploadButton.js' */            },

/*Line 38 - 'AtomUploadButton.js' */            set_capture: function (v) {
/*Line 39 - 'AtomUploadButton.js' */                this._capture = v;
/*Line 40 - 'AtomUploadButton.js' */                if (v) {
/*Line 41 - 'AtomUploadButton.js' */                    var fp = this._filePresenter;
/*Line 42 - 'AtomUploadButton.js' */                    if (fp) {
/*Line 43 - 'AtomUploadButton.js' */                        AtomUI.attr(fp, "capture", v);
/*Line 44 - 'AtomUploadButton.js' */                    }
/*Line 45 - 'AtomUploadButton.js' */                }
/*Line 46 - 'AtomUploadButton.js' */            },
/*Line 47 - 'AtomUploadButton.js' */            onClickHandler: function (e) {

/*Line 49 - 'AtomUploadButton.js' */                if (this._confirm) {
/*Line 50 - 'AtomUploadButton.js' */                    if (!confirm(this._confirmMessage))
/*Line 51 - 'AtomUploadButton.js' */                        return;
/*Line 52 - 'AtomUploadButton.js' */                }

/*Line 54 - 'AtomUploadButton.js' */                if (!this._postUrl) {
/*Line 55 - 'AtomUploadButton.js' */                    //WebAtoms.AtomUploadButton.callBaseMethod(this, "onClickHandler", [e]);
/*Line 56 - 'AtomUploadButton.js' */                    return;
/*Line 57 - 'AtomUploadButton.js' */                }

/*Line 59 - 'AtomUploadButton.js' */                if (this._filePresenter == this._element) {
/*Line 60 - 'AtomUploadButton.js' */                    return;
/*Line 61 - 'AtomUploadButton.js' */                }

/*Line 63 - 'AtomUploadButton.js' */                $(this._filePresenter).trigger("click");
/*Line 64 - 'AtomUploadButton.js' */                AtomUI.cancelEvent(e);
/*Line 65 - 'AtomUploadButton.js' */            },

/*Line 67 - 'AtomUploadButton.js' */            onFileSelected: function () {
/*Line 68 - 'AtomUploadButton.js' */                var data = this.get_postData();

/*Line 70 - 'AtomUploadButton.js' */                if (data === null || data === undefined)
/*Line 71 - 'AtomUploadButton.js' */                    return;

/*Line 73 - 'AtomUploadButton.js' */                var m = this._mergeData;
/*Line 74 - 'AtomUploadButton.js' */                if (m) {
/*Line 75 - 'AtomUploadButton.js' */                    for (var i in m) {
/*Line 76 - 'AtomUploadButton.js' */                        data[i] = m[i];
/*Line 77 - 'AtomUploadButton.js' */                    }
/*Line 78 - 'AtomUploadButton.js' */                }
/*Line 79 - 'AtomUploadButton.js' */                var xhr = this._xhr;
/*Line 80 - 'AtomUploadButton.js' */                if (!xhr) {
/*Line 81 - 'AtomUploadButton.js' */                    xhr = new XMLHttpRequest();
/*Line 82 - 'AtomUploadButton.js' */                    var upload = xhr.upload;
/*Line 83 - 'AtomUploadButton.js' */                    try {
/*Line 84 - 'AtomUploadButton.js' */                        xhr.timeout = 3600000;
/*Line 85 - 'AtomUploadButton.js' */                    } catch (e) {
/*Line 86 - 'AtomUploadButton.js' */                        // IE 10 has some issue with this code..
/*Line 87 - 'AtomUploadButton.js' */                    }

/*Line 89 - 'AtomUploadButton.js' */                    this.bindEvent(upload, "progress", "onProgress");
/*Line 90 - 'AtomUploadButton.js' */                    this.bindEvent(upload, "timeout", "onError");
/*Line 91 - 'AtomUploadButton.js' */                    this.bindEvent(upload, "error", "onError");
/*Line 92 - 'AtomUploadButton.js' */                    this.bindEvent(xhr, "load", "onComplete");
/*Line 93 - 'AtomUploadButton.js' */                    this.bindEvent(xhr, "error", "onError");
/*Line 94 - 'AtomUploadButton.js' */                    this.bindEvent(xhr, "timeout", "onError");
/*Line 95 - 'AtomUploadButton.js' */                    this._xhr = xhr;
/*Line 96 - 'AtomUploadButton.js' */                }

/*Line 98 - 'AtomUploadButton.js' */                var fd = new FormData();

/*Line 100 - 'AtomUploadButton.js' */                var ae = new AtomEnumerator(this._filePresenter.files);
/*Line 101 - 'AtomUploadButton.js' */                while (ae.next()) {
/*Line 102 - 'AtomUploadButton.js' */                    fd.append("file" + ae.currentIndex(), ae.current());
/*Line 103 - 'AtomUploadButton.js' */                }

/*Line 105 - 'AtomUploadButton.js' */                fd.append("formModel", JSON.stringify(AtomBinder.getClone(data)));

/*Line 107 - 'AtomUploadButton.js' */                xhr.open("POST", this._postUrl);
/*Line 108 - 'AtomUploadButton.js' */                xhr.send(fd);

/*Line 110 - 'AtomUploadButton.js' */                atomApplication.setBusy(true, "Uploading...");
/*Line 111 - 'AtomUploadButton.js' */            },

/*Line 113 - 'AtomUploadButton.js' */            set_progress: function (v) {
/*Line 114 - 'AtomUploadButton.js' */                this._progress = v;
/*Line 115 - 'AtomUploadButton.js' */                if (v) {
/*Line 116 - 'AtomUploadButton.js' */                    AtomBinder.setValue(atomApplication, "progress", v);
/*Line 117 - 'AtomUploadButton.js' */                }
/*Line 118 - 'AtomUploadButton.js' */            },

/*Line 120 - 'AtomUploadButton.js' */            onError: function (evt) {
/*Line 121 - 'AtomUploadButton.js' */                atomApplication.setBusy(false, "Uploading...");
/*Line 122 - 'AtomUploadButton.js' */                this.unbindEvent(this._xhr);
/*Line 123 - 'AtomUploadButton.js' */                this._xhr = null;
/*Line 124 - 'AtomUploadButton.js' */                this._lastError = evt;
/*Line 125 - 'AtomUploadButton.js' */                Atom.alert('Upload failed');
/*Line 126 - 'AtomUploadButton.js' */            },
/*Line 127 - 'AtomUploadButton.js' */            onProgress: function (evt) {
/*Line 128 - 'AtomUploadButton.js' */                //evt = evt.originalEvent;
/*Line 129 - 'AtomUploadButton.js' */                if (evt.lengthComputable) {
/*Line 130 - 'AtomUploadButton.js' */                    var percentComplete = Math.round(evt.loaded * 100 / evt.total);
/*Line 131 - 'AtomUploadButton.js' */                    AtomBinder.setValue(this, "progress", percentComplete);
/*Line 132 - 'AtomUploadButton.js' */                }
/*Line 133 - 'AtomUploadButton.js' */            },
/*Line 134 - 'AtomUploadButton.js' */            onComplete: function (evt) {
/*Line 135 - 'AtomUploadButton.js' */                atomApplication.setBusy(false, "Uploading...");
/*Line 136 - 'AtomUploadButton.js' */                var result = null;
/*Line 137 - 'AtomUploadButton.js' */                if (evt.target) {
/*Line 138 - 'AtomUploadButton.js' */                    if (evt.target.status == 200) {
/*Line 139 - 'AtomUploadButton.js' */                        this._value = evt.target.responseText;
/*Line 140 - 'AtomUploadButton.js' */                    } else {
/*Line 141 - 'AtomUploadButton.js' */                        Atom.alert(evt.target.statusText);
/*Line 142 - 'AtomUploadButton.js' */                        return;
/*Line 143 - 'AtomUploadButton.js' */                    }
/*Line 144 - 'AtomUploadButton.js' */                } else {
/*Line 145 - 'AtomUploadButton.js' */                    this._value = evt.result;
/*Line 146 - 'AtomUploadButton.js' */                }

/*Line 148 - 'AtomUploadButton.js' */                this.unbindEvent(this._xhr);
/*Line 149 - 'AtomUploadButton.js' */                this._xhr = null;

/*Line 151 - 'AtomUploadButton.js' */                AtomBinder.refreshValue(this, "value");

/*Line 153 - 'AtomUploadButton.js' */                this.invokeAction(this._next, evt);
/*Line 154 - 'AtomUploadButton.js' */            },

/*Line 156 - 'AtomUploadButton.js' */            init: function () {
/*Line 157 - 'AtomUploadButton.js' */                baseType.init.call(this);

/*Line 159 - 'AtomUploadButton.js' */                var f = this._filePresenter;

/*Line 161 - 'AtomUploadButton.js' */                this.bindEvent(f, "change", "onFileSelected");

/*Line 163 - 'AtomUploadButton.js' */            }
/*Line 164 - 'AtomUploadButton.js' */        }
/*Line 165 - 'AtomUploadButton.js' */    });
/*Line 166 - 'AtomUploadButton.js' */})(WebAtoms.AtomPostButton.prototype);
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

/*Line 0 - 'AtomWizard.js' */

/*Line 2 - 'AtomWizard.js' */(function (baseType) {
/*Line 3 - 'AtomWizard.js' */    return classCreatorEx({
/*Line 4 - 'AtomWizard.js' */        name: "WebAtoms.AtomWizard",
/*Line 5 - 'AtomWizard.js' */        base: baseType,
/*Line 6 - 'AtomWizard.js' */        start: function () {
/*Line 7 - 'AtomWizard.js' */            this._presenters = ["viewPresenter"];
/*Line 8 - 'AtomWizard.js' */        },
/*Line 9 - 'AtomWizard.js' */        properties: {
/*Line 10 - 'AtomWizard.js' */            currentStep: null,
/*Line 11 - 'AtomWizard.js' */            nextLabel: "Next",
/*Line 12 - 'AtomWizard.js' */            nextClass: "",
/*Line 13 - 'AtomWizard.js' */            buttons: null,
/*Line 14 - 'AtomWizard.js' */            prevLabel: "Back",
/*Line 15 - 'AtomWizard.js' */            finishLabel: "Finish",
/*Line 16 - 'AtomWizard.js' */            canMoveBack: true,
/*Line 17 - 'AtomWizard.js' */            canMoveNext: true,
/*Line 18 - 'AtomWizard.js' */            steps: 0,
/*Line 19 - 'AtomWizard.js' */            isLastStep: false
/*Line 20 - 'AtomWizard.js' */        },
/*Line 21 - 'AtomWizard.js' */        methods: {
/*Line 22 - 'AtomWizard.js' */            set_currentStep: function (v) {
/*Line 23 - 'AtomWizard.js' */                this._currentStep = v;
/*Line 24 - 'AtomWizard.js' */                var a = this._buttons;
/*Line 25 - 'AtomWizard.js' */                if (a && a.length) {
/*Line 26 - 'AtomWizard.js' */                    var item = a[v];
/*Line 27 - 'AtomWizard.js' */                    AtomBinder.setValue(this, "nextLabel", item.label);
/*Line 28 - 'AtomWizard.js' */                    AtomBinder.setValue(this, "nextClass", item.styleClass);
/*Line 29 - 'AtomWizard.js' */                }
/*Line 30 - 'AtomWizard.js' */                AtomBinder.refreshValue(this, "isLastStep");
/*Line 31 - 'AtomWizard.js' */            },

/*Line 33 - 'AtomWizard.js' */            get_isLastStep: function () {
/*Line 34 - 'AtomWizard.js' */                return this._currentStep == (this._steps - 1);
/*Line 35 - 'AtomWizard.js' */            },

/*Line 37 - 'AtomWizard.js' */            createWizard: function () {


/*Line 40 - 'AtomWizard.js' */                var vs = this._viewPresenter;

/*Line 42 - 'AtomWizard.js' */                this.disposeChildren(vs);

/*Line 44 - 'AtomWizard.js' */                var vt = this._viewTemplate;

/*Line 46 - 'AtomWizard.js' */                var i = 0;

/*Line 48 - 'AtomWizard.js' */                var ae = new ChildEnumerator(vt);
/*Line 49 - 'AtomWizard.js' */                while (ae.next()) {
/*Line 50 - 'AtomWizard.js' */                    i++;
/*Line 51 - 'AtomWizard.js' */                    var item = AtomUI.cloneNode(ae.current());
/*Line 52 - 'AtomWizard.js' */                    //$(vs).append(item);
/*Line 53 - 'AtomWizard.js' */                    vs.appendChild(item);
/*Line 54 - 'AtomWizard.js' */                    var type = AtomUI.getAtomType(item);
/*Line 55 - 'AtomWizard.js' */                    if (!type) {
/*Line 56 - 'AtomWizard.js' */                        type = "AtomViewBox";
/*Line 57 - 'AtomWizard.js' */                        AtomUI.attr(item, "data-atom-type", type);
/*Line 58 - 'AtomWizard.js' */                    }

/*Line 60 - 'AtomWizard.js' */                    //var s = new AtomScope(this, this.get_scope(), atomApplication);

/*Line 62 - 'AtomWizard.js' */                    var ct = AtomUI.getAtomType(item) || WebAtoms.AtomControl;
/*Line 63 - 'AtomWizard.js' */                    var cc = AtomUI.createControl(item, ct);
/*Line 64 - 'AtomWizard.js' */                    cc.init();
/*Line 65 - 'AtomWizard.js' */                }
/*Line 66 - 'AtomWizard.js' */                AtomBinder.setValue(this, "steps", i);

/*Line 68 - 'AtomWizard.js' */                if (i) {
/*Line 69 - 'AtomWizard.js' */                    AtomBinder.setValue(this, "currentStep", 0);
/*Line 70 - 'AtomWizard.js' */                }
/*Line 71 - 'AtomWizard.js' */            },

/*Line 73 - 'AtomWizard.js' */            init: function () {
/*Line 74 - 'AtomWizard.js' */                $(this._element).addClass('atom-wizard');

/*Line 76 - 'AtomWizard.js' */                baseType.init.call(this);

/*Line 78 - 'AtomWizard.js' */                var _this = this;

/*Line 80 - 'AtomWizard.js' */                var vs = this._viewPresenter;

/*Line 82 - 'AtomWizard.js' */                this.goNextCommand = function (scope, sender, evt) {
/*Line 83 - 'AtomWizard.js' */                    if (_this.get_isLastStep()) {
/*Line 84 - 'AtomWizard.js' */                        _this.invokeAction(_this._next, evt);
/*Line 85 - 'AtomWizard.js' */                        AtomBinder.setValue(_this, "canMoveBack", false);
/*Line 86 - 'AtomWizard.js' */                    } else {
/*Line 87 - 'AtomWizard.js' */                        AtomBinder.setValue(_this, "currentStep", _this._currentStep + 1);
/*Line 88 - 'AtomWizard.js' */                    }
/*Line 89 - 'AtomWizard.js' */                };

/*Line 91 - 'AtomWizard.js' */                this.goPrevCommand = function () {
/*Line 92 - 'AtomWizard.js' */                    AtomBinder.setValue(_this, "currentStep", _this._currentStep - 1);
/*Line 93 - 'AtomWizard.js' */                };

/*Line 95 - 'AtomWizard.js' */                this.resetCommand = function () {
/*Line 96 - 'AtomWizard.js' */                    _this.createWizard();
/*Line 97 - 'AtomWizard.js' */                    AtomBinder.setValue(_this, "currentStep", 0);
/*Line 98 - 'AtomWizard.js' */                    AtomBinder.setValue(_this, "canMoveBack", true);
/*Line 99 - 'AtomWizard.js' */                };

/*Line 101 - 'AtomWizard.js' */                // create children...
/*Line 102 - 'AtomWizard.js' */                this.createWizard();

/*Line 104 - 'AtomWizard.js' */                this.nextCommand = function (scope, sender, evt) {
/*Line 105 - 'AtomWizard.js' */                    var child = vs.atomControl.get_selectedChild().atomControl;
/*Line 106 - 'AtomWizard.js' */                    if (child._next) {
/*Line 107 - 'AtomWizard.js' */                        child.invokeAction(child._next);
/*Line 108 - 'AtomWizard.js' */                        return;
/*Line 109 - 'AtomWizard.js' */                    } else {
/*Line 110 - 'AtomWizard.js' */                        _this.goNextCommand(scope, sender, evt);
/*Line 111 - 'AtomWizard.js' */                    }
/*Line 112 - 'AtomWizard.js' */                };

/*Line 114 - 'AtomWizard.js' */            }
/*Line 115 - 'AtomWizard.js' */        }
/*Line 116 - 'AtomWizard.js' */    });
/*Line 117 - 'AtomWizard.js' */})(WebAtoms.AtomDockPanel.prototype);

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
/*Line 14 - 'AtomYesNoControl.js' */        }
/*Line 15 - 'AtomYesNoControl.js' */    });
/*Line 16 - 'AtomYesNoControl.js' */})(WebAtoms.AtomToggleButtonBar.prototype);
/*Line 0 - 'AtomYesNoCustom.js' */

/*Line 2 - 'AtomYesNoCustom.js' */(function (baseType) {
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
/*Line 39 - 'AtomYesNoCustom.js' */                    AtomUI.attr(this._input, "placeholder", this._placeholder);
/*Line 40 - 'AtomYesNoCustom.js' */                    var pf = window.placeHolderFixer;
/*Line 41 - 'AtomYesNoCustom.js' */                    if(pf) pf.refresh();
/*Line 42 - 'AtomYesNoCustom.js' */                }
/*Line 43 - 'AtomYesNoCustom.js' */            },

/*Line 45 - 'AtomYesNoCustom.js' */            init: function () {

/*Line 47 - 'AtomYesNoCustom.js' */                baseType.init.call(this);

/*Line 49 - 'AtomYesNoCustom.js' */                this._yesNo = this._yesNo.atomControl;

/*Line 51 - 'AtomYesNoCustom.js' */                var input = this._input;
/*Line 52 - 'AtomYesNoCustom.js' */                this.bindEvent(input, "change", "onValueChange");
/*Line 53 - 'AtomYesNoCustom.js' */                //this.bindEvent(this._yesNo, "selectionChanged", "onSelectionChanged");
/*Line 54 - 'AtomYesNoCustom.js' */            }
/*Line 55 - 'AtomYesNoCustom.js' */        }
/*Line 56 - 'AtomYesNoCustom.js' */    });
/*Line 57 - 'AtomYesNoCustom.js' */})(WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomApplication.js' */

/*Line 2 - 'AtomApplication.js' */window.appScope = window.appScope || {};

/*Line 4 - 'AtomApplication.js' */this.atomApplication = null;

/*Line 6 - 'AtomApplication.js' */(function (base) {

/*Line 8 - 'AtomApplication.js' */    return classCreator("WebAtoms.AtomApplication", base,
/*Line 9 - 'AtomApplication.js' */        function (element) {
/*Line 10 - 'AtomApplication.js' */            $(element).removeClass("atom-dock-panel");
/*Line 11 - 'AtomApplication.js' */            $(element).addClass("atom-application");

/*Line 13 - 'AtomApplication.js' */            this._scope = new AtomScope(this, null, this);
/*Line 14 - 'AtomApplication.js' */            //window.appScope = this._scope;

/*Line 16 - 'AtomApplication.js' */            if (window.model) {
/*Line 17 - 'AtomApplication.js' */                window.appScope.model = window.model;
/*Line 18 - 'AtomApplication.js' */                this._data = window.model;
/*Line 19 - 'AtomApplication.js' */            }

/*Line 21 - 'AtomApplication.js' */            if (window.appScope) {
/*Line 22 - 'AtomApplication.js' */                var d = this._scope;
/*Line 23 - 'AtomApplication.js' */                var s = window.appScope;
/*Line 24 - 'AtomApplication.js' */                for (var i in s) {
/*Line 25 - 'AtomApplication.js' */                    d[i] = s[i];
/*Line 26 - 'AtomApplication.js' */                }
/*Line 27 - 'AtomApplication.js' */            }
/*Line 28 - 'AtomApplication.js' */            window.appScope = this._scope;

/*Line 30 - 'AtomApplication.js' */            window.atomApplication = this;
/*Line 31 - 'AtomApplication.js' */            this.busyCount = 0;

/*Line 33 - 'AtomApplication.js' */            var url = location.hash;
/*Line 34 - 'AtomApplication.js' */            url = url ? url.substr(1) : url;
/*Line 35 - 'AtomApplication.js' */            if (url) {
/*Line 36 - 'AtomApplication.js' */                var s = AtomUI.parseUrl(url);
/*Line 37 - 'AtomApplication.js' */                this._hash = location.hash;
/*Line 38 - 'AtomApplication.js' */                var ts = this._scope;
/*Line 39 - 'AtomApplication.js' */                this._defaultHash = s;
/*Line 40 - 'AtomApplication.js' */                for (var i in s) {
/*Line 41 - 'AtomApplication.js' */                    var v = s[i];
/*Line 42 - 'AtomApplication.js' */                    ts[i] = v;
/*Line 43 - 'AtomApplication.js' */                }
                
/*Line 45 - 'AtomApplication.js' */            } else {
/*Line 46 - 'AtomApplication.js' */                this._hash = location.hash;
/*Line 47 - 'AtomApplication.js' */            }

/*Line 49 - 'AtomApplication.js' */            this._defaultScope = {};

/*Line 51 - 'AtomApplication.js' */        },
/*Line 52 - 'AtomApplication.js' */        {
/*Line 53 - 'AtomApplication.js' */            get_title: function () {
/*Line 54 - 'AtomApplication.js' */                return document.title;
/*Line 55 - 'AtomApplication.js' */            },
/*Line 56 - 'AtomApplication.js' */            set_title: function (v) {
/*Line 57 - 'AtomApplication.js' */                document.title = v;
/*Line 58 - 'AtomApplication.js' */            },

/*Line 60 - 'AtomApplication.js' */            get_isBusy: function () {
/*Line 61 - 'AtomApplication.js' */                return this.busyCount;
/*Line 62 - 'AtomApplication.js' */            },

/*Line 64 - 'AtomApplication.js' */            setBusy: function (b, msg) {
/*Line 65 - 'AtomApplication.js' */                if (b) {
/*Line 66 - 'AtomApplication.js' */                    this.busyCount++;
/*Line 67 - 'AtomApplication.js' */                } else {
/*Line 68 - 'AtomApplication.js' */                    this.busyCount--;
/*Line 69 - 'AtomApplication.js' */                }
/*Line 70 - 'AtomApplication.js' */                if (msg !== undefined) {
/*Line 71 - 'AtomApplication.js' */                    if (!msg)
/*Line 72 - 'AtomApplication.js' */                        msg = "";
/*Line 73 - 'AtomApplication.js' */                    AtomBinder.setValue(this, "busyMessage", msg);
/*Line 74 - 'AtomApplication.js' */                } else {
/*Line 75 - 'AtomApplication.js' */                    AtomBinder.setValue(this, "busyMessage", "Loading...");
/*Line 76 - 'AtomApplication.js' */                }
/*Line 77 - 'AtomApplication.js' */                AtomBinder.refreshValue(this, "isBusy");
/*Line 78 - 'AtomApplication.js' */            },

/*Line 80 - 'AtomApplication.js' */            updateUI: function () {
/*Line 81 - 'AtomApplication.js' */                //if (!this._renderAsPage) {
/*Line 82 - 'AtomApplication.js' */                //    var element = this.get_element();
/*Line 83 - 'AtomApplication.js' */                //    var ep = element.parentNode;
/*Line 84 - 'AtomApplication.js' */                //    var pw = $(ep).outerWidth();
/*Line 85 - 'AtomApplication.js' */                //    var left = (pw - $(element).width()) / 2;
/*Line 86 - 'AtomApplication.js' */                //    element.style.left = left + "px";
/*Line 87 - 'AtomApplication.js' */                //    element.style.position = "absolute";
/*Line 88 - 'AtomApplication.js' */                //}
/*Line 89 - 'AtomApplication.js' */                base.updateUI.call(this);

/*Line 91 - 'AtomApplication.js' */                AtomBinder.refreshValue(this, "appWidth");
/*Line 92 - 'AtomApplication.js' */                AtomBinder.refreshValue(this, "appHeight");
/*Line 93 - 'AtomApplication.js' */                AtomBinder.refreshValue(this, "bodyWidth");
/*Line 94 - 'AtomApplication.js' */                AtomBinder.refreshValue(this, "bodyHeight");
/*Line 95 - 'AtomApplication.js' */            },

/*Line 97 - 'AtomApplication.js' */            onUpdateUI: function () {
/*Line 98 - 'AtomApplication.js' */                if (!this._renderAsPage) {
/*Line 99 - 'AtomApplication.js' */                    base.onUpdateUI.call(this);
/*Line 100 - 'AtomApplication.js' */                }
/*Line 101 - 'AtomApplication.js' */            },

/*Line 103 - 'AtomApplication.js' */            get_appWidth: function () {
/*Line 104 - 'AtomApplication.js' */                return $(this._element).width();
/*Line 105 - 'AtomApplication.js' */            },
/*Line 106 - 'AtomApplication.js' */            get_appHeight: function () {
/*Line 107 - 'AtomApplication.js' */                return $(this._element).height();
/*Line 108 - 'AtomApplication.js' */            },

/*Line 110 - 'AtomApplication.js' */            get_bodyWidth: function () {
/*Line 111 - 'AtomApplication.js' */                return $(document.body).width();
/*Line 112 - 'AtomApplication.js' */            },
/*Line 113 - 'AtomApplication.js' */            get_bodyHeight: function () {
/*Line 114 - 'AtomApplication.js' */                return $(document.body).height();
/*Line 115 - 'AtomApplication.js' */            },


/*Line 118 - 'AtomApplication.js' */            onHashChanged: function () {

/*Line 120 - 'AtomApplication.js' */                if (this._noHashRefresh)
/*Line 121 - 'AtomApplication.js' */                    return;
/*Line 122 - 'AtomApplication.js' */                var scope = this._scope;

/*Line 124 - 'AtomApplication.js' */                var url = location.hash;
/*Line 125 - 'AtomApplication.js' */                if (!url) {
/*Line 126 - 'AtomApplication.js' */                    //return;
/*Line 127 - 'AtomApplication.js' */                    url = "#";
/*Line 128 - 'AtomApplication.js' */                }

/*Line 130 - 'AtomApplication.js' */                //log("#changed:" + url);

/*Line 132 - 'AtomApplication.js' */                this._noHashRefresh = true;
/*Line 133 - 'AtomApplication.js' */                url = url.substr(1);

/*Line 135 - 'AtomApplication.js' */                var s = AtomUI.parseUrl(url);

/*Line 137 - 'AtomApplication.js' */                if (this._created) {
/*Line 138 - 'AtomApplication.js' */                    var ds = this._defaultScope;
/*Line 139 - 'AtomApplication.js' */                    for (var key in ds) {
/*Line 140 - 'AtomApplication.js' */                        var v = ds[key];
/*Line 141 - 'AtomApplication.js' */                        if (s[key] === undefined) {
/*Line 142 - 'AtomApplication.js' */                            s[key] = v;
/*Line 143 - 'AtomApplication.js' */                        }
/*Line 144 - 'AtomApplication.js' */                    }

/*Line 146 - 'AtomApplication.js' */                    for (var key in s) {
/*Line 147 - 'AtomApplication.js' */                        var val = s[key];
/*Line 148 - 'AtomApplication.js' */                        if (scope[key] != val) {
/*Line 149 - 'AtomApplication.js' */                            AtomBinder.setValue(scope, key, val);
/*Line 150 - 'AtomApplication.js' */                        }
/*Line 151 - 'AtomApplication.js' */                    }
/*Line 152 - 'AtomApplication.js' */                } else {
/*Line 153 - 'AtomApplication.js' */                    Atom.merge(scope, s);
/*Line 154 - 'AtomApplication.js' */                }

/*Line 156 - 'AtomApplication.js' */                this._noHashRefresh = false;

/*Line 158 - 'AtomApplication.js' */            },

/*Line 160 - 'AtomApplication.js' */            invokeUpdateUI: function () {
/*Line 161 - 'AtomApplication.js' */                var container = this;
/*Line 162 - 'AtomApplication.js' */                var _this = this;
/*Line 163 - 'AtomApplication.js' */                window.setTimeout(function () {
/*Line 164 - 'AtomApplication.js' */                    return _this.updateUI();
/*Line 165 - 'AtomApplication.js' */                }, 5);
/*Line 166 - 'AtomApplication.js' */            },

/*Line 168 - 'AtomApplication.js' */            onRefreshValue: function () {
/*Line 169 - 'AtomApplication.js' */                if (this._noHashRefresh)
/*Line 170 - 'AtomApplication.js' */                    return;

/*Line 172 - 'AtomApplication.js' */                if (!this._ready)
/*Line 173 - 'AtomApplication.js' */                    return;

/*Line 175 - 'AtomApplication.js' */                var dest = this._defaultScope;

/*Line 177 - 'AtomApplication.js' */                //var i = key;
/*Line 178 - 'AtomApplication.js' */                //if (i.indexOf('_') == 0)
/*Line 179 - 'AtomApplication.js' */                //    return;
/*Line 180 - 'AtomApplication.js' */                //var val = this._scope[i];
/*Line 181 - 'AtomApplication.js' */                //if (val === undefined)
/*Line 182 - 'AtomApplication.js' */                //    return;
/*Line 183 - 'AtomApplication.js' */                //if (val === null)
/*Line 184 - 'AtomApplication.js' */                //    return;
/*Line 185 - 'AtomApplication.js' */                //var t = typeof (val);
/*Line 186 - 'AtomApplication.js' */                //if (t != 'string' && t != 'number' && t != 'boolean') {
/*Line 187 - 'AtomApplication.js' */                //    return;
/*Line 188 - 'AtomApplication.js' */                //}


/*Line 191 - 'AtomApplication.js' */                var diff =  AtomBinder.getClone(this._defaultHash || {});
                
/*Line 193 - 'AtomApplication.js' */                var src = this._scope;

/*Line 195 - 'AtomApplication.js' */                for (var k in src) {
/*Line 196 - 'AtomApplication.js' */                    var v = src[k];
/*Line 197 - 'AtomApplication.js' */                    if (dest.hasOwnProperty(k)) {
/*Line 198 - 'AtomApplication.js' */                        if (v == dest[k])
/*Line 199 - 'AtomApplication.js' */                            continue;
/*Line 200 - 'AtomApplication.js' */                        //diff.push({ key: k, value: v });
/*Line 201 - 'AtomApplication.js' */                        diff[k]=v;
/*Line 202 - 'AtomApplication.js' */                    } else {
/*Line 203 - 'AtomApplication.js' */                        if (k.indexOf('_') == 0) continue;
/*Line 204 - 'AtomApplication.js' */                        if (v === undefined || v === null) continue;
/*Line 205 - 'AtomApplication.js' */                        if (!/string|number|boolean/i.test(typeof (v))) continue;
/*Line 206 - 'AtomApplication.js' */                        //diff.push({ key:k, value: v });
/*Line 207 - 'AtomApplication.js' */                        diff[k]=v;
/*Line 208 - 'AtomApplication.js' */                    }
/*Line 209 - 'AtomApplication.js' */                }

/*Line 211 - 'AtomApplication.js' */                var da = [];
/*Line 212 - 'AtomApplication.js' */                for(var k in diff){
/*Line 213 - 'AtomApplication.js' */                    var v = diff[k];
/*Line 214 - 'AtomApplication.js' */                    da.push({ key:k, value:v });
/*Line 215 - 'AtomApplication.js' */                }
/*Line 216 - 'AtomApplication.js' */                var p = "#" + da.map(function (a) { return a.key + "=" + encodeURIComponent(a.value); }).join("&");

/*Line 218 - 'AtomApplication.js' */                if (p == location.hash)
/*Line 219 - 'AtomApplication.js' */                    return;
/*Line 220 - 'AtomApplication.js' */                if (p == "#" && !location.hash)
/*Line 221 - 'AtomApplication.js' */                    return;

/*Line 223 - 'AtomApplication.js' */                this._noHashRefresh = true;
/*Line 224 - 'AtomApplication.js' */                if (history && history.pushState) {
/*Line 225 - 'AtomApplication.js' */                    history.pushState({}, document.title, (location.href.split('#')[0]) + p);
/*Line 226 - 'AtomApplication.js' */                } else {
/*Line 227 - 'AtomApplication.js' */                    location.href = p;
/*Line 228 - 'AtomApplication.js' */                }
/*Line 229 - 'AtomApplication.js' */                this._noHashRefresh = false;
/*Line 230 - 'AtomApplication.js' */            },

/*Line 232 - 'AtomApplication.js' */            onInitialized: function () {

/*Line 234 - 'AtomApplication.js' */                this._ready = true;

/*Line 236 - 'AtomApplication.js' */                // reset url values... enforce again...
/*Line 237 - 'AtomApplication.js' */                base.onInitialized.call(this);
/*Line 238 - 'AtomApplication.js' */                if (!this._renderAsPage) {
/*Line 239 - 'AtomApplication.js' */                    $(this._element).addClass("atom-dock-application");
/*Line 240 - 'AtomApplication.js' */                }


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

/*Line 255 - 'AtomApplication.js' */                AtomBinder.refreshValue(this, "appHeight");
/*Line 256 - 'AtomApplication.js' */                AtomBinder.refreshValue(this, "bodyHeight");

/*Line 258 - 'AtomApplication.js' */            },

/*Line 260 - 'AtomApplication.js' */            createChildren: function () {
/*Line 261 - 'AtomApplication.js' */                base.createChildren.call(this);

/*Line 263 - 'AtomApplication.js' */                this.getTemplate("busyTemplate");
/*Line 264 - 'AtomApplication.js' */                if (this._busyTemplate) {
/*Line 265 - 'AtomApplication.js' */                    this._element.appendChild(this._busyTemplate);

/*Line 267 - 'AtomApplication.js' */                    this.onCreateChildren(this._busyTemplate);
/*Line 268 - 'AtomApplication.js' */                }
/*Line 269 - 'AtomApplication.js' */            },

/*Line 271 - 'AtomApplication.js' */            onCreated: function () {
/*Line 272 - 'AtomApplication.js' */                base.onCreated.call(this);

/*Line 274 - 'AtomApplication.js' */                if (this._next) {
/*Line 275 - 'AtomApplication.js' */                    WebAtoms.dispatcher.callLater(function () {
/*Line 276 - 'AtomApplication.js' */                        window.atomApplication.invokeAction(window.atomApplication._next);
/*Line 277 - 'AtomApplication.js' */                    });
/*Line 278 - 'AtomApplication.js' */                }
/*Line 279 - 'AtomApplication.js' */            },

/*Line 281 - 'AtomApplication.js' */            onCheckHash: function () {
/*Line 282 - 'AtomApplication.js' */                if (this._lastHash != location.hash) {
/*Line 283 - 'AtomApplication.js' */                    this.onHashChanged();
/*Line 284 - 'AtomApplication.js' */                    this._lastHash = location.hash;
/*Line 285 - 'AtomApplication.js' */                }
/*Line 286 - 'AtomApplication.js' */            },

/*Line 288 - 'AtomApplication.js' */            onCloseCommand: function () {
/*Line 289 - 'AtomApplication.js' */                if (!parent)
/*Line 290 - 'AtomApplication.js' */                    return;
/*Line 291 - 'AtomApplication.js' */                //var iframe = parent.document.getElementById(frameElement.id);
/*Line 292 - 'AtomApplication.js' */                var win = frameElement.atomWindow;
/*Line 293 - 'AtomApplication.js' */                win._value = this._value;
/*Line 294 - 'AtomApplication.js' */                win.onCloseCommand();
/*Line 295 - 'AtomApplication.js' */            },

/*Line 297 - 'AtomApplication.js' */            setup: function () {
/*Line 298 - 'AtomApplication.js' */                this.createChildren();
/*Line 299 - 'AtomApplication.js' */                this.init();
/*Line 300 - 'AtomApplication.js' */            },

/*Line 302 - 'AtomApplication.js' */            init: function () {

/*Line 304 - 'AtomApplication.js' */                this.bindEvent(window, "resize", "invokeUpdateUI");

/*Line 306 - 'AtomApplication.js' */                var self = this;
/*Line 307 - 'AtomApplication.js' */                //this._onRefreshValue = function () {
/*Line 308 - 'AtomApplication.js' */                //    self.onRefreshValue.apply(self, arguments);
/*Line 309 - 'AtomApplication.js' */                //};
/*Line 310 - 'AtomApplication.js' */                this._onRefreshValue = aggregateHandler(function () {
/*Line 311 - 'AtomApplication.js' */                    self.onRefreshValue.apply(self, arguments);
/*Line 312 - 'AtomApplication.js' */                });

/*Line 314 - 'AtomApplication.js' */                this._scope._$_watcher = this;

/*Line 316 - 'AtomApplication.js' */                base.init.call(this);


/*Line 319 - 'AtomApplication.js' */                this.closeCommand = function () {
/*Line 320 - 'AtomApplication.js' */                    self.onCloseCommand.apply(self, arguments);
/*Line 321 - 'AtomApplication.js' */                };

/*Line 323 - 'AtomApplication.js' */            }
/*Line 324 - 'AtomApplication.js' */        },
/*Line 325 - 'AtomApplication.js' */        {
/*Line 326 - 'AtomApplication.js' */            renderAsPage: false,
/*Line 327 - 'AtomApplication.js' */            busyMessage: "",
/*Line 328 - 'AtomApplication.js' */            progress: 0

/*Line 330 - 'AtomApplication.js' */        });
/*Line 331 - 'AtomApplication.js' */})(WebAtoms.AtomDockPanel.prototype);
/*Line 0 - 'AtomAutoPostForm.js' */

/*Line 2 - 'AtomAutoPostForm.js' */(function (baseType) {
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
/*Line 113 - 'AtomAutoPostForm.js' */})(WebAtoms.AtomForm.prototype);


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

/*Line 2 - 'AtomFormField.js' */(function (baseType) {
/*Line 3 - 'AtomFormField.js' */    return classCreatorEx({
/*Line 4 - 'AtomFormField.js' */        name: "WebAtoms.AtomFormField",
/*Line 5 - 'AtomFormField.js' */        base: baseType,
/*Line 6 - 'AtomFormField.js' */        start: function () {
/*Line 7 - 'AtomFormField.js' */            this._presenters = ["contentPresenter"];
/*Line 8 - 'AtomFormField.js' */        },
/*Line 9 - 'AtomFormField.js' */        properties: {
/*Line 10 - 'AtomFormField.js' */            label: undefined,
/*Line 11 - 'AtomFormField.js' */            fieldId:undefined,
/*Line 12 - 'AtomFormField.js' */            fieldClass: undefined,
/*Line 13 - 'AtomFormField.js' */            required: false,
/*Line 14 - 'AtomFormField.js' */            fieldVisible: true
/*Line 15 - 'AtomFormField.js' */        },
/*Line 16 - 'AtomFormField.js' */        methods: {
/*Line 17 - 'AtomFormField.js' */            set_fieldVisible: function (v) {
/*Line 18 - 'AtomFormField.js' */                this._fieldVisible = v;
/*Line 19 - 'AtomFormField.js' */                $(this._element).css("display", v ? '' : 'none');
/*Line 20 - 'AtomFormField.js' */            },
/*Line 21 - 'AtomFormField.js' */            set_fieldClass: function (v) {
/*Line 22 - 'AtomFormField.js' */                this._fieldClass = v;
/*Line 23 - 'AtomFormField.js' */                this.setLocalValue('class', v, this._element);
/*Line 24 - 'AtomFormField.js' */            },
/*Line 25 - 'AtomFormField.js' */            onCreated: function () {
/*Line 26 - 'AtomFormField.js' */                this.setup();
/*Line 27 - 'AtomFormField.js' */            },
/*Line 28 - 'AtomFormField.js' */            setup: function () {
/*Line 29 - 'AtomFormField.js' */                if (!this._created)
/*Line 30 - 'AtomFormField.js' */                    return;

/*Line 32 - 'AtomFormField.js' */                if (this._contentPresenter) {
/*Line 33 - 'AtomFormField.js' */                    this._contentPresenter.appendChild(this._element.contentElement);
/*Line 34 - 'AtomFormField.js' */                }

/*Line 36 - 'AtomFormField.js' */                AtomBinder.refreshValue(this, "fieldClass");
/*Line 37 - 'AtomFormField.js' */            }
/*Line 38 - 'AtomFormField.js' */        }
/*Line 39 - 'AtomFormField.js' */    });
/*Line 40 - 'AtomFormField.js' */})(WebAtoms.AtomControl.prototype);
/*Line 0 - 'AtomFormGrid.js' */

/*Line 2 - 'AtomFormGrid.js' */// http://jsfiddle.net/2yqQF/

/*Line 4 - 'AtomFormGrid.js' */(function (baseType) {
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

/*Line 45 - 'AtomFormGrid.js' */                var minLabelWidth = AtomUI.attr(this._element, "atom-min-label-width");

/*Line 47 - 'AtomFormGrid.js' */                this.getTemplate("fieldTemplate");

/*Line 49 - 'AtomFormGrid.js' */                while (ae.next()) {
/*Line 50 - 'AtomFormGrid.js' */                    var item = ae.current();

/*Line 52 - 'AtomFormGrid.js' */                    var at = AtomUI.attr(item,"atom-type");
/*Line 53 - 'AtomFormGrid.js' */                    if (at == "AtomFormRow") {
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
/*Line 73 - 'AtomFormGrid.js' */                    if (at == "AtomFormTabControl" || at == "AtomTabControl") {


/*Line 76 - 'AtomFormGrid.js' */                        var tabBar = document.createElement("ul");
/*Line 77 - 'AtomFormGrid.js' */                        tabBar.setAttribute("atom-type", "AtomToggleButtonBar");
/*Line 78 - 'AtomFormGrid.js' */                        var tabBarID = AtomUI.assignID(tabBar);
/*Line 79 - 'AtomFormGrid.js' */                        tabBar.setAttribute("atom-name", tabBarID);
/*Line 80 - 'AtomFormGrid.js' */                        tabBar.setAttribute("atom-show-tabs", "true");
/*Line 81 - 'AtomFormGrid.js' */                        var te = document.createElement("li");
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
/*Line 115 - 'AtomFormGrid.js' */})(WebAtoms.AtomFormLayout.prototype);


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


/*Line 5 - 'ZZZZZInitializer.js' */$(document).ready(function () {


/*Line 8 - 'ZZZZZInitializer.js' */    // commencing Web Atoms...
/*Line 9 - 'ZZZZZInitializer.js' */    var d = WebAtoms.dispatcher;

/*Line 11 - 'ZZZZZInitializer.js' */    d.setupControls();
/*Line 12 - 'ZZZZZInitializer.js' */    d.start();
/*Line 13 - 'ZZZZZInitializer.js' */});

/*Line 15 - 'ZZZZZInitializer.js' */$(window).unload(function () {

/*Line 17 - 'ZZZZZInitializer.js' */    function dispose(e) {
/*Line 18 - 'ZZZZZInitializer.js' */        if (!e)
/*Line 19 - 'ZZZZZInitializer.js' */            return;
/*Line 20 - 'ZZZZZInitializer.js' */        if (e.atomControl) {
/*Line 21 - 'ZZZZZInitializer.js' */            e.atomControl.dispose();
/*Line 22 - 'ZZZZZInitializer.js' */        } else {
/*Line 23 - 'ZZZZZInitializer.js' */            var ce = new ChildEnumerator(e);
/*Line 24 - 'ZZZZZInitializer.js' */            while (ce.next()) {
/*Line 25 - 'ZZZZZInitializer.js' */                dispose(ce.current());
/*Line 26 - 'ZZZZZInitializer.js' */            }
/*Line 27 - 'ZZZZZInitializer.js' */        }
/*Line 28 - 'ZZZZZInitializer.js' */    }

/*Line 30 - 'ZZZZZInitializer.js' */    dispose(document.body);
/*Line 31 - 'ZZZZZInitializer.js' */});


	})(window);

