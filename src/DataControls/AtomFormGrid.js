/// <reference path="AtomFormLayout.js" />

// http://jsfiddle.net/2yqQF/

(function (window, baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomFormGridLayout",
        base: baseType,
        start: function () { },
        properties: {
            minLabelWidth: 100,
            cellSpacing: 5,
            label: ""
        },
        methods: {
            onUpdateUI: function () {
                AtomBinder.refreshValue(this, "controlWidth");
                AtomBinder.refreshValue(this, "controlHeight");
                baseType.onUpdateUI.apply(this, arguments);
            },

            get_controlWidth: function () {
                return $(this._element.parentNode).innerWidth();
            },

            get_controlHeight: function () {
                return $(this._element.parentNode).innerHeight();
            },

            createChildren: function () {
                var element = this._element;
                $(element).addClass("atom-form-grid");

                var children = $(element).children();

                var ae = new AtomEnumerator(children);

                AtomUI.removeAllChildren(element);

                var container = document.createElement("DIV");
                //container.setAttribute("style-width", "[$owner.controlWidth]");
                $(container).addClass("atom-form-grid-container");

                element.appendChild(container);

                var minLabelWidth = $(this._element).attr("atom-min-label-width");

                this.getTemplate("fieldTemplate");

                while (ae.next()) {
                    var item = ae.current();

                    var at = AtomUI.attributeMap(item, /^(atom\-type)$/gi)["atom-type"];
                    if (at && at.value == "AtomFormRow") {
                        var table = document.createElement("TABLE");
                        container.appendChild(table);
                        $(table).addClass("atom-form-grid-row");
                        var tbody = document.createElement("TBODY");
                        table.appendChild(tbody);

                        var tr = document.createElement("TR");
                        tbody.appendChild(tr);

                        var children = $(item).children();
                        var ce = new AtomEnumerator(children);
                        while (ce.next()) {
                            var td = document.createElement("TD");
                            tr.appendChild(td);
                            this.createField(td, ce.current());
                        }

                        continue;
                    }
                    if (at && (at.value == "AtomFormTabControl" || at.value == "AtomTabControl")) {


                        var tabBar = document.createElement("DIV");
                        tabBar.setAttribute("atom-type", "AtomToggleButtonBar");
                        var tabBarID = AtomUI.assignID(tabBar);
                        tabBar.setAttribute("atom-name", tabBarID);
                        tabBar.setAttribute("atom-show-tabs", "true");
                        var te = document.createElement("SPAN");
                        tabBar.appendChild(te);
                        te.setAttribute("atom-text", "{$data.label}");
                        te.setAttribute("atom-template", "itemTemplate");
                        //td.appendChild(tabBar);
                        this.createField(container, tabBar);

                        var tbc = allControls[tabBarID];

                        var ce = new ChildEnumerator(item);
                        var list = [];
                        var index = 0;
                        while (ce.next()) {
                            var child = ce.current();
                            $(child).remove();
                            child.setAttribute("style-display", "[$scope." + tabBarID + ".selectedIndex == " + index + " ? '' : 'none']");
                            var cf = this.createField(container, child);
                            list.push(cf);
                            //if (cf.constructor == WebAtoms.AtomFormGridLayout) {

                            //}
                            index++;
                        }

                        tbc.set_items(list);
                        continue;
                    }
                    this.createField(container, item);

                }

            }
        }
    });
})(window, WebAtoms.AtomFormLayout.prototype);


(function (baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomFormTab",
        base: baseType,
        start: function () {
        },
        methods: {

        }
    });
})(WebAtoms.AtomFormGridLayout.prototype);