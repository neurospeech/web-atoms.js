/// <reference path="AtomApplication.js" />

(function (window, name, baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomSkinnedApplication",
        base: baseType,
        start:function () {
            this._presenters = ["appPresenter"];
        },
        methods: {
            setup: function () {

                var e = this._element;

                var skin = $(e).attr("atom-skin");
                if (!skin)
                    throw new Error("Skin is missing");

                this._skinTemplate = e.innerHTML;
                e.innerHTML = "";

                var _this = this;

                var a = AtomPromise.get(skin).then(
                    function () {
                        _this.skinLoaded(a);
                    }
                );
                a.invoke();
            },

            skinLoaded: function (p) {
                this._element.innerHTML = p.value();
                baseType.setup.call(this);
            },

            createChildren: function () {

                var s = this._skinTemplate;

                this._appPresenter = $(this._element).find("[atom-presenter=appPresenter]").first()[0];

                //$(this._appPresenter).replaceWith(s);

                var t = this._element.innerHTML;

                t = t.replace(this._appPresenter.innerHTML, s);

                this._element.innerHTML = t;

                base.createChildren.call(this);
            }
        }

    });
})(window, "WebAtoms.AtomSkinnedApplication", WebAtoms.AtomApplication.prototype);

