/// <reference path="AtomItemsControl.js" />

var AtomAnimations = {
    swapLeft: function (elements, width, caller, queue) {
        var first = elements[0];
        var last = elements[1];
        last.style.left = width + "px";
        last.style.visibility = 'inherit';
        last.style.zIndex = 0;
        if (caller) {
            caller._animating = true;
        }
        $(elements).animate(
            {
                left: '-=' + width
            },
            {
                easing: 'swing',
                queue: false,
                complete: function () {
                    first.style.visibility = 'hidden';
                    first.style.zIndex = -5;
                    if (caller) {
                        caller._animating = false;
                    }
                    if (queue) {
                        queue.start();
                    }
                }
            }
        );
    },
    swapRight: function (elements, width, caller, queue) {
        var first = elements[0];
        var last = elements[1];
        last.style.left = (-width) + "px";
        last.style.visibility = 'inherit';
        last.style.zIndex = 0;
        if (caller) {
            caller._animating = true;
        }
        $(elements).animate(
        {
            left: '+=' + width
        },
        {
            easing: 'swing',
            queue: false,
            complete: function () {
                first.style.visibility = 'hidden';
                first.style.zIndex = -5;
                if (caller) {
                    caller._animating = false;
                }
                if (queue) {
                    queue.start();
                }
            }
        }
        );
    },
    swapUp: function (elements, width, caller, queue) {
        var first = elements[0];
        var last = elements[1];
        last.style.top = width + "px";
        last.style.visibility = 'inherit';
        last.style.zIndex = 0;
        if (caller) {
            caller._animating = true;
        }
        $(elements).animate(
                {
                    top: '-=' + width
                },
                {
                    easing: 'swing',
                    queue: false,
                    complete: function () {
                        first.style.visibility = 'hidden';
                        first.style.zIndex = -5;
                        if (caller) {
                            caller._animating = false;
                        }
                        if (queue) {
                            queue.start();
                        }
                    }
                }
            );
    },
    swapDown: function (elements, width, caller, queue) {
        var first = elements[0];
        var last = elements[1];
        last.style.top = (-width) + "px";
        last.style.visibility = 'inherit';
        last.style.zIndex = 0;
        if (caller) {
            caller._animating = true;
        }
        $(elements).animate(
            {
                top: '+=' + width
            },
            {
                easing: 'swing',
                queue: false,
                complete: function () {
                    first.style.visibility = 'hidden';
                    first.style.zIndex = -5;
                    if (caller) {
                        caller._animating = false;
                    }
                    if (queue) {
                        queue.start();
                    }
                }
            }
            );
    }
};

window.AtomAnimations = AtomAnimations;

(function (window, baseType) {

    return classCreatorEx({
        name: "WebAtoms.AtomViewStack",
        base: baseType,
        start: function () {
            this._source = null;
            this._indexChangedHandler = null;
            this._swipeDirection = 'left-right';
        },
        properties: {
            swipeDirection: 'left-right'
        },
        methods: {
            bringSelectionIntoView: function () {
            },
            onUpdateUI: function () {
                var element = this.get_element();

                if (!element.parentNode.atomControl) {
                    // try occupying full height...
                    var height = $(element.parentNode).height();
                    var width = $(element.parentNode).width();
                    element.style.width = width + "px";
                    element.style.height = height + "px";
                }

                var childEn = new ChildEnumerator(this._element);

                var selectedChild = this.get_selectedChild();

                var oldElement;
                var oldIndex = -1;
                var newElement;
                var newIndex = -1;

                var animate = this._swipeDirection != "none" && this._lastSelectedChild && selectedChild != this._lastSelectedChild;

                var s = $(element).css("visibility");
                animate = animate && s == "visible";

                var queue = new WebAtoms.AtomDispatcher();
                queue.pause();

                var i = -1;

                while (childEn.next()) {
                    i = i + 1;
                    var item = childEn.current();


                    if (item == selectedChild) {

                        AtomUI.setItemRect(item, { width: $(element).width(), height: $(element).height() });

                        if (animate) {
                            newElement = item;
                            newIndex = i;
                        } else {
                            if (!this._animating) {
                                item.style.visibility = "inherit";
                                item.style.left = "0px";
                                item.style.top = "0px";
                                item.style.zIndex = 0;
                            }
                        }

                        this._lastSelectedChild = item;

                        //item.style.width = element.style.width;
                        //item.style.height = element.style.height;

                        //AtomUI.setItemRect(item, { width: parseInt(element.style.width), height: parseInt(element.style.height) });

                        {
                            var x = item;
                            queue.callLater(function () {

                                if (x.atomControl) {
                                    x.atomControl.updateUI();
                                }
                            });
                        }

                    } else {


                        if (item.style.visibility != "hidden") {
                            if (animate) {
                                oldElement = item;
                                oldIndex = i;
                            } else {
                                if (!this._animating) {
                                    item.style.visibility = "hidden";
                                    item.style.zIndex = -5;
                                }
                            }
                        }
                    }
                }

                if (animate) {
                    //var width = parseInt(element.style.width, 10);
                    //var height = parseInt(element.style.width, 10);
                    var width = $(element).width();
                    var height = $(element).height();
                    if (this._swipeDirection == 'up-down') {
                        if (newIndex > oldIndex) {
                            AtomAnimations.swapUp([oldElement, newElement], height, this, queue);
                        } else {
                            AtomAnimations.swapDown([oldElement, newElement], height, this, queue);
                        }
                    } else {
                        if (newIndex > oldIndex) {
                            AtomAnimations.swapLeft([oldElement, newElement], width, this, queue);
                        } else {
                            AtomAnimations.swapRight([oldElement, newElement], width, this, queue);
                        }
                    }
                } else {
                    queue.start();
                }

            },
            initialize: function () {
                var element = this.get_element();
                $(element).addClass("atom-view-stack");
                baseType.initialize.call(this);
                //this.updateUI();
            }
        }
    });
})(window, WebAtoms.AtomItemsControl.prototype);

