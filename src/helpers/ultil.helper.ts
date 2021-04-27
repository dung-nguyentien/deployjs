import * as path from "path";
import {config} from "../config/config";

export function camelToSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

export function throwError(message: string) {

}

export function taskPath() {
    return path.join(config.rootPath, 'src/tasks');
}
