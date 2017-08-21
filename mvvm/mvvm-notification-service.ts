/// <reference path="mvvm.ts" />

module WebAtoms {


    export class AtomNotification {

        static short(message: string, title: string = ""): AtomNotification {
            return new AtomNotification(message, title);
        }

        constructor(message: string, title: string, icon: string = null, delay: number = 5000)
        {
            this.message = message;
            this.title = title;
            this.icon = icon || "";
            this.delay = delay || 5000;
        }

        message: string;
        title: string;

        // displayed on left side..
        icon: string;

        // maximum delay to be displayed
        @bindableProperty
        delay: number;

        timeout: number;

    }

    export class AtomNotificationService extends AtomViewModel {

        notifications: AtomList<AtomNotification>;

        removeCommand: AtomCommand<AtomNotification>;

        constructor() {
            super();

            this.notifications = new AtomList<AtomNotification>();

            this.removeCommand = new AtomCommand <AtomNotification>(n => this.onRemoveCommand(n));



            // subscribe to UI notifications sent by anyone...
            AtomDevice.instance.subscribe(
                "ui-notification",
                (m, n) => this.onNotified(n as AtomNotification));
        }

        async onRemoveCommand(n: AtomNotification): Promise<any> {
            this.notifications.remove(n);
            if (n.timeout) {
                clearTimeout(n.timeout);
            }
        }

        async onNotified(n: AtomNotification): Promise<any> {
            this.notifications.add(n);
            if (n.delay > 0) {
                this.updateTimer(n);
            }
        }

        private updateTimer(n: AtomNotification): void {
            if (n.delay > 0) {
                n.delay = n.delay - 1000;
                setTimeout(() => this.updateTimer(n), 1000);
            } else {
                this.notifications.remove(n);
            }
        }

    }
}