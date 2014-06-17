/// <reference path="AtomControl.js" />

(function (window, base) {

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

                var size = { width: $(element).width(), height: $(element).height() };

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
                    var dock = $(child).attr("atom-dock");
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
                    $(element).height(size.height);
                }

                return size;
            },

            onUpdateUI: function () {


                var element = this.get_element();


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

                en = new AtomEnumerator($(element).children("[atom-dock='Top']"));
                while (en.next()) {
                    item = en.current();

                    itemHeight = $(item).outerHeight(true);

                    AtomUI.setItemRect(item, { top: top, left: left, width: width });

                    top += itemHeight;
                    height -= itemHeight;

                    this.resizeChild(item);
                }

                en = new AtomEnumerator($(element).children("[atom-dock='Bottom']").get().reverse());
                while (en.next()) {
                    item = en.current();
                    itemHeight = $(item).outerHeight(true);

                    height -= itemHeight;

                    AtomUI.setItemRect(item, { left: left, top: (top + height), width: width });

                    this.resizeChild(item);
                }

                en = new AtomEnumerator($(element).children("[atom-dock='Left']"));
                while (en.next()) {
                    item = en.current();

                    var itemWidth = $(item).outerWidth(true);
                    width -= itemWidth;

                    AtomUI.setItemRect(item, { top: top, left: left, height: height });
                    left += itemWidth;

                    this.resizeChild(item);
                }

                en = new AtomEnumerator($(element).children("[atom-dock='Right']").get().reverse());
                while (en.next()) {
                    item = en.current();
                    var itemWidth = $(item).outerWidth(true);
                    width -= itemWidth;

                    AtomUI.setItemRect(item, { left: (width + left), top: top, height: height });

                    this.resizeChild(item);
                }

                en = new AtomEnumerator($(element).children("[atom-dock='Fill']"));
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
})(window, WebAtoms.AtomControl.prototype);

