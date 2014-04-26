
classInfo.setup({
    name: "AtomListBox",
    value: "atom-list-box",
    properties: [
        {
            label: "autoSelectOnClick",
            value: "auto-select-on-click",
            def: "true",
            readonly: false,
            description: "If set to true, item is selected when user click on the item, otherwise list.selectCommand must be invoked in order to select the item",
            url: ""
        },
        {
            label: "autoScrollToSelection",
            value: "auto-scroll-to-selection",
            type: "bool",
            def: "true",
            description: "When item is selected by any other means except user interaction, list will be scrolled automatically to display selected item",
            url: ""
        },
        {
            label: "postData",
            value: "post-data",
            readonly: false,
            description: "Data that will be posted to postUrl while selection changes, if this is empty, selectedItem will be used as data",
            url: ""
        },
        {
            label: "postUrl",
            value: "post-url",
            readonly: false,
            description: "If set, whenever selection changes, postData will be posted to given url",
            url: ""
        },
        {
            label: "next",
            value: "next",
            readonly: false,
            description: "Next Invoker to be executed when selection changes",
            url: ""
        }
    ]
});

classInfo.load("atom-items-control");