/// <reference path="AtomToggleButtonBar.js" />

(function (base) {
    return classCreatorEx({
        name: "WebAtoms.AtomLinkBar",
        base: base,
        start: function () {
            this._allowSelectFirst = false;

            var _this = this;
            this.openMenuCommand = function () {
                _this.openMenu.apply(_this, arguments);
            };

        },
        properties: {
            itemsPath: "items",
            selectCurrent: true,
            targetPath: "",
            menuTemplate: null,
            menuDirection: "horizontal"
        },
        methods: {

            setClass: function () {
                var $e = $(this._element);
                $e.removeClass("atom-tab-bar atom-link-bar");
                $e.addClass(this._showTabs ? 'atom-tab-bar' : 'atom-link-bar');
            },

            set_menuDirection: function (v) {
                var $e = $(this._element);
                $e.removeClass("vertical horizontal");
                $e.addClass(v);
                this._menuDirection = v;
            },

            onClick: function () {
            },



            openMenu: function (e) {

                var target = e.target;

                var ap = this.get_atomParent(target);

                if (ap == null)
                    return;

                var data = ap.get_data();

                if (!data[this._itemsPath])
                    return;

                var menu = this._subMenu;

                if (menu) {
                    AtomPopup.hide(menu._element);
                }
                else {

                    var mt = this.getTemplate("menuTemplate");

                    menu = AtomUI.cloneNode(mt);
                    menu._templateParent = this;
                    menu.style.position = "absolute";
                    //menu.style.zOrder = 
                    document.body.appendChild(menu);
                    var mt = AtomUI.getAtomType(mt) || WebAtoms.AtomControl;

                    menu = AtomUI.createControl(menu, mt, data);

                    this._subMenu = menu;
                }

                AtomBinder.setValue(menu, "data", data);

                AtomPopup.show(ap._element, menu._element, 0);

                AtomUI.cancelEvent(e);
            },


            selectDefault: function () {
                if (!this._items)
                    return;

                if (!this._selectCurrent)
                    return;

                if (this._value) {
                    return;
                }
                AtomBinder.setValue(this, "value", location.pathname);

                if (this.get_selectedIndex() == -1) {
                    this.selectItem(this._items);
                }

                this.updateSelectionBindings();
            },

            selectItem: function (a, t) {
                var ae = new AtomEnumerator(a);
                var vp = this._valuePath;
                var lp = location.pathname.toLowerCase();
                while (ae.next()) {
                    var item = ae.current();
                    var l = item;
                    if (vp)
                        l = l[vp];
                    if (!l)
                        continue;
                    if (lp == l.toLowerCase()) {
                        if (!t) {
                            AtomBinder.setValue(this, "selectedItem", item);
                        }
                        return true;
                    }

                    if (item.links) {
                        if (this.selectItem(item.links, true)) {
                            AtomBinder.setValue(this, "selectedItem", item);
                            return true;
                        }
                    }
                }
                return false;
            },

            dispose: function () {

                if (this._subMenu) {
                    this._subMenu.dispose();
                    this._subMenu = null;
                }
                base.dispose.apply(this, arguments);
            },

            init: function () {
                base.init.apply(this, arguments);

                //this.bindEvent(this._element, "mouseover", "openMenuCommand");
                this.bindEvent(this._element, "click", "openMenuCommand");
                //this.setValue("class", "[$owner.showTabs ? 'atom-tab-button-bar' : 'menu atom-link-bar']", true, this._element);
                //this.bind(this._element,
                //    'class',
                //    ['showTabs'], 0,
                //    function (v) {
                //        return v ? 'atom-tab-bar' : 'atom-link-bar'
                //    });

                this.set_menuDirection('horizontal');
            }

        }
    });
})(WebAtoms.AtomToggleButtonBar.prototype);

