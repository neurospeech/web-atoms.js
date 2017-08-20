///<reference path="AtomComponent.js"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
if (!window["Promise"]) {
    var Promise;
}
var AtomHandler = (function () {
    function AtomHandler(message) {
        this.message = message;
        this.list = new Array();
    }
    return AtomHandler;
}());
var AtomMessageAction = (function () {
    function AtomMessageAction(msg, a) {
        this.message = msg;
        this.action = a;
    }
    return AtomMessageAction;
}());
var AtomDevice = (function () {
    function AtomDevice() {
    }
    AtomDevice.prototype.runAsync = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, task];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error(error_1);
                        Atom.showError(error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AtomDevice.prototype.broadcast = function (msg, data) {
        var ary = this.bag[msg];
        if (!ary)
            return;
        for (var _i = 0, _a = ary.list; _i < _a.length; _i++) {
            var entry = _a[_i];
            entry.call(this, [msg, data]);
        }
    };
    AtomDevice.prototype.subscribe = function (msg, action) {
        var ary = this.bag[msg];
        if (!ary) {
            ary = new AtomHandler(msg);
            this.bag[msg] = ary;
        }
        ary.list.push(action);
        return action;
    };
    AtomDevice.prototype.unsubscribe = function (msg, action) {
        var ary = this.bag[msg];
        if (!ary) {
            return;
        }
        ary.list = ary.list.filter(function (a) { return a !== action; });
    };
    return AtomDevice;
}());
AtomDevice.instance = new AtomDevice();
var AtomModel = (function () {
    function AtomModel() {
    }
    AtomModel.prototype.refresh = function (name) {
        Atom.refresh(this, name);
    };
    return AtomModel;
}());
var AtomCommand = (function (_super) {
    __extends(AtomCommand, _super);
    function AtomCommand(action, onParameterSet) {
        if (onParameterSet === void 0) { onParameterSet = null; }
        var _this = _super.call(this) || this;
        _this.isMVVMAtomCommand = true;
        _this._enabled = true;
        _this._parameter = null;
        _this.action = action;
        var self = _this;
        _this.parameterChanged = onParameterSet;
        _this.execute = function () {
            if (self.enabled) {
                this.invokeAction(self.invokeAction());
            }
        };
        return _this;
    }
    Object.defineProperty(AtomCommand.prototype, "enabled", {
        get: function () {
            return this._enabled;
        },
        set: function (v) {
            this._enabled = v;
            this.refresh("enabled");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AtomCommand.prototype, "parameter", {
        get: function () {
            return this._parameter;
        },
        set: function (v) {
            this._parameter = v;
            if (this.parameterChanged) {
                this.enabled = this.parameterChanged(v);
            }
            this.refresh("parameter");
        },
        enumerable: true,
        configurable: true
    });
    AtomCommand.prototype.invokeAction = function () {
        var result = this.action(this.parameter);
        if (result && result.catch) {
            result.catch(function (error) {
                console.error(error);
                Atom.showError(error);
            });
        }
    };
    return AtomCommand;
}(AtomModel));
var AtomJsonService = (function () {
    function AtomJsonService() {
    }
    AtomJsonService.prototype.json = function (method, uri, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, window["WebAtoms"].AtomPromise.json(uri, {
                        type: method,
                        data: data
                    }).toNativePromise()];
            });
        });
    };
    AtomJsonService.prototype.jsonPost = function (uri, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.json("POST", uri, data)];
            });
        });
    };
    AtomJsonService.prototype.jsonGet = function (uri, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.json("GET", uri, data)];
            });
        });
    };
    AtomJsonService.prototype.jsonPut = function (uri, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.json("PUT", uri, data)];
            });
        });
    };
    AtomJsonService.prototype.jsonDelete = function (uri, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.json("DELETE", uri, data)];
            });
        });
    };
    return AtomJsonService;
}());
var AtomViewModel = (function (_super) {
    __extends(AtomViewModel, _super);
    function AtomViewModel() {
        var _this = _super.call(this) || this;
        AtomDevice.instance.runAsync(_this.initAsync());
        return _this;
    }
    AtomViewModel.prototype.onMessage = function (msg, a) {
        var action = function (m, d) {
            a(d);
        };
        AtomDevice.instance.subscribe(msg, action);
        this.subscriptions = this.subscriptions || new Array();
        this.subscriptions.push(new AtomMessageAction(msg, action));
    };
    AtomViewModel.prototype.broadcast = function (msg, data) {
        AtomDevice.instance.broadcast(msg, data);
    };
    AtomViewModel.prototype.initAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    AtomViewModel.prototype.dispose = function () {
        if (this.subscriptions) {
            for (var _i = 0, _a = this.subscriptions; _i < _a.length; _i++) {
                var entry = _a[_i];
                AtomDevice.instance.unsubscribe(entry.message, entry.action);
            }
        }
    };
    return AtomViewModel;
}(AtomModel));
var WebAtoms = window["WebAtoms"];
WebAtoms["AtomCommand"] = AtomCommand;
WebAtoms["AtomModel"] = AtomModel;
WebAtoms["AtomViewModel"] = AtomViewModel;
WebAtoms["AtomDevice"] = AtomDevice;
//# sourceMappingURL=AtomViewModel.js.map