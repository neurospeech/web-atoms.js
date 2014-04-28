/// <reference path="../jquery-1.7.1.min.js" />
/// <reference path="../web-atoms.js" />
/// <reference path="video.js" />

(function (window, baseType) {

    //var requiresFlash = AtomBrowser.isFF && !AtomBrowser.isMobile;

    //window.videojs.options['flash']['swf'] = '/scripts/videojs/video-js.swf?3';

    //if (requiresFlash) {
    //    window.vjs.options.techOrder = ['flash', 'html5'];
    //}

    return classCreatorEx({
        name: "WebAtoms.AtomVideo",
        base: baseType,
        properties:{
            url: null,
            poster: null
        },
        methods: {
            isHidden: function () {
                return $(this._element).css("visibility") != "visible";
            },
            set_url: function(v){
                if (!this.player || this.isHidden()) {
                    var _this = this;
                    setTimeout(function () { _this.set_url(v); }, 1000);
                    return;
                }
                this._url = v;
                this.player.src([ { type: 'video/mp4', src:v } ]);
                this.play();
            },
            play: function () {
                var _this = this;
                if (this.isHidden()) {
                    setTimeout(function () {
                        _this.play();
                    }, 1000);
                    return;
                }
                this.player.play();
            },
            startTimer: function () {
                var _this = this;
                if (!this.timer) {
                    this.timer = setInterval(function () {
                        if (_this.isHidden()) {
                            _this.stop();
                        }
                    }, 1000);
                }
            },
            stop: function () {
                this.onEnded();
                this.player.pause();
            },
            onEnded: function () {
                if (this.timer) {
                    clearInterval(this.timer);
                    this.timer = 0;
                }
            },
            set_poster: function (v) {
                if (!this.player) {
                    var _this = this;
                    setTimeout(function () { _this.set_poster(v); }, 1000);
                    return;
                }
                this._poster = v;
                this.player.poster(v);
            },
            onUpdateUI: function () {
                baseType.onUpdateUI.call(this);

                if (!this.player)
                    return;
                var e = this._element;
                var width = $(e).innerWidth();
                var height = $(e).innerHeight();
                this.player.width(width + "px");
                this.player.height(height + "px");

                //if (this.isHidden()) {
                //    this.player.hide();
                //} else {
                //    this.player.show();
                //}
            },
            initialize: function () {
                baseType.initialize.call(this);
                var _this = this;
                var v = document.createElement("VIDEO");
                AtomUI.assignID(v);
                $(v).addClass("video-js vjs-default-skin");
                this._element.appendChild(v);
                videojs(v.id, { controls: true, autoplay: true, preload: "auto", width: 0, height: 0 }).ready(function () {
                    _this.player = this;
                    this.on("play", function () {
                        _this.startTimer();
                    });
                }).ended(function () {
                    _this.onEnded();
                });
            }
        }
    });
})(window, WebAtoms.AtomControl.prototype);
