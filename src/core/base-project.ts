import {Deployer} from '../../deployer';

export abstract class BaseProject {
    public deployer: Deployer;

    abstract config();

    public before(event: string, callback) {
        this.deployer.before(event, callback);
    }

    public after(event: string, callback) {
        this.deployer.after(event, callback);
    }
}
