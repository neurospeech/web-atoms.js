/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomForm",
    value: "atom-form",
    properties: [
        {
            label: "result",
            value: "result",
            readonly: true,
            description: "Result of Post operation",
            url: ""
        },
        {
            label: "mergeResult",
            value: "merge-result",
            readonly: false,
            def: "true",
            description: "If set to true, result of post operation will be merged to exiting data, by default it is true.",
            url: ""
        },
        {
            label: "postUrl",
            value: "post-url",
            readonly: false,
            description: "Url to which postData or data associated with this form, will be posted",
            url: ""
        },
        {
            label: "successMessage",
            value: "success-message",
            readonly: false,
            description: "Message that will be displayed after the post was successful",
            url: ""
        },
        {
            label: "mergeData",
            value: "merge-data",
            readonly: false,
            description: "An object, whose properties will be merged to data before posting, this is helpful in merging values from different sources",
            url: ""
        }
    ],

    commands: [
        {
            label: "submitCommand",
            value: "submit-command",
            description: "Command that will submit this form to postUrl"
        }
    ]
});

classInfo.load("atom-control");