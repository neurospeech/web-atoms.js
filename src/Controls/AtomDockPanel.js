/// <reference path="AtomControl.js" />

(function (base) {

    var AtomUI = window.AtomUI;

    return classCreatorEx({
        name: "WebAtoms.AtomDockPanel",
        base: base,
        start: function (e) {
            $(e).addClass("atom-dock-panel");
        },
        properties: {
            resizeOnChildResized: false,
            contentWidth: 0
        },
        methods: {
            resizeChild: function (item) {
                if (item.atomControl) {
                    item.atomControl.updateUI();
                } else {
                    this.updateChildUI(item);
                }
            },

            calculateSize: function () {
                var element = this.get_element();
                var $element = $(element);
                var size = { width: $element.width(), height: $element.height() };

                //if (AtomBrowser.isIE && AtomBrowser.majorVersion < 10) {
                //    size = { width: element.offsetWidth, height: element.offsetHeight };
                //}else {

                //var s = AtomUI.getComputedStyle(element);

                //size = { width: AtomUI.parseStyleNumber(s.width), height: AtomUI.parseStyleNumber(s.height) };
                //}

                if (!this._resizeOnChildResized)
                    return size;

                var desiredHeight = 0;

                var ae = new ChildEnumerator(element);
                while (ae.next()) {
                    var child = ae.current();
                    var dock = AtomUI.attr(child, "atom-dock");
                    switch (dock) {
                        case "Bottom":
                        case "Fill":
                        case "Top":
                            var h;
                            if (AtomBrowser.isIE && AtomBrowser.majorVersion < 10) {
                                h = child.offsetHeight;
                            } else {
                                //h = AtomUI.getItemRect(child).height;
                                h = $(child).outerHeight(true);
                            }
                            desiredHeight += h;
                            break;
                    }
                }

                if (size.height < desiredHeight) {
                    size.height = desiredHeight;
                    $element.height(size.height);
                }

                return size;
            },

            onUpdateUI: function () {


                var element = this.get_element();
                var $element = $(element);

                var i;
                var left = 0;
                var top = parseInt($(element).css("paddingTop"), 10);

                var s = this.calculateSize();

                // is parent of this is body??
                var height = s.height;
                var width = s.width;

                if (this._contentWidth) {
                    left = (width - this._contentWidth) / 2;
                    width = this._contentWidth;
                }

                var children = [];
                var en;
                var item;

                var itemRect;
                var clientRect;

                var itemHeight;
                var itemWidth;

                var childList = {
                    top: [],
                    bottom: [],
                    left: [],
                    right: [],
                    fill:[]
                };

                isScriptOrStyle = /script|style/i;

                var ce = new ChildEnumerator(element);
                while (ce.next()) {
                    var e = ce.current();
                    if (isScriptOrStyle.test(e.tagName))
                        continue;
                    var $e = $(e);
                    if ($e.is(".dock-left,[dock$='Left']")) {
                        childList.left.push(e);
                        continue;
                    }
                    if ($e.is(".dock-right,[dock$='Right']")) {
                        childList.right.push(e);
                        continue;
                    }
                    if ($e.is("header,.dock-top,[dock$='Top']")) {
                        childList.top.push(e);
                        continue;
                    }
                    if ($e.is("footer,.dock-bottom,[dock$='Bottom']")) {
                        childList.bottom.push(e);
                        continue;
                    }
                    if ($e.is("section,.dock-fill,[dock$='Fill']")) {
                        childList.fill.push(e);
                        continue;
                    }
                    //childList.fill.push(e);
                }

                en = new AtomEnumerator(childList.top);
                while (en.next()) {
                    item = en.current();

                    itemHeight = $(item).outerHeight(true);

                    AtomUI.setItemRect(item, { top: top, left: left, width: width });

                    top += itemHeight;
                    height -= itemHeight;

                    this.resizeChild(item);
                }

                en = new AtomEnumerator(childList.bottom.reverse());
                while (en.next()) {
                    item = en.current();
                    itemHeight = $(item).outerHeight(true);

                    height -= itemHeight;

                    AtomUI.setItemRect(item, { left: left, top: (top + height), width: width });

                    this.resizeChild(item);
                }

                en = new AtomEnumerator(childList.left);
                while (en.next()) {
                    item = en.current();

                    var itemWidth = $(item).outerWidth(true);
                    width -= itemWidth;

                    AtomUI.setItemRect(item, { top: top, left: left, height: height });
                    left += itemWidth;

                    this.resizeChild(item);
                }

                en = new AtomEnumerator(childList.right.reverse());
                while (en.next()) {
                    item = en.current();
                    var itemWidth = $(item).outerWidth(true);
                    width -= itemWidth;

                    AtomUI.setItemRect(item, { left: (width + left), top: top, height: height });

                    this.resizeChild(item);
                }

                en = new AtomEnumerator(childList.fill);
                while (en.next()) {
                    item = en.current();
                    itemWidth = $(item).css("max-width");
                    if (itemWidth) {
                        itemWidth = parseFloat(itemWidth);
                        if (itemWidth > 0) {
                            width = itemWidth;
                        }
                    }

                    AtomUI.setItemRect(item, { left: left, top: top, width: width, height: height });

                    this.resizeChild(item);
                }

            }
        }
    });
})(WebAtoms.AtomControl.prototype);

