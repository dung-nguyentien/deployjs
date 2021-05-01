import TaskManager from './src/core/task-manager';
import {config} from './src/config/config';
import {ProjectManager} from './src/core/project-manager';
import SshConnection from './src/core/ssh-connection';

export class Deployer {
    public taskManager = new TaskManager();
    public projectManager = new ProjectManager();
    public currentConfig: any = {};
    public connections: SshConnection[] = [];

    public constructor(option?) {
        this.createConfig();
        this.taskManager.loadTasks();
        this.taskManager.registerTasks();
        this.projectManager.loadProjects();
        this.projectManager.registerProjects();
    }

    public createConfig() {
        config.rootPath = __dirname;
    }

    public init() {
        this.taskManager.init();
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

    async runCommand(command, option?) {

    }
}
