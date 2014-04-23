

var AtomEvaluator = {

    ecache: {},

    becache: {},

    parse: function (txt) {

        // http://jsfiddle.net/A3vg6/44/ (recommended)
        // http://jsfiddle.net/A3vg6/45/ (working)
        // http://jsfiddle.net/A3vg6/51/ (including $ sign)

        var be = this.becache[txt];
        if (be)
            return be;

        var regex = /(?:(\$)(window|appScope|scope|data|owner|localScope))(?:\.[a-zA-Z_][a-zA-Z_0-9]*)*/gi;

        var keywords = /(window|appScope|scope|data|owner|localScope)/gi;

        var path = [];
        var vars = [];

        var found = {};

        var ms = txt.replace(regex,
            function (match) {
                var nv = "v" + (path.length + 1);
                if (match.indexOf("$owner.") == 0) {
                    match = match.substr(7);
                } else
                {
                    if (match.indexOf("owner.") == 0) {
                        match = match.substr(6);
                    } else {
                        match = match.substr(1);
                    }
                }
                path.push(match.split('.'));
                vars.push(nv);
                return nv;
            }
            );


        var method = "return " + ms + ";";
        var methodString = method;
        try {
            method = AtomEvaluator.compile(vars, method);
        } catch (e) {
            Atom.alert("Error executing \n" + methodString + "\nOriginal: " + txt);
            throw e;
        }

        be = { length: vars.length, method: method, path: path, original: ms };
        this.becache[txt] = be;
        return be;
    },
    compile: function (vars, method) {
        var k = vars.join("-") + ":" + method;
        var e = this.ecache[k];
        if (e)
            return e;

        vars.push("Atom");
        vars.push("AtomPromise");

        e = new Function(vars,method);
        this.ecache[k] = e;
        return e;
    }
};

window.AtomEvaluator = AtomEvaluator;