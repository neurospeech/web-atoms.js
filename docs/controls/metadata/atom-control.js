/// <reference path="class-info.js" />


classInfo.setup({
    name: "AtomControl",
    value: "atom-control",
    properties: [
        {
            label: "data",
            value: "data",
            type: "object",
            readonly: false,
            description: "Returns data associated with the control. If data is undefined (not set), then data will be inherited from visual parent control",
            url:""
        },
        {
            label: "scope",
            value: "scope",
            type: "object",
            readonly: true,
            description: "Returns current scope of the control, scope is automatically managed by Web Atoms",
            url: ""
        },
        {
            label: "localScope",
            value: "local-scope",
            type: "object",
            readonly: true,
            description: "Returns current localScope if control exists in any localScope, this is useful to access localScope from child of Items control",
            url: ""
        },
        {
            label: "atomParent",
            value: "atom-parent",
            type: "object",
            readonly: true,
            description: "Returns parent atom control, this is different from the visual parent, since visual parent element may not have any control associated.",
            url: ""
        },
        {
            label: "templateParent",
            value: "template-parent",
            type: "object",
            readonly: true,
            description: "Owner of template, template from which this control was loaded.",
            url: ""
        },
        {
            label: "value",
            value: "value",
            type: "object",
            readonly: false,
            description: "Read/Write property to set value of this control, you can use this for binding purpose. This is not same as HTML value attribute of input controls.",
            url: ""
        },
        {
            label: "next",
            value: "next",
            readonly: false,
            type: "object",
            def: "null",
            description: "Stores next invoker, that will be invoked for some default operation, for example if the control is button, next will be invoked after user click operation",
            url: ""
        }

    ]   

});