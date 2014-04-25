/// <reference path="atombrowser.js" />

var ChildEnumerator = null;

if (AtomBrowser.isIE && AtomBrowser.majorVersion < 9) {
    ChildEnumerator = function (e) {
        this.index = -1;
        this.nextItem = e.firstChild;
        this.findNext();
        this.item = null;
    };

    ChildEnumerator.prototype ={

        findNext: function () {
            var ne = this.nextItem;
            while (ne && ne.nodeType != 1) {
                ne = ne.nextSibling;
            }
            this.nextItem = ne;
            this.index++;
        },

        isFirst: function () {
            return this.index == 1;
        },

        isLast: function () {
            return this.item && !this.nextItem;
        },

        next: function () {
            this.item = this.nextItem;
            if (!this.item)
                return false;
            this.nextItem = this.item.nextSibling;
            this.findNext();
            return this.item ? true : false;
        },

        current: function () {
            return this.item;
        }

    };

    window.ChildEnumerator = ChildEnumerator;
}
else {
    ChildEnumerator = function (e) {
        this.nextItem = e.firstElementChild;
        this.item = null;
        this.first = true;
    };

    ChildEnumerator.prototype = {
        isFirst: function () {
            return !this.item.previousElementSibling;
        },
        isLast: function () {
            return this.item && !this.nextItem;
        },
        next: function () {
            this.item = this.nextItem;
            if (!this.item)
                return false;
            this.nextItem = this.item.nextElementSibling;
            return this.item ? true : false;
        },
        current: function () {
            return this.item;
        }

    };

    window.ChildEnumerator = ChildEnumerator;
}



