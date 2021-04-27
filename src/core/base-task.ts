import {Deployer} from '../../deployer';
import {LogManager} from './log-manager';
import {config} from '../config/config';
import Connection from './connection';

export abstract class BaseTask {
    public deployer: Deployer;
    public log: LogManager = LogManager.instance;
    public connection: Connection;
    public static tasks = [];

    public get config() {
        return this.deployer.currentConfig;
    }

    public execRemote(command, option?: any) {
        return {} as any;
    }

    public execLocal(command, option?: any) {
        return {} as any;
    }
}
