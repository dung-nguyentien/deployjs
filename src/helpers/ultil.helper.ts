import * as path from 'path';
import {config} from '../config/config';

export function camelToSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

export function throwError(message: string) {

}

export function getTaskPath() {
    return path.join(config.rootPath, 'src/tasks');
}

export function formatString(value, ...args) {
    return value;
}

export function equalValues(values: any[]) {
    return values.every(value => value === values[0]);
}
