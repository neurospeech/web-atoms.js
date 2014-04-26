/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomNumberComboBox",
    value: "atom-number-combo-box",
    properties: [
        {
            label: "showPrompt",
            value: "show-prompt",
            readonly: false,
            def: "false",
            description: "Displays SELECT word as default first selection",
            url: ""
        },
        {
            label: "startNumber",
            value: "start-number",
            readonly: false,
            description: "Start number of range (inclusive) to display in combo box",
            url: ""
        },
        {
            label: "endNumber",
            value: "end-number",
            readonly: false,
            description: "End number of range (inclusive) to display in combo box",
            url: ""
        },
        {
            label: "step",
            value: "step",
            readonly: false,
            def: "1",
            description: "Step between every item from Start to End, for example, if it is set to 0.5, items will be created as 1, 1.5, 2, 2,5 etc",
            url: ""
        }
    ]
});

classInfo.load("atom-combo-box");