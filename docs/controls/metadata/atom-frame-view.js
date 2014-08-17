/// <reference path="class-info.js" />


classInfo.setup({
    name: "AtomFrameView",
    value: "atom-frame-view",
    properties: [
        {
            label: "url",
            value: "url",
            readonly: false,
            def: "",
            description: "View will navigate to specified url that should exist as scope template",
            url: ""
        }
    ]
});

classInfo.load("atom-view-stack");