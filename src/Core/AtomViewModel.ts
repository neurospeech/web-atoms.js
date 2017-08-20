///<reference path="AtomComponent.js"/>

if (!window["Promise"]) {
    var Promise;
}

type AtomAction = (msg:string,data:any) => void;

class AtomHandler {

    constructor(message: string) {
        this.message = message;
        this.list = new Array<AtomAction>();
    }

    public message: string;
    public list: Array<AtomAction>;
}

class AtomMessageAction {
    public message: string;
    public action: AtomAction;

    constructor(msg: string, a: AtomAction) {
        this.message = msg;
        this.action = a;
    }
}

class AtomDevice {

    static instance: AtomDevice = new AtomDevice();

    public async runAsync<T>(task: Promise<T>):Promise<any> {
        try {
            await task;
        } catch (error) {
            console.error(error);
            Atom.showError(error);
        }
    }

    private bag: any;

    public broadcast(msg: string, data: any) {
        var ary = this.bag[msg] as AtomHandler;
        if (!ary)
            return;
        for (let entry of ary.list) {
            entry.call(this, [ msg, data ]);
        }
    }

    public subscribe(msg: string, action: AtomAction): AtomAction {
        var ary = this.bag[msg] as AtomHandler;
        if (!ary) {
            ary = new AtomHandler(msg);
            this.bag[msg] = ary;
        }
        ary.list.push(action);
        return action;
    }

    public unsubscribe(msg: string, action: AtomAction) {
        var ary = this.bag[msg] as AtomHandler;
        if (!ary) {
            return;
        }

        ary.list = ary.list.filter((a) => a !== action);
    }
}


class AtomModel {
    public refresh(name: String): void {
        Atom.refresh(this, name);
    }
}



class AtomCommand<T> extends AtomModel {

    public readonly isMVVMAtomCommand: boolean = true;


    private _enabled:boolean = true;
    get enabled():boolean{
        return this._enabled;
    }
    set enabled(v:boolean){
        this._enabled = v;
        this.refresh("enabled");
    }

    private _parameter:T = null;
    get parameter():T{
        return this._parameter;
    }
    set parameter(v:T){
        this._parameter = v;
        if (this.parameterChanged) {
            this.enabled = this.parameterChanged(v);
        }
        this.refresh("parameter");
    }

    private action: (p: T) => any;
    private parameterChanged: (p: T) => boolean;

    public execute: Function;

    private invokeAction(): any {

        var result = this.action(this.parameter);

        if (result && result.catch) {
            result.catch((error) => {
                console.error(error);
                Atom.showError(error);
            });
        }
    }

    constructor(
        action: (p: T) => any,
        onParameterSet: (p: T) => boolean = null) {
        super();
        this.action = action;

        var self = this;
        this.parameterChanged = onParameterSet;
        this.execute = function () {
            if (self.enabled) {
                this.invokeAction(self.invokeAction());
            }
        };


    }

}



class AtomJsonService {

    async json<T>(method: String, uri: String, data: any): Promise<T> {
        return window["WebAtoms"].AtomPromise.json(uri, {
            type: method,
            data: data
        }).toNativePromise();
    }

    async jsonPost<T>(uri: String, data: any): Promise<T> {
        return this.json<T>("POST", uri, data);
    }

    async jsonGet<T>(uri: String, data: any): Promise<T> {
        return this.json<T>("GET", uri, data);
    }

    async jsonPut<T>(uri: String, data: any): Promise<T> {
        return this.json<T>("PUT", uri, data);
    }

    async jsonDelete<T>(uri: String, data: any): Promise<T> {
        return this.json<T>("DELETE", uri, data);
    }
}


class AtomViewModel extends AtomModel
{

    private subscriptions: Array<AtomMessageAction>;

    constructor() {
        super();

        AtomDevice.instance.runAsync(this.initAsync());
    }

    protected onMessage<T>(msg: string, a: (data: T) => void) {

        var action: AtomAction = (m, d) => {
            a(d as T);
        };
        AtomDevice.instance.subscribe(msg, action);
        this.subscriptions = this.subscriptions || new Array<AtomMessageAction>();
        this.subscriptions.push(new AtomMessageAction(msg,action));
    }

    public broadcast(msg: string, data: any) {
        AtomDevice.instance.broadcast(msg, data);
    }

    public async initAsync(): Promise<any> {
    }

    public dispose() {
        if (this.subscriptions) {
            for (let entry of this.subscriptions) {
                AtomDevice.instance.unsubscribe(entry.message, entry.action);
            }
        }
    }

}

var WebAtoms = window["WebAtoms"];

WebAtoms["AtomCommand"] = AtomCommand;
WebAtoms["AtomModel"] = AtomModel;
WebAtoms["AtomViewModel"] = AtomViewModel;
WebAtoms["AtomDevice"] = AtomDevice;