/// <reference path="AtomControl.js" />

(function (window, baseType) {

    return classCreatorEx({
        name: "WebAtoms.AtomViewStack",
        base: baseType,
        start: function (e) {
            this._swipeDirection = 'left-right';
        },
        properties: {
            selectedIndex:-1,
            swipeDirection: 'left-right'
        },
        methods: {
            bringSelectionIntoView: function () {
            },
            set_swipeDirection: function (v) {
                var ov = this._swipeDirection;
                if (ov) {
                    $(this._element).removeClass(ov);
                }
                this._swipeDirection = v;
                if (v) {
                    $(this._element).addClass(v);
                }
            },
            set_selectedIndex: function (v) {
                this._previousIndex = this._selectedIndex;
                this._selectedIndex = v;
                this.updateUI();
            },
            onUpdateUI: function () {

                var element = this._element;
                var childEn = new ChildEnumerator(element);

                var selectedIndex = this.get_selectedIndex();

                var queue = new WebAtoms.AtomDispatcher();
                queue.pause();

                var i = -1;

                var self = this;

                while (childEn.next()) {
                    i = i + 1;
                    var item = childEn.current();

                    $(item).addClass("view-stack-child");

                    if (i == selectedIndex) {

                        AtomUI.setItemRect(item, { width: $(element).width(), height: $(element).height() });

                        $(item).removeClass("hidden");

                        this._lastSelectedChild = item;

                        queue.callLater(function () {
                            var ac = self._lastSelectedChild.atomControl;
                            if (ac) {
                                ac.updateUI();
                            }
                        });

                    } else {

                        $(item).addClass("hidden");
                    }
                }

                queue.start();

            },
            init: function () {
                var element = this.get_element();
                $(element).addClass("atom-view-stack");
                baseType.init.call(this);

                var element = this.get_element();

                if (!element.parentNode.atomControl) {
                    $(element).addClass("atom-view-stack-fill");
                }
                $(element).addClass(this._swipeDirection);

                //this.updateUI();
            }
        }
    });
})(window, WebAtoms.AtomControl.prototype);

