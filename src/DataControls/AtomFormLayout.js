/// <reference path="../Controls/AtomControl.js" />

(function (baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomFormLayout",
        base: baseType,
        start: function () {
            this._useTable = true;
            this._errorItems = [];
            this._minLabelWidth = 0;
        },
        properties: {
            minLabelWidth: 0
        },
        methods: {
            createField: function (parent, child) {



                var amap = AtomUI.attributeMap(child, /^(atom\-(type|label|required|regex|data\-type|is\-valid|field\-(value|visible|class)|error))$/i);

                var at = amap["atom-type"];
                if (at) {
                    amap["atom-type"] = null;
                    switch (at.value) {
                        case "AtomFormGridLayout":
                        case "AtomFormTab":
                            parent.appendChild(child);
                            var a = AtomUI.createControl(child, at.value);
                            return a;
                            break;
                    }
                }

                var field = AtomUI.cloneNode(this._fieldTemplate);

                var cp = AtomUI.findPresenter(field);
                if (cp) {
                    cp.appendChild(child);
                    $(cp).removeAttr("atom-presenter");
                } else {
                    field.contentElement = child;
                }

                parent.appendChild(field);

                for (var k in amap) {
                    var v = amap[k];
                    if (!v)
                        continue;
                    child.removeAttributeNode(v.node);
                    field.setAttributeNode(v.node);
                }

                amap = AtomUI.attributeMap(field, /^atom\-(field\-value|is\-valid)$/i);

                if (!(amap["atom-field-value"] || amap["atom-is-valid"])) {
                    var v = $(child).attr("atom-value");
                    if (v && /^\$\[/gi.test(v)) {
                        // must be a two way binding..
                        v = v.substr(2);
                        if (!/^\$/gi.test(v)) {
                            v = "$" + v;
                        }
                        v = "[" + v;
                        var ind = v.indexOf(']');
                        v = v.substr(0, ind + 1);
                        $(field).attr("atom-field-value", v);
                    }
                }

                return AtomUI.createControl(field, WebAtoms.AtomFieldType);
            },

            createChildren: function () {
                var element = this._element;
                $(element).addClass("atom-form");
                var ae = new AtomEnumerator($(element).children());

                // add table...
                var table = document.createElement("TABLE");

                $(table).addClass("atom-form-table");

                var tbody = document.createElement("TBODY");

                AtomUI.removeAllChildren(element);
                //element.innerHTML = "";

                element.appendChild(table);
                table.appendChild(tbody);

                var child;
                this.getTemplate("fieldTemplate");

                while (ae.next()) {
                    child = ae.current();
                    if (!child)
                        continue;

                    this.createField(tbody, child);

                }

            }
        }
    });
})(WebAtoms.AtomControl.prototype);
