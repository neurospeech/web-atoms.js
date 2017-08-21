///<reference path="../../../../../mvvm/mvvm.ts"/>
///<reference path="../../../../../mvvm/mvvm-notification-service.ts"/>

if(!window["Promise"]){
    var Promise;
}

class TodoItem {
    @bindableProperty
    label: string;

    constructor() {
        this.label = "";
    }
}

class TodoViewModel extends WebAtoms.AtomViewModel {

    list: WebAtoms.AtomList<TodoItem>;

    addCommand: WebAtoms.AtomCommand<TodoItem>;
    removeCommand: WebAtoms.AtomCommand<TodoItem>;

    @bindableProperty
    selection: TodoItem;

    @bindableProperty
    newItem:TodoItem;

    constructor() {
        super();


        this.newItem = new TodoItem();
        this.list = new WebAtoms.AtomList<TodoItem>();

        this.addCommand =
            new WebAtoms.AtomCommand<TodoItem>(
                c => this.onAddCommand());

        this.removeCommand =
            new WebAtoms.AtomCommand<TodoItem>(
                c => this.onRemoveCommand(c));

        this.onMessage("notification-event", (d) => {
            // message received from somewhere...
        });


    }

    async onAddCommand(): Promise<any>{

        if (!this.newItem.label) {
            this.broadcast("ui-notification",
                new WebAtoms.AtomNotification("Required", "Task cannot be empty"));
            return;
        }

        this.list.add(this.newItem);
        this.newItem = new TodoItem();
    }

    async onRemoveCommand(item:TodoItem): Promise<any>{
        this.list.remove(item);
    }


    

}
