/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomWizard",
    value: "atom-wizard",
    properties: [
        {
            label: "currentStep",
            value: "current-step",
            readonly: false,
            description: "Current step of wizard",
            url: ""
        },
        {
            label: "nextLabel",
            value: "next-label",
            readonly: false,
            description: "Title of next button",
            url: ""
        },
        {
            label: "nextClass",
            value: "next-class",
            readonly: false,
            description: "Css Class of next button",
            url: ""
        },
        {
            label: "prevLabel",
            value: "prev-label",
            readonly: false,
            description: "Title of previous button",
            url: ""
        },
        {
            label: "finishLabel",
            value: "finish-label",
            readonly: false,
            description: "Title of finish button (next button on last step)",
            url: ""
        },
        {
            label: "canMoveBack",
            value: "can-move-back",
            readonly: false,
            description: "Must return true if wizard can move back, bind this value to enable/disable back button",
            url: ""
        },
        {
            label: "canMoveNext",
            value: "can-move-next",
            readonly: false,
            description: "Must return true if wizard can move forward, bind this value to enable/disable next button",
            url: ""
        },
        {
            label: "steps",
            value: "steps",
            readonly: false,
            description: "Total number of steps in wizard",
            url: ""
        }
    ]
});

classInfo.load("atom-dock-panel");