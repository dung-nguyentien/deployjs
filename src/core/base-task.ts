import {Deployer} from '../../deployer';
import {LogManager} from './log-manager';

export abstract class BaseTask {
    public deployer: Deployer;
    public log: LogManager = LogManager.instance;
    public static tasks = [];

    public get config() {
        return this.deployer.currentConfig;
    }

    public copyRemote(from, to, option?) {

    }

    public execRemote(command, option?: any) {
        return {} as any;
    }

    public execLocal(command, option?: any) {
        return {} as any;
    }
}
