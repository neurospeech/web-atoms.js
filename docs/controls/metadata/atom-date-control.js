/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomDateControl",
    value: "atom-date-control",
    properties: [
        {
            label: "startYear",
            value: "start-year",
            readonly: false,
            description: "While displaying number of years, startYear is added to current date's year, so you can set this to negative value to display previous years",
            url: ""
        },
        {
            label: "endYear",
            value: "end-year",
            readonly: false,
            description: "While displaying number of years, endYear is added to current date's year it is used as last year",
            url: ""
        },
        {
            label: "value",
            value: "value",
            readonly: false,
            description: "This is selected Date, it also accepts Microsoft's JSON Date Format",
            url: ""
        }
    ]
});

classInfo.load("atom-control");