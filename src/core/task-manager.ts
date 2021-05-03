import {Orchestrator} from '../helpers/orchestrator';
import {config} from '../config/config';
import * as fs from 'fs';
import {camelToSnakeCase, getTaskPath} from '../helpers/ultil.helper';
import {Deployer} from '../../deployer';
import * as path from 'path';

export default class TaskManager {
    private orchestrator: Orchestrator = new Orchestrator();

    constructor() {

    }

    public loadTasks(deployer: Deployer) {
        const taskPath = getTaskPath();
        let files = fs.readdirSync(taskPath);
        for (let file of files) {
            if (file.endsWith('.js')) {
                let taskClass = require(path.join(taskPath, file));
                for (let key of Object.keys(taskClass)) {
                    let task = new taskClass[key]();
                    task.deployer = deployer;
                    config.tasks.forEach((t) => {
                        if (t.class === task.constructor.name) {
                            t.instance = task;
                        }
                    })
                }
            }
        }
    }

    public registerTasks() {
        for (let task of config.tasks) {
            let name = `${task.class.toLowerCase()}:${camelToSnakeCase(task.name)}`.toLowerCase();
            this.task(name, () => task.instance[task.name]());
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

    async init() {
        this.orchestrator.add('init', () => {
        });
        await this.orchestrator.run('init');
    }

    public task(name, action) {
        this.orchestrator.add(name, action);
    }

    async run(name) {
        await this.orchestrator.run(name);
    }

    public before(event: string, callback) {
        this.orchestrator.on(`before:${event}`, callback);
    }

    public after(event: string, callback) {
        this.orchestrator.on(`after:${event}`, callback);
    }
}
