/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomYesNoControl",
    value: "atom-yes-no-control",
    properties: [
        {
            label: "allowSelectFirst",
            value: "allow-select-first",
            type: "bool",
            def: "false",
            description: "Since checkbox may not have any value (null), by default first will not be selected",
            url: ""
        }
    ]
});

classInfo.load("atom-toggle-button-bar");