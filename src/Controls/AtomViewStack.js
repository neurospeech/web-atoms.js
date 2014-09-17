/// <reference path="AtomControl.js" />

(function (window, baseType) {

    return classCreatorEx({
        name: "WebAtoms.AtomViewStack",
        base: baseType,
        start: function (e) {
            this._swipeDirection = 'left-right';
        },
        properties: {
            selectedIndex: -1,
            previousIndex: -1,
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
                if (this._isAnimating) {
                    var self = this;
                    setTimeout(function () {
                        self.set_selectedIndex(v);
                    }, 50);
                    return;
                }
                this._previousIndex = this._selectedIndex;
                this._selectedIndex = v;
                this.updateUI();
            },
            get_selectedChild: function () {
                return this._selectedChild;
            },
            onUpdateUI: function () {

                var element = this._element;
                var childEn = new ChildEnumerator(element);

                var selectedIndex = this.get_selectedIndex();
                var previousIndex = this._previousIndex;

                var queue = new WebAtoms.AtomDispatcher();
                queue.pause();

                var i = -1;

                var self = this;

                var selectedElement, previousElement;

                while (childEn.next()) {
                    i = i + 1;
                    var item = childEn.current();

                    $(item).addClass("view-stack-child");
                    if (previousIndex == -1) {
                        $(item).addClass("hidden");
                    }
                    if (i == selectedIndex) {
                        selectedElement = item;
                    } else if (i == previousIndex) {
                        previousElement = item;
                    } else {
                        $(item).addClass("hidden");
                    }
                }

                if (selectedElement) {
                    var width = $(element).innerWidth();
                    var height = $(element).innerHeight();

                    this._selectedChild = selectedElement;

                    AtomUI.setItemRect(selectedElement, { width: width, height: height });
                    var sac = selectedElement.atomControl;
                    if (sac) {
                        sac.updateUI();
                    }

                    if (previousElement) {
                        var self = this;
                        this._isAnimating = true;
                        var ael = [selectedElement, previousElement];
                        $(ael).removeClass("hidden");
                        if (selectedIndex < previousIndex) {
                            $(selectedElement).css("left", -width);
                        } else {
                            $(selectedElement).css("left", width);
                        }
                        $(ael).addClass("animate-left-property");
                        WebAtoms.dispatcher.callLater(function () {
                            $(selectedElement).css("left", 0);
                            if (selectedIndex < previousIndex) {
                                $(previousElement).css("left", width);
                            } else {
                                $(previousElement).css("left", -width);
                            }
                            setTimeout(function () {
                                self._isAnimating = false;
                                $(ael).removeClass("animate-left-property");
                                $(previousElement).addClass("hidden");
                            }, 600);
                        });
                    } else {
                        $(selectedElement).removeClass("hidden");
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

