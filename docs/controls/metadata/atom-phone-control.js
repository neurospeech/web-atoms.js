/// <reference path="class-info.js" />

classInfo.setup({
    name: "AtomPhoneControl",
    value: "atom-phone-control",
    properties: [
        {
            label: "value",
            value: "value",
            readonly: false,
            description: "Phone number formated in format V2:CountryCode:ISDCode:Number.Number.Number:Ext:Msg",
            url: ""
        }
    ]
});

classInfo.load("atom-control");