/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomDockPanel",
    value: "atom-dock-panel",
    properties: [
        {
            label: "contentWidth",
            value: "content-width",
            readonly: false,
            description: "To align contents of DockPanel in center, you can specify fixed width here"
        }
    ]
});

classInfo.load("atom-control");