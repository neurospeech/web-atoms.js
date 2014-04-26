/// <reference path="../../../Scripts/jquery-1.8.2.js" />
/// <reference path="../../../Scripts/WebAtoms.Debug.js" />


var classInfo = {
    name: "",
    baseTypes: [
    ],
    properties: [
    ],
    commands: [
    ],
    methods: [
    ],
    events: [
    ],
    templates: [
    ],
    styles: [
    ],

    reset: function () {
        this.name = "";
        this.baseTypes = [];
        this.properties = [];
        this.commands = [];
        this.methods = [];
        this.templates = [];
        this.events = [];
        this.styles = [];

        AtomBinder.refreshValue(this, "name");
        AtomBinder.refreshValue(this, "baseTypes");
        AtomBinder.refreshValue(this, "properties");
        AtomBinder.refreshValue(this, "commands");
        AtomBinder.refreshValue(this, "methods");
        AtomBinder.refreshValue(this, "templates");
        AtomBinder.refreshValue(this, "events");
        AtomBinder.refreshValue(this, "styles");
    },

    merge: function (c, src, dest) {
        if (!c)
            c = this;
        for (var i = 0; i < src.length; i++) {
            var item = src[i];
            item.owner = c.name;
            item.overriden = false;
            for (var j = 0; j < dest.length; j++) {
                var d = dest[j];
                if (d.value == item.value) {
                    // mark as overriden..
                    d.overriden = true;
                    item.overriden = true;
                    break;
                }
            }

            if (!item.overriden) {
                dest.push(item);
            }
        }

        dest.sort(function (a, b) {
            return a.value.localeCompare(b.value);
        });

        AtomBinder.refreshItems(dest);
    },

    setup: function (c) {

        if (!c.css) {
            c.css = [];
        }
        if (!c.events) {
            c.events = [];
        }
        if (!c.properties) {
            c.properties = [];
        }
        if (!c.templates) {
            c.templates = [];
        }
        if (!c.commands) {
            c.commands = [];
        }
        if (!c.methods) {
            c.methods = [];
        }

        if (!this.name) {
            this.name = c.name;

            if (c.styles) {
                this.styles = c.styles;

                this.styles.sort("value");
            }

            AtomBinder.refreshValue(this, "name");
            AtomBinder.refreshValue(this, "styles");

        } else {
            this.baseTypes.unshift({ name: c.name , value: c.value });
            AtomBinder.refreshItems(this.baseTypes);
        }

        this.merge(c, c.properties, this.properties);
        this.merge(c, c.events, this.events);
        this.merge(c, c.methods, this.methods);
        this.merge(c, c.templates, this.templates);
        this.merge(c, c.commands, this.commands);

    },
    load: function (a) {

        var p = AtomPromise.get("controls/metadata/" + a + ".js").then(
            function () {
                var s = p.value();
                eval(s);
            }
        );
        p.showError(false);
        p.invoke();

    }

};