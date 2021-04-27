import {TaskOption} from "./task-option";

export interface TaskDecorator {
    name?: string;
    class?: string;
    instance?: any;
    option?: TaskOption;
}
