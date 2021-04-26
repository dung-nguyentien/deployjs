import {Orchestrator} from '../helpers/orchestrator';
import {config} from '../config/config';
import * as fs from "fs";
import {camelToSnakeCase} from '../helpers/ultil.helper';

export default class TaskManager {
    private orchestrator: Orchestrator = new Orchestrator();

    constructor() {
    }

    public loadTasks() {
        const taskPath = config.taskPath();
        let files = fs.readdirSync(taskPath);
        for (let file of files) {
            if (file.endsWith('.js')) {
                let taskClass = require(taskPath + '\\' + file).default;
                let task = new taskClass();
                task.deployer = this;
                config.tasks.forEach((t) => {
                    if (t.class === task.constructor.name) {
                        t.instance = task;
                    }
                })
            }
        }
    }

    public registerTasks() {
        for (let task of config.tasks) {
            let name = `${task.class.toLowerCase()}:${camelToSnakeCase(task.name)}`.toLowerCase();
            this.task(name, task.instance[task.name]);
            if (task.option) {
                if (task.option.before) {
                    this.before(task.option.before, name);
                }
                if (task.option.after) {
                    this.after(task.option.after, name);
                }
            }
        }
    }

    public init() {
        this.orchestrator.add('init', () => {
        });
        this.orchestrator.run('init');
    }

    public task(name, action) {
        this.orchestrator.add(name, action);
    }

    public run(name) {
        this.orchestrator.run(name);
    }

    public before(event: string, callback) {
        this.orchestrator.on(`before:${event}`, callback);
    }

    public after(event: string, callback) {
        this.orchestrator.on(`after:${event}`, callback);
    }
}
