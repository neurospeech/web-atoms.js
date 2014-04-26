/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomNavigatorList",
    value: "atom-navigator-list",
    properties: [
        {
            label: "currentPage",
            value: "current-page",
            readonly: false,
            description: "Current page of internal Data Pager Control",
            url: ""
        },
        {
            label: "pageSize",
            value: "page-size",
            readonly: false,
            description: "Page size of internal Data Pager Control",
            url: ""
        },
        {
            label: "newItem",
            value: "new-item",
            readonly: false,
            description: "An object template in JSON format, that will be used as New Item while Adding New Item in the list",
            url: ""
        },
        {
            label: "newUrl",
            value: "new-url",
            readonly: false,
            description: "Url that will be set to Detail IFrame Element while adding new item",
            url: ""
        },
        {
            label: "detailUrl",
            value: "detail-url",
            readonly: false,
            description: "Url that will be set to Detail IFrame while selecting an item",
            url: ""
        },
        {
            label: "showAdd",
            value: "show-add",
            readonly: false,
            description: "Indicates whether to display Add Button or not",
            url: ""
        },
        {
            label: "displayMode",
            value: "display-mode",
            readonly : false,
            description: "Integer indicating List(0) , Detail (1) or Add New (2) mode",
            url: ""
        }
    ],

    commands: [
        {
            label: "goBack",
            value: "go-back",
            description: "Command that will set the display Mode to list mode"
        },
        {
            label: "addCompleteCommand",
            value: "add-complete-command",
            description: "Command that should be executed after the add operation was successful, this is same as go-back but it will refresh the list as well"
        }
    ]
});

classInfo.load("atom-list-box");