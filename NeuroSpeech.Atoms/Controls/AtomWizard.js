/// <reference path="AtomDockPanel.js" />

(function (window, baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomWizard",
        base: baseType,
        start: function () {
            this._presenters = ["viewPresenter"];
        },
        properties: {
            currentStep: 0,
            nextLabel: "Next",
            nextClass: "",
            buttons: null,
            prevLabel: "Back",
            finishLabel: "Finish",
            canMoveBack: true,
            canMoveNext: true,
            steps: 0,
            currentStep: null,
            isLastStep: false
        },
        methods: {
            set_currentStep: function (v) {
                this._currentStep = v;
                var a = this._buttons;
                if (a && a.length) {
                    var item = a[v];
                    AtomBinder.setValue(this, "nextLabel", item.label);
                    AtomBinder.setValue(this, "nextClass", item.styleClass);
                }
                AtomBinder.refreshValue(this, "isLastStep");
            },

            get_isLastStep: function () {
                return this._currentStep == (this._steps - 1);
            },



            initialize: function () {
                $(this._element).addClass('atom-wizard');

                baseType.initialize.call(this);

                var _this = this;


                this.goNextCommand = function (scope, sender, evt) {
                    if (_this.get_isLastStep()) {
                        _this.invokeAction(_this._next, evt);
                        AtomBinder.setValue(_this, "canMoveBack", false);
                    } else {
                        AtomBinder.setValue(_this, "currentStep", _this._currentStep + 1);
                    }
                };

                this.goPrevCommand = function () {
                    AtomBinder.setValue(_this, "currentStep", _this._currentStep - 1);
                };

                this.resetCommand = function () {
                    AtomBinder.setValue(_this, "currentStep", 0);
                    AtomBinder.setValue(_this, "canMoveBack", true);
                };

                // create children...

                var vs = this._viewPresenter;

                var vt = this._viewTemplate;

                var i = 0;

                var ae = new ChildEnumerator(vt);
                while (ae.next()) {
                    i++;
                    var item = ae.current();
                    //$(vs).append(item);
                    vs.appendChild(item);
                    var type = $(item).attr("atom-type");
                    if (!type) {
                        type = "AtomViewBox";
                        $(item).attr("atom-type", type);
                    }

                    //var s = new AtomScope(this, this.get_scope(), atomApplication);

                    var ct = $(item).attr("atom-type") || WebAtoms.AtomControl;
                    var cc = AtomUI.createControl(item, ct);
                    cc.initialize();
                }
                AtomBinder.setValue(this, "steps", i);

                if (i) {
                    AtomBinder.setValue(this, "currentStep", 0);
                }

                this.nextCommand = function (scope, sender, evt) {
                    var child = vs.atomControl.get_selectedChild().atomControl;
                    if (child._next) {
                        child.invokeAction(child._next);
                        return;
                    } else {
                        _this.goNextCommand(scope, sender, evt);
                    }
                };

            }
        }
    });
})(window, WebAtoms.AtomDockPanel.prototype);

