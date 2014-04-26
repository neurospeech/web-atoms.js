/// <reference path="class-info.js" />


classInfo.setup({
    name: "AtomSortableColumn",
    value: "atom-sortable-column",
    properties: [
        {
            label: "defaultDirection",
            value: "default-direction",
            def: "asc",
            readonly: false,
            description: "Default direction of sort while sorting first time or changing from different column to this column",
            url: ""
        },
        {
            label: "direction",
            value: "direction",
            readonly: true,
            description: "Sort direction (asc or desc), this must not be set by javascript, it should only be used for data binding",
            url: ""
        },
        {
            label: "label",
            value: "label",
            readonly: false,
            description: "Label of the column",
            url: ""
        },
        {
            label: "downImage",
            value: "down-image",
            readonly: false,
            def: "/resources/NeuroSpeech.WebAtoms/Content.Buttons.Down.png",
            description: "Icon that will be displayed in descending sort order",
            url: ""
        },
        {
            label: "upImage",
            value: "up-image",
            readonly: false,
            def: "/resources/NeuroSpeech.WebAtoms/Content.Buttons.Up.png",
            description: "Icon that will be displayed in acending sort order",
            url: ""
        },
        {
            label: "sortField",
            value: "sort-field",
            readonly: false,
            description: "Field placeholder to set in value if selected, for example sort-field is value, 'value asc' will be set in this control's value property",
            url: ""
        }
    ]
});