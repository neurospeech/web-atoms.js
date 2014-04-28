/// <reference path="../jquery-1.7.1.min.js" />
/// <reference path="../web-atoms.js" />

(function (window, baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomUploaderItem",
        base: baseType,
        start: function () {
        },
        properties: {
            timeout: 0
        },
        methods: {

            onUploadComplete: function () {
                this.dispose();
                $(this._element).remove();
            },

            get_timeout: function (n) {
                n = n || 5000;
                var _this = this;
                setTimeout(n, function () {
                    Atom.refresh(_this, "timeout");
                });
                return 1;
            }
        }
    });
})(window, WebAtoms.AtomControl.prototype);


Templates.jsonML["WebAtoms.AtomUploader.template"] = [
    ["table", { "class": "atom-uploader" },
        ["thead", {},
            ["tr", {},
                ["th", { "colspan": "5" },
                    ["button", { "atom-presenter": "uploadButton" }, "Upload"]
                ]
            ]
        ],
        ["tbody", { "atom-presenter": "itemsPresenter" }]
    ]
];

Templates.jsonML["WebAtoms.AtomUploader.itemTemplate"] = [
    ["tr", {
        "class": "atom-uploader-item",
        //        "atom-data": "{ AtomPromise.json( $owner.templateParent.postUrl ,{}, { type:'POST', data: Atom.merge( { FileName: $scope.name }, $owner.templateParent.postData ) }) }",
        //        "atom-upload-url": "[Atom.secureUrl($data[$owner.templateParent.uploadPath])]",
        "atom-next": "{$owner.templateParent.removeItemCommand}"
    },
        ["td", { "atom-text": "{$scope.itemIndex + ') ' + $scope.name }" }],
        ["td",
            { "class": "progress-host" },
            ["span", { "class": "progress", "style-width": "[$scope.progress + 'px']" }],
            ["span", { "atom-text": "['(' + $scope.progress + ' %)']" }]
        ],
        ["td", {
            "atom-class": "[$scope.status]",
            "atom-text": "[$scope.status]"
        }]
    ]
];

window.__atom_flash_uploader_event = function (id, json) {
    window.WebAtoms.AtomUploader._instances[id].onFlashEvent(JSON.parse(json));
};


