/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomDataPager",
    value: "atom-data-pager",
    properties: [
        {
            label: "items",
            value: "items",
            readonly: false,
            description: "List of items, which contains actual count and total of paged list",
            url: ""
        },
        {
            label: "currentPage",
            value: "current-page",
            readonly: false,
            description: "Current selected page, defaulted to first page",
            url: ""
        },
        {
            label: "pageStart",
            value: "page-start",
            readonly: true,
            description: "Current Page multiplied by Page Size",
            url: ""
        },
        {
            label: "pages",
            value: "pages",
            readonly: true,
            description: "List of pages that exists in current paging set, this is used for binding the Pager elements",
            url: ""
        },
        {
            label: "itemsPath",
            value: "items-path",
            readonly: false,
            description: "To enable paging, data received in json format, will have paging information and actual array of items, this itemsPath represents path of an array in the items",
            url: ""
        },
        {
            label: "total",
            value: "total",
            readonly: false,
            description: "Total number of items in the paging set (this is not total number of pages)",
            url:""
        },
        {
            label: "totalPath",
            value: "total-path",
            readonly: false,
            description: "Path of total field in items object",
            url: ""
        }
    ]
});

classInfo.load("atom-dock-panel");