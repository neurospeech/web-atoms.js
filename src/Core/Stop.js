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

$x.invoke = function(i,d,v){
    return function(){
        var a = {};
        if(v === undefined){
            var x = {};
            x[d] = v;
            a[i] = x;        
        }else{
            a[i] = d;
        }
        this.invokeAction(a);
    }
}

$x.data = function (d, v) {
    $x.invoke("data", d, v);
}

$x.scope = function (d,v) {
    $x.invoke("scope", d, v);
}

$x.localScope = function (d,v) {
    $x.invoke("localScope", d, v);
}

$x.appScope = function (d,v) {
    $x.invoke("appScope", d, v);
}

$x.owner = function (d,v) {
    $x.invoke("owner", d, v);
}

$x.reveal = function (e) {
    return function () {

    }
}