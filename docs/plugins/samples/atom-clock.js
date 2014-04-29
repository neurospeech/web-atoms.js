/// <reference path="../../../jquery-1.8.2.min.js" />
/// <reference path="../../../atoms-debug.js" />

Templates.jsonML["AtomClock.template"] = [
    ["span", { 'atom-text': '[($owner.time).getHours()]' }],
    ["span", { 'atom-text': '[($owner.time).getMinutes()]' }],
    ["span", { 'atom-text': '[($owner.time).getSeconds()]' }]
];

(function (window, base) {
    return createClass({
        name: "AtomClock",
        base: base,
        start: function (e) {
            $(e).addClass("atom-clock");
        },
        properties: {
            time: (new Date())
        },
        methods: {

            /*init called before setting properties*/

            //init: function () {
            //    base.init.call(this);
            //},


            /*onCreated gets called after successful creation of this component*/
            onCreated: function () {
                base.onCreated.call(this);

                /*Pattern of passing this*/
                var _this = this;
                setInterval(function () {
                    _this.updateTime();
                }, 1000);
            },


            updateTime: function () {
                Atom.set(this, "time", (new Date()));
            }
        }
    });
})(window, WebAtoms.AtomControl.prototype);