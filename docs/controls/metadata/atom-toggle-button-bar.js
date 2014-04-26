/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomToggleButtonBar",
    value: "atom-toggle-button-bar",
    properties: [
        {
            label: "showTabs",
            value: "show-tabs",
            def: "false",
            readonly: false,
            description: "If set true, this button bar will be displayed as tab list instead of button list",
            url: ""
        },
        {
            label: "autoScrollToSelection",
            value: "auto-scroll-to-selection",
            type: "bool",
            def: "false",
            description: "Automatic scrolling to selected item is disabled",
            url: ""
        },
        {
            label: "allowMultipleSelection",
            value: "allow-multiple-selection",
            type: "bool",
            def: "false",
            description: "Multiple selection not allowed",
            url: ""
        },
        {
            label: "allowSelectFirst",
            value: "allow-select-first",
            type: "bool",
            def: "true",
            description: "If default item is not set, first item will be selected",
            url: ""
        }
    ]
});