(function (window, baseType) {

    var requiresFlash = (
        (AtomBrowser.isIE && AtomBrowser.majorVersion < 10) ||
        (AtomBrowser.isSafari && AtomBrowser.majorVersion < 5)
        );

    return classCreatorEx({
        name: "WebAtoms.AtomUploader",
        base: baseType,
        start: function (e) {
            this._presenters = ["itemsPresenter", "uploadButton"];
            $(e).addClass("atom-uploader");

            var _this = this;
            this.uploadCommand = function () {
                _this.onUploadCommand();
            };
        },
        properties: {
            items: null,
            fileTypes: undefined,
            accept: "*/*",
            capture: "",
            multiple: true,
            uploadOnSelect: true,
            uploadUrl: null,
            postUrl: "",
            postData: {},
            maxFileSize: -1,
            uploadPath: null
        },
        methods: {

            set_accept: function (v) {
                this._accept = v;
                if (this._fpID) {
                } else {
                    $(this._filePresenter).attr("accept", v);
                }
            },

            onFlashEvent: function (evt) {
                switch (evt.eventType) {
                    case "ready":
                        //var s = window.document.getElementById(this._fpID).style;
                        //s.top = "0px";
                        //s.left = "0px";
                        //s.zIndex = 20;
                        break;
                    case "click-error":
                        alert(JSON.stringify(evt.e));
                        break;
                    case "select":
                        Atom.set(this, "items", evt.files);
                        break;
                }
                if (evt.id !== undefined) {
                    this.onItemEvent(evt.eventType, evt.id, evt);
                }
            },

            onItemEvent: function (type, id, evt) {
                var item = this._items[id];
                var _this = this;
                switch (type) {
                    case "progress":
                        if (evt.lengthComputable) {
                            var p = Math.floor(evt.loaded * 100 / evt.total);
                            Atom.set(item, "scope.progress", p);
                        }
                        break;
                    case "done":
                    case "complete":
                        Atom.set(item, "scope.status", "done");
                        var so = Atom.get(item, "scope.itemControl");
                        WebAtoms.dispatcher.callLater(function () {
                            _this.onUploadComplete();
                            so.onUploadComplete();
                        });
                        break;
                    case "error":
                        Atom.set(item, "scope.status", "error");
                        WebAtoms.dispatcher.callLater(function () {
                            _this.onUploadComplete();
                        });
                        break;
                }
            },

            onUploadComplete: function () {
                var a = Atom.query(this._items).any({ 'scope.status': 'uploading' });
                if (a || this._finished)
                    return;
                this._finished = true;
                atomApplication.setBusy(false, "Uploading...");
                this.invokeAction(this.get_next());
                if (this._filePresenter) {
                    this.createFilePresenter();
                }
            },

            upload: function (index, url) {
                var item = this._items[index];
                if (this._fpID) {
                    this.get_player().upload(index, item.name, url);
                } else {

                    var _this = this;

                    xhr = new XMLHttpRequest();
                    var upload = xhr.upload;
                    try {
                        xhr.timeout = 3600000;
                    } catch (e) {
                        // IE 10 has some issue with this code..
                    }

                    $(upload).on("progress", function (evt) {
                        _this.onItemEvent("progress", index, evt.originalEvent);
                    });

                    $(upload).on("timeout error", function (evt) {
                        _this.onItemEvent("error", index, evt);
                    });
                    $(xhr).on("timeout error", function (evt) {
                        _this.onItemEvent("error", index, evt);
                    });
                    $(xhr).on("load", function (evt) {
                        _this.onItemEvent("done", index, evt);
                    });

                    var fd = new FormData();
                    fd.append("fileToUpload", item.file);

                    xhr.open("POST", url);
                    //xhr.setRequestHeader("Content-Type", "multipart/form-data");
                    xhr.send(fd);
                }
            },

            set_items: function (v) {
                if (!v)
                    return;

                if (this._maxFileSize != -1) {
                    var bigFiles = Atom.query(v).where({ 'size >': this._maxFileSize });
                    if (bigFiles.any()) {
                        alert('File has to be less then ' + this._maxFileSize);
                        if (this._filePresenter) {
                            this.createFilePresenter();
                            return;
                        }
                    }
                }

                this._finished = false;

                if (this._itemsPresenter) {
                    baseType.disposeChildren(this._itemsPresenter);
                }

                var et = this.getTemplate("itemTemplate");


                var ae = new AtomEnumerator(v);
                var parentScope = this.get_scope();


                WebAtoms.dispatcher.pause();

                while (ae.next()) {
                    var item = ae.current();
                    var scope = new WebAtoms.AtomScope(this, parentScope, parentScope.__application);
                    scope.itemIndex = ae.currentIndex();
                    scope.name = item.name;
                    scope.size = item.size;
                    scope.type = item.type;
                    // if it is html...
                    scope.file = item.file;
                    scope.status = "ready";
                    scope.progress = 0;
                    item.scope = scope;
                    var childElement = AtomUI.cloneNode(et);
                    childElement._templateParent = this;
                    this._itemsPresenter.appendChild(childElement);
                    var ac = AtomUI.createControl(childElement, WebAtoms.AtomUploaderItem, {}, scope);
                    scope.itemControl = ac;
                }

                this._items = v;

                WebAtoms.dispatcher.start();

                if (this._uploadOnSelect) {
                    var _this = this;
                    WebAtoms.dispatcher.callLater(function () {
                        _this.onUploadCommand();
                    });
                }


            },

            onUploadCommand: function () {
                atomApplication.setBusy(true, "Uploading...");

                var _this = this;
                var ae = new AtomEnumerator(this._items);
                while (ae.next()) {
                    var item = ae.current();
                    var index = ae.currentIndex();
                    var p = AtomPromise.json(this._postUrl, {}, { type: 'POST', data: Atom.merge({ FileName: item.name }, this._postData) });
                    p.then(function (ap) {
                        var v = ap.value()[_this._uploadPath];
                        Atom.set(item.scope, "data", v);
                        _this.upload(index, v);
                    });
                    p.invoke();
                }
            },

            get_player: function () {
                var appName = this._fpID;
                if (navigator.appName.indexOf("Microsoft") != -1) {
                    return window[appName];
                } else {
                    return document[appName];
                }
            },

            createFilePresenter: function () {
                var fp = this._filePresenter;
                if (fp) {
                    this.unbindEvent(fp);
                    $(fp).remove();
                }
                fp = document.createElement("input");
                $(fp).attr("type", "file");
                $(fp).css("left", "-500px");
                $(fp).css("position", "absolute");
                $(fp).css("top", "-0px");

                if (this._multiple) {
                    $(fp).attr("multiple", "multiple");
                }

                document.body.appendChild(fp);
                this._filePresenter = fp;

                var _this = this;

                this.bindEvent(this._filePresenter, "change", function () {
                    var files = [];
                    var ae = new AtomEnumerator(_this._filePresenter.files);
                    while (ae.next()) {
                        var file = ae.current();
                        files.push({ id: ae.currentIndex(), file: file, name: file.name, size: file.size, type: file.type });
                    }
                    Atom.set(_this, "items", files);
                });

                if (this._accept) {
                    this.set_accept(this._accept);
                }

            },

            createChildren: function () {
                baseType.createChildren.apply(this, arguments);

                var _this = this;

                var controlID = AtomUI.assignID(this._element);

                var button = this._uploadButton;

                $(button).parent().addClass("uploader-button-host");

                $(button).addClass("upload-button");


                if (requiresFlash) {

                    var th = $(button).parent().get()[0];



                    var fc = document.createElement("DIV");
                    $(fc).addClass("button-container");
                    th.appendChild(fc);

                    $(button).remove();
                    fc.appendChild(button);

                    fc = document.createElement("DIV");
                    $(fc).addClass("flash-container");
                    th.appendChild(fc);
                    th = fc;

                    var divID = controlID + "_div";
                    var div = document.createElement("DIV");
                    div.id = divID;
                    th.appendChild(div);
                    var fpID = controlID + "_fp";

                    WebAtoms.AtomUploader._instances = WebAtoms.AtomUploader._instances || {};
                    WebAtoms.AtomUploader._instances[fpID] = this;

                    var swfVersionStr = "10.2.0";
                    var xiSwfUrlStr = "/Content/flash/playerProductInstall.swf";
                    var flashvars = {};
                    flashvars.controlID = controlID;
                    flashvars.autoPlay = true;
                    var params = {};
                    params.quality = "high";
                    params.bgcolor = "#ffffff";
                    params.allowscriptaccess = "always";
                    params.wmode = "transparent";
                    //params.allowfullscreen = "true";
                    var attributes = {};
                    attributes.id = fpID;
                    attributes.name = fpID;
                    attributes.align = "middle";
                    swfobject.embedSWF(
                                "/scripts/uploader/atomflashuploader.swf?4", divID,
                                "100%", "100%",
                                swfVersionStr, xiSwfUrlStr,
                                flashvars, params, attributes);

                    this._fpID = fpID;

                    /*this.bindEvent(button, "click", function () {
                        _this.get_player().triggerClick();
                    });*/

                } else {


                    this.createFilePresenter();


                    this.bindEvent(button, "click", function () {
                        $(_this._filePresenter).trigger("click");
                    });

                }
            }
        }
    });
})(window, WebAtoms.AtomControl.prototype);