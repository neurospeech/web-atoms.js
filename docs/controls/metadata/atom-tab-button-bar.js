/// <reference path="class-info.js" />


classInfo.setup({
    name: "AtomTabButtonBar",
    value: "atom-tab-button-bar",
    properties: [
        {
            label: "showTabs",
            value: "show-tabs",
            def: "true",
            readonly: false,
            description: "If set true, this button bar will be displayed as tab list instead of button list",
            url: ""
        }
    ]
});

classInfo.load("atom-toggle-button-bar");