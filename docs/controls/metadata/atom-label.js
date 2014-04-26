/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomLabel",
    value: "atom-label",
    properties: [
        {
            label: "isNumber",
            value: "is-number",
            readonly: false,
            def: "false",
            description: "Indicates whether value comparison must be treated as number comparison or text",
            url: ""
        },
        {
            label: "value",
            value: "value",
            readonly: false,
            description: "Selected Value or index stored in database for items",
            url: ""
        },
        {
            label: "labelPath",
            value: "label-path",
            readonly: false,
            description: "Label path (property) of an item to be displayed as label",
            url: ""
        },
        {
            label: "valuePath",
            value: "value-path",
            readonly: false,
            description: "Value path (property) of an item to be compared with value",
            url: ""
        },
        {
            label: "valueSeparator",
            value: "value-separator",
            readonly: false,
            def: ",",
            description: "Value Separator for multiple values",
            url: ""
        },
        {
            label: "items",
            value: "items",
            readonly: false,
            description: "Items from which selected value will be searched and label will be displayed",
            url: ""
        }
    ]
});

classInfo.load("atom-control");