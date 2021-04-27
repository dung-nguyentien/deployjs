import {config} from "../config/config";
import * as fs from "fs";

export class ProjectManager {
    constructor() {
    }

    public loadProjects() {
        // const taskPath = config.taskPath();
        // let files = fs.readdirSync(taskPath);
        // for (let file of files) {
        //     if (file.endsWith('.js')) {
        //         let taskClass = require(taskPath + '\\' + file).default;
        //         let task = new taskClass();
        //         task.deployer = this;
        //         config.tasks.forEach((t) => {
        //             if (t.class === task.constructor.name) {
        //                 t.instance = task;
        //             }
        //         })
        //     }
        // }
    }

    public registerProjects() {

    }
}