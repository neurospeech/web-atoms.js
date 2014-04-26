/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomApplication",
    value: "atom-application",
    properties: [
        {
            label: "appWidth",
            value: "app-width",
            readonly:true,
            description: "Width of application element, this may be different then body's width as application may be centered in the page",
            url:""
        },
        {
            label: "appHeight",
            value: "app-height",
            readonly: true,
            description: "Height of application element",
            url: ""
        },
        {
            label: "bodyWidth",
            value: "body-width",
            readonly: true,
            description: "Width of HTML Body, this property is bindable",
            url: ""
        },
        {
            label: "bodyHeight",
            value: "body-height",
            readonly: true,
            description: "Height of HTML Body, this property is bindable",
            url: ""
        },
        {
            label: "renderAsPage",
            value: "render-as-page",
            readonly: false,
            description: "AtomApplication renders as DockPanel by default, setting renderAsPage to true will cause children to be displayed in default layout without docking, this property is not bindable.",
            url: ""
        },
        {
            label: "busyMessage",
            value: "busy-message",
            readonly: false,
            def: "Loading...",
            description: "Message that will be displayed while busy dialog is on",
            url: ""
        },
        {
            label: "progress",
            value: "progress",
            readonly: false,
            description: "If set, progress will be displayed along with busyMessage",
            url: ""
        },
        {
            label: "isBusy",
            value: "is-busy",
            readonly: true,
            description: "Returns whether the UI is in busy mode or not",
            url: ""
        },
        {
            label: "next",
            value: "next",
            readonly: false,
            type: "object",
            def: "null",
            description: "Next will be invoked after the application has been successfully loaded",
            url: ""
        }

    ],

    templates: [
        {
            label: "busyTemplate",
            value: "busy-template",
            description: "HTML Element that will be displayed while UI is in busy mode"
        }
    ]
});

classInfo.load("atom-control");