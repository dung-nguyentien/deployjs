import * as chalk from 'chalk';

export class LogManager {
    private static _instance: LogManager;
    public static get instance() {
        if (!this._instance) {
            this._instance = new LogManager();
        }

        return this._instance;
    }

    public success(message, info?) {
        if (info) {
            console.log(message, chalk.green(info));
        } else {
            console.log(message);
        }
    }

    public info(message, info?) {
        if (info) {
            console.log(message, chalk.blue(info));
        } else {
            console.log(message);
        }
    }

    public warning(message) {
        console.warn(message);
    }

    public error(message) {
        console.error(message);
    }
}
