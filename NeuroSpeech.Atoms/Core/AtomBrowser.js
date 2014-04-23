var AtomConfig = {
    debug: false,
    baseUrl: "",
    log: "",
    ajax: {
        versionUrl: true,
        versionKey: "__wav",
        version: ((new Date()).toDateString()),
        headers: {
        }
    }
};

window.AtomConfig = AtomConfig;


var log = function log(s) {

    if (window.console) {
        console.log(s);
    }

    AtomConfig.log += s + "\r\n";

}

window.log = log;

var AtomBrowser = {
    browserName: "",
    version: "1.0",
    majorVersion: 1,
    isMobile: false,
    userAgent:'',
    detect: function () {
        var nVer = navigator.appVersion;
        var nAgt = navigator.userAgent;
        this.userAgent = nAgt;
        var browserName = navigator.appName;
        var fullVersion = "" + parseFloat(navigator.appVersion);
        var majorVersion = parseInt(navigator.appVersion, 10);
        var nameOffset, verOffset, ix;

        // In Opera, the true version is after "Opera" or after "Version"
        if ((verOffset = nAgt.indexOf("Opera")) != -1) {
            browserName = "Opera";
            fullVersion = nAgt.substring(verOffset + 6);
            if ((verOffset = nAgt.indexOf("Version")) != -1) {
                fullVersion = nAgt.substring(verOffset + 8);
            }
        }
            // In MSIE, the true version is after "MSIE" in userAgent
        else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
            browserName = "Microsoft Internet Explorer";
            fullVersion = nAgt.substring(verOffset + 5);
        }
                // In Chrome, the true version is after "Chrome"
        else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
            browserName = "Chrome";
            fullVersion = nAgt.substring(verOffset + 7);
        }
                // In Safari, the true version is after "Safari" or after "Version"
        else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
            browserName = "Safari";
            this.isMobile = nAgt.indexOf("iPhone") != -1;
            fullVersion = nAgt.substring(verOffset + 7);
            if ((verOffset = nAgt.indexOf("Version")) != -1) {
                fullVersion = nAgt.substring(verOffset + 8);
            }
        }
                // In Firefox, the true version is after "Firefox"
        else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
            browserName = "Firefox";
            fullVersion = nAgt.substring(verOffset + 8);
        }
                // In most other browsers, "name/version" is at the end of userAgent
        else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) <
              (verOffset = nAgt.lastIndexOf('/'))) {
                  browserName = nAgt.substring(nameOffset, verOffset);
                  fullVersion = nAgt.substring(verOffset + 1);
                  if (browserName.toLowerCase() == browserName.toUpperCase()) {
                      browserName = navigator.appName;
                  }
              }
        // trim the fullVersion string at semicolon/space if present
        if ((ix = fullVersion.indexOf(";")) != -1) {
            fullVersion = fullVersion.substring(0, ix);
        }
        if ((ix = fullVersion.indexOf(" ")) != -1) {
            fullVersion = fullVersion.substring(0, ix);
        }

        majorVersion = parseInt('' + fullVersion, 10);
        if (isNaN(majorVersion)) {
            fullVersion = '' + parseFloat(navigator.appVersion);
            majorVersion = parseInt(navigator.appVersion, 10);
        }

        this.browserName = browserName;
        this.majorVersion = majorVersion;
        this.isMobile = /android|mobile|ios|iphone/gi.test(nAgt);
    },

    isFF: false,
    isChrome: false,
    isIE: false,
    isSafari: false,
    isMac : false,

    initialize: function () {

        this.isMac = /mac os x/gi.test(this.userAgent) && !(/iphone|ipad/gi.test(this.userAgent));

        switch (this.browserName) {
            case "Firefox":
                this.supportsUpload = this.majorVersion >= 4;
                this.isFF = true;
                break;
            case "Chrome":
                this.supportsUpload = this.majorVersion >= 6;
                this.isChrome = true;
                break;
            case "Microsoft Internet Explorer":
                this.supportsUpload = this.majorVersion >= 10;
                this.isIE = true;
                break;
            case "Safari":
                this.isSafari = true;
                if (!this.isMobile) {
                    this.supportsUpload = this.majorVersion >= 5;
                }
                break;
        }

        // is it ios??
        this.supportsFlash = !this.isMobile;
    }

};

window.AtomBrowser = AtomBrowser;

AtomBrowser.detect();
AtomBrowser.initialize();
