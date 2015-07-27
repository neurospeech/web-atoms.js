/// <reference path="WebAtoms.Core.js" />

// http://jsfiddle.net/bZcth/33/#update


$(document).ready(function () {


    // commencing Web Atoms...
    var d = WebAtoms.dispatcher;

    d.setupControls();
    d.start();
});

$(window).unload(function () {

    function dispose(e) {
        if (!e)
            return;
        if (e.atomControl) {
            e.atomControl.dispose();
        } else {
            var ce = new ChildEnumerator(e);
            while (ce.next()) {
                dispose(ce.current());
            }
        }
    }

    dispose(document.body);
});

