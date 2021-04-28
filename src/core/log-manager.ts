export class LogManager {
    private static _instance: LogManager;
    public static get instance() {
        if (this._instance) {
            this._instance = new LogManager();
        }

        return this._instance;
    }

    public info(message) {
        console.log(message);
    }

    public warning(message){
        console.warn(message);
    }

    public error(message) {
        console.error(message);
    }
}