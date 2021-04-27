import 'reflect-metadata';
import {TaskOption} from '../interfaces/task-option';
import {config} from '../config/config';

export function Task(option: TaskOption = null): any {
    return function (target, name, desc: PropertyDescriptor) {
        config.tasks.push({
            class: target.constructor.name,
            name: name,
            option: option
        })
    };
}
