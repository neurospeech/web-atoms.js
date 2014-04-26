/// <reference path="AtomWindow.js" />

Atom.confirm = function (msg, f) {

    var d = { Message: msg, ConfirmValue: false, Confirm: f ? true : false };

    var e = document.createElement("DIV");
    document.body.appendChild(e);
    var w = AtomUI.createControl(e, WebAtoms.AtomWindow, d);

    w.set_windowWidth(380);
    w.set_windowHeight(120);
    w.set_windowTemplate(w.getTemplate("alertTemplate"));
    w.set_title( f ? "Message" : "Confirm" );

    w.set_next(function () {

        w.dispose();
        $(e).remove();

        if (d.ConfirmValue) {
            if (f) {
                f();
            }
        }
    });

    w.refresh();

};

if (window.__chromeCSP) {

    Atom.alert = function (msg) {
        Atom.confirm(msg, null);
    };
} else {
    Atom.alert = function (msg) {
        alert(msg);
    }
}