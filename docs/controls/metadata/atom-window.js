/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomWindow",
    value: "atom-window",
    properties: [
        {
            label: "width",
            value: "width",
            readonly: false,
            description: "Width of Window",
            url: ""
        },
        {
            label: "openerData",
            value: "opener-data",
            readonly: true,
            description: "Data associated with opener of the window ",
            url: ""
        },
        {
            label: "opener",
            value: "opener",
            readonly: true,
            description: "Control that opened this window, mostly a button that opened this window",
            url: ""
        },
        {
            label: "height",
            value: "height",
            readonly: false,
            description: "Height of Window",
            url: ""
        },
        {
            label: "title",
            value: "title",
            readonly: false,
            description: "Title displayed in Window Chrome",
            url: ""
        },
        {
            label: "url",
            value: "url",
            readonly: false,
            description: "If set, window will host an iframe with specified url",
            url: ""
        }


    ],
    templates: [
        {
            label: "windowTemplate",
            value: "window-template",
            description: "Template for window content"
        }
    ]
});

classInfo.load("atom-control");