import * as Orchestrator from 'orchestrator';

export default class Deployer {
    private orchestrator = new Orchestrator();

    constructor() {
    }

    public init() {
        this.orchestrator.add('init', () => {
            this.orchestrator.emit('before:init');
            this.orchestrator.emit('after:init');
        });
        this.orchestrator.start('init');
    }

    public task(name, action) {
        this.orchestrator.add(name, action);
    }

    public run(name){
        this.orchestrator.start(name);
    }

    public before(event: string, callback) {
        this.orchestrator.on(`before:${event}`, callback);
    }

    public after(event: string, callback) {
        this.orchestrator.on(`after:${event}`, callback);
    }
}
