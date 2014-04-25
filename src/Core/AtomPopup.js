/// <reference path="webatoms.core.js" />

var AtomPopup = {

    stack: [],

    startOrder: 2000,


    
    show: function (parent, element, pos, removeHandler) {

        // post =  { 0: bottom left, 1: bottom right, 2: top left, 3: top right }

        // set logical parent
        element.style.zOrder = this.startOrder++;

        if (pos == 0) {

            var p = $(parent).offset();
            element.style.position = "absolute";
            element.style.left =   p.left + "px";
            element.style.top = (p.top + $(parent).outerHeight(true)) + "px";
        }

        element.style.visibility = "visible";

        this.stack.push({ parent: parent, element: element, removeHandler: removeHandler });

    },

    peek: function () {
        var l = null;
        if (this.stack.length > 0)
            l = this.stack[this.stack.length - 1];
        return l;
    },

    hide: function (element) {

        // only hide top most element
        // otherwise it may have been removed
        // by clicked function
        var pk = this.peek();
        if (!pk)
            return;
        if (pk.element !== element)
            return;

        element.style.visibility = "hidden";
        var item = this.stack.pop();
        if (item.removeHandler) {
            item.removeHandler(item.element);
        }
    },

    clicked: function (e) {

        var target = e.target;

        // lets see if target is outside the topmost popup...
        var pk = AtomPopup.peek();
        if (!pk)
            return;
        while (target && target != pk.element && target != pk.parent) {
            target = target.parentNode;
        }
        if (target == pk.element || target == pk.parent) {
            return;
        }

        //AtomPopup.hide(pk);
        pk.element.style.visibility = "hidden";
        this.stack.pop();
        if (pk.removeHandler) {
            pk.removeHandler(pk.element);
        }
    }


};

window.AtomPopup = AtomPopup;

$(window).click(function (e) {
    AtomPopup.clicked(e);
});