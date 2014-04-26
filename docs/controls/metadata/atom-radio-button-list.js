/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomRadioButtonList",
    value: "atom-radio-button-list",
    properties: [
        {
            label: "allowMultipleSelection",
            value: "allow-multiple-selection",
            readonly: false,
            def: "false",
            description: "This is set to false to disable multiple selection of items",
            url: ""
        }
    ]
});

classInfo.load("atom-check-box-list");