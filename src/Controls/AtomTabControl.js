/// <reference path="AtomControl.js" />

(function (window, baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomTabControl",
        base: baseType,
        start: function () {
            this._presenters = ["itemsPresenter"];

            this._layout = WebAtoms.AtomViewBoxLayout.defaultInstance;

            this.selectedIndex = 0;
            this.labelPath = "label";

        },
        properties: {
            items: null
        },
        methods: {
            createChildren: function () {
               baseType.createChildren.call(this);

                if (this._itemsPresenter != this._element) {


                    var children = [];

                    var ae = new ChildEnumerator(this._element);
                    while (ae.next()) {
                        var c = ae.current();
                        this._element.removeChild(c);
                        children.push(c);
                    }

                    if (this._template) {
                        var t = AtomUI.cloneNode(this._template);
                        t._templateParent = this;
                        this._element.appendChild(t);
                        this.onCreateChildren(this._element);
                    }

                    ae = new AtomEnumerator(children);
                    while (ae.next()) {
                        this._itemsPresenter.appendChild(ae.current());
                    }
                    if (this._template) {
                        this.onCreateChildren(this._itemsPresenter);
                    }

                }

            }
        }
    });
})(window, WebAtoms.AtomControl.prototype);

