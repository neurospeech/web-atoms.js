
classInfo.setup({
    name: "AtomAutoCompleteBox",
    value: "atom-auto-complete-box",
    properties: [
        {
            label: "placeholder",
            value: "placeholder",
            readonly: false,
            description: "HTML5 placeholder property for input box",
            url: ""
        },
        {
            label: "keyPressed",
            value: "key-pressed",
            readonly: true,
            description: "This is useful property that returns true while key was pressed, this is important to bind search query when user is actually typing something",
            url: ""
        },
        {
            label: "label",
            value: "label",
            readonly: true,
            description: "The display label of selected item",
            url: ""
        },
        {
            label: "offsetLeft",
            value: "offset-left",
            readonly: true,
            description: "Used for binding, returns offsetLeft property of the control element",
            url: ""
        },
        {
            label: "offsetTop",
            value: "offset-Top",
            readonly: true,
            description: "Used for binding, returns offsetTop property of the control element",
            url: ""
        },
        {
            label: "isPopupOpen",
            value: "is-popup-open",
            readonly: false,
            description: "Property which Opens/Closes the Popup",
            url: ""
        }
    ]
});

classInfo.load("atom-list-box");