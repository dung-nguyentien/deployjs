import {ClientConfigOption} from "./client-config-option";
import {TaskDecorator} from "./task-decorator";

export interface ConfigOption {
    rootPath?: string;
    tasks: TaskDecorator[];
    client?: any
}
