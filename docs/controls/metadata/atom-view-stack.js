/// <reference path="class-info.js" />


classInfo.setup({
    name: "AtomViewStack",
    value: "atom-view-stack",
    properties: [
        {
            label: "swipeDirection",
            value: "swipe-direction",
            readonly: false,
            def: "left-right",
            description: "If set, change of view will be animated, only acceptable values are 'none', 'left-right' and 'up-down'",
            url: ""
        }
    ]
});

classInfo.load("atom-items-control");