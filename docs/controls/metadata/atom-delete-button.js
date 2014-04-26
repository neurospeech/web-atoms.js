/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomDeleteButton",
    value: "atom-delete-button",
    properties: [
        {
            label: "confirm",
            value: "confirm",
            def: "true",
            description: "If set to true, displays a confirm box before executing click event or next invoker",
            url: ""
        },
        {
            label: "confirmMessage",
            value: "confirm-message",
            def: "Are you sure you want to delete this item?",
            description: "Message that will be displayed in confirm box before executing click event or next invoker",
            url: ""
        }
    ]
});

classInfo.load("atom-post-button");