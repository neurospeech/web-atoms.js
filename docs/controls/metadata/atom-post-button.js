/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomPostButton",
    value: "atom-post-button",
    properties: [
        {
            label: "postData",
            value: "post-data",
            readonly: false,
            description: "If set, this will be posted to post url, otherwise data associated with this control will be posted",
            url: ""
        },
        {
            label: "postUrl",
            value: "post-url",
            readonly: false,
            description: "Url to which postData will be posted, if url is empty, next will be invoked directly",
            url: ""
        },
        {
            label: "confirm",
            value: "confirm",
            readonly: false,
            description: "If set to true, confirm dialog box will be displayed prior to executing any further operation, used mostly for warning and delete operations",
            url: ""
        },
        {
            label: "confirmMessage",
            value: "confirm-message",
            readonly: false,
            description: "If confirm is true, message set to this property will be displayed in confirm dialog box",
            url: ""
        },
        {
            label: "mergeData",
            value: "merge-data",
            readonly: false,
            description: "If set, this data (object properties), will be merged with postData prior to posting",
            url: ""
        }
    ]
});

classInfo.load("atom-button");