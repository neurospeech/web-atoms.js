/// <reference path="atomlayout.js" />

var AtomViewBoxLayout = (function (baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomViewBoxLayout",
        base: baseType,
        start: function () { },
        methods: {
            doLayout: function (element) {
                var style = { width: $(element).innerWidth() + 'px', height: $(element).innerHeight() + 'px' };
                var ae = new ChildEnumerator(element);
                var item;
                while (ae.next()) {
                    item = ae.current();
                    item.style.width = style.width;
                    item.style.height = style.height;
                    if (item.atomControl) {
                        item.atomControl.updateUI();
                    }
                }
            }
        }
    });
})(WebAtoms.AtomLayout.prototype);

AtomViewBoxLayout.defaultInstance = new AtomViewBoxLayout();