/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomLinkBar",
    value: "atom-link-bar",
    properties: [
    ],
    templates: [
        {
            label: "itemTemplate",
            value: "item-template",
            description: "An anchor tag that binds and displays and maps to link for every item in the list"
        }
    ]
});

classInfo.load("atom-list-box");