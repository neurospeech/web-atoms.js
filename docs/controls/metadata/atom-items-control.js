/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomItemsControl",
    value: "atom-items-control",
    properties: [
        {
            label: "autoScrollToSelection",
            value: "auto-scroll-to-selection",
            type: "bool",
            def: "false",
            description: "Automatically scrolls Scrollabel Parent HTML Element to bring selected item into the view.",
            url: ""
        },
        {
            label: "allowMultipleSelection",
            value: "allow-multiple-selection",
            type: "bool",
            def: "false",
            description: "Sets multiple selection for the list.",
            url: ""
        },
        {
            label: "allowSelectFirst",
            value: "allow-select-first",
            type: "bool",
            def: "false",
            description: "If set to true, first item will be selected automatically after the items are loaded in the list",
            url: ""
        },
        {
            label: "filter",
            value: "filter",
            type: "function",
            def: "null",
            description: "",
            url: "Function to filter displayed items, this is bindable, and will refresh items automatically if filter changes."
        },
            {
                label:"items",
                value:"items",
                readonly:false,
                type:"Array",
                description:"An array, from which all items will be created, when this property is set, children will be created for corresponding items in this array",
                url:""
            },
            {
                label:"labelPath",
                value:"label-path",
                readonly:false,
                type:"String",
                description:"Used as property path indicator to display items",
                url:""
            },
            {
                label:"valuePath",
                value:"value-path",
                readonly:false,
                type:"String",
                description:"Used as property path indicator for selecting value property",
                url:""
            },
            {
                label: "sortPath",
                value: "sort-path",
                readonly: false,
                type: "String or Function",
                description: "If set, items will be sorted by given path, sort-path can be string path or function that can be given as an input to Array.sort method",
                url: ""
            },
            {
                label: "selectAll",
                value: "select-all",
                readonly: false,
                type: "bool",
                def: "false",
                description: "",
                url: "This property selects/deselects all items when set. This can be bound to checkbox's is-checked value to automatically select all items"
            },
            {
                label:"selectedIndex",
                value:"selected-index",
                readonly:false,
                type:"Integer",
                description:"Index of current selected item in items array, changing this will change all related properties such as selectedItem, value etc.",
                url:""
            },
            {
                label:"selectedItem",
                value:"selected-item",
                readonly:false,
                type:"Object",
                description:"Current selected item in the list of items",
                url:""
            },
            {
                label:"selectedItems",
                value:"selected-items",
                readonly:true,
                type:"Array",
                description:"An array of selected items in case of multiple selection is allowed",
                url:""
            },
            {
                label: "valueSeparator",
                value: "value-separator",
                readonly: false,
                type: "String",
                description: "This is used to separate multiple selected item values for value property.",
                url: ""
            },
            {
                label: "value",
                value: "value",
                readonly: false,
                type: "Object",
                description: "Value of selected Item's valuePath, if multiple items are selected, every value is concateneted as comma separated value",
                url: ""
            }

    ],


    events: [
        {
            label: "selectionChanged",
            value: "selection-changed",
            description: "Fired when selected items changes"
        }
    ],



    templates: [
        {
            label: "itemTemplate",
            value: "item-template",
            description: "Template for every item, you can customize how individual item will be displayed in the list."
        },
        {
            label: "template",
            value: "template",
            description: "You can customize layout of items by changing template, in this template your item-template should appear inside itemsPresenter for template, immediate child is automatically considered as template in case of Items Control."
        }
    ]
});


classInfo.load("atom-control");