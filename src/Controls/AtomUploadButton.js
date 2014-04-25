/// <reference path="AtomPostButton.js" />

(function (baseType) {
    return classCreatorEx({
        name: "WebAtoms.AtomUploadButton",
        base: baseType,
        start: function (e) {
            if (/input/gi.test(e.nodeName) && /file/gi.test($(e).attr("type"))) {
                this._filePresenter = e;
                return;
            }

            this._filePresenter = document.createElement("input");
            $(this._filePresenter).attr("type", "file");
            $(this._filePresenter).css("left", "-500px");
            $(this._filePresenter).css("position", "absolute");
            $(this._filePresenter).css("top", "-0px");
            document.body.appendChild(this._filePresenter);
        },
        properties: {
            fileTypes: undefined,
            accept: "*/*",
            capture: "",
            progress: 0
        },
        methods: {
            set_accept: function (v) {
                this._accept = v;
                if (v) {
                    if (this._filePresenter) {
                        $(this._filePresenter).attr("accept", v);
                    }
                }
            },

            set_capture: function (v) {
                this._capture = v;
                if (v) {
                    if (this._filePresenter) {
                        $(this._filePresenter).attr("capture", v);
                    }
                }
            },
            onClickHandler: function (e) {

                if (this._confirm) {
                    if (!confirm(this._confirmMessage))
                        return;
                }

                if (!this._postUrl) {
                    //WebAtoms.AtomUploadButton.callBaseMethod(this, "onClickHandler", [e]);
                    return;
                }

                if (this._filePresenter == this._element) {
                    return;
                }

                $(this._filePresenter).trigger("click");
                AtomUI.cancelEvent(e);
            },

            onFileSelected: function () {
                var data = this.get_postData();

                if (data === null || data === undefined)
                    return;

                var m = this._mergeData;
                if (m) {
                    for (var i in m) {
                        data[i] = m[i];
                    }
                }
                var xhr = this._xhr;
                if (!xhr) {
                    xhr = new XMLHttpRequest();
                    var upload = xhr.upload;
                    try {
                        xhr.timeout = 3600000;
                    } catch (e) {
                        // IE 10 has some issue with this code..
                    }

                    this.bindEvent(upload, "progress", "onProgress");
                    this.bindEvent(upload, "timeout", "onError");
                    this.bindEvent(upload, "error", "onError");
                    this.bindEvent(xhr, "load", "onComplete");
                    this.bindEvent(xhr, "error", "onError");
                    this.bindEvent(xhr, "timeout", "onError");
                    this._xhr = xhr;
                }

                var fd = new FormData();

                var ae = new AtomEnumerator(this._filePresenter.files);
                while (ae.next()) {
                    fd.append("file" + ae.currentIndex(), ae.current());
                }

                fd.append("formModel", JSON.stringify(AtomBinder.getClone(data)));

                xhr.open("POST", this._postUrl);
                xhr.send(fd);

                atomApplication.setBusy(true, "Uploading...");
            },

            set_progress: function (v) {
                this._progress = v;
                if (v) {
                    AtomBinder.setValue(atomApplication, "progress", v);
                }
            },

            onError: function (evt) {
                atomApplication.setBusy(false, "Uploading...");
                this.unbindEvent(this._xhr);
                this._xhr = null;
                this._lastError = evt;
                Atom.alert('Upload failed');
            },
            onProgress: function (evt) {
                //evt = evt.originalEvent;
                if (evt.lengthComputable) {
                    var percentComplete = Math.round(evt.loaded * 100 / evt.total);
                    AtomBinder.setValue(this, "progress", percentComplete);
                }
            },
            onComplete: function (evt) {
                atomApplication.setBusy(false, "Uploading...");
                var result = null;
                if (evt.target) {
                    if (evt.target.status == 200) {
                        this._value = evt.target.responseText;
                    } else {
                        Atom.alert(evt.target.statusText);
                        return;
                    }
                } else {
                    this._value = evt.result;
                }

                this.unbindEvent(this._xhr);
                this._xhr = null;

                AtomBinder.refreshValue(this, "value");

                this.invokeAction(this._next, evt);
            },

            initialize: function () {
                baseType.initialize.call(this);

                var f = this._filePresenter;

                this.bindEvent(f, "change", "onFileSelected");

            }
        }
    });
})(WebAtoms.AtomPostButton.prototype);
