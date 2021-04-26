export abstract class BaseProject {
    constructor(public shipit) {
    }

    abstract get config();

    abstract tasks();

    public init() {
        this.shipit.initConfig(this.config);
        this.tasks();
    }

    public on(event, callback) {
        this.shipit.on(event, callback);
    }

    public start(task) {
        this.shipit.start(task);
    }

    public after(prevTask, nextTask) {
        this.on(prevTask, () => {
            this.start(nextTask);
        })
    }
}
