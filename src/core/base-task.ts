import {Deployer} from '../../deployer';

export abstract class BaseTask {
    public deployer: Deployer;

    public static tasks = [];
}
