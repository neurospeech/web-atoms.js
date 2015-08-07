/// <reference path="AtomUI.js" />


window.getInputError = function getInputError(e, a, v) {
    var k = a["atom-required"];
    if (k) {
        if (!v) {
            $(e).addClass("atom-error-required");
            return k.msg || "Required";
        } else {
            $(e).removeClass("atom-data-required");
        }
    }
    k = a["atom-regex"];
    if (k) {
        var re = eval("(" + k.value + ")");
        if (!re.test(v)) {
            $(e).addClass("atom-error-invalid");
            return k.msg || "Invalid";
        } else {
            $(e).removeClass("atom-erorr-invalid");
        }
    }

    k = a["atom-data-type"];
    if (k) {
        var dt = k.value;
        if (dt == "email") {
            var re = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (!re.test(v)) {
                $(e).addClass("atom-error-email");
                return k.msg || "Invalid email";
            } else {
                $(e).removeClass("atom-error-email");
            }
        }
    }

    return null;
}


window.getInputErrors = function getInputErrors(e, skipFormField) {

    // is this valid...
    var v = null;
    var errors = [];
    if (/input|select|textarea/i.test(e.nodeName)) {
        v = $(e).val();
        var a = AtomUI.attributeMap(e, /atom\-(required|data\-error|regex)/);
        var error = getInputError(e, a, v);
        if (error)
        {
            errors.push({ label: error, value: e });
        }
    } else {
        var ac = e.atomControl;
        if (ac) {
            if (!skipFormField && ac.constructor == WebAtoms.AtomFormField) {
                return ac.getInputErrors();
            }
            v = AtomBinder.getValue(ac, "value");

            var a = AtomUI.attributeMap(e, /atom\-(required|data\-error|regex)/);
            var error = getInputError(e, a,  v);
            if (error) {
                errors.push({ label: error, value: e });
            }
        }
        var ce = new ChildEnumerator(e);
        while (ce.next()) {
            var child = ce.current();
            var error = getInputErrors(child);
            if (error) {
                errors = errors.concat(error);
            }
        }
    }

    if (!errors.length)
        return null;
    return errors;
};

window.clearInputErrors = function clearInputErrors(e) {

    var $e = $(e);

    $e.removeClass("atom-error-invalid");
    $e.removeClass("atom-error-required");
    $e.removeClass("atom-error-email");

    var ac = e.atomControl;
    if (ac) {

        if (ac.constructor == WebAtoms.AtomFormField) {
            ac.clearInputErrors();
            return;
        }

    }

    var ce = new ChildEnumerator(e);
    while (ce.next()) {
        var child = ce.current();
        clearInputError(child);
    }

};