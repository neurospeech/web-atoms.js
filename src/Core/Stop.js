var $x = {};

window.$x = $x;

$x.stop = function stop(test, msg) {
    return function () {
        if (test)
            throw new Error(msg);
    }
}

$x.stopIf = window.stop;

$x.timeout = function (i, actions) {
    return function () {
        var self = this;
        setTimeout(function () {
            self.invokeAction(actions);
        }, i);
    }
}

$x.data = function (d) {
    return function () {
        this.invokeAction({data: d});
    }
}

$x.scope = function (d) {
    return function () {
        this.invokeAction({ scope: d });
    }
}

$x.localScope = function (d) {
    return function () {
        this.invokeAction({ localScope: d });
    }
}

$x.appScope = function (d) {
    return function () {
        this.invokeAction({ appScope: d });
    }
}

$x.owner = function (d) {
    return function () {
        this.invokeAction({ owner: d });
    }
}
