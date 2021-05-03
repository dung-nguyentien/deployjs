import {Deployer} from './deployer';
import {Index} from './examples';
import {Test} from './examples/projects/test';

let deployer = new Deployer();
let main = new Index(deployer);
let project = new Test();
deployer.before('init', () => {
    console.log('ok');
});
deployer.environment = 'develop';
deployer.init(main.config(), project.config());
