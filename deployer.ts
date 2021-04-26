import TaskManager from './src/core/task-manager';
import {config} from './src/config/config';
import * as fs from 'fs';
import {BaseTask} from './src/core/base-task';
import {camelToSnakeCase} from './src/helpers/ultil.helper';

export class Deployer {
    public taskManager = new TaskManager();

    public constructor() {
        this.createConfig();
        this.taskManager.loadTasks();
        this.taskManager.registerTasks();
    }

    public createConfig() {
        config.rootPath = __dirname;
    }


    public loadProjects() {

    }

    public init() {
        this.taskManager.init();
    }

    public task(name, action) {
        this.taskManager.task(name, action);
    }

    public run(name) {
        this.taskManager.run(name);
    }

    public before(event: string, callback) {
        this.taskManager.before(event, callback);
    }

    public after(event: string, callback) {
        this.taskManager.after(event, callback);
    }
}
