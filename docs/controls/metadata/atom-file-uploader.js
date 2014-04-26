/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomFileUploader",
    value: "atom-file-uploader",
    properties: [
        {
            label: "fileTypes",
            value: "file-types",
            readonly: false,
            description: "Array of file types allowed to be selected in JSON format with description and extensions as properties",
            url: ""
        },
        {
            label: "accept",
            value: "accept",
            readonly: false,
            description: "HTML5 accept arguement for input element, ignored in Flash Mode ( Before IE 10)",
            url: ""
        },
        {
            label: "capture",
            value: "capture",
            readonly: false,
            description: "HTML5 capture arguement for input element, ignored in Flash Mode ( Before IE 10)",
            url: ""
        },
        {
            label: "lockProgress",
            value: "lock-progress",
            readonly: false,
            def: "true",
            description: "Locks UI by displaying busy dialog while uploading file to server",
            url: ""
        },
        {
            label: "onSelect",
            value: "on-select",
            readonly: false,
            description: "Next invoker that will be executed after user selects the file",
            url: ""
        },
        {
            label: "displayMode",
            value: "display-mode",
            readonly: false,
            description: "An integer used for view stack's selected index to change state of the control",
            url: ""
        },
        {
            label: "state",
            value: "state",
            readonly: false,
            description: "Current state of control (ready/uploading/uploaded/error)",
            url: ""
        },
        {
            label: "value",
            value: "value",
            readonly: true,
            description: "Returns name of selected file",
            url: ""
        },
        {
            label: "url",
            value: "url",
            readonly: false,
            description: "Destination url of file upload",
            url: ""
        }
    ]
});

classInfo.load("atom-control");