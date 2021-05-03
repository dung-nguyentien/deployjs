import TaskManager from './src/core/task-manager';
import {config} from './src/config/config';
import {ProjectManager} from './src/core/project-manager';
import SshConnection from './src/core/ssh-connection';
import * as shelljs from 'shelljs';

export class Deployer {
    public taskManager = new TaskManager();
    public projectManager = new ProjectManager();
    public currentConfig: any = {};
    public connections: SshConnection[] = [];
    public environment: string = null;

    public constructor(option?) {
        this.createConfig();
    }

    public createConfig() {
        config.rootPath = __dirname;
    }

    public init(mainConfig, projectConfig) {
        this.currentConfig = {...mainConfig.default, ...projectConfig.default, ...mainConfig[this.environment], ...projectConfig[this.environment]};
        this.taskManager.loadTasks(this);
        this.taskManager.registerTasks();
        this.projectManager.loadProjects();
        this.projectManager.registerProjects();
        this.taskManager.init().then(() => {
            process.exit(0);
        }).catch((error) => {
            console.error(error);
            process.exit(1);
        });
    }

    public task(name, action) {
        this.taskManager.task(name, action);
    }

    async run(name) {
        await this.taskManager.run(name);
    }

    public before(event: string, callback) {
        this.taskManager.before(event, callback);
    }

    public after(event: string, callback) {
        this.taskManager.after(event, callback);
    }

    async execRemote(command, option?) {
        let results = [];
        for (let connection of this.connections) {
            results.push(await connection.run(command, option));
        }

        return results;
    }

    public execLocal(command, option?: any): Promise<string> {
        option = option || {};
        return new Promise((resolve, reject) => {
            shelljs.exec(command, option, (error, stream) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stream);
                }
            });
        });
    }

    public copyRemote(from, to, option?) {
        let promise = [];
        for (let connection of this.connections) {
            promise.push(connection.syncDir(from, to, option));
        }
        return Promise.all(promise);
    }
}
