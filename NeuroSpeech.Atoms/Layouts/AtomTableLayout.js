/// <reference path="AtomLayout.js" />

(function (baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomTableLayout",
        base: baseType,
        start: function (columns, cellWidth, cellHeight) {
            this._cellWidth = cellWidth;
            this._cellHeight = cellHeight;
            this._columns = columns;
        },
        methods: {
            doLayout: function (element) {
                var ae = new AtomEnumerator($(element).children());
                var item;

                var left = 0;
                var top = 0;

                var maxRows = Math.ceil(ae._array.length / this._columns) - 1;
                var rows = maxRows;

                var width = this._columns * this._cellWidth;
                var height = this._cellHeight * (maxRows + 1);

                element.style.position = "relative";
                element.style.width = width + "px";
                element.style.height = height + "px";

                element.maxRows = maxRows;

                while (ae.next()) {
                    item = ae.current();

                    item.style.position = "absolute";
                    item.style.left = left + "px";
                    item.style.top = top + "px";

                    item.style.width = this._cellWidth + "px";

                    if (rows <= 0) {
                        rows = maxRows;
                        left += this._cellWidth + 10;
                        top = 0;
                    } else {
                        rows--;
                        top += this._cellHeight;
                    }
                }
            }
        }
    });
})(WebAtoms.AtomLayout.prototype);
