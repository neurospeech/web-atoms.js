/// <reference path="../../Scripts/jquery-1.11.1.min.js" />
/// <reference path="../../atoms-debug.js" />


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
        "class": "atom-uploader-item"
    },
        ["td", { "atom-text": "{$scope.itemIndex + ') ' + $data.name }" }],
        ["td",
            { "class": "progress-host" },
            ["span", { "class": "progress", "style-width": "[$data.progress + 'px']" }],
            ["span", { "atom-text": "['(' + $data.progress + ' %)']" }]
        ],
        ["td", {
            "atom-class": "[$data.status]",
            "atom-text": "[$data.error || $data.status]"
        }]
    ]
];

window.__atom_flash_uploader_event = function (id, json) {
    json = unescape(json);
    window.WebAtoms.AtomUploader._instances[id].onFlashEvent(JSON.parse(json));
};


(function (window, baseType) {

    var requiresFlash = false;
    if (!AtomBrowser.isMobile) {
        requiresFlash = (
        (AtomBrowser.isIE && AtomBrowser.majorVersion < 10) ||
        (AtomBrowser.isSafari && AtomBrowser.majorVersion < 5)
        );

    }

    //requiresFlash = true;

    return classCreatorEx({
        name: "WebAtoms.AtomUploader",
        base: baseType,
        start: function (e) {
            this._presenters = ["itemsPresenter", "uploadButton"];
            this._items = [];
            $(e).addClass("atom-uploader");
            var us = window.uploadSettings;
            if (us) {
                this._uploadHost = us.uploadHost;
                if (requiresFlash) {
                    this._headers = { 'x-c800-auth': us.authorization };
                }
            }
        },
        properties: {
            items: null,
            fileTypes: undefined,
            accept: "*/*",
            capture: "",
            multiple: true,
            uploadHost: null,
            uploadUrl: null,
            postData: {},
            finished: false,
            maxFileSize: -1,
            maxFiles: -1,
            headers: null,
            urlPath: null,
            flashPath : "/scripts/atoms/plugins/upload/"
        },
        methods: {

            get_value: function () {
                var vp = this._valuePath;
                var values = [];
                var ae = new AtomEnumerator(this._items);
                while (ae.next()) {
                    var item = ae.current();
                    if (item.status !== 'done')
                        continue;
                    item = item.result;
                    if (!item) continue;
                    if (vp) item = item[vp];
                    values.push(item);
                }
                return values.join(this._valueSeparator || ',');
            },

            set_accept: function (v) {
                this._accept = v;
                if (this._fpID) {
                } else {
                    $(this._filePresenter).attr("accept", v);
                }
            },

            onFlashEvent: function (evt) {
                if (console) {
                    console.log(evt);
                }
                switch (evt.eventType) {
                    case "ready":
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
                            Atom.set(item, "progress", p);
                        }
                        break;
                    case "done":
                    case "complete":
                        Atom.set(item, "status", "done");
                        Atom.set(item, "result", JSON.parse(evt.result)[0]);
                        WebAtoms.dispatcher.callLater(function () {
                            _this.onUploadComplete();
                        });
                        break;
                    case "error":
                        Atom.set(item, "status", "error");
                        Atom.set(item, "error", evt);
                        WebAtoms.dispatcher.callLater(function () {
                            _this.onUploadComplete();
                        });
                        break;
                    default:
                        if (console) {
                            console.log(evt);
                        }
                        break;
                }
            },

            onUploadComplete: function () {
                var a = Atom.query(this._items).any({ 'status': 'uploading' });
                if (a || this._finished)
                    return;
                AtomBinder.setValue(this, "finished", true);
                atomApplication.setBusy(false, "Uploading...");
                Atom.refresh(this, "value");

                var testFlow = window.testFlow;
                if (testFlow && testFlow.state == 'recording') {

                    var up = this.get_urlPath();
                    if (!up)
                        throw new Error("url-path not specified for AtomUploader");

                    var step = {
                        path: testFlow.path(this._element),
                        action: "atom-upload",
                        files: this._items.map(function (item) { return { name: item.name, size: item.size, url: item.result[up] } })
                    };

                    testFlow.pushStep(step);
                }

                this.invokeAction(this.get_next());
                if (this._filePresenter) {
                    this.createFilePresenter();
                }
            },

            upload: function (index, url) {
                this._finished = false;
                // flash needs absolute url...
                if ((/^(http|https)\:\/\//i.test(url))) {
                    // do nothing..
                } else {
                    if (/^\//.test(url)) {
                        if (/^\/\//.test(url)) {
                            url = location.protocol + url;
                        } else {
                            url = location.protocol + '//' + (this._uploadHost || (location.hostname + (location.port ? (':' + location.port) : ''))) + url;
                        }
                    } 
                }

                var item = this._items[index];
                Atom.set(item, "status", "uploading");
                if (this._fpID) {
                    if (this._headers != null) {
                        url = Atom.url(url, this._headers);
                    }
                    this.get_player().upload(index, item.name, url, null);
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
                        if (evt.target.status != 200) {
                            _this.onItemEvent("error", index, evt.target.responseText);
                        } else {
                            _this.onItemEvent("done", index, { result: evt.target.responseText });
                        }
                    });

                    var fd = new FormData();
                    fd.append("fileToUpload", item.file);

                    if (this._uploadUrl) {
                        if (this._postData) {
                            fd.append("formModel", JSON.stringify(this._postData));
                        }
                    }

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
                        alert('File has to be less then ' + AtomFileSize.toFileSize(this._maxFileSize));
                        if (this._filePresenter) {
                            this.createFilePresenter();
                            return;
                        }
                    }
                }

                baseType.set_items.call(this, v);

                var _this = this;
                WebAtoms.dispatcher.callLater(function () {
                    _this.onUploadCommand();
                });


            },

            onUploadCommand: function () {

                if (!(this._items && this._items.length)) {
                    this.invokeAction(this._next);
                    return;
                }

                atomApplication.setBusy(true, "Uploading...");

                var _this = this;
                var ae = new AtomEnumerator(this._items);
                while (ae.next()) {
                    var item = ae.current();
                    var index = ae.currentIndex();

                    this.upload(index, this._uploadUrl);
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
                    this.unbindEvent(this._button);
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
                        files.push({ id: ae.currentIndex(), file: file, name: file.name, size: file.size, type: file.type, error: '', status:'' });
                    }
                    Atom.set(_this, "items", files);
                });

                this.bindEvent(this._button, "click", function () {
                    $(_this._filePresenter).trigger("click");
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

                $(button).addClass("test-flow-no-record-click");

                this._button = button;

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
                                this._flashPath + "atom-flash-uploader.swf?2014-17-09-04-09", divID,
                                "100%", "100%",
                                swfVersionStr, xiSwfUrlStr,
                                flashvars, params, attributes);

                    this._fpID = fpID;

                    /*this.bindEvent(button, "click", function () {
                        _this.get_player().triggerClick();
                    });*/

                } else {
                    this.createFilePresenter();
                }
            }
        }
    });
})(window, WebAtoms.AtomItemsControl.prototype);