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

                var isChildField = false;

                //var amap = AtomUI.attributeMap(child, /^(atom\-(init|type|label|required|regex|data\-type|is\-valid|field\-(value|visible|class)|error))$/i);
                var amap = AtomUI.attributeMap(child, /^(atom\-(init|type|label|field\-(visible|class)))$/i);

                var at = amap["atom-type"];
                if (at) {
                    amap["atom-type"] = null;
                    switch (at.value) {
                        case "AtomFormField":
                            isChildField = true;
                            break;
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
                    if (isChildField) {
                        var ce = new ChildEnumerator(child);
                        while (ce.next()) {
                            cp.appendChild(ce.current());
                        }
                    } else {
                        cp.appendChild(child);
                    }
                    AtomUI.removeAttr(cp, "atom-presenter");
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

                amap = AtomUI.attributeMap(child, /^atom\-required$/i);

                var childID = AtomUI.assignID(child);
                AtomUI.attr(field, "atom-field-id", childID);

                if (amap["atom-required"]) {
                    AtomUI.attr(field, "atom-required", "true");
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
